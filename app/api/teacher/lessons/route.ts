import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CreateLessonSchema = z.object({
    chapter_id: z.string().uuid("Chapter ID must be a valid UUID"),
    title: z.string().min(1, "Title is required"),
    order: z.number().int().min(1, "Order must be a positive integer"),
    video_url: z.string().url("Video URL must be a valid URL").optional(),
    pdf_url: z.string().url("PDF URL must be a valid URL").optional(),
    is_free: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { chapter_id, title, order, video_url, pdf_url, is_free } = CreateLessonSchema.parse(body);

        // Verify chapter belongs to a course owned by this teacher
        const chapter = await prisma.chapter.findFirst({
            where: {
                id: chapter_id,
                course: { instructor_id: userId },
            },
        });
        if (!chapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        const lesson = await prisma.lesson.create({
            data: { chapter_id, title, order, video_url, pdf_url, is_free },
        });
        return NextResponse.json({ lesson }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating lesson:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
