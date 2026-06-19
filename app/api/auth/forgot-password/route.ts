import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import { sendOtpEmail } from "@/lib/email/resend";
import { hashPassword } from "@/lib/auth/password";

const Schema = z.object({
    email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = Schema.parse(body);

        const user = await prisma.user.findUnique({ where: { email } });
        // Trả về 200 dù không tìm thấy user (tránh email enumeration)
        if (!user) {
            return NextResponse.json({ message: "Nếu email tồn tại, mã sẽ được gửi." }, { status: 200 });
        }

        // Vô hiệu hoá các mã cũ chưa dùng
        await prisma.passwordReset.updateMany({
            where: { email, used: false },
            data:  { used: true },
        });

        const code       = String(randomInt(100_000, 1_000_000)); // CSPRNG, max exclusive → 100000..999999
        const code_hash  = await hashPassword(code);               // lưu hash, không lưu mã gốc
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        await prisma.passwordReset.create({ data: { email, code_hash, expires_at } });
        await sendOtpEmail(email, code); // email gửi mã gốc cho người dùng

        return NextResponse.json({ message: "Nếu email tồn tại, mã sẽ được gửi." }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("forgot-password error:", error);
        return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
    }
}
