import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Trạng thái trích lời giảng (transcript) của video bài học, cho editor poll.
// "none" = không có video R2 để trích (chưa upload / dùng URL YouTube).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const lesson = await prisma.lesson.findFirst({
            where:  { id, chapter: { course: { instructor_id: userId } } },
            select: { video_url: true },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        // Chỉ video upload lên R2 ("r2:videos/...") mới có transcript.
        const videoKey = lesson.video_url?.replace(/^r2:/, "") ?? "";
        if (!videoKey.startsWith("videos/")) {
            return NextResponse.json({ status: "none" }, { status: 200 });
        }

        const t = await prisma.videoTranscript.findUnique({ where: { video_key: videoKey } });
        // Chưa có row = worker vừa nhận job, coi như đang xử lý.
        const status = t?.status ?? "processing";
        return NextResponse.json({ status }, { status: 200 });
    } catch (error) {
        console.error("Error fetching transcript status:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
