import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { signVideoToken } from "@/lib/auth/video-token";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: lessonId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            video_url: true,
            is_free: true,
            chapter: {
                select: {
                    course: {
                        select: {
                            instructor_id: true,
                            enrollments: {
                                where: { user_id: userId },
                                select: { user_id: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!lesson?.video_url?.startsWith("r2:")) {
        return NextResponse.json({ error: "Not an R2 video" }, { status: 400 });
    }

    const { instructor_id, enrollments } = lesson.chapter.course;
    const hasAccess = instructor_id === userId || lesson.is_free || enrollments.length > 0;

    if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const videoKey = lesson.video_url.slice(3); // strip "r2:"
    const token = await signVideoToken({ lessonId, userId, videoKey });

    return NextResponse.json({
        token,
        workerUrl: process.env.CF_WORKER_URL,
        videoKey,
    });
}
