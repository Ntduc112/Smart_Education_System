import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const AskSchema = z.object({
    content: z.string().min(1, "Nội dung không được trống").max(2000),
});

async function getEnrollmentOrTeacher(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { chapter: { select: { course_id: true } } },
    });
    if (!lesson) return null;

    const courseId = lesson.chapter.course_id;

    const enrollment = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    });
    if (enrollment) return { courseId, isTeacher: false };

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructor_id: true },
    });
    if (course?.instructor_id === userId) return { courseId, isTeacher: true };

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: lessonId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const access = await getEnrollmentOrTeacher(userId, lessonId);
        if (!access) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const rawQuestions = await prisma.lessonQuestion.findMany({
            where: { lesson_id: lessonId },
            include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
                _count: { select: { votes: true, replies: true } },
                votes: { where: { user_id: userId }, select: { user_id: true } },
                replies: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, role: true } },
                        _count: { select: { votes: true } },
                        votes: { where: { user_id: userId }, select: { user_id: true } },
                    },
                    orderBy: { created_at: "asc" },
                },
            },
        });

        const high = rawQuestions
            .filter((q) => q._count.votes >= 10)
            .sort((a, b) => b._count.votes - a._count.votes);
        const low = rawQuestions
            .filter((q) => q._count.votes < 10)
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        const sorted = [...high, ...low];

        const questions = sorted.map((q) => ({
            id: q.id,
            content: q.content,
            created_at: q.created_at,
            vote_count: q._count.votes,
            reply_count: q._count.replies,
            has_voted: q.votes.length > 0,
            user: q.user,
            replies: q.replies.map((r) => ({
                id: r.id,
                content: r.content,
                created_at: r.created_at,
                vote_count: r._count.votes,
                has_voted: r.votes.length > 0,
                user: r.user,
            })),
        }));

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: lessonId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const access = await getEnrollmentOrTeacher(userId, lessonId);
        if (!access || access.isTeacher) {
            return NextResponse.json({ error: "Only enrolled students can ask questions" }, { status: 403 });
        }

        const body = await request.json();
        const { content } = AskSchema.parse(body);

        const question = await prisma.lessonQuestion.create({
            data: { lesson_id: lessonId, user_id: userId, content },
            include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
            },
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
