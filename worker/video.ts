/**
 * Worker xử lý HLS video chạy độc lập với Next.js server.
 * Khởi động: npm run worker
 */
import "dotenv/config";
import path from "path";
import { promises as fs, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import os from "os";
import { Worker, Job } from "bullmq";
import { createRedisConnection, VideoJobData, VideoJobResult } from "../lib/queue/video.js";
import { getObjectStream, deleteObject } from "../lib/storage/s3.js";
import { processHLSFromFile } from "../lib/video/hls.js";

const CONCURRENCY = 1; // chỉ xử lý 1 video tại một thời điểm để tránh quá tải CPU

async function processJob(job: Job<VideoJobData, VideoJobResult>) {
    const { rawKey, keyPrefix } = job.data;
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hls-worker-"));

    try {
        // Bước 1: Download video gốc từ MinIO ra ổ cứng (stream, không load vào RAM)
        await job.updateProgress(1);
        const inputPath = path.join(tmpDir, "input.mp4");
        const readStream = await getObjectStream(rawKey);
        await pipeline(readStream, createWriteStream(inputPath));

        // Bước 2: Chạy ffmpeg → cắt thành HLS segments mã hóa AES-128
        // onProgress nhận % từ ffmpeg và cập nhật lên Redis để frontend poll
        await processHLSFromFile(inputPath, keyPrefix, tmpDir, async (percent) => {
            await job.updateProgress(percent);
        });

        // Bước 3: Xóa video gốc khỏi MinIO sau khi xử lý xong
        await deleteObject(rawKey);

        return { videoUrl: `hls:${keyPrefix}` };
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

const worker = new Worker<VideoJobData, VideoJobResult>(
    "video-hls",
    processJob,
    {
        connection: createRedisConnection(),
        concurrency: CONCURRENCY,
    },
);

worker.on("active", (job) => {
    console.log(`[worker] Bắt đầu xử lý job ${job.id} — raw: ${job.data.rawKey}`);
});

worker.on("progress", (job, progress) => {
    console.log(`[worker] Job ${job.id} — ${progress}%`);
});

worker.on("completed", (job, result) => {
    console.log(`[worker] Hoàn thành job ${job.id} → ${result.videoUrl}`);
});

worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} thất bại:`, err.message);
});

console.log("[worker] Video HLS worker đã khởi động, đang chờ job...");
