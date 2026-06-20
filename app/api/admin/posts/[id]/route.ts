import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notification";

const ModerateSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
});

// PATCH /api/admin/posts/[id] — duyệt / từ chối (chỉ ADMIN, middleware ép)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { status } = ModerateSchema.parse(await request.json());

        const post = await prisma.post.findUnique({ where: { id }, select: { author_id: true } });
        if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

        const updated = await prisma.post.update({ where: { id }, data: { status } });

        createNotification(
            post.author_id,
            status === "APPROVED" ? "POST_APPROVED" : "POST_REJECTED",
            status === "APPROVED" ? "Bài viết đã được duyệt" : "Bài viết bị từ chối",
            status === "APPROVED"
                ? "Bài viết của bạn đã được duyệt và hiển thị công khai"
                : "Bài viết của bạn không được duyệt",
            "/"
        ).catch(console.error);

        return NextResponse.json({ post: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error moderating post:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
