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
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "10") || 10));

    const [total, posts] = await Promise.all([
        prisma.post.count({ where: { status: "APPROVED" } }),
        prisma.post.findMany({
            where: { status: "APPROVED" },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                author: { select: authorSelect },
                _count: { select: { likes: true, comments: true } },
            },
        }),
    ]);

    const likedIds = new Set(
        (await prisma.postLike.findMany({
            where: { user_id: userId, post_id: { in: posts.map((p) => p.id) } },
            select: { post_id: true },
        })).map((l) => l.post_id)
    );

    const data = posts.map((p) => ({ ...p, likedByMe: likedIds.has(p.id) }));

    return NextResponse.json({
        posts: data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
