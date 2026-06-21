"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMe, useStudentCourses } from "@/app/student/dashboard/dashboard.hook";
import { useCourses, useCategories, CourseInList, SortOption, PriceType } from "./courses.hook";
import { useWishlist } from "@/app/student/wishlist/wishlist.hook";
import { WishlistButton } from "@/app/_components/WishlistButton";

// ── Palette (cozy-blue) ──────────────────────────────────────────────────────
const C = {
  canvas: "#EFF5FE",
  card: "#FFFFFF",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  emerald: "#0E9F6E",
  danger: "#e53e3e",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

// ── Motion ───────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = (d = 0.07) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

// ── Decorative floating blobs ─────────────────────────────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ] as const;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)",
            top: "top" in b ? b.top : undefined, left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined, bottom: "bottom" in b ? b.bottom : undefined,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",     label: "Mới nhất" },
  { value: "popular",    label: "Nhiều học viên nhất" },
  { value: "price_asc",  label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: "all",  label: "Tất cả" },
  { value: "free", label: "Miễn phí" },
  { value: "paid", label: "Có phí" },
];

const LEVELS = [
  { value: "", label: "Tất cả cấp độ" },
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── Discovery card ───────────────────────────────────────────────────────────

function CourseCard({
  course,
  isEnrolled,
  isWishlisted,
  isLoggedIn,
}: {
  course: CourseInList;
  isEnrolled: boolean;
  isWishlisted: boolean;
  isLoggedIn: boolean;
}) {
  const isFree = parseFloat(course.price) === 0;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white"
      style={isEnrolled
        ? { border: `2px solid ${C.blue}`, boxShadow: "rgba(27,97,201,0.18) 0px 8px 24px" }
        : { border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
    >
      {/* WishlistButton overlay — top-right, only when not enrolled */}
      {!isEnrolled && (
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton courseId={course.id} isWishlisted={isWishlisted} isLoggedIn={isLoggedIn} size="sm" />
        </div>
      )}

      <Link
        href={isEnrolled ? `/student/courses/${course.id}/learn` : `/courses/${course.id}`}
        className="flex flex-col flex-1"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
              {course.category.name}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs" style={{ color: C.inkSoft, background: "#EAF1FC" }}>
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-3 line-clamp-2 font-display text-[17px] font-semibold leading-snug transition-colors group-hover:text-[#1b61c9]" style={{ color: C.ink }}>
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-4">
            {course.instructor.avatar ? (
              <img src={course.instructor.avatar} alt={course.instructor.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold" style={{ background: "rgba(27,97,201,0.12)", color: C.blue }}>
                {course.instructor.name.charAt(0)}
              </div>
            )}
            <span className="text-[13px] truncate" style={{ color: C.inkSoft }}>{course.instructor.name}</span>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t" style={{ borderColor: "#EEF3FB" }}>
            <div className="flex items-center gap-3 text-xs" style={{ color: C.inkFaint }}>
              <span className="flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {course._count.enrollments.toLocaleString("vi-VN")}
              </span>
              <span className="flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {course._count.sections} chương
              </span>
            </div>
            {isEnrolled ? (
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: C.blue }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã đăng ký
              </span>
            ) : isFree ? (
              <span className="text-sm font-semibold" style={{ color: C.emerald }}>Miễn phí</span>
            ) : course.discount_percent ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold" style={{ color: C.danger }}>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    parseFloat(course.price) * (1 - course.discount_percent / 100)
                  )}
                </span>
                <span className="text-xs line-through" style={{ color: C.inkFaint }}>{formatPrice(course.price)}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold" style={{ color: C.ink }}>{formatPrice(course.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white animate-pulse" style={{ border: `1px solid ${C.border}` }}>
      <div className="aspect-video" style={{ background: "#E7EFFB" }} />
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-20 rounded-full" style={{ background: "#E2ECF9" }} />
          <div className="h-5 w-14 rounded-full" style={{ background: "#E2ECF9" }} />
        </div>
        <div className="h-4 w-full rounded mb-2" style={{ background: "#E2ECF9" }} />
        <div className="h-4 w-3/4 rounded mb-4" style={{ background: "#E2ECF9" }} />
        <div className="h-4 w-1/2 rounded mb-4" style={{ background: "#E2ECF9" }} />
        <div className="h-px w-full my-4" style={{ background: "#EEF3FB" }} />
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded" style={{ background: "#E2ECF9" }} />
          <div className="h-3 w-16 rounded" style={{ background: "#E2ECF9" }} />
        </div>
      </div>
    </div>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────

function CoursesContent() {
  const { data: user, isLoading: userLoading } = useMe();
  const isLoggedIn = !userLoading && !!user;
  const { data: enrolledCourses = [] } = useStudentCourses({ enabled: isLoggedIn });
  const enrolledIds = new Set(enrolledCourses.map((c) => c.id));
  const { data: wishlist = [] } = useWishlist(isLoggedIn);
  const wishlistedIds = new Set(wishlist.map((w) => w.course_id));
  const { data: categories = [] } = useCategories();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch]         = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebounced] = useState(() => searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("category") ?? "");
  const [level, setLevel]           = useState(() => searchParams.get("level") ?? "");
  const [sort, setSort]             = useState<SortOption>(() => (searchParams.get("sort") as SortOption) ?? "newest");
  const [priceType, setPriceType]   = useState<PriceType>(() => (searchParams.get("priceType") as PriceType) ?? "all");
  const [minPrice, setMinPrice]     = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice]     = useState(() => searchParams.get("maxPrice") ?? "");
  const [priceInputMin, setPriceInputMin] = useState(() => searchParams.get("minPrice") ?? "");
  const [priceInputMax, setPriceInputMax] = useState(() => searchParams.get("maxPrice") ?? "");
  const [page, setPage]             = useState(() => parseInt(searchParams.get("page") ?? "1"));

  // Sync state → URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("search", debouncedSearch);
    if (categoryId)      p.set("category", categoryId);
    if (level)           p.set("level", level);
    if (sort !== "newest") p.set("sort", sort);
    if (priceType !== "all") p.set("priceType", priceType);
    if (minPrice)        p.set("minPrice", minPrice);
    if (maxPrice)        p.set("maxPrice", maxPrice);
    if (page > 1)        p.set("page", String(page));
    router.replace(`/courses${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false });
  }, [debouncedSearch, categoryId, level, sort, priceType, minPrice, maxPrice, page]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useCourses({
    search: debouncedSearch || undefined,
    category_id: categoryId || undefined,
    level: level || undefined,
    sort,
    priceType: priceType !== "all" ? priceType : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page,
  });

  const courses = data?.courses ?? [];
  const pagination = data?.pagination;

  const handleCategory = (id: string) => { setCategoryId(id); setPage(1); };
  const handleLevel = (v: string) => { setLevel(v); setPage(1); };
  const handleSort = (v: SortOption) => { setSort(v); setPage(1); };
  const handlePriceType = (v: PriceType) => {
    setPriceType(v);
    if (v !== "paid") { setMinPrice(""); setMaxPrice(""); setPriceInputMin(""); setPriceInputMax(""); }
    setPage(1);
  };
  const applyPriceRange = () => { setMinPrice(priceInputMin); setMaxPrice(priceInputMax); setPage(1); };
  const clearAllFilters = () => {
    setSearch(""); setDebounced(""); setCategoryId(""); setLevel("");
    setSort("newest"); setPriceType("all");
    setMinPrice(""); setMaxPrice(""); setPriceInputMin(""); setPriceInputMax("");
    setPage(1);
  };

  const inputBase = "text-sm bg-white rounded-xl px-3 py-1.5 outline-none focus:border-[#1b61c9] cursor-pointer transition-colors";

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light mb-3" style={{ color: C.ink }}>
            Khám phá <span className="font-semibold" style={{ color: C.blue }}>khóa học</span>
          </h1>
          <p className="tracking-[0.18px] mb-8" style={{ color: C.inkSoft }}>
            Hàng trăm khóa học chất lượng cao từ các chuyên gia hàng đầu
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-base rounded-2xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 focus:border-[#1b61c9] transition-all tracking-[0.08px]"
              style={{ color: C.ink, background: C.card, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#181d26]"
                style={{ color: C.inkFaint }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => handleCategory("")}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-all"
            style={categoryId === ""
              ? { background: C.blue, color: "#fff" }
              : { background: C.card, color: C.inkSoft, border: `1px solid ${C.border}` }}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-all"
              style={categoryId === cat.id
                ? { background: C.blue, color: "#fff" }
                : { background: C.card, color: C.inkSoft, border: `1px solid ${C.border}` }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Filter row ── */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Level */}
              <select
                value={level}
                onChange={(e) => handleLevel(e.target.value)}
                className={inputBase}
                style={{ color: C.ink, border: `1px solid ${C.border}` }}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => handleSort(e.target.value as SortOption)}
                className={inputBase}
                style={{ color: C.ink, border: `1px solid ${C.border}` }}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {/* Price type toggle */}
              <div className="flex items-center rounded-xl overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
                {PRICE_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => handlePriceType(pt.value)}
                    className="px-3 py-1.5 text-sm font-medium transition-colors"
                    style={priceType === pt.value
                      ? { background: C.blue, color: "#fff" }
                      : { color: C.inkSoft }}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm shrink-0" style={{ color: C.inkFaint }}>
              {isFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Đang tải...
                </span>
              ) : pagination ? (
                `${pagination.total} khóa học`
              ) : null}
            </p>
          </div>

          {/* Price range — only shown when priceType=paid */}
          {priceType === "paid" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm" style={{ color: C.inkSoft }}>Giá:</span>
              <input
                type="number"
                min={0}
                placeholder="Từ"
                value={priceInputMin}
                onChange={(e) => setPriceInputMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
                className="w-28 px-3 py-1.5 text-sm rounded-xl outline-none focus:border-[#1b61c9] bg-white"
                style={{ border: `1px solid ${C.border}` }}
              />
              <span className="text-sm" style={{ color: C.inkFaint }}>—</span>
              <input
                type="number"
                min={0}
                placeholder="Đến"
                value={priceInputMax}
                onChange={(e) => setPriceInputMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
                className="w-28 px-3 py-1.5 text-sm rounded-xl outline-none focus:border-[#1b61c9] bg-white"
                style={{ border: `1px solid ${C.border}` }}
              />
              <span className="text-sm" style={{ color: C.inkSoft }}>VND</span>
              <button
                onClick={applyPriceRange}
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-white transition-colors hover:bg-[#254fad]"
                style={{ background: C.blue }}
              >
                Áp dụng
              </button>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setPriceInputMin(""); setPriceInputMax(""); setPage(1); }}
                  className="text-xs transition-colors hover:text-[#181d26]"
                  style={{ color: C.inkFaint }}
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-20" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold mb-1" style={{ color: C.ink }}>Không tìm thấy khóa học</p>
              <p className="text-sm" style={{ color: C.inkSoft }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
            <button
              onClick={clearAllFilters}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#254fad]"
              style={{ background: C.blue }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <motion.div
            key={`${page}-${debouncedSearch}-${categoryId}-${level}-${sort}-${priceType}`}
            initial="hidden" animate="show" variants={stagger(0.05)}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledIds.has(course.id)}
                isWishlisted={wishlistedIds.has(course.id)}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:border-[#1b61c9]/40 hover:text-[#1b61c9] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
              style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const p = i + 1;
              const show = p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1;
              const gap = p === 2 && page > 4;
              const gap2 = p === pagination.totalPages - 1 && page < pagination.totalPages - 3;
              if (!show && !gap && !gap2) return null;
              if (gap || gap2) return <span key={p} className="text-sm" style={{ color: C.inkFaint }}>…</span>;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                  style={p === page
                    ? { background: C.blue, color: "#fff" }
                    : { background: C.card, color: C.inkSoft, border: `1px solid ${C.border}` }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:border-[#1b61c9]/40 hover:text-[#1b61c9] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
              style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesContent />
    </Suspense>
  );
}
