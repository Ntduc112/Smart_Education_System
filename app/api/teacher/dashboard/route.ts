import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      total_courses,
      published,
      draft,
      total_students,
      revenueResult,
      recent_courses_raw,
      recent_enrollments_raw,
    ] = await Promise.all([
      prisma.course.count({ where: { instructor_id: userId } }),
      prisma.course.count({ where: { instructor_id: userId, status: "PUBLISHED" } }),
      prisma.course.count({ where: { instructor_id: userId, status: "DRAFT" } }),
      prisma.enrollment.count({ where: { course: { instructor_id: userId } } }),
      prisma.payment.aggregate({
        where: {
          course: { instructor_id: userId },
          status: "PAID",
          created_at: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.course.findMany({
        where:   { instructor_id: userId },
        orderBy: { created_at: "desc" },
        take: 5,
        include: { _count: { select: { enrollments: true } } },
      }),
      prisma.enrollment.findMany({
        where:   { course: { instructor_id: userId } },
        orderBy: { enrolled_at: "desc" },
        take: 8,
        include: {
          user:   { select: { name: true, avatar: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    const revenue_this_month = revenueResult._sum.amount
      ? Number(revenueResult._sum.amount)
      : 0;

    const recent_courses = recent_courses_raw.map((c) => ({
      id:               c.id,
      title:            c.title,
      thumbnail:        c.thumbnail,
      status:           c.status,
      enrollment_count: c._count.enrollments,
      updated_at:       c.updated_at,
    }));

    const recent_enrollments = recent_enrollments_raw.map((e) => ({
      enrolled_at: e.enrolled_at,
      user:        e.user,
      course:      e.course,
    }));

    return NextResponse.json(
      { stats: { total_courses, published, draft, total_students, revenue_this_month }, recent_courses, recent_enrollments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
