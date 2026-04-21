import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status  = searchParams.get("status") ?? undefined;
        const search  = searchParams.get("search") ?? undefined;
        const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

        const where = {
            ...(status && { status: status as "DRAFT" | "PUBLISHED" }),
            ...(search && { title: { contains: search, mode: "insensitive" as const } }),
        };

        const [courses, total] = await prisma.$transaction([
            prisma.course.findMany({
                where,
                include: {
                    category:   { select: { id: true, name: true } },
                    instructor: { select: { id: true, name: true, email: true } },
                    _count:     { select: { enrollments: true } },
                },
                orderBy: { created_at: "desc" },
                skip:    (page - 1) * limit,
                take:    limit,
            }),
            prisma.course.count({ where }),
        ]);

        return NextResponse.json({
            courses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching courses (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
