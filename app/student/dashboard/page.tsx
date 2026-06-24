"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, GraduationCap, CheckCircle2, TrendingUp, Flame,
  Layers, StickyNote, Trophy, Heart, ArrowRight,
} from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import {
  useMe, useStudentCourses, useCoursesProgress, useStreak,
  StudentCourse, CourseProgress,
} from "./dashboard.hook";
import {
  useCertificates, useNotesCount, useFlashcardsCount, useWishlistCount,
} from "@/app/student/home/home.hook";

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
  sky: "#2E8BE6",
  emerald: "#0E9F6E",
  violet: "#7C5CFC",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// ── Motion ───────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = (d = 0.07) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

// ── Atmosphere ─────────────────────────────────────────────────────────────
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
            top: "top" in b ? b.top : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
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

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, tintBg, tintFg, label, value }: {
  icon: React.ReactNode; tintBg: string; tintFg: string; label: string; value: string | number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl bg-white p-5"
      style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
    >
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl" style={{ background: tintBg, color: tintFg }}>
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold" style={{ color: C.ink }}>{value}</p>
      <p className="mt-0.5 text-sm" style={{ color: C.inkSoft }}>{label}</p>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-white p-5" style={{ border: `1px solid ${C.border}` }}>
      <div className="mb-3 h-11 w-11 rounded-xl" style={{ background: "#E2ECF9" }} />
      <div className="mb-2 h-7 w-12 rounded" style={{ background: "#E2ECF9" }} />
      <div className="h-3 w-24 rounded" style={{ background: "#E2ECF9" }} />
    </div>
  );
}

