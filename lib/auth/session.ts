import { cookies } from "next/headers";
import { verifyAccessToken } from "./token";
const ACCESS_TOKEN_COOKIE = "access_token"
const REFRESH_TOKEN_COOKIE = "refresh_token"

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
        if (!accessToken) return null;
        return verifyAccessToken(accessToken);
    }
    catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}
export async function setSession(accessToken: string, refreshToken: string) {
    try {
        const cookieStore = await cookies();
        cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE!),
            path: "/"
        });
        cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE!),
            path: "/"
        })
    }
    catch (error) {
        console.error("Error setting session:", error);
        return null;
    }
}
export async function clearSession() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(ACCESS_TOKEN_COOKIE);
        cookieStore.delete(REFRESH_TOKEN_COOKIE);
    }
    catch (error) {
        console.error("Error clearing session:", error);
        return null;
    }

}
