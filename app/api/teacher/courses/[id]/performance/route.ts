import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructor_id: userId },
      select: { id: true, title: true },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Lấy tất cả quiz của khoá học
    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { chapter: { course_id: courseId } } },
      select: {
        id: true,
        title: true,
        pass_score: true,
        lesson: { select: { title: true } },
      },
      orderBy: { lesson: { order: "asc" } },
    });

    // Lấy học viên enrolled
    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: courseId, user_id: { not: userId } }, // exclude course owner
      select: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { enrolled_at: "asc" },
    });

    const quizIds = quizzes.map((q) => q.id);
    const userIds = enrollments.map((e) => e.user.id);

    // Lấy điểm cao nhất mỗi user × quiz
    const attempts = await prisma.quizAttempt.findMany({
      where: { quiz_id: { in: quizIds }, user_id: { in: userIds } },
      select: { user_id: true, quiz_id: true, score: true, is_passed: true },
      orderBy: { submitted_at: "desc" },
    });

    // Map: userId → quizId → best attempt
    const bestMap = new Map<string, Map<string, { score: number | null; is_passed: boolean | null }>>();
    for (const a of attempts) {
      if (!bestMap.has(a.user_id)) bestMap.set(a.user_id, new Map());
      const userMap = bestMap.get(a.user_id)!;
      const existing = userMap.get(a.quiz_id);
      if (!existing || (a.score ?? 0) > (existing.score ?? 0)) {
        userMap.set(a.quiz_id, { score: a.score, is_passed: a.is_passed });
      }
    }

    const students = enrollments.map((e) => {
      const userMap = bestMap.get(e.user.id) ?? new Map();
      const scores = quizzes.map((q) => {
        const attempt = userMap.get(q.id);
        return {
          quiz_id:   q.id,
          score:     attempt?.score ?? null,
          is_passed: attempt?.is_passed ?? null,
        };
      });
      return { user: e.user, scores };
    });

    return NextResponse.json({
      course,
      quizzes: quizzes.map((q) => ({
        id:           q.id,
        title:        q.title,
        pass_score:   q.pass_score,
        lesson_title: q.lesson.title,
      })),
      students,
    });
  } catch (err) {
    console.error("[Performance] error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
