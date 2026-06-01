import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import prisma from "@/prisma/prisma";
import { hashPassword } from "@/lib/auth/password";

const Schema = z.object({
    resetToken:  z.string().min(1),
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

function getResetSecret() {
    const v = process.env.RESET_TOKEN_SECRET ?? process.env.ACCESS_TOKEN_SECRET;
    if (!v) throw new Error("Missing RESET_TOKEN_SECRET");
    return new TextEncoder().encode(v);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { resetToken, newPassword } = Schema.parse(body);

        let email: string;
        try {
            const { payload } = await jwtVerify(resetToken, getResetSecret(), { algorithms: ["HS256"] });
            if (payload.purpose !== "reset-password" || typeof payload.email !== "string") {
                throw new Error("invalid token");
            }
            email = payload.email;
        } catch {
            return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
        }

        const password_hash = await hashPassword(newPassword);
        await prisma.user.update({ where: { email }, data: { password_hash } });

        // Huỷ tất cả refresh token để buộc đăng nhập lại
        await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });

        return NextResponse.json({ message: "Đặt lại mật khẩu thành công" }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("reset-password error:", error);
        return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
    }
}
