import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    result.push(monthKey(d));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const n = parseInt(request.nextUrl.searchParams.get("months") ?? "6");
    const months = n === 12 ? 12 : 6;

    const since = new Date();
    since.setDate(1);
    since.setMonth(since.getMonth() - (months - 1));
    since.setHours(0, 0, 0, 0);

    const [payments, enrollments, courses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          course:     { instructor_id: userId },
          status:     "PAID",
          created_at: { gte: since },
        },
        select: { amount: true, created_at: true },
      }),
      prisma.enrollment.findMany({
        where: {
          course:      { instructor_id: userId },
          enrolled_at: { gte: since },
        },
        select: { enrolled_at: true },
      }),
      prisma.course.findMany({
        where:   { instructor_id: userId },
        include: {
          _count:   { select: { enrollments: true } },
          payments: { where: { status: "PAID" }, select: { amount: true } },
        },
      }),
    ]);

    // ── Monthly chart data ──────────────────────────────────────────────────
    const monthList = lastNMonths(months);
    const rev: Record<string, number> = {};
    const enr: Record<string, number> = {};
    monthList.forEach((m) => { rev[m] = 0; enr[m] = 0; });

    for (const p of payments) {
      const k = monthKey(p.created_at);
      if (k in rev) rev[k] += Number(p.amount);
    }
    for (const e of enrollments) {
      const k = monthKey(e.enrolled_at);
      if (k in enr) enr[k] += 1;
    }

    const monthly = monthList.map((month) => ({
      month,
      revenue:     rev[month],
      enrollments: enr[month],
    }));

    // ── Top courses ─────────────────────────────────────────────────────────
    const top_courses = courses
      .map((c) => ({
        id:          c.id,
        title:       c.title,
        thumbnail:   c.thumbnail,
        status:      c.status,
        enrollments: c._count.enrollments,
        revenue:     c.payments.reduce((s, p) => s + Number(p.amount), 0),
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10);

    // ── Overview & growth ───────────────────────────────────────────────────
    const total_revenue     = payments.reduce((s, p) => s + Number(p.amount), 0);
    const total_enrollments = enrollments.length;
    const total_courses     = courses.length;

    const cur = monthKey(new Date());
    const prev = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return monthKey(d); })();

    const growth = (cur_val: number, prev_val: number) =>
      prev_val === 0 ? null : Math.round(((cur_val - prev_val) / prev_val) * 100);

    return NextResponse.json({
      overview: {
        total_revenue,
        total_enrollments,
        total_courses,
        revenue_growth:    growth(rev[cur] ?? 0, rev[prev] ?? 0),
        enrollment_growth: growth(enr[cur] ?? 0, enr[prev] ?? 0),
      },
      monthly,
      top_courses,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
