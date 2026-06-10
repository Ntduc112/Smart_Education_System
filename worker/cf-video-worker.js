/**
 * Cloudflare Worker — Video Token Gate
 *
 * Setup:
 *   1. wrangler deploy
 *   2. Set secrets: wrangler secret put VIDEO_TOKEN_SECRET
 *   3. Bind R2 bucket: wrangler.toml → [[r2_buckets]] binding = "BUCKET"
 *
 * URL format: GET /{videoKey}?token={jwt}
 *   videoKey: e.g. "videos/uuid.mp4"
 *   token: signed JWT từ /api/student/lessons/[id]/video-token
 */

async function verifyJWT(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
    );

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
}

export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Range",
                },
            });
        }

        if (request.method !== "GET") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        const url = new URL(request.url);

        // videoKey = path bỏ dấu "/" đầu, e.g. "videos/uuid.mp4"
        const videoKey = url.pathname.slice(1);
        if (!videoKey) return new Response("Not Found", { status: 404 });

        const token = url.searchParams.get("token");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const payload = await verifyJWT(token, env.VIDEO_TOKEN_SECRET);
        if (!payload) return new Response("Forbidden — invalid or expired token", { status: 403 });

        // Token phải chứa đúng videoKey
        if (payload.videoKey !== videoKey) {
            return new Response("Forbidden — token mismatch", { status: 403 });
        }

        const rangeHeader = request.headers.get("Range");

        // Parse range: bytes=start-[end]
        let rangeOpts = undefined;
        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
                const offset = parseInt(match[1]);
                const end = match[2] !== "" ? parseInt(match[2]) : undefined;
                rangeOpts = { offset, length: end !== undefined ? end - offset + 1 : undefined };
            }
        }

        // Need total file size for Content-Range — HEAD is a cheap R2 Class B op
        let totalSize = null;
        if (rangeOpts) {
            const head = await env.BUCKET.head(videoKey);
            if (!head) return new Response("Not Found", { status: 404 });
            totalSize = head.size;
        }

        const object = await env.BUCKET.get(videoKey, rangeOpts ? { range: rangeOpts } : {});
        if (!object) return new Response("Not Found", { status: 404 });

        const headers = {
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, no-store",
            "Access-Control-Allow-Origin": "*",
        };

        if (rangeOpts && totalSize !== null) {
            const start = rangeOpts.offset;
            // object.size returns total file size, not chunk size — compute from input range
            const end = rangeOpts.length !== undefined ? start + rangeOpts.length - 1 : totalSize - 1;
            const chunkSize = end - start + 1;
            headers["Content-Range"] = `bytes ${start}-${end}/${totalSize}`;
            headers["Content-Length"] = String(chunkSize);
            return new Response(object.body, { status: 206, headers });
        }

        headers["Content-Length"] = String(object.size);
        return new Response(object.body, { status: 200, headers });
    },
};
