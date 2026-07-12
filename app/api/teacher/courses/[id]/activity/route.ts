import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Nhật ký hoạt động khóa học — chỉ giáo viên sở hữu xem được.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const course = await prisma.course.findFirst({
    where: { id, instructor_id: userId },
    select: { id: true },
  });
  if (!course) return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });

  const actorId = request.nextUrl.searchParams.get("actor_id");
  const activities = await prisma.courseActivityLog.findMany({
    where: { course_id: id, ...(actorId ? { actor_id: actorId } : {}) },
    select: {
      id: true,
      action: true,
      entity_type: true,
      entity_id: true,
      entity_title: true,
      created_at: true,
      actor: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });
  return NextResponse.json({ activities });
}
