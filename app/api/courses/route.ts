import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const category_id = searchParams.get("category_id") ?? undefined;
        const level      = searchParams.get("level") ?? undefined;
        const search     = searchParams.get("search") ?? undefined;
        const minPrice   = searchParams.get("minPrice");
        const maxPrice   = searchParams.get("maxPrice");
        const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit      = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));

        const courses = await prisma.course.findMany({
            where: {
                status: "PUBLISHED",
                category_id,
                level,
                ...(search && {
                    title: { contains: search, mode: "insensitive" },
                }),
                ...(minPrice || maxPrice
                    ? {
                          price: {
                              ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                              ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
                          },
                      }
                    : {}),
            },
            include: {
                category: { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true, avatar: true } },
                _count: { select: { enrollments: true, sections: true } },
            },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.course.count({
            where: {
                status: "PUBLISHED",
                category_id,
                level,
                ...(search && { title: { contains: search, mode: "insensitive" } }),
            },
        });

        return NextResponse.json({
            courses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
