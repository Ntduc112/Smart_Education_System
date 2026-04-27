import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateQuestionSchema = z.object({
    content:       z.string().min(1).optional(),
    points:        z.number().int().min(1).optional(),
    order:         z.number().int().min(1).optional(),
    sample_answer: z.string().nullable().optional(),
});

async function verifyOwnership(questionId: string, userId: string) {
    return prisma.question.findFirst({
        where: {
            id:   questionId,
            quiz: { lesson: { chapter: { course: { instructor_id: userId } } } },
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
        const data = UpdateQuestionSchema.parse(body);

        const question = await prisma.question.update({
            where:   { id },
            data,
            include: { options: { orderBy: { order: "asc" } } },
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
