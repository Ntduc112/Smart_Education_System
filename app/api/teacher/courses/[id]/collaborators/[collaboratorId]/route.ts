import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";

const PermissionSchema = z.object({
  can_manage_lessons: z.boolean(),
  can_manage_quizzes: z.boolean(),
}).refine((value) => value.can_manage_lessons || value.can_manage_quizzes, {
  message: "Cần cấp ít nhất một quyền",
});

async function ownedMembership(courseId: string, collaboratorId: string, ownerId: string) {
  return prisma.courseCollaborator.findFirst({
    where: { id: collaboratorId, course_id: courseId, course: { instructor_id: ownerId } },
    select: { id: true },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; collaboratorId: string }> }) {
  const { id, collaboratorId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  try {
    const input = PermissionSchema.parse(await request.json());
    if (!await ownedMembership(id, collaboratorId, userId)) {
      return NextResponse.json({ error: "Không tìm thấy trợ giảng" }, { status: 404 });
    }
    const collaborator = await prisma.courseCollaborator.update({
      where: { id: collaboratorId },
      data: input,
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return NextResponse.json({ collaborator });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Không thể cập nhật quyền" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; collaboratorId: string }> }) {
  const { id, collaboratorId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (!await ownedMembership(id, collaboratorId, userId)) {
    return NextResponse.json({ error: "Không tìm thấy trợ giảng" }, { status: 404 });
  }
  await prisma.courseCollaborator.update({
    where: { id: collaboratorId },
    data: { status: "REVOKED", revoked_at: new Date() },
  });
  return NextResponse.json({ message: "Đã thu hồi quyền trợ giảng" });
}
