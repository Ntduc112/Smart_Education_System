import { NextRequest, NextResponse } from "next/server";
import { convertToHLS } from "@/lib/video/hls";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const maxDuration = 300; // 5 phút cho ffmpeg processing

export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "Không có file được gửi lên" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Chỉ chấp nhận file video (MP4, MOV, AVI, WebM)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "Video vượt quá giới hạn 500MB" }, { status: 400 });
    }

    try {
        // Truyền stream trực tiếp, không đọc toàn bộ file vào RAM
        const { keyPrefix } = await convertToHLS(file.stream());

        // video_url lưu dưới dạng "hls:<keyPrefix>" để phân biệt với YouTube URL
        const videoUrl = `hls:${keyPrefix}`;
        return NextResponse.json({ url: videoUrl }, { status: 200 });
    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ error: "Xử lý video thất bại" }, { status: 500 });
    }
}
