import { NextRequest, NextResponse } from "next/server";
import { getFaststartQueue } from "@/lib/queue/video";

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { videoKey } = body as { videoKey?: string };

    if (!videoKey || !videoKey.startsWith("videos/")) {
        return NextResponse.json({ error: "Invalid videoKey" }, { status: 400 });
    }

    const queue = getFaststartQueue();
    const job = await queue.add("faststart", { videoKey });

    return NextResponse.json({ jobId: job.id });
}
