import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { createPaymentLink, getPayosStatus, cancelPaymentLink } from "@/lib/payment/payos";
import { fulfillPayment } from "@/lib/payment/fulfill";

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { course_id } = await request.json();
        if (!course_id) {
            return NextResponse.json({ error: "course_id is required" }, { status: 400 });
        }

        // URL trả về suy ra từ origin của request → tự đúng trên local/production/preview.
        // Cho phép ghi đè bằng APP_URL khi muốn ghim domain chính thức.
        const baseUrl = process.env.APP_URL ?? request.nextUrl.origin;

        const course = await prisma.course.findFirst({
            where: { id: course_id, status: "PUBLISHED" },
            select: { id: true, title: true, price: true, discount_percent: true },
        });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Kiểm tra đã enroll chưa
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id } },
        });
        if (existingEnrollment) {
            return NextResponse.json({ error: "Already enrolled in this course" }, { status: 409 });
        }

        const finalPrice = course.discount_percent
            ? Math.round(Number(course.price) * (1 - course.discount_percent / 100))
            : Number(course.price);

        // Course miễn phí → enroll trực tiếp, không qua PayOS
        if (finalPrice === 0) {
            await prisma.enrollment.create({ data: { user_id: userId, course_id } });
            return NextResponse.json({ enrolled: true }, { status: 201 });
        }

        // Có PENDING cũ → đối soát với PayOS trước khi tạo đơn mới.
        // orderCode không tái dùng được phía PayOS (kể cả khi đơn đã hủy/hết hạn),
        // nên đơn cũ luôn được đóng lại rồi tạo đơn mới với orderCode mới.
        const pendingPayment = await prisma.payment.findFirst({
            where: { user_id: userId, course_id, status: "PENDING" },
        });
        if (pendingPayment) {
            const payosStatus = await getPayosStatus(pendingPayment.order_code);

            // Tiền đã vào nhưng webhook/polling chưa kịp xử lý → fulfill luôn
            if (payosStatus === "PAID") {
                await fulfillPayment(pendingPayment.order_code);
                return NextResponse.json({ enrolled: true }, { status: 200 });
            }

            // Đơn còn sống phía PayOS → hủy để QR cũ hết hiệu lực.
            // Hủy thất bại thì throw (rơi xuống catch → 500), không được đánh dấu
            // CANCELLED trong DB khi QR cũ có thể vẫn nhận tiền.
            if (!["CANCELLED", "EXPIRED", "FAILED", "NOT_FOUND"].includes(payosStatus)) {
                await cancelPaymentLink(pendingPayment.order_code, "Tao lai link thanh toan");
            }

            await prisma.payment.update({
                where: { order_code: pendingPayment.order_code },
                data:  { status: "CANCELLED" },
            });
        }

        // Tạo orderCode ngẫu nhiên 8 chữ số (fits trong Int32)
        const orderCode = Math.floor(Math.random() * 900_000_000) + 100_000_000;

        const payment = await prisma.payment.create({
            data: {
                user_id:    userId,
                course_id,
                amount:     finalPrice,
                status:     "PENDING",
                order_code: orderCode,
            },
        });

        const checkoutUrl = await createPaymentLink({
            orderCode:   payment.order_code,
            amount:      Number(payment.amount),
            description: `Khoa hoc ${course.title}`.slice(0, 25),
            returnUrl:   `${baseUrl}/payment/success`,
            cancelUrl:   `${baseUrl}/payment/cancel`,
        });

        return NextResponse.json({ checkoutUrl }, { status: 201 });
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
