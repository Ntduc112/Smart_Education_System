import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateCourseSchema = z.object({
    title:            z.string().min(1).optional(),
    description:      z.string().optional(),
    thumbnail:        z.string().optional(),
    price:            z.number().min(0).optional(),
    discount_percent: z.number().int().min(0).max(100).nullable().optional(),
    level:            z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    category_id:      z.string().optional(),
    status:          z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const course = await prisma.course.findUnique({
            where:  { id },
            include: {
                category:   { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true, email: true, avatar: true } },
                _count:     { select: { enrollments: true, sections: true, reviews: true, payments: true } },
            },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ course }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const data = UpdateCourseSchema.parse(body);

        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const updated = await prisma.course.update({
            where: { id },
            data,
            include: {
                category:   { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true, email: true, avatar: true } },
                _count:     { select: { enrollments: true, sections: true, reviews: true, payments: true } },
            },
        });

        return NextResponse.json({ course: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error updating course (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        // Course relations lack onDelete: Cascade, so delete children first.
        // Deleting chapters cascades to lessons (and their progress/notes/questions/quiz).
        await prisma.$transaction([
            prisma.enrollment.deleteMany({ where: { course_id: id } }),
            prisma.payment.deleteMany({ where: { course_id: id } }),
            prisma.review.deleteMany({ where: { course_id: id } }),
            prisma.certificate.deleteMany({ where: { course_id: id } }),
            prisma.chapter.deleteMany({ where: { course_id: id } }),
            prisma.course.delete({ where: { id } }),
        ]);
        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting course (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
