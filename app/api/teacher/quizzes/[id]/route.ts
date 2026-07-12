import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { MAX_QUIZ_ATTEMPTS } from "@/lib/quiz-policy";
import { courseAccessWhere, getCourseAccess } from "@/lib/course-access";

const UpdateQuizSchema = z.object({
    title:        z.string().min(1).optional(),
    pass_score:   z.number().int().min(1).max(100).optional(),
    require_pass: z.boolean().optional(),
    max_attempts: z.number().int().min(1).max(MAX_QUIZ_ATTEMPTS).nullable().optional(),
    time_limit:   z.number().int().min(1).nullable().optional(),
});

async function verifyOwnership(quizId: string, userId: string) {
    return prisma.quiz.findFirst({
        where: {
            id:     quizId,
            deleted_at: null,
            lesson: { chapter: { course: courseAccessWhere(userId, "QUIZZES") } },
        },
        include: { questions: { include: { options: true, testCases: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
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

        const courseId = await prisma.quiz.findUnique({
            where: { id },
            select: { lesson: { select: { chapter: { select: { course_id: true } } } } },
        });
        const access = courseId
            ? await getCourseAccess(userId, courseId.lesson.chapter.course_id)
            : null;
        return NextResponse.json({ quiz, access }, { status: 200 });
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

        const existing = await prisma.quiz.findFirst({
            where: { id, deleted_at: null, lesson: { chapter: { course: { instructor_id: userId } } } },
        });
        if (!existing) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        await prisma.quiz.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
        return NextResponse.json({ message: "Quiz deleted; student attempts preserved" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
