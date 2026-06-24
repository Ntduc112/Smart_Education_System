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
    "/api/roadmaps",
    "/api/posts",
    "/api/categories",
    "/courses",
    "/posts",
    "/roadmaps",
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
// Trang chủ theo role — đẩy user đã đăng nhập khỏi landing marketing.
function roleHome(role: string){
    if(role === "ADMIN") return "/admin/dashboard";
    if(role === "TEACHER") return "/teacher/home";
    return "/student/home";
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
    // Landing marketing: chỉ guest mới thấy. Đã đăng nhập → vào thẳng home theo role.
    if(pathName === "/"){
        const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
        let s: TokenPayload | null = token ? await verifyAccessToken(token) : null;
        let refreshed: string | null = null;
        if(!s){
            const rt = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
            const rp = rt ? await verifyRefreshToken(rt) : null;
            if(rp){
                refreshed = await signAccessToken({ userId: rp.userId, role: rp.role });
                s = { userId: rp.userId, role: rp.role };
            }
        }
        if(s){
            const res = NextResponse.redirect(new URL(roleHome(s.role), request.url));
            if(refreshed) setAccessCookie(res, refreshed);
            return res;
        }
        return NextResponse.next();
    }
    // Giải mã session (nếu có) cho MỌI route — route công khai vẫn nhận diện được
    // user khi đã đăng nhập (vd feed /api/posts trả myReaction của chính họ).
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

    const isPublic = matchesRoutes(pathName, PUBLIC_ROUTES);

    if(!session){
        // Guest ở route công khai → cho qua (không gắn header identity).
        if(isPublic) return NextResponse.next();
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
