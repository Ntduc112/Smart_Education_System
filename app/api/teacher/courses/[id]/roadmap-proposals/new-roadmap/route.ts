import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const ProposeSchema = z.object({
    title:       z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
});

// Latest proposal (if any) this teacher made to create a new roadmap from this course.
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

        const proposal = await prisma.roadmapCreationProposal.findFirst({
            where:   { course_id: courseId, proposed_by: userId },
            orderBy: { created_at: "desc" },
            select:  { id: true, title: true, description: true, status: true },
        });

        return NextResponse.json({ proposal }, { status: 200 });
    } catch (error) {
        console.error("Error fetching roadmap creation proposal (teacher):", error);
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
        const { title, description } = ProposeSchema.parse(await request.json());

        const [course, pending] = await Promise.all([
            prisma.course.findFirst({
                where:  { id: courseId, instructor_id: userId },
                select: { id: true, title: true },
            }),
            prisma.roadmapCreationProposal.findFirst({
                where:  { course_id: courseId, proposed_by: userId, status: "PENDING" },
                select: { id: true },
            }),
        ]);

        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        if (pending) return NextResponse.json({ error: "Already have a pending proposal" }, { status: 409 });

        const proposal = await prisma.roadmapCreationProposal.create({
            data: {
                title,
                description,
                course_id:   courseId,
                proposed_by: userId,
                status:      "PENDING",
            },
        });

        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((a) => ({
                    user_id: a.id,
                    type:    "ROADMAP_CREATION_PROPOSAL",
                    title:   "Đề xuất lộ trình mới",
                    message: `Giảng viên đề xuất tạo lộ trình mới "${title}" (từ khóa học "${course.title}").`,
                    link:    "/admin/roadmaps",
                })),
            });
        }

        return NextResponse.json({ proposal }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error proposing new roadmap (teacher):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
