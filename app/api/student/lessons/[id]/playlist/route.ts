import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { getObject, getPresignedUrl } from "@/lib/storage/s3";

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

    const keyPrefix = lesson.video_url.slice(4); // bỏ "hls:"
    const playlistKey = `${keyPrefix}index.m3u8`;

    const rawPlaylist = await getObject(playlistKey);
    let playlist = rawPlaylist.toString("utf-8");

    // Thay key URI placeholder → endpoint thực
    const baseUrl = request.nextUrl.origin;
    const keyApiUrl = `${baseUrl}/api/student/lessons/${lessonId}/video-key`;
    playlist = playlist.replace(/__KEY_URI__/g, keyApiUrl);

    // Thay segment filename → presigned URL MinIO (TTL 4 giờ)
    const lines = playlist.split("\n");
    const rewritten = await Promise.all(
        lines.map(async (line) => {
            const trimmed = line.trim();
            if (trimmed.endsWith(".ts")) {
                return getPresignedUrl(`${keyPrefix}${trimmed}`, 14400);
            }
            return line;
        }),
    );

    return new NextResponse(rewritten.join("\n"), {
        headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store",
        },
    });
}
