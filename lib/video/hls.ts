import ffmpeg from "fluent-ffmpeg";
import { randomBytes, randomUUID } from "crypto";
import { promises as fs, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import os from "os";
import path from "path";
import { uploadBuffer, deleteObject } from "@/lib/storage/s3";

// ffmpeg-static bị Next.js bundler làm sai path → dùng process.cwd() thay thế
const ffmpegBin = path.join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
console.log(`[hls] ffmpeg binary path: ${ffmpegBin}`);
import { existsSync } from "fs";
console.log(`[hls] ffmpeg binary exists: ${existsSync(ffmpegBin)}`);
ffmpeg.setFfmpegPath(ffmpegBin);

const HLS_SEGMENT_DURATION = 10;
const UPLOAD_CONCURRENCY = 5;

export interface HLSResult {
    keyPrefix: string;
    keyFile: string;
}

// Dùng cho upload trực tiếp (legacy, giữ lại để không break code cũ)
export async function convertToHLS(inputStream: ReadableStream<Uint8Array>): Promise<HLSResult> {
    const uuid = randomUUID();
    const keyPrefix = `videos/${uuid}/`;
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hls-"));

    try {
        const inputPath = path.join(tmpDir, "input.mp4");
        await pipeline(
            Readable.fromWeb(inputStream as Parameters<typeof Readable.fromWeb>[0]),
            createWriteStream(inputPath),
        );
        return processHLSFromFile(inputPath, keyPrefix, tmpDir);
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

// Dùng cho worker: nhận file đã có trên disk, xử lý HLS rồi upload lên MinIO
export async function processHLSFromFile(
    inputPath: string,
    keyPrefix: string,
    tmpDir?: string,
    onProgress?: (percent: number) => void,
): Promise<HLSResult> {
    const ownTmpDir = !tmpDir;
    const workDir = tmpDir ?? await fs.mkdtemp(path.join(os.tmpdir(), "hls-"));

    try {
        const aesKey = randomBytes(16);
        const keyPath = path.join(workDir, "enc.key");
        await fs.writeFile(keyPath, aesKey);

        const keyinfoPath = path.join(workDir, "keyinfo");
        await fs.writeFile(keyinfoPath, `__KEY_URI__\n${keyPath}\n`);

        const playlistPath = path.join(workDir, "index.m3u8");
        await runFfmpeg(inputPath, keyinfoPath, playlistPath, workDir, onProgress);

        const files = (await fs.readdir(workDir)).filter(
            (f) => f !== path.basename(inputPath) && f !== "keyinfo",
        );

        for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
            const batch = files.slice(i, i + UPLOAD_CONCURRENCY);
            await Promise.all(
                batch.map(async (file) => {
                    const filePath = path.join(workDir, file);
                    const content = await fs.readFile(filePath);
                    const contentType = file.endsWith(".m3u8")
                        ? "application/vnd.apple.mpegurl"
                        : file.endsWith(".ts")
                        ? "video/mp2t"
                        : "application/octet-stream";
                    await uploadBuffer(content, `${keyPrefix}${file}`, contentType);
                }),
            );
        }

        return {
            keyPrefix,
            keyFile: `${keyPrefix}enc.key`,
        };
    } finally {
        if (ownTmpDir) {
            await fs.rm(workDir, { recursive: true, force: true });
        }
    }
}

function runFfmpeg(
    inputPath: string,
    keyinfoPath: string,
    playlistPath: string,
    tmpDir: string,
    onProgress?: (percent: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const cmd = ffmpeg(inputPath)
            .outputOptions([
                "-c:v libx264",
                "-c:a aac",
                `-hls_time ${HLS_SEGMENT_DURATION}`,
                "-hls_playlist_type vod",
                `-hls_key_info_file ${keyinfoPath}`,
                `-hls_segment_filename ${path.join(tmpDir, "segment_%03d.ts")}`,
            ])
            .output(playlistPath)
            .on("end", () => resolve())
            .on("error", (err: Error) => reject(err));

        if (onProgress) {
            cmd.on("progress", (p: { percent?: number }) => {
                onProgress(Math.min(99, Math.round(p.percent ?? 0)));
            });
        }

        cmd.run();
    });
}
