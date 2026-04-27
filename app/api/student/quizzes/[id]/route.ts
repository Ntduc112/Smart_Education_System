import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

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

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                lesson: { include: { chapter: { select: { course_id: true } } } },
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                            select: { id: true, content: true, order: true },
                        },
                    },
                },
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

        const safeQuiz = {
            ...quiz,
            questions: quiz.questions.map(({ sample_answer: _, ...q }) => q),
        };

        return NextResponse.json({ quiz: safeQuiz }, { status: 200 });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
