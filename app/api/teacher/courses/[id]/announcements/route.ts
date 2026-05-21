import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const BodySchema = z.object({
  title:   z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructor_id: userId },
      select: { id: true, title: true },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: courseId },
      select: { user_id: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((e) => ({
          user_id: e.user_id,
          type:    "ANNOUNCEMENT",
          title:   body.title,
          message: body.message,
          link:    `/student/courses/${courseId}/learn`,
        })),
      });
    }

    return NextResponse.json({
      sent: enrollments.length,
      message: `Đã gửi thông báo đến ${enrollments.length} học viên`,
    });
  } catch (err) {
    console.error("[Announcements] error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
