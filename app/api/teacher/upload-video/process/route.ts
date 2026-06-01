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

    const job = await getVideoQueue().add("convert", {
        rawKey: body.rawKey,
        keyPrefix,
    });

    return NextResponse.json({ jobId: job.id });
}
