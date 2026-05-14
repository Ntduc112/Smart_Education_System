import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: replyId } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const reply = await prisma.questionReply.findUnique({
            where: { id: replyId },
            include: {
                question: {
                    include: { lesson: { include: { chapter: { select: { course_id: true } } } } },
                },
            },
        });
        if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id: userId,
                    course_id: reply.question.lesson.chapter.course_id,
                },
            },
        });
        if (!enrollment) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const existing = await prisma.replyVote.findUnique({
            where: { reply_id_user_id: { reply_id: replyId, user_id: userId } },
        });

        if (existing) {
            await prisma.replyVote.delete({
                where: { reply_id_user_id: { reply_id: replyId, user_id: userId } },
            });
            return NextResponse.json({ voted: false });
        } else {
            await prisma.replyVote.create({ data: { reply_id: replyId, user_id: userId } });
            return NextResponse.json({ voted: true });
        }
    } catch (error) {
        console.error("Error toggling reply vote:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
