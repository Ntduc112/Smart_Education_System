import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: params.id },
            include: { chapter: { select: { course_id: true } } },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        // Verify student đã enroll course này
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id:   userId,
                    course_id: lesson.chapter.course_id,
                },
            },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
        }

        const progress = await prisma.lessonProgress.upsert({
            where: { user_id_lesson_id: { user_id: userId, lesson_id: params.id } },
            create: {
                user_id:        userId,
                lesson_id:      params.id,
                is_completed:   true,
                last_watched_at: new Date(),
            },
            update: {
                is_completed:   true,
                last_watched_at: new Date(),
            },
        });

        return NextResponse.json({ progress }, { status: 200 });
    } catch (error) {
        console.error("Error updating lesson progress:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
