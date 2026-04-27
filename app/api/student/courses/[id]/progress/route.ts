import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

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

        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
        }

        const lessons = await prisma.lesson.findMany({
            where: { chapter: { course_id: id } },
            select: { id: true },
        });
        const lessonIds = lessons.map((l) => l.id);

        const completed = await prisma.lessonProgress.findMany({
            where: {
                user_id:      userId,
                lesson_id:    { in: lessonIds },
                is_completed: true,
            },
            select: { lesson_id: true, last_watched_at: true },
        });

        const totalLessons     = lessonIds.length;
        const completedLessons = completed.length;
        const percentage       = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return NextResponse.json({
            progress: {
                total_lessons:        totalLessons,
                completed_lessons:    completedLessons,
                percentage,
                completed_lesson_ids: completed.map((c) => c.lesson_id),
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course progress:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
