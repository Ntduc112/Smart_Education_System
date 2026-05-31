import { NextRequest, NextResponse } from "next/server";
import { videoQueue } from "@/lib/queue/video";

export type JobStatus = "waiting" | "active" | "completed" | "failed" | "unknown";

export interface StatusResponse {
    status: JobStatus;
    progress: number;      // 0-100
    videoUrl?: string;     // có khi status === "completed"
    error?: string;        // có khi status === "failed"
}

/**
 * GET /api/teacher/upload-video/status/[jobId]
 *
 * Frontend poll endpoint này mỗi 2 giây để biết tiến trình ffmpeg.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> },
) {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await videoQueue.getJob(jobId);

    if (!job) {
        return NextResponse.json<StatusResponse>({ status: "unknown", progress: 0 });
    }

    const state = await job.getState();
    const progress = typeof job.progress === "number" ? job.progress : 0;

    if (state === "completed") {
        const result = job.returnvalue;
        return NextResponse.json<StatusResponse>({
            status: "completed",
            progress: 100,
            videoUrl: result?.videoUrl,
        });
    }

    if (state === "failed") {
        return NextResponse.json<StatusResponse>({
            status: "failed",
            progress: 0,
            error: job.failedReason ?? "Xử lý video thất bại",
        });
    }

    const status: JobStatus = state === "active" ? "active" : "waiting";
    return NextResponse.json<StatusResponse>({ status, progress });
}
