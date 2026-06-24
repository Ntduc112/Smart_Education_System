import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getPaymentInfo } from "@/lib/payment/payos";
import { fulfillPayment } from "@/lib/payment/fulfill";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderCode: string }> }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderCode: orderCodeParam } = await params;
        const orderCode = parseInt(orderCodeParam);
        if (isNaN(orderCode)) {
            return NextResponse.json({ error: "Invalid orderCode" }, { status: 400 });
        }

        const payment = await prisma.payment.findFirst({
            where: { order_code: orderCode, user_id: userId },
            select: { status: true, course_id: true, amount: true, created_at: true },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Webhook có thể chưa về (hoặc chưa cấu hình) — hỏi trực tiếp PayOS để đối soát.
        if (payment.status === "PENDING") {
            try {
                const info = await getPaymentInfo(orderCode);
                if (info.status === "PAID") {
                    await fulfillPayment(orderCode);
                    payment.status = "PAID";
                } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(info.status)) {
                    await prisma.payment.update({
                        where: { order_code: orderCode },
                        data:  { status: "CANCELLED" },
                    });
                    payment.status = "CANCELLED";
                }
            } catch (e) {
                console.error("PayOS reconcile failed:", e);
                // Giữ nguyên PENDING, client sẽ poll lại.
            }
        }

        return NextResponse.json({ payment }, { status: 200 });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
