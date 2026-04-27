import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const PublishSchema = z.object({
    status: z.enum(["PUBLISHED", "DRAFT"]),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { status } = PublishSchema.parse(body);

        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const updated = await prisma.course.update({
            where: { id },
            data: { status },
        });
        return NextResponse.json({ course: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        console.error("Error publishing course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
