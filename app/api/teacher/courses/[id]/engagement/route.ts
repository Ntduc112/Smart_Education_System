import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { computeEngagement } from "@/lib/analytics/engagement";

// GET: tổng hợp mức độ tương tác theo từng bài học của một khóa học.
// Dùng watch_percent + is_completed (đã thu sẵn) để chỉ ra bài học nào học viên
// bỏ giữa chừng nhiều nhất (điểm rơi hứng thú).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const course = await prisma.course.findFirst({
      where:  { id, instructor_id: userId },
      select: {
        id:    true,
        title: true,
        sections: {
          orderBy: { order: "asc" },
          select: {
            title: true,
            order: true,
            lessons: {
              orderBy: { order: "asc" },
              select:  { id: true, title: true, order: true },
            },
          },
        },
        enrollments: {
          where:  { user_id: { not: userId } }, // loại trừ chính chủ khóa học
          select: { user_id: true },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const allLessons = course.sections.flatMap((s) =>
      s.lessons.map((l) => ({ ...l, chapter_title: s.title }))
    );
    const enrolledUserIds = course.enrollments.map((e) => e.user_id);
    const totalEnrolled   = enrolledUserIds.length;

    if (totalEnrolled === 0 || allLessons.length === 0) {
      return NextResponse.json({
        course:          { id: course.id, title: course.title },
        total_enrolled:  totalEnrolled,
        total_lessons:   allLessons.length,
        lessons:         [],
        worst_lesson_id: null,
      });
    }

    const progresses = await prisma.lessonProgress.findMany({
      where: {
        user_id:   { in: enrolledUserIds },
        lesson_id: { in: allLessons.map((l) => l.id) },
      },
      select: { lesson_id: true, is_completed: true, watch_percent: true },
    });

    const { lessons, worst_lesson_id } = computeEngagement(allLessons, progresses, totalEnrolled);

    return NextResponse.json({
      course:          { id: course.id, title: course.title },
      total_enrolled:  totalEnrolled,
      total_lessons:   allLessons.length,
      lessons,
      worst_lesson_id,
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
