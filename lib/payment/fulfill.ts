import prisma from "@/prisma/prisma";
import { createNotification } from "@/lib/notification";

// Đánh dấu payment PAID + tạo enrollment + gửi thông báo. Idempotent.
// Trả về true nếu payment đã ở trạng thái PAID sau khi gọi.
export async function fulfillPayment(orderCode: number): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
        where: { order_code: orderCode },
    });
    if (!payment) return false;
    if (payment.status === "PAID") return true;
    if (payment.status !== "PENDING") return false;

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

    // Fire-and-forget notifications
    createNotification(
        payment.user_id,
        "PAYMENT",
        "Thanh toán thành công",
        "Bạn đã đăng ký khóa học thành công",
        "/student/dashboard"
    ).catch(console.error);

    prisma.course.findUnique({
        where:  { id: payment.course_id },
        select: { instructor_id: true },
    }).then((course) => {
        if (course?.instructor_id) {
            createNotification(
                course.instructor_id,
                "ENROLLMENT",
                "Học viên mới",
                "Có học viên mới đăng ký khóa học của bạn",
                `/teacher/courses/${payment.course_id}/students`
            ).catch(console.error);
        }
    }).catch(console.error);

    return true;
}
