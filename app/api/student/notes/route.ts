import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const notes = await prisma.lessonNote.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                content: true,
                created_at: true,
                updated_at: true,
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        chapter: {
                            select: {
                                course: {
                                    select: { id: true, title: true, thumbnail: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error("Error fetching all notes:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
