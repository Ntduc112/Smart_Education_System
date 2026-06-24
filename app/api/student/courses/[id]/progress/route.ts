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
            where:   { chapter: { course_id: id } },
            select:  { id: true, order: true, chapter: { select: { order: true } } },
            orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
        });
        const lessonIds = lessons.map((l) => l.id);

        const completed = await prisma.lessonProgress.findMany({
            where: {
                user_id:      userId,
                lesson_id:    { in: lessonIds },
                is_completed: true,
            },
            select: { lesson_id: true },
        });

        const completedSet     = new Set(completed.map((c) => c.lesson_id));
        const totalLessons     = lessonIds.length;
        const completedLessons = completedSet.size;
        const percentage       = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Bài đang học = bài đầu tiên chưa hoàn thành (theo thứ tự), hoặc bài cuối nếu xong hết
        const currentLesson = lessons.find((l) => !completedSet.has(l.id)) ?? lessons.at(-1);

        // Trạng thái "thỏa" của từng quiz để gate bài kế tiếp (xem quy tắc gate)
        const quizzes = await prisma.quiz.findMany({
            where:  { lesson: { chapter: { course_id: id } } },
            select: {
                id:           true,
                max_attempts: true,
                require_pass: true,
                attempts:     { where: { user_id: userId }, select: { is_passed: true } },
            },
        });
        const quizStates = quizzes.map((q) => {
            const used      = q.attempts.length;
            const hasPassed = q.attempts.some((a) => a.is_passed === true);
            const satisfied =
                used === 0                                       ? false
              : q.max_attempts != null && used >= q.max_attempts ? true   // hết lượt thì cho qua
              : !q.require_pass                                  ? true   // chỉ cần nộp
              :                                                    hasPassed;
            return { quiz_id: q.id, satisfied };
        });

        return NextResponse.json({
            progress: {
                total_lessons:        totalLessons,
                completed_lessons:    completedLessons,
                percentage,
                completed_lesson_ids: [...completedSet],
                current_lesson_id:    currentLesson?.id ?? null,
                quiz_states:          quizStates,
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course progress:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