// ── CourseCard (cả card click thẳng vào bài đang học) ────────────────────────
function CourseCard({ course, progress, index }: {
  course: StudentCourse; progress?: CourseProgress; index: number;
}) {
  const pct = progress?.percentage ?? 0;
  const done = pct === 100;
  const href = progress?.current_lesson_id
    ? `/student/courses/${course.id}/learn?lesson=${progress.current_lesson_id}`
    : `/student/courses/${course.id}/learn`;
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }}>
      <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white"
        style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
        <div className="relative aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
          <img src={course.thumbnail} alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {done && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ background: C.emerald }}>
              <CheckCircle2 size={13} /> Hoàn thành
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
              {course.category.name}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs" style={{ color: C.inkSoft, background: "#EAF1FC" }}>
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          </div>
          <h3 className="mb-3 line-clamp-2 font-display text-[17px] font-semibold leading-snug" style={{ color: C.ink }}>
            {course.title}
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold"
              style={{ background: "rgba(27,97,201,0.12)", color: C.blue }}>
              {course.instructor.name.charAt(0)}
            </div>
            <span className="text-[13px]" style={{ color: C.inkSoft }}>{course.instructor.name}</span>
          </div>
          <div className="mt-auto">
            <div className="mb-1.5 flex items-center justify-between text-xs" style={{ color: C.inkSoft }}>
              <span>{progress?.completed_lessons ?? 0}/{progress?.total_lessons ?? 0} bài</span>
              <span className="font-semibold" style={{ color: done ? C.emerald : C.blue }}>{pct}%</span>
            </div>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full" style={{ background: "#E2ECF9" }}>
              <motion.div className="h-full rounded-full" style={{ background: done ? C.emerald : C.blue }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 + index * 0.05 }} />
            </div>
            <span className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors"
              style={done ? { background: "#EAF1FC", color: C.ink } : { background: C.blue, color: "#fff" }}>
              {done ? "Xem lại" : pct > 0 ? "Tiếp tục học" : "Bắt đầu học"}
              <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${C.border}` }}>
      <div className="aspect-video" style={{ background: "#E7EFFB" }} />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
        <div className="h-2 w-full rounded-full" style={{ background: "#E2ECF9" }} />
        <div className="h-10 w-full rounded-xl" style={{ background: "#E2ECF9" }} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const { data: user } = useMe();
  const { data: streakData } = useStreak();
  const { data: courses = [], isLoading: coursesLoading } = useStudentCourses();
  const { data: certs = [] } = useCertificates();
  const { data: notesCount } = useNotesCount();
  const { data: flashCount } = useFlashcardsCount();
  const { data: wishCount } = useWishlistCount();

  const courseIds = courses.map((c) => c.id);
  const progressResults = useCoursesProgress(courseIds);
  const progressMap: Record<string, CourseProgress | undefined> = Object.fromEntries(
    courseIds.map((id, i) => [id, progressResults[i]?.data])
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

  const firstName = user?.name?.split(" ").pop() ?? "bạn";

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Greeting */}
        <motion.div className="mb-8" initial="hidden" animate="show" variants={stagger(0.08)}>
          <motion.h1 variants={fadeUp} className="font-display text-[32px] font-light leading-tight">
            {getGreeting()}, <span className="font-semibold" style={{ color: C.blue }}>{firstName}!</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-1.5 text-[15px]" style={{ color: C.inkSoft }}>
            Tiếp tục hành trình học tập của bạn hôm nay.
          </motion.p>
        </motion.div>

        {/* Stats */}
        {coursesLoading ? (
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4"
            initial="hidden" animate="show" variants={stagger(0.09)}>
            <StatCard icon={<BookOpen size={20} />} tintBg="rgba(27,97,201,0.10)" tintFg={C.blue}
              label="Khóa học đã đăng ký" value={totalCourses} />
            <StatCard icon={<GraduationCap size={20} />} tintBg="rgba(46,139,230,0.12)" tintFg={C.sky}
              label="Đang học" value={inProgressCourses} />
            <StatCard icon={<CheckCircle2 size={20} />} tintBg="rgba(14,159,110,0.12)" tintFg={C.emerald}
              label="Đã hoàn thành" value={completedCourses} />
            <StatCard icon={<TrendingUp size={20} />} tintBg="rgba(124,92,252,0.12)" tintFg={C.violet}
              label="Tiến độ trung bình" value={avgProgress !== null ? `${avgProgress}%` : "—"} />
          </motion.div>
        )}

        {/* Streak (gradient xanh — không amber) */}
        {streakData !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative mb-8 flex items-center gap-4 overflow-hidden rounded-3xl p-6 text-white"
            style={{ background: "linear-gradient(150deg,#3D8BEF 0%,#1b61c9 55%,#1a4fa0 100%)", boxShadow: "rgba(27,97,201,0.30) 0px 14px 36px" }}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 opacity-20"><Flame size={130} strokeWidth={1.2} /></div>
            <motion.div
              animate={streakData.today_learned ? { rotate: [0, -10, 10, -6, 6, 0] } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">🔥</motion.div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold">
                {streakData.streak > 0 ? `${streakData.streak} ngày học liên tiếp!` : "Bắt đầu streak hôm nay!"}
              </p>
              <p className="mt-0.5 font-display text-sm text-white/90">
                {streakData.today_learned
                  ? "Bạn đã học hôm nay. Tiếp tục phát huy nhé!"
                  : "Học ít nhất 1 bài hôm nay để duy trì streak."}
              </p>
            </div>
            {streakData.streak >= 7 && (
              <div className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {streakData.streak >= 30 ? "Huyền thoại" : streakData.streak >= 14 ? "Xuất sắc" : "Tốt lắm"}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div className="mb-8 flex flex-wrap items-center gap-3"
          initial="hidden" animate="show" variants={stagger(0.07)}>
          {[
            { href: "/student/flashcards", icon: <Layers size={16} />, label: "Flashcard ôn tập", n: flashCount },
            { href: "/student/notes", icon: <StickyNote size={16} />, label: "Ghi chú của tôi", n: notesCount },
            { href: "/student/certificates", icon: <Trophy size={16} />, label: "Chứng chỉ", n: certs.length },
            { href: "/student/wishlist", icon: <Heart size={16} />, label: "Yêu thích", n: wishCount },
          ].map((item) => (
            <motion.div key={item.href} variants={fadeUp} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link href={item.href}
                className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-[#1b61c9]/40"
                style={{ border: `1px solid ${C.border}`, color: C.inkSoft, boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}>
                <span style={{ color: C.blue }}>{item.icon}</span>
                {item.label}
                {item.n !== undefined && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#EAF1FC", color: C.ink }}>
                    {item.n}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Section header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">
            Khóa học của tôi
            {!coursesLoading && <span className="ml-2 text-lg font-normal" style={{ color: C.inkFaint }}>({totalCourses})</span>}
          </h2>
          <Link href="/courses" className="text-sm font-medium" style={{ color: C.blue }}>Khám phá thêm →</Link>
        </div>

        {/* Course grid */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16"
            style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <BookOpen size={26} style={{ color: C.blue }} />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Bạn chưa đăng ký khóa học nào</p>
              <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Khám phá hàng trăm khóa học chất lượng cao.</p>
            </div>
            <Link href="/courses" className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
              style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}>
              Xem khóa học
            </Link>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden" animate="show" variants={stagger(0.08)}>
            {courses.map((course, i) => (
              <CourseCard key={course.id} course={course} progress={progressMap[course.id]} index={i} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
