import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// POST /api/posts/[id]/like — react: value 1 (like) | -1 (dislike).
// Bấm lại cùng giá trị = bỏ; bấm giá trị khác = đổi.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const value = body?.value === -1 ? -1 : 1;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    const key = { post_id_user_id: { post_id: postId, user_id: userId } };
    const existing = await prisma.postLike.findUnique({ where: key });

    let myReaction: number | null = value;
    if (existing && existing.value === value) {
        await prisma.postLike.delete({ where: key });
        myReaction = null;
    } else if (existing) {
        await prisma.postLike.update({ where: key, data: { value } });
    } else {
        await prisma.postLike.create({ data: { post_id: postId, user_id: userId, value } });
    }

    const [likeCount, dislikeCount] = await Promise.all([
        prisma.postLike.count({ where: { post_id: postId, value: 1 } }),
        prisma.postLike.count({ where: { post_id: postId, value: -1 } }),
    ]);
    return NextResponse.json({ myReaction, likeCount, dislikeCount });
}
