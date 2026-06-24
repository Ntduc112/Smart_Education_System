import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const AttachSchema = z.object({
    course_id: z.string().min(1),
});

// Admin attaches a course directly -> APPROVED immediately, appended to the end.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: roadmapId } = await params;
    try {
        const { course_id } = AttachSchema.parse(await request.json());

        const [roadmap, course, existing] = await Promise.all([
            prisma.roadmap.findUnique({ where: { id: roadmapId }, select: { id: true } }),
            prisma.course.findUnique({ where: { id: course_id }, select: { id: true } }),
            prisma.roadmapItem.findUnique({
                where: { roadmap_id_course_id: { roadmap_id: roadmapId, course_id } },
                select: { id: true },
            }),
        ]);

        if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
        if (!course)  return NextResponse.json({ error: "Course not found" },  { status: 404 });
        if (existing) return NextResponse.json({ error: "Course already in roadmap" }, { status: 409 });

        const last = await prisma.roadmapItem.findFirst({
            where:   { roadmap_id: roadmapId },
            orderBy: { order: "desc" },
            select:  { order: true },
        });

        const item = await prisma.roadmapItem.create({
            data: {
                roadmap_id: roadmapId,
                course_id,
                order:      (last?.order ?? 0) + 1,
                status:     "APPROVED",
            },
        });

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error attaching course to roadmap (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
