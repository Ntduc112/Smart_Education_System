import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { name, description } = CategorySchema.parse(body);
        const category = await prisma.category.update({
            where: { id },
            data: { name, description },
        });
        return NextResponse.json({ category }, { status: 200 });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
