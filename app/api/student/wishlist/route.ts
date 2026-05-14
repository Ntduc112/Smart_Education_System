import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const ToggleSchema = z.object({
    course_id: z.string().uuid(),
});

const COURSE_SELECT = {
    id: true,
    title: true,
    thumbnail: true,
    price: true,
    level: true,
    status: true,
    instructor: { select: { name: true, avatar: true } },
    category: { select: { name: true } },
    _count: { select: { enrollments: true } },
};

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const wishlist = await prisma.wishlist.findMany({
            where: { user_id: userId },
            include: { course: { select: COURSE_SELECT } },
        });

        return NextResponse.json({ wishlist });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { course_id } = ToggleSchema.parse(body);

        const existing = await prisma.wishlist.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id } },
        });

        if (existing) {
            await prisma.wishlist.delete({
                where: { user_id_course_id: { user_id: userId, course_id } },
            });
            return NextResponse.json({ wishlisted: false });
        } else {
            await prisma.wishlist.create({ data: { user_id: userId, course_id } });
            return NextResponse.json({ wishlisted: true });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error toggling wishlist:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
