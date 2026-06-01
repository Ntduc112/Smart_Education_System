"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { SearchBar } from "@/app/_components/SearchBar";
import { UserMenu } from "@/app/_components/UserMenu";
import { motion } from "framer-motion";
import { useMe, useStudentCourses, useCoursesProgress, useStreak, StudentCourse, CourseProgress } from "./dashboard.hook";

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

// ── Animation variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const stagger = (delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: delayChildren } },
});

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.26, 0.64, 1] },
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, boxShadow: "rgba(15,48,106,0.12) 0px 8px 24px" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6] cursor-default"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px] mb-1">{label}</p>
      <p className="text-3xl font-semibold text-[#181d26]">{value}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1 tracking-[0.07px]">{sub}</p>}
    </motion.div>
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
  index,
}: {
  course: StudentCourse;
  progress?: CourseProgress;
  progressLoading: boolean;
  index: number;
}) {
  const pct = progress?.percentage ?? 0;
  const isDone = pct === 100;
  const isStarted = pct > 0;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{
        y: -6,
        boxShadow: "rgba(15,48,106,0.14) 0px 16px 40px",
        transition: { duration: 0.22, ease: "easeOut" },
      }}
      className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden flex flex-col"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[#f8fafc]">
        <motion.img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.04, transition: { duration: 0.4, ease: "easeOut" } }}
        />
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 bg-[#006400] text-white text-xs font-medium px-2.5 py-1 rounded-full"
          >
            Hoàn thành
          </motion.div>
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
                <motion.div
                  className={`h-full rounded-full ${isDone ? "bg-[#006400]" : "bg-[#1b61c9]"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 + index * 0.06 }}
                />
              </div>
            </>
          )}

          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href={
                progress?.current_lesson_id
                  ? `/student/courses/${course.id}/learn?lesson=${progress.current_lesson_id}`
                  : `/student/courses/${course.id}/learn`
              }
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium tracking-[0.08px] transition-all ${isDone
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
          </motion.div>
        </div>
      </div>
    </motion.div>
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
  const { data: streakData } = useStreak();
  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();

  const courseIds = courses.map((c) => c.id);
  const progressResults = useCoursesProgress(courseIds);

  const progressMap: Record<string, CourseProgress | undefined> = Object.fromEntries(
    courseIds.map((id, i) => [id, progressResults[i]?.data])
  );
  const progressLoadingMap: Record<string, boolean> = Object.fromEntries(
    courseIds.map((id, i) => [id, progressResults[i]?.isLoading ?? true])
  );

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
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10"
      >
        <div className="w-full px-6 h-16 flex items-center">
          <div className="flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Logo size={32} />
              <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
            </Link>
          </div>
          <div style={{ width: 520, flexShrink: 0, transform: "translateX(-10px)" }}>
            <SearchBar />
          </div>
          <div className="flex-1 min-w-0 flex justify-end">
            <UserMenu user={user ?? null} />
          </div>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="show"
          variants={stagger(0.08)}
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl font-light text-[#181d26]"
          >
            {getGreeting()},{" "}
            <span className="font-semibold">{user?.name?.split(" ").pop() ?? "bạn"}!</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-[rgba(4,14,32,0.55)] mt-1.5 tracking-[0.18px]"
          >
            Tiếp tục hành trình học tập của bạn hôm nay.
          </motion.p>
        </motion.div>

        {/* Stats */}
        {coursesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            initial="hidden"
            animate="show"
            variants={stagger(0.09)}
          >
            <StatCard label="Khóa học đã đăng ký" value={totalCourses} />
            <StatCard label="Đang học" value={inProgressCourses} />
            <StatCard label="Đã hoàn thành" value={completedCourses} />
            <StatCard
              label="Tiến độ trung bình"
              value={avgProgress !== null ? `${avgProgress}%` : "—"}
            />
          </motion.div>
        )}

        {/* Streak */}
        {streakData !== undefined && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={slideLeft}
            whileHover={{ scale: 1.008, transition: { duration: 0.2 } }}
            className={`mb-8 rounded-2xl border px-6 py-4 flex items-center gap-4 cursor-default ${
              streakData.today_learned
                ? "bg-orange-50 border-orange-200"
                : "bg-white border-[#e0e2e6]"
            }`}
            style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
          >
            <motion.div
              animate={streakData.today_learned ? { rotate: [0, -10, 10, -6, 6, 0] } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                streakData.today_learned ? "bg-orange-100" : "bg-[#f8fafc]"
              }`}
            >
              🔥
            </motion.div>
            <div className="flex-1">
              <p className="text-base font-semibold text-[#181d26]">
                {streakData.streak > 0
                  ? `${streakData.streak} ngày học liên tiếp!`
                  : "Bắt đầu streak hôm nay!"}
              </p>
              <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
                {streakData.today_learned
                  ? "Bạn đã học hôm nay. Tiếp tục phát huy nhé!"
                  : "Học ít nhất 1 bài hôm nay để duy trì streak."}
              </p>
            </div>
            {streakData.streak >= 7 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.35, ease: [0.34, 1.26, 0.64, 1] }}
                className="shrink-0 text-right"
              >
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
                  {streakData.streak >= 30 ? "Huyền thoại" : streakData.streak >= 14 ? "Xuất sắc" : "Tốt lắm"}
                </p>
                <p className="text-xs text-[rgba(4,14,32,0.35)] mt-0.5">{streakData.streak} ngày</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div
          className="flex items-center gap-3 mb-8 flex-wrap"
          initial="hidden"
          animate="show"
          variants={stagger(0.07)}
        >
          {[
            { href: "/student/flashcards", icon: "🃏", label: "Flashcard ôn tập" },
            { href: "/student/notes", icon: "📝", label: "Ghi chú của tôi" },
            { href: "/student/certificates", icon: "🏆", label: "Chứng chỉ" },
          ].map((item) => (
            <motion.div
              key={item.href}
              variants={scaleIn}
              whileHover={{ y: -2, boxShadow: "rgba(27,97,201,0.12) 0px 6px 20px", transition: { duration: 0.18 } }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e0e2e6] text-sm font-medium text-[rgba(4,14,32,0.65)] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors"
                style={{ boxShadow: "rgba(15,48,106,0.04) 0px 0px 12px" }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Section header */}
        <motion.div
          className="flex items-center justify-between mb-5"
          initial="hidden"
          animate="show"
          variants={fadeIn}
        >
          <h2 className="text-xl font-semibold text-[#181d26] tracking-[0.12px]">
            Khóa học của tôi
            {!coursesLoading && (
              <span className="ml-2 text-base font-normal text-[rgba(4,14,32,0.45)]">
                ({totalCourses})
              </span>
            )}
          </h2>
          <Link
            href="/courses"
            className="text-sm text-[#1b61c9] hover:text-[#254fad] font-medium tracking-[0.07px] transition-colors"
          >
            Khám phá thêm →
          </Link>
        </motion.div>

        {/* Course grid */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white border border-[#e0e2e6] rounded-2xl py-16 flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] }}
              className="w-14 h-14 bg-[#1b61c9]/8 rounded-2xl flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="text-center"
            >
              <p className="text-[#181d26] font-medium mb-1">Bạn chưa đăng ký khóa học nào</p>
              <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
                Khám phá hàng trăm khóa học chất lượng cao
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/courses"
                className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors tracking-[0.08px]"
              >
                Xem khóa học
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="show"
            variants={stagger(0.08)}
          >
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                progressLoading={progressLoadingMap[course.id]}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
