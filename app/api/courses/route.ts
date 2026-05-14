import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

type SortOption = "newest" | "popular" | "price_asc" | "price_desc";
type PriceType  = "free" | "paid" | "all";

function buildOrderBy(sort: SortOption) {
    switch (sort) {
        case "popular":    return { enrollments: { _count: "desc" as const } };
        case "price_asc":  return { price: "asc" as const };
        case "price_desc": return { price: "desc" as const };
        default:           return { created_at: "desc" as const };
    }
}

function buildPriceWhere(priceType: PriceType, minPrice?: number, maxPrice?: number) {
    if (priceType === "free") return { price: { equals: 0 } };
    if (priceType === "paid") {
        return {
            price: {
                gt: 0,
                ...(minPrice != null ? { gte: minPrice } : {}),
                ...(maxPrice != null ? { lte: maxPrice } : {}),
            },
        };
    }
    return {};
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const category_id = searchParams.get("category_id") ?? undefined;
        const level       = searchParams.get("level") ?? undefined;
        const search      = searchParams.get("search") ?? undefined;
        const sort        = (searchParams.get("sort") ?? "newest") as SortOption;
        const priceType   = (searchParams.get("priceType") ?? "all") as PriceType;
        const minPrice    = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
        const maxPrice    = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
        const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit       = Math.min(20, parseInt(searchParams.get("limit") ?? "9"));

        const searchWhere = search
            ? {
                  OR: [
                      { title:       { contains: search, mode: "insensitive" as const } },
                      { description: { contains: search, mode: "insensitive" as const } },
                      { instructor:  { name: { contains: search, mode: "insensitive" as const } } },
                  ],
              }
            : {};

        const priceWhere = buildPriceWhere(priceType, minPrice, maxPrice);

        const where = {
            status: "PUBLISHED" as const,
            ...(category_id ? { category_id } : {}),
            ...(level ? { level } : {}),
            ...searchWhere,
            ...priceWhere,
        };

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    category:   { select: { id: true, name: true } },
                    instructor: { select: { id: true, name: true, avatar: true } },
                    _count:     { select: { enrollments: true, sections: true } },
                },
                orderBy: buildOrderBy(sort),
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.course.count({ where }),
        ]);

        return NextResponse.json({
            courses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
