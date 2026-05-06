import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const reviews = await prisma.review.findMany({
            where: { course_id: id },
            include: { user: { select: { name: true, avatar: true } } },
            orderBy: { created_at: "desc" },
        });

        const averageRating = reviews.length
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
            : null;

        return NextResponse.json({ reviews, averageRating, totalCount: reviews.length }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
