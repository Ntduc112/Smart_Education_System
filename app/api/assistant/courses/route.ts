import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const memberships = await prisma.courseCollaborator.findMany({
    where: { user_id: userId, status: "ACTIVE" },
    select: {
      id: true,
      can_manage_lessons: true,
      can_manage_quizzes: true,
      created_at: true,
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          status: true,
          instructor: { select: { name: true, avatar: true } },
          _count: { select: { sections: true, enrollments: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ memberships });
}
