import "dotenv/config";
import path from "path";
import { promises as fs, createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import { Worker, Job } from "bullmq";
import { createRedisConnection, FaststartJobData, FaststartJobResult } from "../lib/queue/video.js";
import { getObjectStream, uploadStream } from "../lib/storage/s3.js";

const execFileAsync = promisify(execFile);

const ffmpegBin = path.join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");

async function processFaststartJob(job: Job<FaststartJobData, FaststartJobResult>) {
    const { videoKey } = job.data;
    console.log(`[faststart:${job.id}] Start — key: ${videoKey}`);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "faststart-"));

    try {
        const inputPath  = path.join(tmpDir, "input.mp4");
        const outputPath = path.join(tmpDir, "output.mp4");

        // Download from R2
        await job.updateProgress(5);
        console.log(`[faststart:${job.id}] Downloading...`);
        const readStream = await getObjectStream(videoKey);
        await pipeline(readStream, createWriteStream(inputPath));
        const { size } = await fs.stat(inputPath);
        console.log(`[faststart:${job.id}] Downloaded ${(size / 1024 / 1024).toFixed(1)}MB`);

        // ffmpeg remux: move moov to front, no re-encode
        await job.updateProgress(20);
        console.log(`[faststart:${job.id}] Running ffmpeg -movflags +faststart -c copy...`);
        await execFileAsync(ffmpegBin, [
            "-i", inputPath,
            "-movflags", "+faststart",
            "-c", "copy",
            "-y", outputPath,
        ]);
        const { size: outSize } = await fs.stat(outputPath);
        console.log(`[faststart:${job.id}] ffmpeg done — output ${(outSize / 1024 / 1024).toFixed(1)}MB`);

        // Upload back to R2 (overwrite original key)
        await job.updateProgress(70);
        console.log(`[faststart:${job.id}] Uploading back to R2...`);
        await uploadStream(createReadStream(outputPath), videoKey, "video/mp4", outSize);

        await job.updateProgress(100);
        console.log(`[faststart:${job.id}] Done`);
        return { videoKey };
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

const faststartWorker = new Worker<FaststartJobData, FaststartJobResult>(
    "video-faststart",
    processFaststartJob,
    { connection: createRedisConnection(), concurrency: 1 },
);

faststartWorker.on("active",    (job)      => console.log(`[faststart] job ${job.id} started — key: ${job.data.videoKey}`));
faststartWorker.on("completed", (job, res) => console.log(`[faststart] job ${job.id} done → ${res.videoKey}`));
faststartWorker.on("failed",    (job, err) => console.error(`[faststart] job ${job?.id} failed:`, err.message));

console.log("[worker] Faststart worker đã khởi động, đang chờ job...");
