import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateQuizSchema = z.object({
    title:      z.string().min(1).optional(),
    pass_score: z.number().int().min(0).max(100).optional(),
    time_limit: z.number().int().min(1).nullable().optional(),
});

async function verifyOwnership(quizId: string, userId: string) {
    return prisma.quiz.findFirst({
        where: {
            id:     quizId,
            lesson: { chapter: { course: { instructor_id: userId } } },
        },
        include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
    });
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

        const quiz = await verifyOwnership(id, userId);
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        return NextResponse.json({ quiz }, { status: 200 });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
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
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const body = await request.json();
        const data = UpdateQuizSchema.parse(body);

        const quiz = await prisma.quiz.update({ where: { id }, data });
        return NextResponse.json({ quiz }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating quiz:", error);
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
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        await prisma.quiz.delete({ where: { id } });
        return NextResponse.json({ message: "Quiz deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
