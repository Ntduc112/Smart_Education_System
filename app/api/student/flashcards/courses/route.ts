import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// GET /student/flashcards/courses
// Courses the student has un-mastered wrong answers in, with per-course counts.
export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const mastered = await prisma.flashcardMastered.findMany({
      where: { user_id: userId },
      select: { question_id: true },
    });
    const masteredIds = mastered.map((m) => m.question_id);

    const rows = await prisma.attemptAnswer.findMany({
      where: {
        is_correct: false,
        attempt: { user_id: userId },
        question: {
          type: { in: ["MCQ", "TRUE_FALSE"] },
          ...(masteredIds.length ? { id: { notIn: masteredIds } } : {}),
        },
      },
      select: {
        question: {
          select: {
            quiz: {
              select: {
                lesson: {
                  select: {
                    chapter: {
                      select: { course: { select: { id: true, title: true, thumbnail: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      distinct: ["question_id"],
      take: 500,
    });

    const map = new Map<string, { course_id: string; course_title: string; thumbnail: string; wrong_count: number }>();
    for (const r of rows) {
      const c = r.question.quiz.lesson.chapter.course;
      const cur = map.get(c.id);
      if (cur) cur.wrong_count += 1;
      else map.set(c.id, { course_id: c.id, course_title: c.title, thumbnail: c.thumbnail, wrong_count: 1 });
    }

    const courses = [...map.values()].sort((a, b) => b.wrong_count - a.wrong_count);
    const total = courses.reduce((s, c) => s + c.wrong_count, 0);

    return NextResponse.json({ courses, total });
  } catch (err) {
    console.error("[Flashcards/courses] error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
