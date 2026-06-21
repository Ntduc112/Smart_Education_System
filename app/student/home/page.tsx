"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, BookOpen, Flame,
  StickyNote, Layers, Heart, Play, CheckCircle2, Trophy, Users, Compass,
} from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { PostsFeedSection } from "@/app/_components/home/PostsFeedSection";
import { useCourses, CourseInList } from "@/app/(marketing)/courses/courses.hook";
import {
  useMe, useStudentCourses, useCoursesProgress, useStreak,
  useCertificates, useNotesCount, useFlashcardsCount, useWishlistCount,
  StudentCourse, CourseProgress,
} from "./home.hook";

// ── Palette (warm "cozy study desk") ────────────────────────────────────────
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

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const QUOTES = [
  "Mỗi bài học hôm nay là một phiên bản tốt hơn của bạn ngày mai.",
  "Học chậm cũng được, miễn là đừng dừng lại.",
  "Kiến thức là thứ duy nhất càng cho đi càng giàu thêm.",
  "Việc khó nhất luôn là bắt đầu — bạn đã ở đây rồi.",
];

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
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28,
            filter: "blur(90px)",
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      {/* subtle grain */}
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

// ── Course card ──────────────────────────────────────────────────────────────
function CourseCard({ course, progress, index }: {
  course: StudentCourse; progress?: CourseProgress; index: number;
}) {
  const pct = progress?.percentage ?? 0;
  const done = pct === 100;
  const href = progress?.current_lesson_id
    ? `/student/courses/${course.id}/learn?lesson=${progress.current_lesson_id}`
    : `/student/courses/${course.id}/learn`;
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }} className="group flex flex-col overflow-hidden rounded-3xl bg-white"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
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
          <Link href={href}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors"
            style={done
              ? { background: "#EAF1FC", color: C.ink }
              : { background: C.blue, color: "#fff" }}>
            {done ? "Xem lại" : pct > 0 ? "Tiếp tục học" : "Bắt đầu học"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Discover card (phổ biến — tái dùng style trang /courses để đồng bộ) ──────
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function DiscoverCard({ course }: { course: CourseInList }) {
  const price = parseFloat(course.price);
  const free = !price;
  const final = course.discount_percent ? price * (1 - course.discount_percent / 100) : price;
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }}>
      <Link href={`/courses/${course.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white"
        style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(27,60,120,0.05) 0px 8px 24px" }}>
        <div className="relative aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
          <img src={course.thumbnail} alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
          <h3 className="mb-3 line-clamp-2 font-display text-[17px] font-semibold leading-snug transition-colors group-hover:text-[#1b61c9]" style={{ color: C.ink }}>
            {course.title}
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold" style={{ background: "rgba(27,97,201,0.12)", color: C.blue }}>
              {course.instructor.name.charAt(0)}
            </div>
            <span className="text-[13px]" style={{ color: C.inkSoft }}>{course.instructor.name}</span>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: C.inkFaint }}>
              <Users size={14} /> {course._count.enrollments}
            </span>
            <span className="font-display text-base font-semibold" style={{ color: free ? C.emerald : C.blue }}>
              {free ? "Miễn phí" : formatVND(final)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StudentHomePage() {
  const { data: user } = useMe();
  const { data: streak } = useStreak();
  const { data: courses = [], isLoading } = useStudentCourses();
  const { data: certs = [] } = useCertificates();
  const { data: notesCount } = useNotesCount();
  const { data: flashCount } = useFlashcardsCount();
  const { data: wishCount } = useWishlistCount();

  const ids = courses.map((c) => c.id);
  const progressResults = useCoursesProgress(ids);
  const progressMap: Record<string, CourseProgress | undefined> = Object.fromEntries(
    ids.map((id, i) => [id, progressResults[i]?.data])
  );

  // Resume = in-progress course closest to finishing; else first not-started.
  const resume = (() => {
    const withP = courses.map((c) => ({ c, p: progressMap[c.id] }));
    const active = withP
      .filter((x) => (x.p?.percentage ?? 0) > 0 && (x.p?.percentage ?? 0) < 100)
      .sort((a, b) => (b.p!.percentage) - (a.p!.percentage));
    if (active[0]) return active[0];
    return withP.find((x) => (x.p?.percentage ?? 0) === 0) ?? null;
  })();

  // Gợi ý: khóa phổ biến chưa đăng ký (tái dùng endpoint /courses để đồng bộ catalog).
  const { data: popularData } = useCourses({ sort: "popular", limit: 6 });
  const enrolledIds = new Set(ids);
  const popular = (popularData?.courses ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, 3);

  const quote = QUOTES[(user?.name?.length ?? 0) % QUOTES.length];
  const firstName = user?.name?.split(" ").pop() ?? "bạn";

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />

      {/* ── Navbar (shared structure: logo • nav links • bell + user) ── */}
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Hero ── */}
        <motion.section initial="hidden" animate="show" variants={stagger(0.1)}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Greeting */}
          <motion.div variants={fadeUp} className="flex flex-col justify-center rounded-3xl bg-white p-7"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "rgba(124,92,252,0.10)", color: C.violet }}>
              <Sparkles size={13} /> Hôm nay là một ngày tốt để học
            </div>
            <h1 className="font-display text-[34px] font-light leading-tight sm:text-[40px]">
              {greeting()},<br />
              <span className="font-semibold" style={{ color: C.blue }}>{firstName}</span> 👋
            </h1>
            <p className="mt-3 max-w-md text-[15px] italic leading-relaxed" style={{ color: C.inkSoft }}>
              “{quote}”
            </p>
          </motion.div>

          {/* Streak card */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl p-7 text-white"
            style={{ background: "linear-gradient(150deg,#3D8BEF 0%,#1b61c9 55%,#1a4fa0 100%)", boxShadow: "rgba(27,97,201,0.34) 0px 14px 36px" }}>
            <div className="pointer-events-none absolute -right-6 -top-8 opacity-20">
              <Flame size={150} strokeWidth={1.2} />
            </div>
            <div className="flex items-center gap-3">
              <motion.div animate={streak?.today_learned ? { rotate: [0, -12, 10, -6, 0] } : {}}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl">🔥</motion.div>
              <div>
                <p className="font-display text-4xl font-bold leading-none">{streak?.streak ?? 0}</p>
                <p className="text-sm text-white/85">ngày học liên tiếp</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/90">
              {streak?.today_learned
                ? "Bạn đã học hôm nay — giữ lửa nhé! 🎉"
                : "Học ít nhất 1 bài hôm nay để giữ chuỗi."}
            </p>
            {resume && !streak?.today_learned && (
              <Link href={resume.p?.current_lesson_id
                ? `/student/courses/${resume.c.id}/learn?lesson=${resume.p.current_lesson_id}`
                : `/student/courses/${resume.c.id}/learn`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold"
                style={{ color: C.sky }}>
                Học ngay <ArrowRight size={15} />
              </Link>
            )}
          </motion.div>
        </motion.section>

        {/* ── Resume hero ── */}
        {resume && (
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-5 overflow-hidden rounded-3xl"
            style={{ background: C.ink, boxShadow: "rgba(36,31,24,0.22) 0px 18px 44px" }}>
            <div className="flex flex-col md:flex-row">
              <div className="relative aspect-video w-full overflow-hidden md:aspect-auto md:w-72 md:shrink-0">
                <img src={resume.c.thumbnail} alt={resume.c.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 grid place-items-center bg-black/25">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95">
                    <Play size={22} className="ml-0.5" style={{ color: C.ink }} fill={C.ink} />
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-7 text-white">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/55">
                  <BookOpen size={13} /> {(resume.p?.percentage ?? 0) > 0 ? "Tiếp tục nơi bạn dừng lại" : "Khóa học mới của bạn"}
                </p>
                <h2 className="font-display text-2xl font-semibold leading-snug">{resume.c.title}</h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <motion.div className="h-full rounded-full" style={{ background: "#5EA0FF" }}
                      initial={{ width: 0 }} animate={{ width: `${resume.p?.percentage ?? 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }} />
                  </div>
                  <span className="text-sm font-semibold text-white/90">{resume.p?.percentage ?? 0}%</span>
                </div>
                <Link href={resume.p?.current_lesson_id
                  ? `/student/courses/${resume.c.id}/learn?lesson=${resume.p.current_lesson_id}`
                  : `/student/courses/${resume.c.id}/learn`}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                  style={{ background: C.blue, color: "#fff" }}>
                  {(resume.p?.percentage ?? 0) > 0 ? "Tiếp tục học" : "Bắt đầu học"} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Quick actions ── */}
        <motion.div initial="hidden" animate="show" variants={stagger(0.06)}
          className="mt-8 flex flex-wrap gap-3">
          {[
            { href: "/student/flashcards", icon: <Layers size={16} />, label: "Flashcard", n: flashCount },
            { href: "/student/notes", icon: <StickyNote size={16} />, label: "Ghi chú", n: notesCount },
            { href: "/student/certificates", icon: <Trophy size={16} />, label: "Chứng chỉ", n: certs.length },
            { href: "/student/wishlist", icon: <Heart size={16} />, label: "Yêu thích", n: wishCount },
          ].map((a) => (
            <motion.div key={a.href} variants={fadeUp} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href={a.href}
                className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-[#1b61c9]/40"
                style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}>
                <span style={{ color: C.blue }}>{a.icon}</span>
                {a.label}
                {a.n !== undefined && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: "#EAF1FC", color: C.ink }}>{a.n}</span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Courses ── */}
        <div className="mb-5 mt-12 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">
            Khóa học của tôi
            {!isLoading && <span className="ml-2 text-lg font-normal" style={{ color: C.inkFaint }}>({courses.length})</span>}
          </h2>
          <Link href="/student/dashboard" className="text-sm font-medium" style={{ color: C.blue }}>Xem tất cả →</Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${C.border}` }}>
                <div className="aspect-video" style={{ background: "#E7EFFB" }} />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
                  <div className="h-2 w-full rounded-full" style={{ background: "#E2ECF9" }} />
                  <div className="h-10 w-full rounded-xl" style={{ background: "#E2ECF9" }} />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16"
            style={{ border: `1px solid ${C.border}` }}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <BookOpen size={26} style={{ color: C.blue }} />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Bạn chưa đăng ký khóa học nào</p>
              <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Khám phá hàng trăm khóa học chất lượng cao.</p>
            </div>
            <Link href="/courses" className="rounded-xl px-5 py-2.5 text-sm font-medium text-white" style={{ background: C.blue }}>
              Xem khóa học
            </Link>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger(0.07)}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <CourseCard key={c.id} course={c} progress={progressMap[c.id]} index={i} />
            ))}
          </motion.div>
        )}

        {/* ── Discover popular ── */}
        {popular.length > 0 && (
          <>
            <div className="mb-5 mt-12 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                <Compass size={22} style={{ color: C.violet }} /> Khám phá khóa học phổ biến
              </h2>
              <Link href="/courses" className="text-sm font-medium" style={{ color: C.blue }}>Xem tất cả →</Link>
            </div>
            <motion.div initial="hidden" animate="show" variants={stagger(0.07)}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {popular.map((c) => <DiscoverCard key={c.id} course={c} />)}
            </motion.div>
          </>
        )}

        {/* ── Community posts feed ── */}
        <PostsFeedSection />
      </main>
    </div>
  );
}
