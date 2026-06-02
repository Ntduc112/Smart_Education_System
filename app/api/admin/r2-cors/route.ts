import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { setupR2Cors } from "@/lib/storage/s3";

// Dùng client riêng để tránh conflict với client singleton trong s3.ts
const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION ?? "auto",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = process.env.S3_BUCKET!;

/** GET /api/admin/r2-cors — đọc CORS policy hiện tại */
export async function GET(request: NextRequest) {
    const role = request.headers.get("x-user-role");
    if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const res = await client.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
        return NextResponse.json({ rules: res.CORSRules ?? [] });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ rules: [], error: msg }, { status: 200 });
    }
}

/** POST /api/admin/r2-cors — (re)apply CORS policy */
export async function POST(request: NextRequest) {
    const role = request.headers.get("x-user-role");
    if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        await setupR2Cors();
        return NextResponse.json({ ok: true, message: "CORS applied" });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
