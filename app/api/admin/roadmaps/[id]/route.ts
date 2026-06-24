import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
    title:       z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    thumbnail:   z.string().nullable().optional(),
    status:      z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const roadmap = await prisma.roadmap.findUnique({
            where:   { id },
            include: {
                items: {
                    orderBy: [{ order: "asc" }, { created_at: "asc" }],
                    include: {
                        course: {
                            select: {
                                id: true, title: true, thumbnail: true, status: true,
                                instructor: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
        return NextResponse.json({ roadmap }, { status: 200 });
    } catch (error) {
        console.error("Error fetching roadmap (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const data = UpdateSchema.parse(await request.json());

        const existing = await prisma.roadmap.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

        const roadmap = await prisma.roadmap.update({ where: { id }, data });
        return NextResponse.json({ roadmap }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error updating roadmap (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const existing = await prisma.roadmap.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

        // RoadmapItem has onDelete: Cascade, so deleting the roadmap removes its items.
        await prisma.roadmap.delete({ where: { id } });
        return NextResponse.json({ message: "Roadmap deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting roadmap (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
