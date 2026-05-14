import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notification";

const ReplySchema = z.object({
    content: z.string().min(1, "Nội dung không được trống").max(2000),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: questionId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const question = await prisma.lessonQuestion.findUnique({
            where: { id: questionId },
            include: {
                lesson: { include: { chapter: { select: { course_id: true } } } },
            },
        });
        if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

        const courseId = question.lesson.chapter.course_id;

        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: courseId } },
        });
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { instructor_id: true },
        });
        const isTeacher = course?.instructor_id === userId;

        if (!enrollment && !isTeacher) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const { content } = ReplySchema.parse(body);

        const reply = await prisma.questionReply.create({
            data: { question_id: questionId, user_id: userId, content },
            include: {
                user: { select: { id: true, name: true, avatar: true, role: true } },
            },
        });

        // Notify question author (skip if replying to own question)
        if (question.user_id !== userId) {
            const lessonId = question.lesson_id;
            const notifTitle = isTeacher ? "Giáo viên đã trả lời" : "Có người trả lời câu hỏi của bạn";
            const notifMsg = isTeacher
                ? "Giáo viên đã trả lời câu hỏi của bạn"
                : "Có học viên đã trả lời câu hỏi của bạn";
            createNotification(
                question.user_id,
                "QA_REPLY",
                notifTitle,
                notifMsg,
                `/student/courses/${courseId}/learn?lesson=${lessonId}`
            ).catch(console.error);
        }

        return NextResponse.json({ reply }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating reply:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
