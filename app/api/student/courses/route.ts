import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: userId },
            include: {
                course: {
                    include: {
                        category:   { select: { id: true, name: true } },
                        instructor: { select: { id: true, name: true, avatar: true } },
                        _count:     { select: { sections: true } },
                    },
                },
            },
            orderBy: { enrolled_at: "desc" },
        });

        const courses = enrollments.map((e) => e.course);
        return NextResponse.json({ courses }, { status: 200 });
    } catch (error) {
        console.error("Error fetching student courses:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
