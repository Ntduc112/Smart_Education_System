import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
        });
        if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

        const lessons = await prisma.lesson.findMany({
            where: { chapter: { course_id: id } },
            select: { id: true },
        });
        const totalLessons = lessons.length;

        const completedCount = await prisma.lessonProgress.count({
            where: {
                user_id: userId,
                lesson_id: { in: lessons.map((l) => l.id) },
                is_completed: true,
            },
        });

        if (totalLessons === 0 || completedCount < totalLessons) {
            return NextResponse.json({ error: "Chưa hoàn thành khóa học" }, { status: 400 });
        }

        const certNo = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const cert = await prisma.certificate.upsert({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
            create: { user_id: userId, course_id: id, certificate_no: certNo },
            update: {},
            include: {
                course: { select: { title: true, instructor: { select: { name: true } } } },
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({ certificate: cert }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const cert = await prisma.certificate.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
            include: {
                course: { select: { title: true, instructor: { select: { name: true } } } },
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({ certificate: cert ?? null }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
