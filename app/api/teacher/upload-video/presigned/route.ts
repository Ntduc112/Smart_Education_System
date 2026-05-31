import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getPresignedPutUrl } from "@/lib/storage/s3";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

/**
 * GET /api/teacher/upload-video/presigned?contentType=video/mp4
 *
 * Trả về presigned PUT URL để browser upload thẳng lên MinIO.
 * Next.js server không nhận file, không tốn băng thông.
 *
 * MinIO cần cấu hình CORS cho phép PUT từ browser:
 *   mc anonymous set-json cors.json myminio/<bucket>
 * cors.json: { "CORSRules": [{ "AllowedOrigins":["*"], "AllowedMethods":["PUT","GET"],
 *              "AllowedHeaders":["*"] }] }
 */
export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.nextUrl.searchParams.get("contentType") ?? "video/mp4";
    if (!ALLOWED_TYPES.includes(contentType)) {
        return NextResponse.json({ error: "Loại file không hợp lệ" }, { status: 400 });
    }

    // raw/ prefix để phân biệt với HLS segments đã xử lý
    const rawKey = `raw/${randomUUID()}.mp4`;
    const uploadUrl = await getPresignedPutUrl(rawKey, 3600);

    return NextResponse.json({ uploadUrl, rawKey });
}
