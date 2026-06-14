import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, signAccessToken, type TokenPayload } from "@/lib/auth/token";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
    "/api/auth/verify-otp",
    "/api/auth/reset-password",
    "/forgot-password",
    "/api/payment/webhook",
    "/api/courses",
    "/api/admin/categories",
    "/courses",
    "/payment/success",
    "/payment/cancel",
];
const ADMIN_ROUTES = [
    "/admin",
    "/api/admin",
];
const TEACHER_ROUTES = [
    "/teacher",
    "/api/teacher",
];
function matchesRoutes(pathName: string, routes: string[]){
    return routes.some(route => pathName === route || pathName.startsWith(route + "/"));
}
// đặt cookie access mới khi refresh ngầm thành công (khớp option ở lib/auth/session.ts)
function setAccessCookie(response: NextResponse, accessToken: string){
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN!),
        path: "/",
    });
}
export async function proxy(request: NextRequest){
    const pathName = request.nextUrl.pathname;
    if( pathName.startsWith("/_next")||
        pathName.startsWith("/favicon.ico")){
        return NextResponse.next();
    }
    if(matchesRoutes(pathName, PUBLIC_ROUTES)){
        return NextResponse.next();
    }
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const accessToken = bearerToken ?? request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

    let session: TokenPayload | null = accessToken ? await verifyAccessToken(accessToken) : null;

    // Refresh ngầm: access thiếu/hết hạn → thử cấp access mới từ refresh token.
    // Chỉ verify chữ ký JWT (stateless, không DB) để chạy được trên edge runtime.
    // Rotation + reuse-detection vẫn nằm ở /api/auth/refresh khi client chủ động gọi.
    let refreshedAccessToken: string | null = null;
    if(!session){
        const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
        const refreshPayload = refreshToken ? await verifyRefreshToken(refreshToken) : null;
        if(refreshPayload){
            refreshedAccessToken = await signAccessToken({
                userId: refreshPayload.userId,
                role: refreshPayload.role,
            });
            session = { userId: refreshPayload.userId, role: refreshPayload.role };
        }
    }

    if(!session){
        if(pathName.startsWith("/api")){
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete(ACCESS_TOKEN_COOKIE);
        return response;
    }
    if(matchesRoutes(pathName, ADMIN_ROUTES) && session.role !== "ADMIN"){
        if(pathName.startsWith("/api")){
            return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/403", request.url));
    }
    if(matchesRoutes(pathName, TEACHER_ROUTES) && session.role !== "TEACHER" && session.role !== "ADMIN"){
        if(pathName.startsWith("/api")){
            return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/403", request.url));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if(refreshedAccessToken) setAccessCookie(response, refreshedAccessToken);
    return response;
}
export const config = {
    matcher: ["/((?!login|register|_next/static|_next/image/favicon.ico).*)"]
}
