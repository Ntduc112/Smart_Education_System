import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getPresignedPutUrl } from "@/lib/storage/s3";

// contentType → đuôi file. Quyết định luôn mediaType cho client.
const TYPE_MAP: Record<string, { ext: string; media: "IMAGE" | "VIDEO" }> = {
    "image/jpeg": { ext: "jpg", media: "IMAGE" },
    "image/png": { ext: "png", media: "IMAGE" },
    "image/webp": { ext: "webp", media: "IMAGE" },
    "image/gif": { ext: "gif", media: "IMAGE" },
    "video/mp4": { ext: "mp4", media: "VIDEO" },
    "video/quicktime": { ext: "mov", media: "VIDEO" },
    "video/webm": { ext: "webm", media: "VIDEO" },
};

/**
 * GET /api/posts/upload/presigned?contentType=image/png
 * Trả presigned PUT URL để browser upload thẳng media lên R2 (folder posts/).
 */
export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.nextUrl.searchParams.get("contentType") ?? "";
    const mapped = TYPE_MAP[contentType];
    if (!mapped) {
        return NextResponse.json({ error: "Loại file không hợp lệ" }, { status: 400 });
    }

    const key = `posts/${randomUUID()}.${mapped.ext}`;
    const uploadUrl = await getPresignedPutUrl(key, 3600);
    const publicUrl = `${process.env.S3_PUBLIC_URL}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, mediaType: mapped.media });
}
