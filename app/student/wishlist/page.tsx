"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { WishlistButton } from "@/app/_components/WishlistButton";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useWishlist, WishlistItem } from "./wishlist.hook";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const { course } = item;
  const isFree = parseFloat(course.price) === 0;

  return (
    <div className="group bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg relative"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      {/* WishlistButton overlay */}
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton courseId={course.id} isWishlisted={true} isLoggedIn={true} size="sm" />
      </div>

      <Link href={`/courses/${course.id}`} className="flex flex-col flex-1">
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
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-[#1b61c9] bg-[#1b61c9]/8 px-2.5 py-1 rounded-full font-medium">
              {course.category.name}
            </span>
            <span className="text-xs text-[rgba(4,14,32,0.55)] bg-[#f8fafc] px-2.5 py-1 rounded-full border border-[#e0e2e6]">
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          </div>

          <h3 className="text-base font-medium text-[#181d26] leading-snug line-clamp-2 mb-3 tracking-[0.08px] group-hover:text-[#1b61c9] transition-colors">
            {course.title}
          </h3>

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

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#f0f2f5]">
            <span className="flex items-center gap-1 text-xs text-[rgba(4,14,32,0.45)]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {course._count.enrollments.toLocaleString("vi-VN")}
            </span>
            <span className={`text-sm font-semibold ${isFree ? "text-[#006400]" : "text-[#181d26]"}`}>
              {formatPrice(course.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-5 w-14 bg-gray-100 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="h-px w-full bg-gray-100 my-3" />
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { data: user } = useMe();
  const { data: wishlist, isLoading } = useWishlist(!!user);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
            </Link>
            <div className="w-px h-5 bg-[#e0e2e6] hidden sm:block" />
            <Link href="/student/dashboard" className="text-sm text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors hidden sm:block">
              Dashboard
            </Link>
          </div>
          <UserMenu user={user ?? null} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">
            Khóa học đã lưu
            {wishlist && wishlist.length > 0 && (
              <span className="ml-2 text-base font-normal text-[rgba(4,14,32,0.45)]">
                ({wishlist.length})
              </span>
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <WishlistCard key={item.course_id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 gap-4 bg-white rounded-2xl border border-[#e0e2e6]">
            <div className="w-16 h-16 rounded-2xl bg-[#fffbeb] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#181d26] font-medium mb-1">Bạn chưa lưu khóa học nào</p>
              <p className="text-sm text-[rgba(4,14,32,0.55)]">Khám phá các khóa học và nhấn ★ để lưu lại</p>
            </div>
            <Link
              href="/courses"
              className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors"
              style={{ boxShadow: "rgba(45,127,249,0.28) 0px 1px 4px" }}
            >
              Khám phá khóa học
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
