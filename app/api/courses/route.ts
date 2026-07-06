import { NextRequest, NextResponse } from "next/server";
import { getPublishedCourses, SortOption, PriceType } from "@/lib/courses";

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

        const result = await getPublishedCourses({
            category_id, level, search, sort, priceType, minPrice, maxPrice, page, limit,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
