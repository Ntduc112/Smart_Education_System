"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus, BookOpen, Users, ArrowRight, Sparkles, BarChart2,
  Wallet, FileText, PenLine, FileEdit, CheckCircle2, TrendingUp, TrendingDown,
  MessagesSquare,
} from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import {
  useMe, useTeacherDashboard, useGradingQueue, useTeacherAnalytics,
  RecentCourse, RecentEnrollment,
} from "./home.hook";

// ── Palette (chung với student/home để đồng bộ) ─────────────────────────────
const C = {
  canvas: "#EFF5FE",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  sky: "#2E8BE6",
  emerald: "#0E9F6E",
  rose: "#E5484D",
  violet: "#7C5CFC",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function compactVND(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ── Motion ───────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = (d = 0.07) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

// ── Atmosphere (đồng bộ student/home) ────────────────────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)",
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }} />
      ))}
    </div>
  );
}

// ── Sparkline (inline svg, từ mảng số thật) ──────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8" />;
  const w = 96, h = 32, max = Math.max(...data, 1), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Growth badge ──────────────────────────────────────────────────────────────
function Growth({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
      style={up ? { background: "rgba(14,159,110,0.12)", color: C.emerald }
                : { background: "rgba(229,72,77,0.12)", color: C.rose }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────────
function Kpi({ icon, tint, fg, value, label, growth, spark, sparkColor }: {
  icon: React.ReactNode; tint: string; fg: string; value: React.ReactNode; label: string;
  growth?: number | null; spark?: number[]; sparkColor?: string;
}) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }}
      className="rounded-2xl bg-white p-5"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: tint, color: fg }}>
          {icon}
        </div>
        {growth !== undefined && <Growth pct={growth} />}
      </div>
      <p className="mt-4 font-display text-[26px] font-semibold leading-none" style={{ color: C.ink }}>{value}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="text-[13px]" style={{ color: C.inkSoft }}>{label}</p>
        {spark && spark.length > 1 && <Sparkline data={spark} color={sparkColor ?? fg} />}
      </div>
    </motion.div>
  );
}

// ── Recent course row ──────────────────────────────────────────────────────────
function CourseRow({ course }: { course: RecentCourse }) {
  const published = course.status === "PUBLISHED";
  return (
    <motion.div variants={fadeUp}
      className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-[#F4F8FE]">
      <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: "#E7EFFB" }}>
        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: C.ink }}>{course.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
            style={published ? { background: "rgba(14,159,110,0.12)", color: C.emerald }
                             : { background: "#EAF1FC", color: C.inkSoft }}>
            {published ? "Đã công bố" : "Nháp"}
          </span>
          <span className="text-xs" style={{ color: C.inkFaint }}>{course.enrollment_count} học viên</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {published && (
          <Link href={`/teacher/courses/${course.id}/students`}
            className="whitespace-nowrap text-xs font-medium" style={{ color: C.violet }}>Học viên →</Link>
        )}
        <Link href={`/teacher/courses/${course.id}/edit`}
          className="whitespace-nowrap text-xs font-medium" style={{ color: C.blue }}>Chỉnh sửa →</Link>
      </div>
    </motion.div>
  );
}

// ── Recent enrollment row ──────────────────────────────────────────────────────
function EnrollmentRow({ enrollment }: { enrollment: RecentEnrollment }) {
  return (
    <motion.div variants={fadeUp} className="flex items-start gap-3">
      <div className="relative shrink-0">
        {enrollment.user.avatar ? (
          <img src={enrollment.user.avatar} alt={enrollment.user.name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "rgba(27,97,201,0.12)" }}>
            <span className="text-xs font-semibold" style={{ color: C.blue }}>{enrollment.user.name.charAt(0)}</span>
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: C.emerald }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight" style={{ color: C.ink }}>{enrollment.user.name}</p>
        <p className="mt-0.5 truncate text-xs" style={{ color: C.inkSoft }}>
          đăng ký <span style={{ color: C.blue }}>{enrollment.course.title}</span>
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: C.inkFaint }}>{timeAgo(enrollment.enrolled_at)}</p>
      </div>
    </motion.div>
  );
}

type CourseFilter = "all" | "PUBLISHED" | "DRAFT";

