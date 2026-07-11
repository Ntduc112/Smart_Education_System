import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getQuizAttemptState } from "@/lib/quiz-policy";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [quiz, attempts, attemptRequests] = await Promise.all([
            prisma.quiz.findFirst({
                where: { id, deleted_at: null },
                include: {
                    lesson: { include: { chapter: { select: { course_id: true } } } },
                    questions: {
                        orderBy: { order: "asc" },
                        include: {
                            options: { orderBy: { order: "asc" } },
                            // Chỉ trả test cases public (không hidden) cho student
                            testCases: {
                                where: { is_hidden: false },
                                orderBy: { order: "asc" },
                                select: { id: true, input: true, expected: true, order: true },
                            },
                        },
                    },
                },
            }),
            prisma.quizAttempt.findMany({
                where: { quiz_id: id, user_id: userId },
                select: { score: true, is_passed: true },
            }),
            prisma.quizAttemptRequest.findMany({
                where: {
                    quiz_id: id,
                    user_id: userId,
                    status: { in: ["PENDING", "APPROVED"] },
                },
                select: { id: true, status: true, requested_at: true },
                orderBy: { requested_at: "desc" },
            }),
        ]);

        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id:   userId,
                    course_id: quiz.lesson.chapter.course_id,
                },
            },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
        }

        const approvedExtraAttempts = attemptRequests.filter((item) => item.status === "APPROVED").length;
        const pendingRequest = attemptRequests.find((item) => item.status === "PENDING") ?? null;
        const attemptState = getQuizAttemptState(quiz, attempts, approvedExtraAttempts);
        // Không trả đáp án đúng từ quiz API vì học viên có thể được cấp thêm lượt
        // sau khi đã hết lượt. AttemptAnswer vẫn cho biết đáp án đã chọn đúng/sai.
        const safeQuiz = {
            ...quiz,
            questions: quiz.questions.map((question) => ({
                id: question.id,
                quiz_id: question.quiz_id,
                content: question.content,
                type: question.type,
                points: question.points,
                order: question.order,
                ai_graded: question.ai_graded,
                language: question.language,
                starter_code: question.starter_code,
                testCases: question.testCases,
                options: question.options.map((option) => ({
                    id: option.id,
                    content: option.content,
                    order: option.order,
                })),
            })),
        };

        return NextResponse.json(
            { quiz: safeQuiz, attemptState, attemptRequest: pendingRequest },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
