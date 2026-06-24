import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateItemSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    order:  z.number().int().min(0).optional(),
});

// Approve/reject a teacher proposal, or reorder an item.
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await params;
    try {
        const data = UpdateItemSchema.parse(await request.json());

        const item = await prisma.roadmapItem.findUnique({
            where:  { id: itemId },
            include: {
                roadmap: { select: { id: true, title: true } },
                course:  { select: { id: true, title: true } },
            },
        });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        const updated = await prisma.roadmapItem.update({ where: { id: itemId }, data });

        // Notify the proposing teacher when their proposal is approved or rejected.
        const statusChanged = data.status && data.status !== item.status;
        if (statusChanged && item.proposed_by && (data.status === "APPROVED" || data.status === "REJECTED")) {
            const approved = data.status === "APPROVED";
            await prisma.notification.create({
                data: {
                    user_id: item.proposed_by,
                    type:    "ROADMAP_PROPOSAL",
                    title:   approved ? "Đề xuất lộ trình được duyệt" : "Đề xuất lộ trình bị từ chối",
                    message: approved
                        ? `Khóa học "${item.course.title}" đã được thêm vào lộ trình "${item.roadmap.title}".`
                        : `Đề xuất thêm "${item.course.title}" vào lộ trình "${item.roadmap.title}" đã bị từ chối.`,
                    link:    "/teacher/courses",
                },
            });
        }

        return NextResponse.json({ item: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error updating roadmap item (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    const { itemId } = await params;
    try {
        const existing = await prisma.roadmapItem.findUnique({ where: { id: itemId }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        await prisma.roadmapItem.delete({ where: { id: itemId } });
        return NextResponse.json({ message: "Item removed from roadmap" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting roadmap item (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
