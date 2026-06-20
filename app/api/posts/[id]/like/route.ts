import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// POST /api/posts/[id]/like — toggle like
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    const key = { post_id_user_id: { post_id: postId, user_id: userId } };
    const existing = await prisma.postLike.findUnique({ where: key });

    if (existing) {
        await prisma.postLike.delete({ where: key });
    } else {
        await prisma.postLike.create({ data: { post_id: postId, user_id: userId } });
    }

    const likeCount = await prisma.postLike.count({ where: { post_id: postId } });
    return NextResponse.json({ liked: !existing, likeCount });
}
