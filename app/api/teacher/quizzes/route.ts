import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CreateQuizSchema = z.object({
    lesson_id:  z.string().uuid(),
    title:      z.string().min(1),
    pass_score: z.number().int().min(0).max(100).default(70),
    time_limit: z.number().int().min(1).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const data = CreateQuizSchema.parse(body);

        const lesson = await prisma.lesson.findFirst({
            where: {
                id:      data.lesson_id,
                chapter: { course: { instructor_id: userId } },
            },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        const quiz = await prisma.quiz.create({ data });
        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
