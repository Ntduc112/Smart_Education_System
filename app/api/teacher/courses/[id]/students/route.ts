import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Fetch course structure + enrollments ────────────────────────────────
    const course = await prisma.course.findFirst({
      where:   { id, instructor_id: userId },
      select: {
        id:    true,
        title: true,
        sections: {
          orderBy: { order: "asc" },
          select: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id:    true,
                title: true,
                order: true,
                quiz:  { select: { id: true, title: true, pass_score: true } },
              },
            },
          },
        },
        enrollments: {
          orderBy: { enrolled_at: "desc" },
          select: {
            enrolled_at: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const allLessons = course.sections.flatMap((s) => s.lessons);
    const allQuizzes = allLessons.flatMap((l) =>
      l.quiz.map((q) => ({ ...q, lesson_title: l.title }))
    );
    const enrolledUserIds = course.enrollments.map((e) => e.user.id);

    if (enrolledUserIds.length === 0) {
      return NextResponse.json({
        course:        { id: course.id, title: course.title },
        total_lessons: allLessons.length,
        total_quizzes: allQuizzes.length,
        students:      [],
      });
    }

    // ── Bulk-fetch progress + attempts (no N+1) ─────────────────────────────
    const [progresses, attempts] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: {
          user_id:   { in: enrolledUserIds },
          lesson_id: { in: allLessons.map((l) => l.id) },
        },
        select: {
          user_id:        true,
          lesson_id:      true,
          is_completed:   true,
          last_watched_at: true,
        },
      }),
      prisma.quizAttempt.findMany({
        where: {
          user_id: { in: enrolledUserIds },
          quiz_id: { in: allQuizzes.map((q) => q.id) },
        },
        select: {
          user_id:      true,
          quiz_id:      true,
          score:        true,
          is_passed:    true,
          submitted_at: true,
        },
        orderBy: { submitted_at: "desc" },
      }),
    ]);

    // ── Group by userId ─────────────────────────────────────────────────────
    const progressByUser: Record<string, typeof progresses> = {};
    const attemptsByUser: Record<string, typeof attempts>   = {};

    for (const p of progresses) {
      (progressByUser[p.user_id] ??= []).push(p);
    }
    for (const a of attempts) {
      (attemptsByUser[a.user_id] ??= []).push(a);
    }

    // ── Aggregate per student ───────────────────────────────────────────────
    const students = course.enrollments.map((enrollment) => {
      const uid          = enrollment.user.id;
      const userProgress = progressByUser[uid] ?? [];
      const userAttempts = attemptsByUser[uid] ?? [];

      const completedLessons = userProgress.filter((p) => p.is_completed).length;

      const lastActive = userProgress
        .map((p) => p.last_watched_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ?? null;

      const recentProgress = [...userProgress].sort(
        (a, b) =>
          new Date(b.last_watched_at ?? 0).getTime() -
          new Date(a.last_watched_at ?? 0).getTime()
      )[0];
      const currentLesson =
        allLessons.find((l) => l.id === recentProgress?.lesson_id)?.title ?? null;

      // Per-quiz: best attempt
      const quizzes = allQuizzes.map((quiz) => {
        const qAttempts = userAttempts.filter((a) => a.quiz_id === quiz.id);
        const best = qAttempts.reduce<typeof qAttempts[0] | null>((acc, a) => {
          if (!acc || (a.score ?? -1) > (acc.score ?? -1)) return a;
          return acc;
        }, null);
        return {
          quiz_id:      quiz.id,
          quiz_title:   quiz.title,
          lesson_title: quiz.lesson_title,
          pass_score:   quiz.pass_score,
          best_score:   best ? best.score : null,
          is_passed:    best ? best.is_passed : null,
          attempts:     qAttempts.length,
          last_attempt: best ? best.submitted_at : null,
        };
      });

      return {
        user:              enrollment.user,
        enrolled_at:       enrollment.enrolled_at,
        completed_lessons: completedLessons,
        total_lessons:     allLessons.length,
        completion_pct:
          allLessons.length > 0
            ? Math.round((completedLessons / allLessons.length) * 100)
            : 0,
        last_active_at:    lastActive ?? null,
        current_lesson:    currentLesson,
        quizzes,
        quiz_passed:       quizzes.filter((q) => q.is_passed).length,
        quiz_total:        allQuizzes.length,
      };
    });

    return NextResponse.json({
      course:        { id: course.id, title: course.title },
      total_lessons: allLessons.length,
      total_quizzes: allQuizzes.length,
      students,
    });
  } catch (error) {
    console.error("Error fetching students progress:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
