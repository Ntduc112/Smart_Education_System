import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const enrollments = await prisma.enrollment.findMany({
      where:   { user_id: id },
      orderBy: { enrolled_at: "desc" },
      select: {
        enrolled_at: true,
        course: {
          select: {
            id:        true,
            title:     true,
            thumbnail: true,
            status:    true,
            instructor: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json({
      enrollments: enrollments.map((e) => ({
        ...e.course,
        enrolled_at: e.enrolled_at,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { course_id } = z.object({ course_id: z.string().uuid() }).parse(await request.json());

    const existing = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: id, course_id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Đã đăng ký khóa học này rồi" }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: { user_id: id, course_id },
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
