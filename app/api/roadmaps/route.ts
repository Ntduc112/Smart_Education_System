import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Public: list PUBLISHED roadmaps with their approved course count.
export async function GET() {
    try {
        const roadmaps = await prisma.roadmap.findMany({
            where:   { status: "PUBLISHED" },
            select: {
                id: true, title: true, description: true, thumbnail: true, created_at: true,
                _count: { select: { items: { where: { status: "APPROVED" } } } },
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json({ roadmaps }, { status: 200 });
    } catch (error) {
        console.error("Error fetching roadmaps (public):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
