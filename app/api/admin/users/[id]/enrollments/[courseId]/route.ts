import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Xóa enrollment của student + MỌI dữ liệu liên quan tới khóa học đó của student:
// quiz attempts (+answers cascade), lesson progress, notes, Q&A (câu hỏi/trả lời/vote),
// certificate, review, wishlist. KHÔNG xóa Payment (bản ghi giao dịch tài chính).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const { id, courseId } = await params;
  try {
    // Gom id các lesson/quiz thuộc khóa học
    const lessons = await prisma.lesson.findMany({
      where: { chapter: { course_id: courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    const quizzes = await prisma.quiz.findMany({
      where: { lesson_id: { in: lessonIds } },
      select: { id: true },
    });
    const quizIds = quizzes.map((q) => q.id);

    await prisma.$transaction([
      // Quiz: xóa attempt của student (AttemptAnswer tự cascade theo FK)
      prisma.quizAttempt.deleteMany({ where: { user_id: id, quiz_id: { in: quizIds } } }),
      // Tiến độ học + ghi chú
      prisma.lessonProgress.deleteMany({ where: { user_id: id, lesson_id: { in: lessonIds } } }),
      prisma.lessonNote.deleteMany({ where: { user_id: id, lesson_id: { in: lessonIds } } }),
      // Q&A của student trong các bài của khóa (vote → reply → câu hỏi; cascade lo phần còn lại)
      prisma.replyVote.deleteMany({ where: { user_id: id, reply: { question: { lesson_id: { in: lessonIds } } } } }),
      prisma.questionVote.deleteMany({ where: { user_id: id, question: { lesson_id: { in: lessonIds } } } }),
      prisma.questionReply.deleteMany({ where: { user_id: id, question: { lesson_id: { in: lessonIds } } } }),
      prisma.lessonQuestion.deleteMany({ where: { user_id: id, lesson_id: { in: lessonIds } } }),
      // Chứng chỉ / đánh giá / yêu thích của khóa này
      prisma.certificate.deleteMany({ where: { user_id: id, course_id: courseId } }),
      prisma.review.deleteMany({ where: { user_id: id, course_id: courseId } }),
      prisma.wishlist.deleteMany({ where: { user_id: id, course_id: courseId } }),
      // Cuối cùng: gỡ enrollment
      prisma.enrollment.deleteMany({ where: { user_id: id, course_id: courseId } }),
    ]);

    return NextResponse.json({ message: "Enrollment and related data removed" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
