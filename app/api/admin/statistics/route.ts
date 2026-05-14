import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    result.push(monthKey(d));
  }
  return result;
}

export async function GET(_request: NextRequest) {
  try {
    const since = new Date();
    since.setDate(1);
    since.setMonth(since.getMonth() - 5);
    since.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      total_users, total_students, total_teachers, total_courses,
      total_enrollments, revenueResult,
      new_users_month, new_enrollments_month,
      payments, enrollments, newUsers, courses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.user.count({ where: { created_at: { gte: startOfMonth } } }),
      prisma.enrollment.count({ where: { enrolled_at: { gte: startOfMonth } } }),
      prisma.payment.findMany({
        where:  { status: "PAID", created_at: { gte: since } },
        select: { amount: true, created_at: true },
      }),
      prisma.enrollment.findMany({
        where:  { enrolled_at: { gte: since } },
        select: { enrolled_at: true },
      }),
      prisma.user.findMany({
        where:  { created_at: { gte: since } },
        select: { created_at: true },
      }),
      prisma.course.findMany({
        select: {
          id:        true,
          title:     true,
          thumbnail: true,
          _count:    { select: { enrollments: true } },
          payments:  { where: { status: "PAID" }, select: { amount: true } },
        },
      }),
    ]);

    const months     = lastNMonths(6);
    const rev: Record<string, number> = {};
    const enr: Record<string, number> = {};
    const usr: Record<string, number> = {};
    months.forEach((m) => { rev[m] = 0; enr[m] = 0; usr[m] = 0; });

    for (const p of payments)    { const k = monthKey(p.created_at);   if (k in rev) rev[k] += Number(p.amount); }
    for (const e of enrollments) { const k = monthKey(e.enrolled_at);  if (k in enr) enr[k] += 1; }
    for (const u of newUsers)    { const k = monthKey(u.created_at);   if (k in usr) usr[k] += 1; }

    const monthly = months.map((month) => ({
      month,
      revenue:     rev[month],
      enrollments: enr[month],
      new_users:   usr[month],
    }));

    const top_courses = courses
      .map((c) => ({
        id:          c.id,
        title:       c.title,
        thumbnail:   c.thumbnail,
        enrollments: c._count.enrollments,
        revenue:     c.payments.reduce((s, p) => s + Number(p.amount), 0),
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 8);

    return NextResponse.json({
      overview: {
        total_users,
        total_students,
        total_teachers,
        total_courses,
        total_enrollments,
        total_revenue:          Number(revenueResult._sum.amount ?? 0),
        new_users_month,
        new_enrollments_month,
      },
      monthly,
      top_courses,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
