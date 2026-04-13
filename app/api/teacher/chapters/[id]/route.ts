import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateChapterSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    order: z.number().int().min(1, "Order must be a positive integer").optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { title, order } = UpdateChapterSchema.parse(body);

        // Verify chapter belongs to a course owned by this teacher
        const existing = await prisma.chapter.findFirst({
            where: {
                id: params.id,
                course: { instructor_id: userId },
            },
        });
        if (!existing) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        const chapter = await prisma.chapter.update({
            where: { id: params.id },
            data: { title, order },
        });
        return NextResponse.json({ chapter }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating chapter:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = _request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify chapter belongs to a course owned by this teacher
        const existing = await prisma.chapter.findFirst({
            where: {
                id: params.id,
                course: { instructor_id: userId },
            },
        });
        if (!existing) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        await prisma.chapter.delete({ where: { id: params.id } });
        return NextResponse.json({ message: "Chapter deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
