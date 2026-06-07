import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

export interface VideoJobData {
    rawKey: string;    // MinIO key của video gốc, e.g. "raw/uuid.mp4"
    keyPrefix: string; // target HLS prefix, e.g. "videos/uuid/"
}

export interface VideoJobResult {
    videoUrl: string;  // e.g. "hls:videos/uuid/"
}

// BullMQ bundles its own ioredis — cast needed to avoid duplicate-package type conflict
export function createRedisConnection(): ConnectionOptions {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    const isTls = url.startsWith("rediss://");
    return new IORedis(url, {
        maxRetriesPerRequest: null,
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    }) as unknown as ConnectionOptions;
}

// Lazy singleton — Queue is created on first request, not at module import time.
// This prevents Next.js from connecting to Redis during build/prerender.
let _videoQueue: Queue<VideoJobData, VideoJobResult, string> | null = null;

export function getVideoQueue(): Queue<VideoJobData, VideoJobResult, string> {
    if (!_videoQueue) {
        _videoQueue = new Queue<VideoJobData, VideoJobResult, string>("video-hls", {
            connection: createRedisConnection(),
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: "fixed", delay: 5000 },
                removeOnComplete: { age: 3600 },
                removeOnFail:    { age: 86400 },
            },
        });
    }
    return _videoQueue;
}
