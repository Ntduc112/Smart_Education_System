import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notification";

const CommentSchema = z.object({
    content: z.string().min(1, "Nội dung không được trống").max(2000),
});

const userSelect = { id: true, name: true, avatar: true, role: true } as const;

// GET /api/posts/[id]/comments — danh sách comment (cũ → mới)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const comments = await prisma.postComment.findMany({
        where: { post_id: postId },
        orderBy: { created_at: "asc" },
        include: { user: { select: userSelect } },
    });

    return NextResponse.json({ comments });
}

// POST /api/posts/[id]/comments — thêm comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { author_id: true },
        });
        if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

        const { content } = CommentSchema.parse(await request.json());

        const comment = await prisma.postComment.create({
            data: { post_id: postId, user_id: userId, content },
            include: { user: { select: userSelect } },
        });

        // Báo tác giả khi có comment (bỏ qua nếu tự comment bài mình)
        if (post.author_id !== userId) {
            createNotification(
                post.author_id,
                "POST_COMMENT",
                "Bình luận mới",
                "Có người đã bình luận bài viết của bạn",
                "/"
            ).catch(console.error);
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
