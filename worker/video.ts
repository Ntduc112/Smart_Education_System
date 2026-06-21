import "dotenv/config";
import http from "http";
import path from "path";
import { promises as fs, createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import Groq from "groq-sdk";
import { getObjectStream, uploadStream } from "../lib/storage/s3.js";
import prisma from "../prisma/prisma.js";

const execFileAsync = promisify(execFile);
const ffmpegBin = path.join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
const PORT = process.env.PORT ?? "3001";
const WORKER_SECRET = process.env.WORKER_SECRET;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Trích lời nói trong video bằng Groq Whisper → lưu vào VideoTranscript.
// Lỗi ở đây KHÔNG làm hỏng faststart (đã chạy xong trước đó).
async function transcribe(videoKey: string, inputPath: string, tmpDir: string): Promise<void> {
    await prisma.videoTranscript.upsert({
        where: { video_key: videoKey },
        create: { video_key: videoKey, status: "processing" },
        update: { status: "processing", text: null },
    });

    try {
        const audioPath = path.join(tmpDir, "audio.mp3");
        // Audio mono 16kHz 32kbps: tối ưu cho Whisper, file nhỏ (~0.25MB/phút).
        await execFileAsync(ffmpegBin, [
            "-i", inputPath,
            "-vn", "-ac", "1", "-ar", "16000", "-b:a", "32k",
            "-y", audioPath,
        ]);
        const { size } = await fs.stat(audioPath);
        console.log(`[transcribe] Audio ${(size / 1024 / 1024).toFixed(1)}MB — ${videoKey}`);

        const result = await groq.audio.transcriptions.create({
            file: createReadStream(audioPath),
            model: "whisper-large-v3",
            response_format: "text",
        });
        const text = (typeof result === "string" ? result : result.text ?? "").trim();

        await prisma.videoTranscript.update({
            where: { video_key: videoKey },
            data: { status: "done", text },
        });
        console.log(`[transcribe] Done — ${videoKey} (${text.length} chars)`);
    } catch (err) {
        await prisma.videoTranscript.update({
            where: { video_key: videoKey },
            data: { status: "failed" },
        }).catch(() => {});
        throw err;
    }
}

async function processFaststart(videoKey: string): Promise<void> {
    console.log(`[faststart] Start — key: ${videoKey}`);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "faststart-"));
    try {
        const inputPath  = path.join(tmpDir, "input.mp4");
        const outputPath = path.join(tmpDir, "output.mp4");

        const readStream = await getObjectStream(videoKey);
        await pipeline(readStream, createWriteStream(inputPath));
        const { size } = await fs.stat(inputPath);
        console.log(`[faststart] Downloaded ${(size / 1024 / 1024).toFixed(1)}MB`);

        await execFileAsync(ffmpegBin, [
            "-i", inputPath,
            "-movflags", "+faststart",
            "-c", "copy",
            "-y", outputPath,
        ]);
        const { size: outSize } = await fs.stat(outputPath);
        console.log(`[faststart] ffmpeg done — ${(outSize / 1024 / 1024).toFixed(1)}MB`);

        await uploadStream(createReadStream(outputPath), videoKey, "video/mp4", outSize);
        console.log(`[faststart] Done — ${videoKey}`);

        // Transcribe sau khi faststart xong. Lỗi transcribe không làm fail faststart.
        await transcribe(videoKey, inputPath, tmpDir).catch(err =>
            console.error(`[transcribe] Failed — ${videoKey}:`, err.message)
        );
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200).end("ok");
        return;
    }

    if (req.method !== "POST" || req.url !== "/faststart") {
        res.writeHead(404).end("Not Found");
        return;
    }

    const auth = req.headers.authorization?.replace("Bearer ", "");
    if (WORKER_SECRET && auth !== WORKER_SECRET) {
        res.writeHead(401).end("Unauthorized");
        return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
        let videoKey: string;
        try {
            ({ videoKey } = JSON.parse(body));
        } catch {
            res.writeHead(400).end("Invalid JSON");
            return;
        }

        if (!videoKey?.startsWith("videos/")) {
            res.writeHead(400).end("Invalid videoKey");
            return;
        }

        // Return immediately, process in background
        res.writeHead(202).end(JSON.stringify({ ok: true }));
        processFaststart(videoKey).catch(err =>
            console.error(`[faststart] Failed — ${videoKey}:`, err.message)
        );
    });
});

server.listen(PORT, () => {
    console.log(`[worker] Faststart HTTP server listening on :${PORT}`);
});
