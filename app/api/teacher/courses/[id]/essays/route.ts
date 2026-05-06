import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const course = await prisma.course.findFirst({
            where: { id, instructor_id: userId },
            select: { id: true },
        });
        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

        const gradedFalse = request.nextUrl.searchParams.get("graded") === "false";

        const answers = await prisma.attemptAnswer.findMany({
            where: {
                question: {
                    type: "SHORT_ANSWER",
                    quiz: { lesson: { chapter: { course_id: id } } },
                },
                ...(gradedFalse ? { points_earned: null } : {}),
            },
            include: {
                question: {
                    select: {
                        content: true,
                        points: true,
                        sample_answer: true,
                        quiz: { select: { id: true, title: true } },
                    },
                },
                attempt: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
            },
            orderBy: { attempt: { submitted_at: "desc" } },
        });

        const quizMap = new Map<string, { id: string; title: string; answers: typeof answers }>();
        for (const answer of answers) {
            const quiz = answer.question.quiz;
            if (!quizMap.has(quiz.id)) {
                quizMap.set(quiz.id, { id: quiz.id, title: quiz.title, answers: [] });
            }
            quizMap.get(quiz.id)!.answers.push(answer);
        }

        const quizzes = Array.from(quizMap.values());

        return NextResponse.json({ quizzes }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
