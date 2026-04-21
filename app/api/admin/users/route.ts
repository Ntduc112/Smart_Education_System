import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const role   = searchParams.get("role") ?? undefined;
        const search = searchParams.get("search") ?? undefined;
        const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

        const where = {
            ...(role && { role: role as "STUDENT" | "TEACHER" | "ADMIN" }),
            ...(search && {
                OR: [
                    { name:  { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                select: {
                    id:         true,
                    name:       true,
                    email:      true,
                    role:       true,
                    avatar:     true,
                    created_at: true,
                    _count:     { select: { enrollments: true, courses: true } },
                },
                orderBy: { created_at: "desc" },
                skip:    (page - 1) * limit,
                take:    limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching users (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
