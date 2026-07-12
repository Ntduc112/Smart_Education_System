import prisma from "@/prisma/prisma";
import { NextResponse, NextRequest } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { sendRegisterOtpEmail } from "@/lib/email/resend";
import { Registerschema } from "./register-schema";

// Bước 1 đăng ký: validate + gửi OTP về email. User CHƯA được tạo —
// tạo ở bước 2 (/api/auth/register/verify) sau khi xác thực mã.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = Registerschema.parse(body);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
        }

        // Vô hiệu hoá các mã cũ chưa dùng (cùng pattern forgot-password)
        await prisma.emailVerification.updateMany({
            where: { email, used: false },
            data:  { used: true },
        });

        const code       = String(randomInt(100_000, 1_000_000)); // CSPRNG, max exclusive → 100000..999999
        const code_hash  = await hashPassword(code);               // lưu hash, không lưu mã gốc
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        await prisma.emailVerification.create({ data: { email, code_hash, expires_at } });
        await sendRegisterOtpEmail(email, code);

        return NextResponse.json({ message: "Mã xác thực đã được gửi đến email của bạn" }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("register error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
