import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION ?? "auto",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
    // AWS SDK v3 >=3.525 adds CRC32 checksums to presigned PUT URLs by default.
    // Cloudflare R2 does not support these checksum headers — setting this to
    // WHEN_REQUIRED disables them so direct-browser uploads to R2 work.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = process.env.S3_BUCKET!;
//logic xử lí file pdf
export async function uploadFile(
    file: Buffer,
    originalName: string,
    contentType: string,
): Promise<string> {
    const ext = originalName.split(".").pop() ?? "bin";
    const key = `${randomUUID()}.${ext}`;

    await client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
    }));

    return `${process.env.S3_PUBLIC_URL}/${key}`;
}

export async function deleteFile(url: string): Promise<void> {
    const urlObj = new URL(url);
    const key = urlObj.pathname.replace(/^\//, "");
    if (!key) return;

    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
//Logic xử lý video
export async function uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
): Promise<void> {
    await client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
}

export async function getObject(key: string): Promise<Buffer> {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function getPresignedUrl(key: string, ttlSeconds = 14400): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getSignedUrl(client as any, cmd, { expiresIn: ttlSeconds });
}

// Presigned URL để browser upload thẳng lên MinIO (bỏ qua server)
export async function getPresignedPutUrl(key: string, ttlSeconds = 3600): Promise<string> {
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getSignedUrl(client as any, cmd, { expiresIn: ttlSeconds });
}

// Stream object từ MinIO ra Node.js Readable (không load vào RAM)
export async function getObjectStream(key: string): Promise<Readable> {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return res.Body as Readable;
}

export async function deleteObject(key: string): Promise<void> {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// Dùng Cloudflare API (không phải S3 API) vì R2 token thông thường
// không có quyền PutBucketCors qua S3 — chỉ Cloudflare API token mới được.
export async function setupR2Cors(): Promise<void> {
    const cfToken = process.env.CF_API_TOKEN;
    if (!cfToken) throw new Error("CF_API_TOKEN not set");

    // account id nằm trong subdomain của S3_ENDPOINT
    // vd: https://4bf5e3624e6076e18bfaeba8d41aca3e.r2.cloudflarestorage.com
    const endpoint = process.env.S3_ENDPOINT!;
    const accountId = new URL(endpoint).hostname.split(".")[0];

    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : ["*"];

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/cors`;
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${cfToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            rules: [
                {
                    allowed: {
                        origins: allowedOrigins,
                        methods: ["GET", "PUT", "HEAD", "DELETE"],
                        headers: ["*"],
                    },
                    exposeHeaders: ["ETag"],
                    maxAgeSeconds: 3000,
                },
            ],
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloudflare API ${res.status}: ${body}`);
    }
}
