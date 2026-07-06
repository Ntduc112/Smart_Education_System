import prisma from "@/prisma/prisma";

export type SortOption = "newest" | "popular" | "price_asc" | "price_desc";
export type PriceType  = "free" | "paid" | "all";

export interface CourseListArgs {
    category_id?: string;
    level?: string;
    search?: string;
    sort: SortOption;
    priceType: PriceType;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
}

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

/**
 * Shared published-course listing query. Used by both the /api/courses route
 * and the server-rendered /courses page (SSR prefetch), so first paint has
 * data without a client fetch waterfall.
 */
export async function getPublishedCourses(args: CourseListArgs) {
    const { category_id, level, search, sort, priceType, minPrice, maxPrice, page, limit } = args;

    const searchWhere = search
        ? {
              OR: [
                  { title:       { contains: search, mode: "insensitive" as const } },
                  { description: { contains: search, mode: "insensitive" as const } },
                  { instructor:  { name: { contains: search, mode: "insensitive" as const } } },
              ],
          }
        : {};

    const where = {
        status: "PUBLISHED" as const,
        ...(category_id ? { category_id } : {}),
        ...(level ? { level } : {}),
        ...searchWhere,
        ...buildPriceWhere(priceType, minPrice, maxPrice),
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

    return {
        courses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}
