import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
});

// Approve creates the actual Roadmap (and attaches the proposing course as its
// first item, already APPROVED); reject just marks the proposal. Either way the
// proposing teacher gets notified.
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { status } = ReviewSchema.parse(await request.json());

        const proposal = await prisma.roadmapCreationProposal.findUnique({
            where:  { id },
            include: { course: { select: { id: true, title: true } } },
        });
        if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
        if (proposal.status !== "PENDING") return NextResponse.json({ error: "Proposal already reviewed" }, { status: 409 });

        let roadmapId: string | null = null;

        if (status === "APPROVED") {
            const roadmap = await prisma.roadmap.create({
                data: {
                    title:       proposal.title,
                    description: proposal.description,
                    status:      "DRAFT",
                    ...(proposal.course_id && {
                        items: { create: { course_id: proposal.course_id, order: 1, status: "APPROVED" } },
                    }),
                },
            });
            roadmapId = roadmap.id;
        }

        await prisma.roadmapCreationProposal.update({ where: { id }, data: { status } });

        await prisma.notification.create({
            data: {
                user_id: proposal.proposed_by,
                type:    "ROADMAP_CREATION_PROPOSAL",
                title:   status === "APPROVED" ? "Đề xuất lộ trình được duyệt" : "Đề xuất lộ trình bị từ chối",
                message: status === "APPROVED"
                    ? `Lộ trình "${proposal.title}" đã được tạo${proposal.course ? ` với khóa học "${proposal.course.title}" là bước đầu` : ""}.`
                    : `Đề xuất tạo lộ trình "${proposal.title}" đã bị từ chối.`,
                link: roadmapId ? `/admin/roadmaps/${roadmapId}` : "/teacher/courses",
            },
        });

        return NextResponse.json({ status, roadmap_id: roadmapId }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error reviewing roadmap creation proposal (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
