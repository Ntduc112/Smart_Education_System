import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

// Tổng hợp số bài tự luận (SHORT_ANSWER) chờ chấm trên TẤT CẢ khóa của giảng viên.
// Không có endpoint per-course nào gộp sẵn nên gom ở đây để dùng cho dải "Cần xử lý".
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const answers = await prisma.attemptAnswer.findMany({
      where: {
        points_earned: null,
        question: {
          type: "SHORT_ANSWER",
          quiz: { lesson: { chapter: { course: { instructor_id: userId } } } },
        },
        attempt: { user_id: { not: userId } }, // bỏ qua bài tự làm của chính giảng viên
      },
      select: {
        id: true,
        question: {
          select: {
            quiz: {
              select: {
                lesson: {
                  select: {
                    chapter: {
                      select: { course: { select: { id: true, title: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const byCourse = new Map<string, { course_id: string; title: string; count: number }>();
    for (const a of answers) {
      const course = a.question.quiz.lesson.chapter.course;
      const cur = byCourse.get(course.id) ?? { course_id: course.id, title: course.title, count: 0 };
      cur.count++;
      byCourse.set(course.id, cur);
    }
    const courses = Array.from(byCourse.values()).sort((x, y) => y.count - x.count);

    return NextResponse.json({ total: answers.length, courses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching grading queue:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
