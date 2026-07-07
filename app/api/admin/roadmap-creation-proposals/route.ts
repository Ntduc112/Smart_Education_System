import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status") ?? "PENDING";

        const proposals = await prisma.roadmapCreationProposal.findMany({
            where:   { status: status as "PENDING" | "APPROVED" | "REJECTED" },
            include: {
                course: { select: { id: true, title: true, thumbnail: true, instructor: { select: { id: true, name: true } } } },
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json({ proposals }, { status: 200 });
    } catch (error) {
        console.error("Error listing roadmap creation proposals (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
