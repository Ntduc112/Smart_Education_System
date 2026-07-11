import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { isCodeBasedQuestionType, isExecutableQuestionType } from "@/lib/question-types";

const OptionInput = z.object({
    content:    z.string().min(1).max(2_000),
    is_correct: z.boolean(),
    order:      z.number().int().min(1),
});

const TestCaseInput = z.object({
    input:     z.string().max(10_000),
    expected:  z.string().min(1).max(10_000),
    is_hidden: z.boolean().default(false),
    order:     z.number().int().min(0),
});

const UpdateQuestionSchema = z.object({
    content:       z.string().min(1).max(10_000).optional(),
    points:        z.number().int().min(1).optional(),
    order:         z.number().int().min(1).optional(),
    sample_answer: z.string().max(10_000).nullable().optional(),
    ai_graded:     z.boolean().optional(),
    options:       z.array(OptionInput).optional(),
    // Code-question fields
    language:      z.enum(["python", "javascript", "c", "cpp", "java"]).optional(),
    starter_code:  z.string().max(50_000).nullable().optional(),
    solution_code: z.string().max(50_000).nullable().optional(),
    testCases:     z.array(TestCaseInput).min(1).max(20).optional(),
});

async function verifyOwnership(questionId: string, userId: string) {
    return prisma.question.findFirst({
        where: {
            id:   questionId,
            quiz: {
                deleted_at: null,
                lesson: { chapter: { course: { instructor_id: userId } } },
            },
        },
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await verifyOwnership(id, userId);
        if (!existing) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const body = await request.json();
        const { options, testCases, ...rest } = UpdateQuestionSchema.parse(body);
        // Chỉ SHORT_ANSWER mới có nghĩa chấm AI
        if (existing.type !== "SHORT_ANSWER") delete rest.ai_graded;
        if (!isCodeBasedQuestionType(existing.type)) {
            delete rest.language;
            delete rest.starter_code;
            delete rest.solution_code;
        } else if (!rest.language && !existing.language) {
            return NextResponse.json(
                { error: "Câu hỏi code phải chọn ngôn ngữ" },
                { status: 400 },
            );
        }

        if (existing.type !== "SHORT_ANSWER" && existing.type !== "CODE_OUTPUT") {
            delete rest.sample_answer;
        }

        const question = await prisma.$transaction(async (tx) => {
            if (options) {
                await tx.option.deleteMany({ where: { question_id: id } });
                await tx.option.createMany({
                    data: options.map((o) => ({ ...o, question_id: id })),
                });
            }
            if (isExecutableQuestionType(existing.type) && testCases) {
                await tx.testCase.deleteMany({ where: { question_id: id } });
                await tx.testCase.createMany({
                    data: testCases.map((testCase) => ({
                        ...testCase,
                        question_id: id,
                    })),
                });
            }
            return tx.question.update({
                where:   { id },
                data:    rest,
                include: { options: { orderBy: { order: "asc" } }, testCases: { orderBy: { order: "asc" } } },
            });
        });
        return NextResponse.json({ question }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating question:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await verifyOwnership(id, userId);
        if (!existing) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ message: "Question deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
