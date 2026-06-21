import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { createPaymentLink } from "@/lib/payment/payos";

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

        // Nếu đang có PENDING payment thì trả về luôn để tránh tạo trùng
        const pendingPayment = await prisma.payment.findFirst({
            where: { user_id: userId, course_id, status: "PENDING" },
        });
        if (pendingPayment) {
            const checkoutUrl = await createPaymentLink({
                orderCode:   pendingPayment.order_code,
                amount:      Number(pendingPayment.amount),
                description: `Khoa hoc ${course.title}`.slice(0, 25),
                returnUrl:   `${baseUrl}/payment/success`,
                cancelUrl:   `${baseUrl}/payment/cancel`,
            });
            return NextResponse.json({ checkoutUrl }, { status: 200 });
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
