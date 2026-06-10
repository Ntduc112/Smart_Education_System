import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { videoKey } = body as { videoKey?: string };

    if (!videoKey?.startsWith("videos/")) {
        return NextResponse.json({ error: "Invalid videoKey" }, { status: 400 });
    }

    const workerUrl = process.env.RAILWAY_WORKER_URL;
    if (workerUrl) {
        fetch(`${workerUrl}/faststart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(process.env.WORKER_SECRET
                    ? { Authorization: `Bearer ${process.env.WORKER_SECRET}` }
                    : {}),
            },
            body: JSON.stringify({ videoKey }),
        }).catch(err => console.error("[confirm] Failed to trigger faststart:", err.message));
    }

    return NextResponse.json({ ok: true });
}
