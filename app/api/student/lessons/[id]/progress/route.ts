import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

async function verifyEnrollment(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { chapter: { select: { course_id: true } } },
    });
    if (!lesson) return null;

    const enrollment = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: lesson.chapter.course_id } },
    });
    return enrollment ? lesson : null;
}

// PATCH: update watch_percent, auto-complete at 80%
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lesson = await verifyEnrollment(userId, id);
    if (!lesson) return NextResponse.json({ error: "Not found or not enrolled" }, { status: 403 });

    const body = await request.json();
    const raw = typeof body.watch_percent === "number" ? body.watch_percent : 0;
    const newPct = Math.max(0, Math.min(100, Math.round(raw)));

    const existing = await prisma.lessonProgress.findUnique({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: id } },
    });

    // watch_percent chỉ tăng, không giảm (tránh seek backwards reset tiến độ)
    const finalPct = Math.max(existing?.watch_percent ?? 0, newPct);
    const finalCompleted = (existing?.is_completed ?? false) || finalPct >= 80;

    const progress = await prisma.lessonProgress.upsert({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: id } },
        create: { user_id: userId, lesson_id: id, watch_percent: finalPct, is_completed: finalCompleted, last_watched_at: new Date() },
        update: { watch_percent: finalPct, is_completed: finalCompleted, last_watched_at: new Date() },
    });

    return NextResponse.json({ progress }, { status: 200 });
}

// POST: mark lesson as manually completed
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lesson = await verifyEnrollment(userId, id);
    if (!lesson) return NextResponse.json({ error: "Not found or not enrolled" }, { status: 403 });

    const progress = await prisma.lessonProgress.upsert({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: id } },
        create: { user_id: userId, lesson_id: id, is_completed: true, watch_percent: 100, last_watched_at: new Date() },
        update: { is_completed: true, watch_percent: 100, last_watched_at: new Date() },
    });

    return NextResponse.json({ progress }, { status: 200 });
}
