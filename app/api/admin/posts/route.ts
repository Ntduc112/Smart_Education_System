import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

// GET /api/admin/posts?status=PENDING — hàng đợi duyệt (chỉ ADMIN, middleware ép)
export async function GET(request: NextRequest) {
    const sp = request.nextUrl.searchParams;
    const statusParam = sp.get("status") ?? "PENDING";
    const status = (STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as Status)
        : "PENDING";

    const posts = await prisma.post.findMany({
        where: { status },
        orderBy: { created_at: "desc" },
        include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
            _count: { select: { likes: true, comments: true } },
        },
    });

    return NextResponse.json({ posts });
}
