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
    console.log(`[job:${job.id}] Start — rawKey: ${rawKey}, keyPrefix: ${keyPrefix}`);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hls-worker-"));
    console.log(`[job:${job.id}] tmpDir: ${tmpDir}`);

    try {
        // Bước 1: Download video gốc từ R2
        await job.updateProgress(1);
        const inputPath = path.join(tmpDir, "input.mp4");
        console.log(`[job:${job.id}] Downloading from R2: ${rawKey}`);
        const readStream = await getObjectStream(rawKey);
        await pipeline(readStream, createWriteStream(inputPath));
        const stat = await fs.stat(inputPath);
        console.log(`[job:${job.id}] Downloaded — size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);

        // Bước 2: ffmpeg → HLS
        console.log(`[job:${job.id}] Starting ffmpeg...`);
        await processHLSFromFile(inputPath, keyPrefix, tmpDir, async (percent) => {
            console.log(`[job:${job.id}] ffmpeg: ${percent}%`);
            await job.updateProgress(percent);
        });
        console.log(`[job:${job.id}] ffmpeg done, uploading HLS to R2...`);

        // Bước 3: Xóa video gốc
        await deleteObject(rawKey);
        console.log(`[job:${job.id}] Raw video deleted from R2`);

        return { videoUrl: `hls:${keyPrefix}` };
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
        console.log(`[job:${job.id}] tmpDir cleaned up`);
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
