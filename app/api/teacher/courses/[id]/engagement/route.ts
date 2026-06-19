import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

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

    // Gom theo lesson_id
    const byLesson: Record<string, { sumWatch: number; completed: number; started: number }> = {};
    for (const p of progresses) {
      const agg = (byLesson[p.lesson_id] ??= { sumWatch: 0, completed: 0, started: 0 });
      agg.sumWatch += p.watch_percent;
      if (p.is_completed)        agg.completed += 1;
      if (p.watch_percent > 0)   agg.started   += 1;
    }

    // Tính chỉ số theo thứ tự bài học; drop_from_prev = mức tụt completion so với bài trước
    let prevCompletion: number | null = null;
    const lessons = allLessons.map((lesson, index) => {
      const agg = byLesson[lesson.id] ?? { sumWatch: 0, completed: 0, started: 0 };
      const avgWatch       = Math.round(agg.sumWatch / totalEnrolled);
      const completionRate = Math.round((agg.completed / totalEnrolled) * 100);
      const dropFromPrev   = prevCompletion === null ? 0 : prevCompletion - completionRate;
      prevCompletion = completionRate;

      return {
        lesson_id:       lesson.id,
        lesson_title:    lesson.title,
        chapter_title:   lesson.chapter_title,
        position:        index + 1,
        avg_watch_percent: avgWatch,
        completion_rate:   completionRate,
        students_started:  agg.started,
        students_completed: agg.completed,
        drop_from_prev:    dropFromPrev,
      };
    });

    // Bài "mất hứng thú" nhất = avg_watch_percent thấp nhất
    const worst = lessons.reduce((min, l) => (l.avg_watch_percent < min.avg_watch_percent ? l : min), lessons[0]);

    return NextResponse.json({
      course:          { id: course.id, title: course.title },
      total_enrolled:  totalEnrolled,
      total_lessons:   allLessons.length,
      lessons,
      worst_lesson_id: worst.lesson_id,
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
