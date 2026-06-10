import "dotenv/config";
import http from "http";
import path from "path";
import { promises as fs, createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import { getObjectStream, uploadStream } from "../lib/storage/s3.js";

const execFileAsync = promisify(execFile);
const ffmpegBin = path.join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
const PORT = process.env.PORT ?? "3001";
const WORKER_SECRET = process.env.WORKER_SECRET;

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
