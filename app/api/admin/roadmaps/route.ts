import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CreateSchema = z.object({
    title:       z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    thumbnail:   z.string().nullable().optional(),
    status:      z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status") ?? undefined;

        const roadmaps = await prisma.roadmap.findMany({
            where:   { ...(status && { status: status as "DRAFT" | "PUBLISHED" }) },
            include: { _count: { select: { items: true } } },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json({ roadmaps }, { status: 200 });
    } catch (error) {
        console.error("Error fetching roadmaps (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = CreateSchema.parse(await request.json());

        const roadmap = await prisma.roadmap.create({
            data: {
                title:       data.title,
                description: data.description,
                thumbnail:   data.thumbnail ?? null,
                status:      data.status ?? "DRAFT",
            },
        });

        return NextResponse.json({ roadmap }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.issues }, { status: 400 });
        }
        console.error("Error creating roadmap (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
