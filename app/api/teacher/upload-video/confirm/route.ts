import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { triggerFaststart } from "@/lib/video";

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { videoKey } = body as { videoKey?: string };

    if (!videoKey?.startsWith("videos/")) {
        return NextResponse.json({ error: "Invalid videoKey" }, { status: 400 });
    }

    // Tạo row "processing" ngay khi nhận job: từ đây, transcript-status thấy
    // "không có row" nghĩa là job thất lạc thật (chứ không phải worker đang chạy).
    await prisma.videoTranscript.upsert({
        where: { video_key: videoKey },
        create: { video_key: videoKey, status: "processing" },
        update: { status: "processing", text: null },
    });
    await triggerFaststart(videoKey);

    return NextResponse.json({ ok: true });
}
