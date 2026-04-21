import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/token";

const ACCESS_TOKEN_COOKIE = "access_token";

const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/payment/webhook",
    "/api/courses",
    "/api/admin/categories",
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
export async function middleware(request: NextRequest){
    const pathName = request.nextUrl.pathname;
    if( pathName.startsWith("/_next")||
        pathName.startsWith("/favicon.ico")){
        return NextResponse.next();
    }
    if(matchesRoutes(pathName, PUBLIC_ROUTES)){
        return NextResponse.next();
    }
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if(!accessToken){
        if(pathName.startsWith("/api")){
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifyAccessToken(accessToken);
    if(!session){
        if(pathName.startsWith("/api")){
            return NextResponse.json({ error: "AccessToken không hợp lệ" }, { status: 401 });
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
 
  return NextResponse.next({ request: { headers: requestHeaders } });
}
export const config = {
    matcher: ["/((?!login|register|_next/static|_next/image/favicon.ico).*)"]
}