import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { didAttemptPass } from "@/lib/quiz-policy";
import { getCourseAccess } from "@/lib/course-access";
import { logCourseActivity } from "@/lib/activity-log";
import { buildQuizAttemptResultLink } from "@/lib/quiz-attempt-link";

const GradeSchema = z.object({
    points_earned: z.number().min(0, "Points must be non-negative"),
    feedback: z.string(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
    const { answerId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { points_earned, feedback } = GradeSchema.parse(body);

        const existing = await prisma.attemptAnswer.findFirst({
            where: { id: answerId },
            include: {
                question: {
                    include: {
                        quiz: {
                            include: {
                                lesson: {
                                    include: {
                                        chapter: {
                                            include: {
                                                course: { select: { id: true } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!existing) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

        // Chủ khóa học hoặc trợ giảng có quyền quiz đều được chấm tự luận
        const access = await getCourseAccess(userId, existing.question.quiz.lesson.chapter.course.id);
        if (!access?.canManageQuizzes) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const answer = await prisma.attemptAnswer.update({
            where: { id: answerId },
            // được điểm > 0 coi như đúng (dùng cho hiển thị số câu đúng)
            data: { points_earned, ai_feedback: feedback, is_correct: points_earned > 0 },
        });

        await logCourseActivity({
            courseId: existing.question.quiz.lesson.chapter.course.id,
            actorId: userId,
            action: "GRADE_ESSAY",
            entityType: "QUESTION",
            entityId: existing.question.id,
            entityTitle: existing.question.content.slice(0, 80),
        });

        // Chấm xong 1 câu → nếu attempt đã hết câu chờ chấm thì tính lại điểm tổng
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: answer.attempt_id },
            include: {
                answers: { include: { question: { select: { points: true } } } },
                quiz: {
                    select: {
                        id: true,
                        pass_score: true,
                        require_pass: true,
                        lesson: {
                            select: {
                                chapter: { select: { course_id: true } },
                            },
                        },
                    },
                },
            },
        });

        if (attempt) {
            const pending = attempt.answers.some((a) => a.points_earned === null);
            if (!pending) {
                const total  = attempt.answers.reduce((s, a) => s + a.question.points, 0);
                const earned = attempt.answers.reduce((s, a) => s + (a.points_earned ?? 0), 0);
                const score  = total > 0 ? Math.round((earned / total) * 100) : 0;
                const isPassed = didAttemptPass(attempt.quiz, score);

                // Cập nhật điểm và notification cùng transaction để serverless không
                // kết thúc request trước khi thông báo được ghi vào database.
                await prisma.$transaction([
                    prisma.quizAttempt.update({
                        where: { id: attempt.id },
                        data: { score, is_passed: isPassed },
                    }),
                    prisma.notification.create({
                        data: {
                            user_id: attempt.user_id,
                            type: "QUIZ_RESULT",
                            title: "Quiz đã được chấm điểm",
                            message: !attempt.quiz.require_pass
                                ? `Bạn đã hoàn thành quiz với ${score}/100`
                                : `Bạn đạt ${score}/100 — ${isPassed ? "Đạt" : "Chưa đạt"}`,
                            link: buildQuizAttemptResultLink(
                                attempt.quiz.lesson.chapter.course_id,
                                attempt.quiz.id,
                                attempt.id,
                            ),
                        },
                    }),
                ]);
            }
        }

        return NextResponse.json({ answer }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
