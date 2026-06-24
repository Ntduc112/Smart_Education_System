import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const OptionSchema = z.object({
    content:    z.string().min(1),
    is_correct: z.boolean(),
});

const QuestionSchema = z.object({
    content:       z.string().min(1),
    type:          z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
    points:        z.number().int().min(1).default(1),
    sample_answer: z.string().optional(),
    options:       z.array(OptionSchema).optional(),
});

const CreateQuizSchema = z.object({
    lesson_id:  z.string().uuid(),
    title:      z.string().min(1),
    pass_score:   z.number().int().min(0).max(100).default(70),
    require_pass: z.boolean().optional(),
    max_attempts: z.number().int().positive().nullable().optional(),
    time_limit:   z.number().int().min(1).optional(),
    questions:    z.array(QuestionSchema).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { questions, ...quizData } = CreateQuizSchema.parse(body);

        const lesson = await prisma.lesson.findFirst({
            where: {
                id:      quizData.lesson_id,
                chapter: { course: { instructor_id: userId } },
            },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        const quiz = await prisma.quiz.create({
            data: {
                ...quizData,
                questions: questions
                    ? {
                        create: questions.map((q, i) => ({
                            content:       q.content,
                            type:          q.type,
                            points:        q.points,
                            order:         i + 1,
                            sample_answer: q.sample_answer,
                            options: q.options
                                ? { create: q.options.map((o, idx) => ({ ...o, order: idx + 1 })) }
                                : undefined,
                        })),
                    }
                    : undefined,
            },
            include: questions ? { questions: { include: { options: true } } } : undefined,
        });
        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
