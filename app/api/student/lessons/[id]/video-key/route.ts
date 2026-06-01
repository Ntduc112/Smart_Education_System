import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getObject } from "@/lib/storage/s3";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: lessonId } = await params;

    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Gộp kiểm tra quyền và lấy video_url trong 1 query duy nhất
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

    if (!lesson?.video_url?.startsWith("hls:")) {
        return new NextResponse("Not an HLS video", { status: 400 });
    }

    const { instructor_id, enrollments } = lesson.chapter.course;
    const hasAccess =
        instructor_id === userId ||
        lesson.is_free ||
        enrollments.length > 0;

    if (!hasAccess) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const keyPrefix = lesson.video_url.slice(4);
    const keyBuffer = await getObject(`${keyPrefix}enc.key`);

    return new NextResponse(new Uint8Array(keyBuffer), {
        headers: {
            "Content-Type": "application/octet-stream",
            "Cache-Control": "no-store",
        },
    });
}
