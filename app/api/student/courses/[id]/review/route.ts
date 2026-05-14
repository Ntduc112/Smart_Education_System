import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
        });
        if (!enrollment) return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });

        const body = await request.json();
        const { rating, comment } = reviewSchema.parse(body);

        const review = await prisma.review.upsert({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
            create: { user_id: userId, course_id: id, rating, comment },
            update: { rating, comment },
        });

        return NextResponse.json({ review }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const review = await prisma.review.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: id } },
        });

        return NextResponse.json({ review: review ?? null }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
