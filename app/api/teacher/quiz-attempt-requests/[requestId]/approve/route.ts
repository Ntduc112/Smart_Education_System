import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> },
) {
    const { requestId } = await params;
    try {
        const teacherId = request.headers.get("x-user-id");
        if (!teacherId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const attemptRequest = await prisma.quizAttemptRequest.findFirst({
            where: {
                id: requestId,
                quiz: {
                    deleted_at: null,
                    lesson: { chapter: { course: { instructor_id: teacherId } } },
                },
            },
            select: {
                id: true,
                status: true,
                user_id: true,
                user: { select: { name: true } },
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        lesson: {
                            select: {
                                chapter: { select: { course_id: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!attemptRequest) {
            return NextResponse.json({ error: "Yêu cầu không tồn tại" }, { status: 404 });
        }
        if (attemptRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Yêu cầu này đã được xử lý" }, { status: 409 });
        }

        const courseId = attemptRequest.quiz.lesson.chapter.course_id;
        const approved = await prisma.$transaction(async (tx) => {
            const updated = await tx.quizAttemptRequest.updateMany({
                where: { id: requestId, status: "PENDING" },
                data: {
                    status: "APPROVED",
                    resolved_at: new Date(),
                    resolved_by: teacherId,
                },
            });
            if (updated.count === 0) return false;

            await tx.notification.create({
                data: {
                    user_id: attemptRequest.user_id,
                    type: "QUIZ_ATTEMPT_GRANTED",
                    title: "Bạn đã được mở thêm lượt quiz",
                    message: `Giáo viên đã cấp thêm 1 lượt cho “${attemptRequest.quiz.title}”.`,
                    link: `/student/courses/${courseId}/learn?quiz=${attemptRequest.quiz.id}`,
                },
            });
            return true;
        });
        if (!approved) {
            return NextResponse.json({ error: "Yêu cầu này vừa được xử lý" }, { status: 409 });
        }

        return NextResponse.json({
            attemptRequest: {
                id: attemptRequest.id,
                status: "APPROVED",
            },
        });
    } catch (error) {
        console.error("Error approving quiz attempt request:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
