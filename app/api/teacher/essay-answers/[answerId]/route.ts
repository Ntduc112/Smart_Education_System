import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
            data: { points_earned, ai_feedback: feedback },
        });

        return NextResponse.json({ answer }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
