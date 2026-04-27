import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: { user_id: userId, course_id: id },
            },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                category:   { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true, avatar: true } },
                sections: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ course }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course content:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
