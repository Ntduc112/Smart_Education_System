"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { useState } from "react";
import { useMe, useStudentCourses, useCoursesProgress, StudentCourse, CourseProgress } from "./dashboard.hook";

// ── Helpers ────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6]"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px] mb-1">{label}</p>
      <p className="text-3xl font-semibold text-[#181d26]">{value}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1 tracking-[0.07px]">{sub}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6] animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-8 w-12 bg-gray-100 rounded" />
    </div>
  );
}

function CourseCard({
  course,
  progress,
  progressLoading,
}: {
  course: StudentCourse;
  progress?: CourseProgress;
  progressLoading: boolean;
}) {
  const pct = progress?.percentage ?? 0;
  const isDone = pct === 100;
  const isStarted = pct > 0;

  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[#f8fafc]">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        {isDone && (
          <div className="absolute top-3 right-3 bg-[#006400] text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Hoàn thành
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#1b61c9] bg-[#1b61c9]/8 px-2.5 py-1 rounded-full font-medium tracking-[0.07px]">
            {course.category.name}
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.55)] bg-[#f8fafc] px-2.5 py-1 rounded-full border border-[#e0e2e6] tracking-[0.07px]">
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-medium text-[#181d26] leading-snug line-clamp-2 mb-3 tracking-[0.08px]">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          {course.instructor.avatar ? (
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#1b61c9]/15 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-[#1b61c9]">
                {course.instructor.name.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
            {course.instructor.name}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-auto">
          {progressLoading ? (
            <div className="animate-pulse">
              <div className="h-1.5 bg-gray-100 rounded-full mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
                  {progress?.completed_lessons ?? 0}/{progress?.total_lessons ?? 0} bài
                </span>
                <span
                  className={`text-xs font-semibold tracking-[0.07px] ${isDone ? "text-[#006400]" : "text-[#1b61c9]"}`}
                >
                  {pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-[#006400]" : "bg-[#1b61c9]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}

          <Link
            href={`/student/courses/${course.id}/learn`}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium tracking-[0.08px] transition-all ${
              isDone
                ? "bg-[#f8fafc] text-[#181d26] border border-[#e0e2e6] hover:border-[#1b61c9]/40"
                : "bg-[#1b61c9] text-white hover:bg-[#254fad]"
            }`}
            style={
              !isDone
                ? { boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }
                : undefined
            }
          >
            {isDone ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Xem lại
              </>
            ) : isStarted ? (
              <>
                Tiếp tục học
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            ) : (
              <>
                Bắt đầu học
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-24 bg-gray-100 rounded-full" />
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="h-1.5 w-full bg-gray-100 rounded-full mb-4" />
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { data: user } = useMe();
  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();

  const courseIds = courses.map((c) => c.id);
  const progressResults = useCoursesProgress(courseIds);

  const progressMap: Record<string, CourseProgress | undefined> = Object.fromEntries(
    courseIds.map((id, i) => [id, progressResults[i]?.data])
  );
  const progressLoadingMap: Record<string, boolean> = Object.fromEntries(
    courseIds.map((id, i) => [id, progressResults[i]?.isLoading ?? true])
  );

  // Stats
  const totalCourses = courses.length;
  const completedCourses = courseIds.filter((id) => (progressMap[id]?.percentage ?? 0) === 100).length;
  const inProgressCourses = courseIds.filter((id) => {
    const pct = progressMap[id]?.percentage ?? 0;
    return pct > 0 && pct < 100;
  }).length;
  const allProgressLoaded = progressResults.every((r) => !r.isLoading);
  const avgProgress =
    allProgressLoaded && courseIds.length > 0
      ? Math.round(courseIds.reduce((sum, id) => sum + (progressMap[id]?.percentage ?? 0), 0) / courseIds.length)
      : null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/student/dashboard", label: "Dashboard", active: true },
              { href: "/courses", label: "Khóa học" },
              { href: "/student/ai-tutor", label: "AI Tutor" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-colors ${
                  item.active
                    ? "bg-[#1b61c9]/8 text-[#1b61c9]"
                    : "text-[rgba(4,14,32,0.69)] hover:text-[#181d26] hover:bg-[#f8fafc]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User dropdown */}
          <UserMenu user={user ?? null} />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#181d26]">
            {getGreeting()},{" "}
            <span className="font-semibold">{user?.name?.split(" ").pop() ?? "bạn"}!</span>
          </h1>
          <p className="text-[rgba(4,14,32,0.55)] mt-1.5 tracking-[0.18px]">
            Tiếp tục hành trình học tập của bạn hôm nay.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {coursesLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Khóa học đã đăng ký" value={totalCourses} />
              <StatCard label="Đang học" value={inProgressCourses} />
              <StatCard label="Đã hoàn thành" value={completedCourses} />
              <StatCard
                label="Tiến độ trung bình"
                value={avgProgress !== null ? `${avgProgress}%` : "—"}
              />
            </>
          )}
        </div>

        {/* Courses */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-[#181d26] tracking-[0.12px]">
            Khóa học của tôi
            {!coursesLoading && (
              <span className="ml-2 text-base font-normal text-[rgba(4,14,32,0.45)]">
                ({totalCourses})
              </span>
            )}
          </h2>
          <Link
            href="/(marketing)/courses"
            className="text-sm text-[#1b61c9] hover:text-[#254fad] font-medium tracking-[0.07px] transition-colors"
          >
            Khám phá thêm →
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-[#e0e2e6] rounded-2xl py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-[#1b61c9]/8 rounded-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#181d26] font-medium mb-1">Bạn chưa đăng ký khóa học nào</p>
              <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
                Khám phá hàng trăm khóa học chất lượng cao
              </p>
            </div>
            <Link
              href="/courses"
              className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors tracking-[0.08px]"
            >
              Xem khóa học
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                progressLoading={progressLoadingMap[course.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
