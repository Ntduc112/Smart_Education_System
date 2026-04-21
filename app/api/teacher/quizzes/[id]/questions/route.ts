import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const OptionSchema = z.object({
    content:    z.string().min(1),
    is_correct: z.boolean(),
    order:      z.number().int().min(1),
});

const CreateQuestionSchema = z.object({
    content:       z.string().min(1),
    type:          z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
    points:        z.number().int().min(1).default(1),
    order:         z.number().int().min(1),
    sample_answer: z.string().optional(),
    options:       z.array(OptionSchema).optional(),
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quiz = await prisma.quiz.findFirst({
            where: {
                id:     params.id,
                lesson: { chapter: { course: { instructor_id: userId } } },
            },
        });
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const body = await request.json();
        const { options, ...questionData } = CreateQuestionSchema.parse(body);

        const question = await prisma.question.create({
            data: {
                ...questionData,
                quiz_id: params.id,
                options: options ? { create: options } : undefined,
            },
            include: { options: true },
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
