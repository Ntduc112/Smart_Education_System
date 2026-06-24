import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const ProposeSchema = z.object({
    roadmap_id: z.string().min(1),
});

// List PUBLISHED roadmaps + this course's current proposal state, so the teacher
// can see which roadmaps it can still be proposed into.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const course = await prisma.course.findFirst({
            where:  { id: courseId, instructor_id: userId },
            select: { id: true },
        });
        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

        const [roadmaps, items] = await Promise.all([
            prisma.roadmap.findMany({
                where:   { status: "PUBLISHED" },
                select:  { id: true, title: true, description: true, thumbnail: true },
                orderBy: { created_at: "desc" },
            }),
            prisma.roadmapItem.findMany({
                where:  { course_id: courseId },
                select: { roadmap_id: true, status: true },
            }),
        ]);

        const statusByRoadmap = new Map(items.map((i) => [i.roadmap_id, i.status]));
        const result = roadmaps.map((r) => ({
            ...r,
            proposal_status: statusByRoadmap.get(r.id) ?? null,
        }));

        return NextResponse.json({ roadmaps: result }, { status: 200 });
    } catch (error) {
        console.error("Error listing roadmap proposals (teacher):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { roadmap_id } = ProposeSchema.parse(await request.json());

        const [course, roadmap, existing] = await Promise.all([
            prisma.course.findFirst({
                where:  { id: courseId, instructor_id: userId },
                select: { id: true, title: true },
            }),
            prisma.roadmap.findFirst({
                where:  { id: roadmap_id, status: "PUBLISHED" },
                select: { id: true, title: true },
            }),
            prisma.roadmapItem.findUnique({
                where:  { roadmap_id_course_id: { roadmap_id, course_id: courseId } },
                select: { id: true },
            }),
        ]);

        if (!course)  return NextResponse.json({ error: "Course not found" }, { status: 404 });
        if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
        if (existing) return NextResponse.json({ error: "Already proposed to this roadmap" }, { status: 409 });

        const item = await prisma.roadmapItem.create({
            data: {
                roadmap_id,
                course_id:   courseId,
                status:      "PENDING",
                proposed_by: userId,
            },
        });

        // Notify all admins about the new proposal.
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((a) => ({
                    user_id: a.id,
                    type:    "ROADMAP_PROPOSAL",
                    title:   "Đề xuất lộ trình mới",
                    message: `Khóa học "${course.title}" được đề xuất vào lộ trình "${roadmap.title}".`,
                    link:    `/admin/roadmaps/${roadmap_id}`,
                })),
            });
        }

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error proposing course to roadmap (teacher):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
