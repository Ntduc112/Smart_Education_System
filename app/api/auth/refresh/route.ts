import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/token";
import { setSession, clearSession } from "@/lib/auth/session";
import prisma from "@/prisma/prisma";

const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Refresh token not found" },
                { status: 401 }
            );
        }

        // Bước 1: Verify chữ ký JWT
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            await clearSession();
            return NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        // Bước 2: Kiểm tra token có trong DB không (reuse detection)
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!storedToken) {
            // Token hợp lệ về JWT nhưng không có trong DB
            // → đã bị dùng rồi hoặc bị thu hồi → nghi ngờ bị đánh cắp
            await clearSession();
            return NextResponse.json(
                { error: "Refresh token has been revoked" },
                { status: 401 }
            );
        }

        // Bước 3: Kiểm tra token chưa hết hạn trong DB
        if (storedToken.expires_at < new Date()) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            await clearSession();
            return NextResponse.json(
                { error: "Refresh token has expired" },
                { status: 401 }
            );
        }

        // Bước 4: Ký token mới
        const newAccessToken = await signAccessToken({
            userId: payload.userId,
            role: payload.role,
        });
        const newRefreshToken = await signRefreshToken({
            userId: payload.userId,
            role: payload.role,
        });

        const refreshTokenMaxAge = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN!);
        const expiresAt = new Date(Date.now() + refreshTokenMaxAge * 1000);

        // Bước 5: Xoá token cũ, lưu token mới — atomic transaction
        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { token: refreshToken } }),
            prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    user_id: payload.userId,
                    expires_at: expiresAt,
                },
            }),
        ]);

        // Bước 6: Cập nhật cookie
        await setSession(newAccessToken, newRefreshToken);

        return NextResponse.json(
            { message: "Token refreshed successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error refreshing token:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
