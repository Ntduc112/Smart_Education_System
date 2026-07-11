import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getQuizAttemptState } from "@/lib/quiz-policy";

class RequestNotAllowedError extends Error {}

function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quiz = await prisma.quiz.findFirst({
            where: { id, deleted_at: null },
            select: {
                id: true,
                title: true,
                require_pass: true,
                pass_score: true,
                max_attempts: true,
                lesson: {
                    select: {
                        chapter: {
                            select: {
                                course: { select: { id: true, instructor_id: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }
        if (quiz.max_attempts === null) {
            return NextResponse.json(
                { error: "Bài kiểm tra này không giới hạn lượt làm" },
                { status: 400 },
            );
        }

        const course = quiz.lesson.chapter.course;
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: { user_id: userId, course_id: course.id },
            },
            select: { user: { select: { name: true } } },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
        }

        let result: {
            request: { id: string; status: string; requested_at: Date };
            created: boolean;
        } | null = null;

        for (let retry = 0; retry < 3 && !result; retry++) {
            try {
                result = await prisma.$transaction(async (tx) => {
                    const [attempts, approvedExtraAttempts, pendingRequest] = await Promise.all([
                        tx.quizAttempt.findMany({
                            where: { quiz_id: id, user_id: userId },
                            select: { score: true, is_passed: true },
                        }),
                        tx.quizAttemptRequest.count({
                            where: { quiz_id: id, user_id: userId, status: "APPROVED" },
                        }),
                        tx.quizAttemptRequest.findFirst({
                            where: { quiz_id: id, user_id: userId, status: "PENDING" },
                            select: { id: true, status: true, requested_at: true },
                        }),
                    ]);

                    if (pendingRequest) {
                        return { request: pendingRequest, created: false };
                    }
                    if (getQuizAttemptState(quiz, attempts, approvedExtraAttempts).canAttempt) {
                        throw new RequestNotAllowedError("Bạn vẫn còn lượt làm bài");
                    }

                    const newRequest = await tx.quizAttemptRequest.create({
                        data: { quiz_id: id, user_id: userId },
                        select: { id: true, status: true, requested_at: true },
                    });
                    await tx.notification.create({
                        data: {
                            user_id: course.instructor_id,
                            type: "QUIZ_ATTEMPT_REQUEST",
                            title: "Yêu cầu mở thêm lượt quiz",
                            message: `${enrollment.user.name} xin thêm 1 lượt cho “${quiz.title}”.`,
                            link: `/teacher/courses/${course.id}/students?request=${newRequest.id}`,
                        },
                    });
                    return { request: newRequest, created: true };
                }, { isolationLevel: "Serializable" });
            } catch (error) {
                if (error instanceof RequestNotAllowedError) throw error;
                if (hasPrismaCode(error, "P2002")) {
                    const pendingRequest = await prisma.quizAttemptRequest.findFirst({
                        where: { quiz_id: id, user_id: userId, status: "PENDING" },
                        select: { id: true, status: true, requested_at: true },
                    });
                    if (pendingRequest) result = { request: pendingRequest, created: false };
                    continue;
                }
                if (!hasPrismaCode(error, "P2034") || retry === 2) throw error;
            }
        }

        if (!result) {
            throw new Error("Không thể tạo yêu cầu mở lượt");
        }

        return NextResponse.json(
            { attemptRequest: result.request },
            { status: result.created ? 201 : 200 },
        );
    } catch (error) {
        if (error instanceof RequestNotAllowedError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("Error requesting another quiz attempt:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
