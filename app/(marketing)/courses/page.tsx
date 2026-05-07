"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { useState, useEffect } from "react";
import { useMe, useStudentCourses } from "@/app/student/dashboard/dashboard.hook";
import { useCourses, useCategories, CourseInList } from "./courses.hook";
import { useWishlist } from "@/app/student/wishlist/wishlist.hook";
import { WishlistButton } from "@/app/_components/WishlistButton";

// ── Constants ──────────────────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────────────────────

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
    <div
      className="group bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg relative"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
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
      <div className="relative aspect-video overflow-hidden bg-[#f8fafc]">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isFree && (
          <div className="absolute top-3 left-3 bg-[#006400] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Miễn phí
          </div>
        )}
        {isEnrolled && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#1b61c9] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã đăng ký
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-[#1b61c9] bg-[#1b61c9]/8 px-2.5 py-1 rounded-full font-medium">
            {course.category.name}
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.55)] bg-[#f8fafc] px-2.5 py-1 rounded-full border border-[#e0e2e6]">
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-medium text-[#181d26] leading-snug line-clamp-2 mb-3 tracking-[0.08px] group-hover:text-[#1b61c9] transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          {course.instructor.avatar ? (
            <img src={course.instructor.avatar} alt={course.instructor.name} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#1b61c9]/15 flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#1b61c9]">{course.instructor.name.charAt(0)}</span>
            </div>
          )}
          <span className="text-sm text-[rgba(4,14,32,0.55)] truncate">{course.instructor.name}</span>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#f0f2f5]">
          <div className="flex items-center gap-3 text-xs text-[rgba(4,14,32,0.45)]">
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
          <span className={`text-sm font-semibold ${isFree ? "text-[#006400]" : "text-[#181d26]"}`}>
            {formatPrice(course.price)}
          </span>
        </div>
      </div>
      </Link>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-5 w-14 bg-gray-100 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-100 rounded mb-4" />
        <div className="h-px w-full bg-gray-100 my-4" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const isLoggedIn = !userLoading && !!user;
  const { data: enrolledCourses = [] } = useStudentCourses({ enabled: isLoggedIn });
  const enrolledIds = new Set(enrolledCourses.map((c) => c.id));
  const { data: wishlist = [] } = useWishlist(isLoggedIn);
  const wishlistedIds = new Set(wishlist.map((w) => w.course_id));
  const { data: categories = [] } = useCategories();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useCourses({
    search: debouncedSearch || undefined,
    category_id: categoryId || undefined,
    level: level || undefined,
    page,
  });

  const courses = data?.courses ?? [];
  const pagination = data?.pagination;

  const handleCategory = (id: string) => { setCategoryId(id); setPage(1); };
  const handleLevel = (v: string) => { setLevel(v); setPage(1); };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
          </Link>
          {!userLoading && (
            isLoggedIn ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[rgba(4,14,32,0.69)] hover:text-[#181d26] hover:bg-[#f8fafc] transition-colors tracking-[0.08px]"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors tracking-[0.08px]"
                >
                  Đăng ký
                </Link>
              </div>
            )
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-[#181d26] mb-3">
            Khám phá <span className="font-semibold">khóa học</span>
          </h1>
          <p className="text-[rgba(4,14,32,0.55)] tracking-[0.18px] mb-8">
            Hàng trăm khóa học chất lượng cao từ các chuyên gia hàng đầu
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-base text-[#181d26] bg-white border border-[#e0e2e6] rounded-2xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 focus:border-[#1b61c9] transition-all placeholder:text-[rgba(4,14,32,0.35)] tracking-[0.08px]"
              style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26] transition-colors"
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
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-all ${categoryId === ""
              ? "bg-[#1b61c9] text-white"
              : "bg-white text-[rgba(4,14,32,0.69)] border border-[#e0e2e6] hover:border-[#1b61c9]/40 hover:text-[#181d26]"
              }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-all ${categoryId === cat.id
                ? "bg-[#1b61c9] text-white"
                : "bg-white text-[rgba(4,14,32,0.69)] border border-[#e0e2e6] hover:border-[#1b61c9]/40 hover:text-[#181d26]"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Filter row ── */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(4,14,32,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="text-sm text-[rgba(4,14,32,0.55)]">Cấp độ:</span>
            <select
              value={level}
              onChange={(e) => handleLevel(e.target.value)}
              className="text-sm text-[#181d26] bg-white border border-[#e0e2e6] rounded-xl px-3 py-1.5 outline-none focus:border-[#1b61c9] cursor-pointer"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-[rgba(4,14,32,0.45)] shrink-0">
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

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-[#e0e2e6] rounded-2xl py-20 flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-[#f8fafc] rounded-2xl flex items-center justify-center border border-[#e0e2e6]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(4,14,32,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#181d26] font-medium mb-1">Không tìm thấy khóa học</p>
              <p className="text-sm text-[rgba(4,14,32,0.55)]">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
            <button
              onClick={() => { setSearch(""); setCategoryId(""); setLevel(""); setPage(1); }}
              className="text-sm text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledIds.has(course.id)}
                isWishlisted={wishlistedIds.has(course.id)}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-[#e0e2e6] flex items-center justify-center text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
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
              if (gap || gap2) return <span key={p} className="text-[rgba(4,14,32,0.35)] text-sm">…</span>;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${p === page
                    ? "bg-[#1b61c9] text-white"
                    : "bg-white text-[rgba(4,14,32,0.69)] border border-[#e0e2e6] hover:border-[#1b61c9]/40"
                    }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-xl border border-[#e0e2e6] flex items-center justify-center text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
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
