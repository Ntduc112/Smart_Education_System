import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const wrongAnswers = await prisma.attemptAnswer.findMany({
      where: {
        is_correct: false,
        attempt: { user_id: userId },
        question: { type: { in: ["MCQ", "TRUE_FALSE"] } },
      },
      select: {
        id: true,
        answer: true,
        question: {
          select: {
            id: true,
            content: true,
            type: true,
            options: {
              where: { is_correct: true },
              select: { content: true },
            },
            quiz: {
              select: {
                title: true,
                lesson: {
                  select: {
                    title: true,
                    chapter: { select: { course: { select: { title: true } } } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { attempt: { submitted_at: "desc" } },
      distinct: ["question_id"],
      take: 50,
    });

    const flashcards = wrongAnswers.map((a) => ({
      id: a.id,
      question:      a.question.content,
      correct_answer: a.question.options[0]?.content ?? "",
      your_answer:   a.answer,
      quiz_title:    a.question.quiz.title,
      lesson_title:  a.question.quiz.lesson.title,
      course_title:  a.question.quiz.lesson.chapter.course.title,
    }));

    return NextResponse.json({ flashcards });
  } catch (err) {
    console.error("[Flashcards] error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
