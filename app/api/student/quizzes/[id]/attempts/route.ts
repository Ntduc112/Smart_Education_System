import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notification";

const SubmitAttemptSchema = z.object({
    answers: z.array(z.object({
        question_id: z.string().uuid(),
        answer:      z.string().min(1),
    })),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quiz = await prisma.quiz.findUnique({
            where:   { id },
            include: {
                lesson:    { include: { chapter: { select: { course_id: true } } } },
                questions: { include: { options: true } },
            },
        });
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

        const body = await request.json();
        const { answers } = SubmitAttemptSchema.parse(body);

        const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
        let totalPoints  = 0;
        let earnedPoints = 0;

        const gradedAnswers = answers.map(({ question_id, answer }) => {
            const question = questionMap.get(question_id);
            if (!question) return null;

            totalPoints += question.points;

            if (question.type === "SHORT_ANSWER") {
                return { question_id, answer, is_correct: null, points_earned: null };
            }

            const correctOption = question.options.find((o) => o.is_correct);
            const isCorrect     = correctOption?.content.toLowerCase() === answer.toLowerCase();
            const pts           = isCorrect ? question.points : 0;
            earnedPoints += pts;

            return { question_id, answer, is_correct: isCorrect, points_earned: pts };
        }).filter(Boolean) as {
            question_id:   string;
            answer:        string;
            is_correct:    boolean | null;
            points_earned: number | null;
        }[];

        const hasShortAnswer = gradedAnswers.some((a) => a.is_correct === null);
        const score          = totalPoints > 0 && !hasShortAnswer
            ? Math.round((earnedPoints / totalPoints) * 100)
            : null;
        const isPassed       = score !== null ? score >= quiz.pass_score : null;

        const attempt = await prisma.quizAttempt.create({
            data: {
                user_id:  userId,
                quiz_id:  id,
                score,
                is_passed: isPassed,
                answers: { create: gradedAnswers },
            },
            include: { answers: true },
        });

        // Fire-and-forget notification
        const quizMessage = score !== null
            ? `Bạn đạt ${score}/100 — ${isPassed ? "Đạt" : "Chưa đạt"}`
            : "Bài quiz của bạn đang chờ chấm điểm";
        createNotification(
            userId,
            "QUIZ_RESULT",
            "Kết quả quiz",
            quizMessage,
            "/student/dashboard"
        ).catch(console.error);

        return NextResponse.json({ attempt }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error submitting attempt:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

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

        const attempts = await prisma.quizAttempt.findMany({
            where:   { quiz_id: id, user_id: userId },
            orderBy: { submitted_at: "desc" },
            include: { answers: true },
        });

        return NextResponse.json({ attempts }, { status: 200 });
    } catch (error) {
        console.error("Error fetching attempts:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
