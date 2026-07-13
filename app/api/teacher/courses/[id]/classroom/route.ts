import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { courseAccessWhere, getCourseAccess } from "@/lib/course-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [course, access] = await Promise.all([prisma.course.findFirst({
      where: { id, ...courseAccessWhere(userId) },
      select: {
        id: true,
        title: true,
        status: true,
        instructor: {
          select: { id: true, name: true, avatar: true },
        },
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                order: true,
                content: true,
                video_url: true,
                pdf_url: true,
                pdf_text: true,
                is_free: true,
                quiz: {
                  where: { deleted_at: null },
                  select: {
                    id: true,
                    title: true,
                    pass_score: true,
                    require_pass: true,
                    max_attempts: true,
                    time_limit: true,
                  },
                },
                questions: {
                  select: {
                    _count: { select: { replies: true } },
                  },
                },
              },
            },
          },
        },
      },
    }), getCourseAccess(userId, id)]);

    if (!course || !access) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const classroom = {
      ...course,
      access,
      viewer_id: userId,
      sections: course.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map(({ questions, ...lesson }) => ({
          ...lesson,
          question_count: questions.length,
          unanswered_count: questions.filter((question) => question._count.replies === 0).length,
        })),
      })),
    };

    return NextResponse.json({ course: classroom });
  } catch (error) {
    console.error("Error fetching teacher classroom:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
