import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import { sendOtpEmail } from "@/lib/email/resend";

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

        const code       = String(Math.floor(100_000 + Math.random() * 900_000));
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        await prisma.passwordReset.create({ data: { email, code, expires_at } });
        await sendOtpEmail(email, code);

        return NextResponse.json({ message: "Nếu email tồn tại, mã sẽ được gửi." }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("forgot-password error:", error);
        return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
    }
}
