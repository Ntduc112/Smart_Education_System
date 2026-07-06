import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// POST /student/flashcards/mastered  { question_id }  → mark a flashcard as remembered
export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { question_id } = await request.json();
    if (!question_id || typeof question_id !== "string") {
      return NextResponse.json({ error: "question_id required" }, { status: 400 });
    }

    await prisma.flashcardMastered.upsert({
      where: { user_id_question_id: { user_id: userId, question_id } },
      create: { user_id: userId, question_id },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Flashcards/mastered] POST error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE /student/flashcards/mastered            → un-master everything (reset all)
// DELETE /student/flashcards/mastered?course_id= → un-master one course's cards
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get("course_id") ?? undefined;

  try {
    if (!courseId) {
      await prisma.flashcardMastered.deleteMany({ where: { user_id: userId } });
      return NextResponse.json({ ok: true });
    }

    // Restrict to questions belonging to the given course.
    const mastered = await prisma.flashcardMastered.findMany({
      where: { user_id: userId },
      select: { question_id: true },
    });
    const ids = mastered.map((m) => m.question_id);
    if (ids.length === 0) return NextResponse.json({ ok: true });

    const inCourse = await prisma.question.findMany({
      where: { id: { in: ids }, quiz: { lesson: { chapter: { course_id: courseId } } } },
      select: { id: true },
    });
    const toDelete = inCourse.map((q) => q.id);
    if (toDelete.length) {
      await prisma.flashcardMastered.deleteMany({
        where: { user_id: userId, question_id: { in: toDelete } },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Flashcards/mastered] DELETE error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
