import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { triggerFaststart } from "@/lib/video";

// Row kẹt "processing" lâu hơn ngưỡng này coi như worker chết giữa job → trigger lại.
const RETRIGGER_AFTER_MS = 10 * 60 * 1000;

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

        // Không có row = job thất lạc (confirm không tới worker, hoặc video upload
        // trước khi có pipeline). Tự vá: tạo row rồi trigger. create (không upsert)
        // + nuốt lỗi unique để nhiều tab poll cùng lúc chỉ trigger một lần.
        if (!t) {
            const created = await prisma.videoTranscript
                .create({ data: { video_key: videoKey, status: "processing" } })
                .catch(() => null);
            if (created) await triggerFaststart(videoKey);
            return NextResponse.json({ status: "processing" }, { status: 200 });
        }

        // Kẹt "processing" quá lâu = worker chết giữa job → trigger lại.
        // Update trước khi trigger để đẩy updated_at lên, tránh poll sau retrigger tiếp.
        if (t.status === "processing" && Date.now() - t.updated_at.getTime() > RETRIGGER_AFTER_MS) {
            await prisma.videoTranscript.update({
                where: { video_key: videoKey },
                data:  { status: "processing" },
            });
            await triggerFaststart(videoKey);
        }

        return NextResponse.json({ status: t.status }, { status: 200 });
    } catch (error) {
        console.error("Error fetching transcript status:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
