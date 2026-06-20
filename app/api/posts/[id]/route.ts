import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

const authorSelect = { id: true, name: true, avatar: true, role: true } as const;

// GET /api/posts/[id] — 1 bài viết kèm comment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true } },
        },
    });
    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    const likedByMe = !!(await prisma.postLike.findUnique({
        where: { post_id_user_id: { post_id: id, user_id: userId } },
    }));

    return NextResponse.json({ post: { ...post, likedByMe } });
}

// DELETE /api/posts/[id] — tác giả hoặc admin
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id }, select: { author_id: true } });
    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    if (post.author_id !== userId && role !== "ADMIN") {
        return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
