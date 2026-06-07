import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getVideoQueue } from "@/lib/queue/video";

/**
 * POST /api/teacher/upload-video/process
 * Body: { rawKey: "raw/uuid.mp4" }
 *
 * Thêm job vào queue để worker xử lý ffmpeg → HLS.
 * Trả về jobId để frontend poll trạng thái.
 */
export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { rawKey?: string };
    if (!body.rawKey?.startsWith("raw/")) {
        return NextResponse.json({ error: "rawKey không hợp lệ" }, { status: 400 });
    }

    const keyPrefix = `videos/${randomUUID()}/`;

    console.log(`[process] Enqueuing job — rawKey: ${body.rawKey}, keyPrefix: ${keyPrefix}`);
    let job;
    try {
        job = await getVideoQueue().add("convert", { rawKey: body.rawKey, keyPrefix });
        console.log(`[process] Job enqueued — jobId: ${job.id}`);
    } catch (err) {
        console.error("[process] Failed to enqueue job (Redis error?):", err);
        return NextResponse.json({ error: "Không thể kết nối queue" }, { status: 500 });
    }

    return NextResponse.json({ jobId: job.id });
}