// ── Page ───────────────────────────────────────────────────────────────────
export default function TeacherHomePage() {
  const { data: user } = useMe();
  const { data, isLoading } = useTeacherDashboard();
  const { data: queue } = useGradingQueue();
  const { data: analytics } = useTeacherAnalytics(6);
  const [filter, setFilter] = useState<CourseFilter>("all");

  const stats = data?.stats;
  const overview = analytics?.overview;
  const monthly = analytics?.monthly ?? [];
  const firstName = user?.name?.split(" ").pop() ?? "thầy/cô";

  const revSpark = monthly.map((m) => m.revenue);
  const enrSpark = monthly.map((m) => m.enrollments);
  const maxRev = Math.max(...revSpark, 1);

  // ── Cần xử lý ──
  const pendingEssays = queue?.total ?? 0;
  const draftCount = stats?.draft ?? 0;
  const topGradingCourse = queue?.courses?.[0];
  const todos = [
    pendingEssays > 0 && {
      key: "essays",
      icon: <PenLine size={18} />,
      tint: "rgba(124,92,252,0.12)", fg: C.violet,
      label: `${pendingEssays} bài tự luận chờ chấm`,
      sub: topGradingCourse ? `Nhiều nhất: ${topGradingCourse.title}` : "Trên các khóa của bạn",
      href: topGradingCourse ? `/teacher/courses/${topGradingCourse.course_id}/essays` : "/teacher/courses",
    },
    draftCount > 0 && {
      key: "drafts",
      icon: <FileEdit size={18} />,
      tint: "rgba(46,139,230,0.12)", fg: C.sky,
      label: `${draftCount} khóa học bản nháp`,
      sub: "Hoàn thiện và xuất bản",
      href: "/teacher/courses",
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; tint: string; fg: string; label: string; sub: string; href: string }[];

  const actions = [
    { href: "/teacher/courses/new", icon: <Plus size={16} />, label: "Tạo khóa học" },
    { href: "/teacher/courses",     icon: <BookOpen size={16} />, label: "Khóa học của tôi" },
    { href: "/teacher/analytics",   icon: <BarChart2 size={16} />, label: "Phân tích" },
    { href: "/posts",               icon: <MessagesSquare size={16} />, label: "Cộng đồng" },
  ];

  const filteredCourses = (data?.recent_courses ?? []).filter((c) => filter === "all" || c.status === filter);

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Hero ── */}
        <motion.section initial="hidden" animate="show" variants={fadeUp}
          className="flex flex-col gap-5 rounded-3xl bg-white p-7 md:flex-row md:items-center md:justify-between"
          style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
          <div>
            <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "rgba(124,92,252,0.10)", color: C.violet }}>
              <Sparkles size={13} /> Bảng điều khiển giảng dạy
            </div>
            <h1 className="font-display text-[32px] font-light leading-tight sm:text-[38px]">
              {greeting()}, <span className="font-semibold" style={{ color: C.blue }}>{firstName}</span> 👋
            </h1>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              Nhìn lại lớp học và bắt đầu một ngày dạy hiệu quả.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link href="/teacher/courses/new"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.32) 0px 6px 16px" }}>
              <Plus size={16} /> Tạo khóa học
            </Link>
            <Link href="/teacher/analytics"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}>
              <BarChart2 size={16} /> Phân tích
            </Link>
          </div>
        </motion.section>

        {/* ── Cần xử lý ── */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <CheckCircle2 size={18} style={{ color: C.emerald }} /> Cần xử lý
          </h2>
          {todos.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4"
              style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "rgba(14,159,110,0.12)", color: C.emerald }}>
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: C.ink }}>Mọi thứ đã gọn gàng 🎉</p>
                <p className="text-[13px]" style={{ color: C.inkSoft }}>Không có bài chờ chấm hay khóa nháp nào.</p>
              </div>
            </div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={stagger(0.06)}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {todos.map((t) => (
                <motion.div key={t.key} variants={fadeUp} whileHover={{ y: -3 }}>
                  <Link href={t.href}
                    className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 transition-colors hover:border-[#1b61c9]/40"
                    style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: t.tint, color: t.fg }}>
                      {t.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>{t.label}</p>
                      <p className="truncate text-[13px]" style={{ color: C.inkSoft }}>{t.sub}</p>
                    </div>
                    <ArrowRight size={16} style={{ color: C.inkFaint }} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── KPI ── */}
        <motion.div initial="hidden" animate="show" variants={stagger(0.08)}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Users size={20} />} tint="rgba(124,92,252,0.12)" fg={C.violet}
            value={isLoading ? "—" : (stats?.total_students ?? 0)} label="Tổng học viên" />
          <Kpi icon={<Wallet size={20} />} tint="rgba(14,159,110,0.12)" fg={C.emerald}
            value={isLoading ? "—" : formatVND(stats?.revenue_this_month ?? 0)} label="Doanh thu tháng này"
            growth={overview?.revenue_growth ?? undefined} spark={revSpark} sparkColor={C.emerald} />
          <Kpi icon={<TrendingUp size={20} />} tint="rgba(46,139,230,0.12)" fg={C.sky}
            value={overview ? overview.total_enrollments : "—"} label="Lượt đăng ký (6 tháng)"
            growth={overview?.enrollment_growth ?? undefined} spark={enrSpark} sparkColor={C.sky} />
          <Kpi icon={<BookOpen size={20} />} tint="rgba(27,97,201,0.10)" fg={C.blue}
            value={isLoading ? "—" : (stats?.total_courses ?? 0)}
            label={`${stats?.published ?? 0} công bố · ${stats?.draft ?? 0} nháp`} />
        </motion.div>

        {/* ── Revenue chart ── */}
        {monthly.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mt-6 rounded-3xl bg-white p-6"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Wallet size={18} style={{ color: C.emerald }} /> Doanh thu 6 tháng gần đây
              </h2>
              <Link href="/teacher/analytics" className="text-sm font-medium" style={{ color: C.blue }}>Chi tiết →</Link>
            </div>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {monthly.map((m) => {
                const pct = (m.revenue / maxRev) * 100;
                return (
                  <div key={m.month} className="group flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: C.emerald }}>
                      {compactVND(m.revenue)}
                    </span>
                    <motion.div className="w-full rounded-t-lg"
                      style={{ background: "linear-gradient(180deg,#34C38F,#0E9F6E)", minHeight: 4 }}
                      initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }} />
                    <span className="text-[11px]" style={{ color: C.inkFaint }}>{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Quick actions ── */}
        <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="mt-8 flex flex-wrap gap-3">
          {actions.map((a) => (
            <motion.div key={a.href} variants={fadeUp} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href={a.href}
                className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-[#1b61c9]/40"
                style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}>
                <span style={{ color: C.blue }}>{a.icon}</span>
                {a.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Recent courses + enrollments ── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Recent courses */}
          <div className="rounded-3xl bg-white p-6"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <BookOpen size={18} style={{ color: C.blue }} /> Khóa học gần đây
              </h2>
              <Link href="/teacher/courses" className="text-sm font-medium" style={{ color: C.blue }}>Xem tất cả →</Link>
            </div>

            <div className="mb-4 flex items-center gap-2">
              {([
                { key: "all",       label: "Tất cả",     count: stats?.total_courses },
                { key: "PUBLISHED", label: "Đã công bố", count: stats?.published },
                { key: "DRAFT",     label: "Nháp",       count: stats?.draft },
              ] as { key: CourseFilter; label: string; count?: number }[]).map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={filter === key ? { background: C.blue, color: "#fff" } : { background: "#EAF1FC", color: C.inkSoft }}>
                  {label}
                  {!isLoading && count !== undefined && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={filter === key ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "#DCE6F4", color: C.inkFaint }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-11 w-16 rounded-lg" style={{ background: "#E2ECF9" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
                      <div className="h-3 w-1/2 rounded" style={{ background: "#E2ECF9" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="py-10 text-center text-sm" style={{ color: C.inkFaint }}>Chưa có khóa học nào.</p>
            ) : (
              <motion.div initial="hidden" animate="show" variants={stagger(0.05)} className="space-y-1">
                {filteredCourses.map((c) => <CourseRow key={c.id} course={c} />)}
              </motion.div>
            )}
          </div>

          {/* Recent enrollments */}
          <div className="rounded-3xl bg-white p-6"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Users size={18} style={{ color: C.blue }} /> Đăng ký mới
              </h2>
              <Link href="/teacher/analytics" className="text-sm font-medium" style={{ color: C.blue }}>Phân tích →</Link>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full" style={{ background: "#E2ECF9" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded" style={{ background: "#E2ECF9" }} />
                      <div className="h-3 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.recent_enrollments.length ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FileText size={24} style={{ color: C.inkFaint }} />
                <p className="text-sm" style={{ color: C.inkFaint }}>Chưa có học viên nào đăng ký.</p>
              </div>
            ) : (
              <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="space-y-4">
                {data.recent_enrollments.map((e, i) => <EnrollmentRow key={i} enrollment={e} />)}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
