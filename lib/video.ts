// Gửi job faststart + transcribe cho Railway worker.
// Worker trả 202 ngay rồi xử lý nền, nên await ở đây rẻ — và PHẢI await:
// trên Vercel serverless, fetch không await có thể bị kill trước khi gửi đi.
export async function triggerFaststart(videoKey: string): Promise<void> {
    const workerUrl = process.env.RAILWAY_WORKER_URL;
    if (!workerUrl) return;

    try {
        const res = await fetch(`${workerUrl}/faststart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(process.env.WORKER_SECRET
                    ? { Authorization: `Bearer ${process.env.WORKER_SECRET}` }
                    : {}),
            },
            body: JSON.stringify({ videoKey }),
        });
        if (!res.ok) {
            console.error(`[faststart] Worker returned ${res.status} — ${videoKey}`);
        }
    } catch (err) {
        console.error(`[faststart] Failed to trigger — ${videoKey}:`, (err as Error).message);
    }
}
