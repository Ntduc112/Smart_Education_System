import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notification";

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
                                                course: { select: { instructor_id: true } },
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

        const instructorId = existing.question.quiz.lesson.chapter.course.instructor_id;
        if (instructorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const answer = await prisma.attemptAnswer.update({
            where: { id: answerId },
            // được điểm > 0 coi như đúng (dùng cho hiển thị số câu đúng)
            data: { points_earned, ai_feedback: feedback, is_correct: points_earned > 0 },
        });

        // Chấm xong 1 câu → nếu attempt đã hết câu chờ chấm thì tính lại điểm tổng
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: answer.attempt_id },
            include: {
                answers: { include: { question: { select: { points: true } } } },
                quiz: { select: { pass_score: true } },
            },
        });

        if (attempt) {
            const pending = attempt.answers.some((a) => a.points_earned === null);
            if (!pending) {
                const total  = attempt.answers.reduce((s, a) => s + a.question.points, 0);
                const earned = attempt.answers.reduce((s, a) => s + (a.points_earned ?? 0), 0);
                const score  = total > 0 ? Math.round((earned / total) * 100) : 0;
                const isPassed = score >= attempt.quiz.pass_score;

                await prisma.quizAttempt.update({
                    where: { id: attempt.id },
                    data: { score, is_passed: isPassed },
                });

                // Báo cho student là quiz đã có điểm
                createNotification(
                    attempt.user_id,
                    "QUIZ_RESULT",
                    "Quiz đã được chấm điểm",
                    `Bạn đạt ${score}/100 — ${isPassed ? "Đạt" : "Chưa đạt"}`,
                    "/student/dashboard"
                ).catch(console.error);
            }
        }

        return NextResponse.json({ answer }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
