import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { verifyWebhook, isPaymentSuccess } from "@/lib/payment/payos";

// PayOS yêu cầu response { code: "00" } để xác nhận đã nhận webhook
const OK = NextResponse.json({ code: "00", message: "success" }, { status: 200 });

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        let webhookData: ReturnType<typeof verifyWebhook>;
        try {
            webhookData = verifyWebhook(body);
        } catch {
            return NextResponse.json({ code: "97", message: "Invalid signature" }, { status: 200 });
        }

        const orderCode = webhookData.data?.orderCode;
        if (!orderCode) return OK;

        const payment = await prisma.payment.findUnique({
            where: { order_code: orderCode },
        });
        if (!payment || payment.status !== "PENDING") return OK;

        if (isPaymentSuccess(webhookData)) {
            // Atomic: cập nhật payment + tạo enrollment trong cùng 1 transaction
            await prisma.$transaction([
                prisma.payment.update({
                    where: { order_code: orderCode },
                    data:  { status: "PAID" },
                }),
                prisma.enrollment.upsert({
                    where:  { user_id_course_id: { user_id: payment.user_id, course_id: payment.course_id } },
                    create: { user_id: payment.user_id, course_id: payment.course_id },
                    update: {},
                }),
            ]);
        } else {
            await prisma.payment.update({
                where: { order_code: orderCode },
                data:  { status: "CANCELLED" },
            });
        }

        return OK;
    } catch (error) {
        console.error("Webhook error:", error);
        // Vẫn trả 200 để PayOS không retry
        return OK;
    }
}
