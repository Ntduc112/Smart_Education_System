import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage/s3";

const ALLOWED_TYPES = ["application/pdf"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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
        return NextResponse.json({ error: "Chỉ chấp nhận file PDF" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "File vượt quá giới hạn 50MB" }, { status: 400 });
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFile(buffer, file.name, file.type);
        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
    }
}
