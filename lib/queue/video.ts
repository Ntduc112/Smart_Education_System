import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

export interface VideoJobData {
    rawKey: string;    // MinIO key của video gốc, e.g. "raw/uuid.mp4"
    keyPrefix: string; // target HLS prefix, e.g. "videos/uuid/"
}

export interface VideoJobResult {
    videoUrl: string;  // e.g. "hls:videos/uuid/"
}

export interface FaststartJobData {
    videoKey: string;  // R2 key, e.g. "videos/uuid.mp4"
}

export interface FaststartJobResult {
    videoKey: string;
}

// BullMQ bundles its own ioredis — cast needed to avoid duplicate-package type conflict
export function createRedisConnection(): ConnectionOptions {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    const isTls = url.startsWith("rediss://");
    console.log(`[redis] Connecting — TLS: ${isTls}, URL prefix: ${url.slice(0, 30)}...`);
    return new IORedis(url, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        ...(isTls ? { tls: {} } : {}),
        retryStrategy: (times) => {
            const delay = Math.min(times * 500, 5000);
            console.log(`[redis] Retry #${times} in ${delay}ms`);
            return delay;
        },
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

let _faststartQueue: Queue<FaststartJobData, FaststartJobResult, string> | null = null;

export function getFaststartQueue(): Queue<FaststartJobData, FaststartJobResult, string> {
    if (!_faststartQueue) {
        _faststartQueue = new Queue<FaststartJobData, FaststartJobResult, string>("video-faststart", {
            connection: createRedisConnection(),
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: "fixed", delay: 5000 },
                removeOnComplete: { age: 3600 },
                removeOnFail:    { age: 86400 },
            },
        });
    }
    return _faststartQueue;
}
