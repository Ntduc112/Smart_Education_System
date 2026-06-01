import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";
import prisma from "@/prisma/prisma";

const Schema = z.object({
    email: z.string().email(),
    code:  z.string().length(6),
});

function getResetSecret() {
    const v = process.env.RESET_TOKEN_SECRET ?? process.env.ACCESS_TOKEN_SECRET;
    if (!v) throw new Error("Missing RESET_TOKEN_SECRET");
    return new TextEncoder().encode(v);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code } = Schema.parse(body);

        const record = await prisma.passwordReset.findFirst({
            where: { email, code, used: false },
            orderBy: { created_at: "desc" },
        });

        if (!record || record.expires_at < new Date()) {
            return NextResponse.json({ error: "Mã không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        // Đánh dấu đã dùng
        await prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } });

        // Tạo reset token (5 phút)
        const resetToken = await new SignJWT({ email, purpose: "reset-password" })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("5m")
            .sign(getResetSecret());

        return NextResponse.json({ resetToken }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("verify-otp error:", error);
        return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
    }
}
