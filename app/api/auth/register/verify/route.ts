import prisma from "@/prisma/prisma";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { Registerschema } from "../register-schema";

const MAX_ATTEMPTS = 5;

const Schema = Registerschema.extend({
    code: z.string().length(6),
});

// Bước 2 đăng ký: xác thực OTP → tạo user. Client gửi lại toàn bộ payload
// đăng ký kèm mã — server không giữ state giữa 2 bước.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, role, code } = Schema.parse(body);

        const record = await prisma.emailVerification.findFirst({
            where: { email, used: false },
            orderBy: { created_at: "desc" },
        });

        if (!record || record.expires_at < new Date()) {
            return NextResponse.json({ error: "Mã không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        const isMatch = await verifyPassword(code, record.code_hash);
        if (!isMatch) {
            // Sai mã: tăng bộ đếm, vô hiệu record khi vượt ngưỡng (chặn brute-force)
            const attempts = record.attempts + 1;
            await prisma.emailVerification.update({
                where: { id: record.id },
                data:  { attempts, ...(attempts >= MAX_ATTEMPTS ? { used: true } : {}) },
            });
            return NextResponse.json({ error: "Mã không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        // Đúng mã → đánh dấu đã dùng
        await prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } });

        // Email có thể vừa bị đăng ký bởi request khác — check lại trước khi tạo
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: await hashPassword(password),
                role,
            },
        });
        const { password_hash: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("register verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
