import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Upload avatar cho mọi user đã đăng nhập (student / teacher / admin).
// Lưu vào prefix "profile" trên R2.
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
        return NextResponse.json({ error: "Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "Ảnh vượt quá giới hạn 5MB" }, { status: 400 });
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFile(buffer, file.name, file.type, "profile");
        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
    }
}
