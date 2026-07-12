import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { verifyWebhook, isPaymentSuccess } from "@/lib/payment/payos";
import { fulfillPayment } from "@/lib/payment/fulfill";

// PayOS yêu cầu response { code: "00" } để xác nhận đã nhận webhook.
// Phải tạo Response mới mỗi lần — body là stream chỉ đọc được 1 lần,
// dùng chung 1 object sẽ lỗi "Body has already been read" từ request thứ 2.
const ok = () => NextResponse.json({ code: "00", message: "success" }, { status: 200 });

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        let webhookData: Awaited<ReturnType<typeof verifyWebhook>>;
        try {
            webhookData = await verifyWebhook(body);
        } catch {
            return NextResponse.json({ code: "97", message: "Invalid signature" }, { status: 200 });
        }

        const orderCode = webhookData.orderCode;
        if (!orderCode) return ok();

        const payment = await prisma.payment.findUnique({
            where: { order_code: orderCode },
        });
        if (!payment || payment.status !== "PENDING") return ok();

        if (isPaymentSuccess(webhookData)) {
            await fulfillPayment(orderCode);
        } else {
            await prisma.payment.update({
                where: { order_code: orderCode },
                data:  { status: "CANCELLED" },
            });
        }

        return ok();
    } catch (error) {
        console.error("Webhook error:", error);
        // Vẫn trả 200 để PayOS không retry
        return ok();
    }
}
