import { Queue } from "bullmq";
import IORedis from "ioredis";

// Kết nối Redis dùng chung cho cả API server và worker
export const redisConnection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    {
        maxRetriesPerRequest: null, // bắt buộc với BullMQ
    },
);

export interface VideoJobData {
    rawKey: string;    // MinIO key của video gốc, e.g. "raw/uuid.mp4"
    keyPrefix: string; // target HLS prefix, e.g. "videos/uuid/"
}

export interface VideoJobResult {
    videoUrl: string;  // e.g. "hls:videos/uuid/"
}

export const videoQueue = new Queue<VideoJobData, VideoJobResult>("video-hls", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,           // thử lại tối đa 2 lần nếu ffmpeg thất bại
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { age: 3600 }, // giữ job đã hoàn thành 1 giờ để frontend poll
        removeOnFail:    { age: 86400 }, // giữ job lỗi 24 giờ để debug
    },
});
