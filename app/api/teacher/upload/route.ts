import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage/s3";
import pdfParse from "pdf-parse";

const ALLOWED_TYPES = ["application/pdf"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_PDF_TEXT   = 8000;             // ký tự tối đa lưu vào DB

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

        // Upload lên S3 và extract text song song
        const [url, parsed] = await Promise.all([
            uploadFile(buffer, file.name, file.type),
            pdfParse(buffer).catch(() => null),
        ]);

        const pdfText = parsed?.text
            ? parsed.text.replace(/\s+/g, " ").trim().slice(0, MAX_PDF_TEXT)
            : null;

        return NextResponse.json({ url, pdfText }, { status: 200 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
    }
}
