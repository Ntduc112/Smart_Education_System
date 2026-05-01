"use client";

import Link from "next/link";
import { useCourses, CourseInList } from "@/app/(marketing)/courses/courses.hook";
import { useMe, useStudentCourses } from "@/app/student/dashboard/dashboard.hook";

// ── Gradient palette ───────────────────────────────────────────────────────

const CATEGORY_GRADIENT: Record<string, string> = {
  "Lập trình & Công nghệ":    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "Thiết kế & Sáng tạo":      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "Kinh doanh & Khởi nghiệp": "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "Ngoại ngữ":                "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
];

function getGradient(course: CourseInList, idx: number): string {
  return CATEGORY_GRADIENT[course.category.name] ?? FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
}

function formatPrice(price: string) {
  const n = parseFloat(price);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── Card ───────────────────────────────────────────────────────────────────

function GradientCard({
  course,
  index,
  variant = "sm",
  isEnrolled = false,
}: {
  course: CourseInList;
  index: number;
  variant?: "sm" | "lg";
  isEnrolled?: boolean;
}) {
  const isFree    = parseFloat(course.price) === 0;
  const gradient  = getGradient(course, index);
  const isLg      = variant === "lg";

  return (
    <Link
      href={isEnrolled ? `/student/courses/${course.id}/learn` : `/courses/${course.id}`}
      className="group block"
    >
      {/* Gradient thumbnail */}
      <div
        className={`relative rounded-2xl overflow-hidden ${isLg ? "aspect-[16/10]" : "aspect-video"}`}
        style={{ background: gradient }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

        {/* Enrolled chip */}
        {isEnrolled && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#1b61c9] text-[10px] font-bold px-2 py-1 rounded-full">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã đăng ký
          </div>
        )}

        {/* Text overlay */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <span className="text-white/60 text-[10px] uppercase tracking-[0.15em] mb-1">
            {course.category.name}
          </span>
          <h3 className={`text-white font-bold leading-tight ${isLg ? "text-xl" : "text-base"} line-clamp-2`}>
            {course.title}
          </h3>
        </div>

        {/* Hover darken */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-2xl" />
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <h3 className="text-sm font-medium text-[#181d26] line-clamp-2 leading-snug mb-1 group-hover:text-[#1b61c9] transition-colors">
          {course.title}
        </h3>

        <p className={`text-sm font-semibold mb-2 ${isFree ? "text-[#1b61c9]" : "text-[#e5521b]"}`}>
          {isFree ? "Miễn phí" : formatPrice(course.price)}
        </p>

        <div className="flex items-center gap-3 text-xs text-[rgba(4,14,32,0.45)] flex-wrap">
          <span className="flex items-center gap-1 min-w-0">
            {course.instructor.avatar ? (
              <img src={course.instructor.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#1b61c9]/20 shrink-0" />
            )}
            <span className="truncate max-w-[80px]">{course.instructor.name}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            {course._count.enrollments.toLocaleString("vi-VN")}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {course._count.sections} chương
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton({ variant = "sm" }: { variant?: "sm" | "lg" }) {
  return (
    <div className="animate-pulse">
      <div className={`rounded-2xl bg-gray-200 ${variant === "lg" ? "aspect-[16/10]" : "aspect-video"}`} />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="h-3.5 bg-gray-200 rounded w-full" />
        <div className="h-3.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-16">
      <div className="flex items-end justify-between mb-7">
        <div>
          <h2 className="text-2xl font-semibold text-[#181d26] tracking-tight">{title}</h2>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-1 tracking-[0.07px]">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="text-sm text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors shrink-0 ml-4"
        >
          Xem tất cả →
        </Link>
      </div>
      {children}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function CoursesSection() {
  const { data, isLoading } = useCourses({ limit: 20 });
  const { data: me } = useMe();
  const { data: enrolledCourses = [] } = useStudentCourses({ enabled: !!me });
  const enrolledIds = new Set(enrolledCourses.map((c) => c.id));

  const all  = data?.courses ?? [];
  const free = all.filter((c) => parseFloat(c.price) === 0);
  const paid = all.filter((c) => parseFloat(c.price) > 0);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 border-t border-[#e0e2e6]">
      {/* Free courses */}
      <Section
        title="Khóa học miễn phí"
        subtitle="Bắt đầu hành trình học tập, hoàn toàn miễn phí"
        href="/courses"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : free.length > 0
            ? free.map((c, i) => <GradientCard key={c.id} course={c} index={i} isEnrolled={enrolledIds.has(c.id)} />)
            : (
              <p className="col-span-5 text-sm text-[rgba(4,14,32,0.45)] py-8 text-center">
                Chưa có khóa học miễn phí.
              </p>
            )}
        </div>
      </Section>

      {/* Paid courses */}
      <Section
        title="Khóa học trả phí"
        subtitle="Học chuyên sâu cùng giảng viên hàng đầu"
        href="/courses"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} variant="lg" />)
            : paid.length > 0
            ? paid.map((c, i) => <GradientCard key={c.id} course={c} index={i} variant="lg" isEnrolled={enrolledIds.has(c.id)} />)
            : (
              <p className="col-span-4 text-sm text-[rgba(4,14,32,0.45)] py-8 text-center">
                Chưa có khóa học trả phí.
              </p>
            )}
        </div>
      </Section>
    </section>
  );
}
