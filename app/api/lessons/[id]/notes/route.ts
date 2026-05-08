import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const NoteSchema = z.object({
    content: z.string().min(1, "Nội dung không được trống").max(5000),
});

async function checkEnrollment(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { chapter: { select: { course_id: true } } },
    });
    if (!lesson) return null;
    const enrollment = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: lesson.chapter.course_id } },
    });
    return enrollment ? lesson : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: lessonId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const lesson = await checkEnrollment(userId, lessonId);
        if (!lesson) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const notes = await prisma.lessonNote.findMany({
            where: { lesson_id: lessonId, user_id: userId },
            orderBy: { created_at: "desc" },
            select: { id: true, content: true, created_at: true, updated_at: true },
        });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: lessonId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const lesson = await checkEnrollment(userId, lessonId);
        if (!lesson) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const body = await request.json();
        const { content } = NoteSchema.parse(body);

        const note = await prisma.lessonNote.create({
            data: { user_id: userId, lesson_id: lessonId, content },
            select: { id: true, content: true, created_at: true, updated_at: true },
        });

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
