import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CreateChapterSchema = z.object({
    course_id: z.string().uuid("Course ID must be a valid UUID"),
    title: z.string().min(1, "Title is required"),
    order: z.number().int().min(1, "Order must be a positive integer"),
});

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { course_id, title, order } = CreateChapterSchema.parse(body);

        // Verify course belongs to this teacher
        const course = await prisma.course.findFirst({
            where: { id: course_id, instructor_id: userId },
        });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const chapter = await prisma.chapter.create({
            data: { course_id, title, order },
        });
        return NextResponse.json({ chapter }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating chapter:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
