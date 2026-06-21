import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CreatePostSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được trống").max(200),
    content: z.string().min(1, "Nội dung không được trống").max(5000),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
});

const authorSelect = { id: true, name: true, avatar: true, role: true } as const;

// GET /api/posts?page=1&limit=10 — feed bài viết đã duyệt (mới nhất trước)
export async function GET(request: NextRequest) {
    // Feed công khai: guest cũng xem được. Chỉ user đăng nhập mới có myReaction.
    const userId = request.headers.get("x-user-id");

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "10") || 10));

    try {
    const [total, posts] = await Promise.all([
        prisma.post.count({ where: { status: "APPROVED" } }),
        prisma.post.findMany({
            where: { status: "APPROVED" },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                author: { select: authorSelect },
                _count: { select: { comments: true } },
            },
        }),
    ]);

    const ids = posts.map((p) => p.id);
    const [grouped, mine] = await Promise.all([
        prisma.postLike.groupBy({
            by: ["post_id", "value"],
            where: { post_id: { in: ids } },
            _count: { _all: true },
        }),
        userId
            ? prisma.postLike.findMany({
                where: { user_id: userId, post_id: { in: ids } },
                select: { post_id: true, value: true },
            })
            : Promise.resolve([] as { post_id: string; value: number }[]),
    ]);

    const likeMap = new Map<string, number>();
    const dislikeMap = new Map<string, number>();
    for (const g of grouped) {
        (g.value === 1 ? likeMap : dislikeMap).set(g.post_id, g._count._all);
    }
    const myMap = new Map(mine.map((r) => [r.post_id, r.value]));

    const data = posts.map((p) => ({
        ...p,
        likeCount: likeMap.get(p.id) ?? 0,
        dislikeCount: dislikeMap.get(p.id) ?? 0,
        myReaction: myMap.get(p.id) ?? null,
    }));

    return NextResponse.json({
        posts: data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    } catch (error) {
        console.error("Error fetching posts feed:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

// POST /api/posts — tạo bài viết (mọi user login), mặc định PENDING chờ duyệt
export async function POST(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { title, content, mediaUrl, mediaType } = CreatePostSchema.parse(body);

        const post = await prisma.post.create({
            data: {
                author_id: userId,
                title,
                content,
                media_url: mediaUrl ?? null,
                media_type: mediaType ?? null,
            },
            include: { author: { select: authorSelect } },
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
