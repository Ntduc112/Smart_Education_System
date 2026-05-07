import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

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
            include: { lesson: { include: { chapter: { select: { course_id: true } } } } },
        });
        if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id: userId,
                    course_id: question.lesson.chapter.course_id,
                },
            },
        });
        if (!enrollment) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const existing = await prisma.questionVote.findUnique({
            where: { question_id_user_id: { question_id: questionId, user_id: userId } },
        });

        if (existing) {
            await prisma.questionVote.delete({
                where: { question_id_user_id: { question_id: questionId, user_id: userId } },
            });
            return NextResponse.json({ voted: false });
        } else {
            await prisma.questionVote.create({ data: { question_id: questionId, user_id: userId } });
            return NextResponse.json({ voted: true });
        }
    } catch (error) {
        console.error("Error toggling question vote:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
