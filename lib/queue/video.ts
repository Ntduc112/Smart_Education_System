import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

// lazyConnect: true prevents IORedis from connecting at module import time (e.g. during Next.js build)
// BullMQ bundles its own ioredis — cast needed to avoid duplicate-package type conflict
export const redisConnection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null, lazyConnect: true },
) as unknown as ConnectionOptions;

export interface VideoJobData {
    rawKey: string;    // MinIO key của video gốc, e.g. "raw/uuid.mp4"
    keyPrefix: string; // target HLS prefix, e.g. "videos/uuid/"
}

export interface VideoJobResult {
    videoUrl: string;  // e.g. "hls:videos/uuid/"
}

export const videoQueue = new Queue<VideoJobData, VideoJobResult, string>("video-hls", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,           // thử lại tối đa 2 lần nếu ffmpeg thất bại
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { age: 3600 }, // giữ job đã hoàn thành 1 giờ để frontend poll
        removeOnFail:    { age: 86400 }, // giữ job lỗi 24 giờ để debug
    },
});
