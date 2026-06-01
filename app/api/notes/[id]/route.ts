import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
    content: z.string().min(1, "Nội dung không được trống").max(5000),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const note = await prisma.lessonNote.findUnique({ where: { id } });
        if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
        if (note.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { content } = UpdateSchema.parse(body);

        const updated = await prisma.lessonNote.update({
            where: { id },
            data: { content },
            select: { id: true, content: true, video_time: true, created_at: true, updated_at: true },
        });

        return NextResponse.json({ note: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error updating note:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const note = await prisma.lessonNote.findUnique({ where: { id } });
        if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
        if (note.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.lessonNote.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
