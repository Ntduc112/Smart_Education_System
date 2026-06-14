import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateLessonSchema = z.object({
    title:      z.string().min(1, "Title is required").optional(),
    order:      z.number().int().min(1, "Order must be a positive integer").optional(),
    chapter_id: z.string().uuid("Chapter ID must be a valid UUID").optional(),
    content:   z.string().nullable().optional(),
    video_url: z.string().refine(v => v.startsWith("r2:") || z.string().url().safeParse(v).success, "Video URL không hợp lệ").nullable().optional(),
    pdf_url:   z.string().url("PDF URL must be a valid URL").nullable().optional(),
    pdf_text:  z.string().nullable().optional(),
    is_free:   z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const lesson = await prisma.lesson.findFirst({
            where:   { id, chapter: { course: { instructor_id: userId } } },
            include: { quiz: true },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        return NextResponse.json({ lesson }, { status: 200 });
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { title, order, chapter_id, content, video_url, pdf_url, pdf_text, is_free } = UpdateLessonSchema.parse(body);

        const existing = await prisma.lesson.findFirst({
            where: { id, chapter: { course: { instructor_id: userId } } },
        });
        if (!existing) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        // When moving the lesson to another chapter, verify the target chapter belongs to this instructor.
        if (chapter_id) {
            const targetChapter = await prisma.chapter.findFirst({
                where: { id: chapter_id, course: { instructor_id: userId } },
            });
            if (!targetChapter) {
                return NextResponse.json({ error: "Target chapter not found" }, { status: 404 });
            }
        }

        const lesson = await prisma.lesson.update({
            where: { id },
            data:  { title, order, chapter_id, content, video_url, pdf_url, pdf_text, is_free },
        });
        return NextResponse.json({ lesson }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating lesson:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.lesson.findFirst({
            where: { id, chapter: { course: { instructor_id: userId } } },
        });
        if (!existing) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        await prisma.lesson.delete({ where: { id } });
        return NextResponse.json({ message: "Lesson deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
