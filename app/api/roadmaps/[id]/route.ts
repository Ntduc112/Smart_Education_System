import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Public: a PUBLISHED roadmap with its APPROVED courses in order.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const roadmap = await prisma.roadmap.findFirst({
            where:   { id, status: "PUBLISHED" },
            select: {
                id: true, title: true, description: true, thumbnail: true, created_at: true,
                items: {
                    where:   { status: "APPROVED" },
                    orderBy: [{ order: "asc" }, { created_at: "asc" }],
                    select: {
                        id: true, order: true,
                        course: {
                            select: {
                                id: true, title: true, description: true, thumbnail: true,
                                price: true, discount_percent: true, level: true,
                                instructor: { select: { id: true, name: true } },
                                _count:     { select: { enrollments: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
        return NextResponse.json({ roadmap }, { status: 200 });
    } catch (error) {
        console.error("Error fetching roadmap (public):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
