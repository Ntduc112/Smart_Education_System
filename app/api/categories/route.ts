import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Public read-only danh mục — dùng cho trang /courses (guest + student).
// Ghi danh mục vẫn ở /api/admin/categories (gate ADMIN).
export async function GET(_request: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { courses: true } } },
            orderBy: { name: "asc" }
        });
        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
