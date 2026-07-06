import { Suspense } from "react";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getPublishedCourses, SortOption, PriceType } from "@/lib/courses";
import CoursesContent from "./CoursesContent";

// searchParams opts this page into request-time (dynamic) rendering — we want
// fresh course data on every request, prefetched on the server so the client
// hydrates with data already present (no fetch waterfall on first paint).

type SP = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // Derive filter EXACTLY as CoursesContent does on first mount, so the
  // dehydrated queryKey matches the client's useCourses key and hydration hits.
  const search   = first(sp.search) ?? "";
  const category = first(sp.category) ?? "";
  const level    = first(sp.level) ?? "";
  const sort      = (first(sp.sort) as SortOption) ?? "newest";
  const priceType = (first(sp.priceType) as PriceType) ?? "all";
  const minStr = first(sp.minPrice) ?? "";
  const maxStr = first(sp.maxPrice) ?? "";
  const page   = parseInt(first(sp.page) ?? "1");

  const filter = {
    search: search || undefined,
    category_id: category || undefined,
    level: level || undefined,
    sort,
    priceType: priceType !== "all" ? priceType : undefined,
    minPrice: minStr ? parseFloat(minStr) : undefined,
    maxPrice: maxStr ? parseFloat(maxStr) : undefined,
    page,
  };

  const queryClient = new QueryClient();
  try {
    const result = await getPublishedCourses({
      category_id: filter.category_id,
      level: filter.level,
      search: filter.search,
      sort,
      priceType,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: 9,
    });
    // Normalize to the same JSON shape the client receives from /api/courses
    // (Decimal → string, Date → ISO) so hydrated data matches refetch shape.
    queryClient.setQueryData(["courses", "list", filter], JSON.parse(JSON.stringify(result)));
  } catch (e) {
    // Prefetch is best-effort: on failure the client just fetches as before.
    console.error("Course SSR prefetch failed:", e);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <CoursesContent />
      </Suspense>
    </HydrationBoundary>
  );
}
