import { NextRequest, NextResponse } from "next/server";
import { setupR2Cors } from "@/lib/storage/s3";

/** GET /api/admin/r2-cors — kiểm tra CORS hiện tại qua Cloudflare API */
export async function GET(request: NextRequest) {
    const role = request.headers.get("x-user-role");
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const cfToken = process.env.CF_API_TOKEN;
    if (!cfToken) return NextResponse.json({ error: "CF_API_TOKEN not set" }, { status: 500 });

    const endpoint = process.env.S3_ENDPOINT!;
    const accountId = new URL(endpoint).hostname.split(".")[0];
    const bucket = process.env.S3_BUCKET!;

    try {
        const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/cors`,
            { headers: { "Authorization": `Bearer ${cfToken}` } }
        );
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/** POST /api/admin/r2-cors — apply CORS policy */
export async function POST(request: NextRequest) {
    const role = request.headers.get("x-user-role");
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        await setupR2Cors();
        return NextResponse.json({ ok: true, message: "CORS applied" });
    } catch (err: unknown) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
