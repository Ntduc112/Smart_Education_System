"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, BookOpen, DollarSign } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { useTeacherAnalytics, MonthlyPoint, CourseStats } from "./analytics.hook";

// ── Palette (đồng bộ với teacher/home) ───────────────────────────────────────
const C = {
  canvas: "#EFF5FE", ink: "#181d26", inkSoft: "rgba(4,14,32,0.62)", inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4", blue: "#1b61c9", blueDark: "#254fad", sky: "#2E8BE6", emerald: "#0E9F6E", violet: "#7C5CFC", rose: "#E5484D",
};

// ── Atmosphere (đồng bộ teacher/home) ────────────────────────────────────────
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
          style={{ width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)", top: b.top, left: b.left, right: b.right, bottom: b.bottom }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }} />
      ))}
    </div>
  );
}

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtVNDFull(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function fmtMonth(key: string) {
  const [y, m] = key.split("-");
  return `Th${parseInt(m)}/${y.slice(2)}`;
}

// ── Growth badge ─────────────────────────────────────────────────────────────

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-xs" style={{ color: C.inkFaint }}>—</span>;
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
        style={{ background: "rgba(14,159,110,0.12)", color: C.emerald }}>
        <TrendingUp size={11} /> +{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
        style={{ background: "rgba(229,72,77,0.12)", color: C.rose }}>
        <TrendingDown size={11} /> {value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs" style={{ color: C.inkFaint }}>
      <Minus size={11} /> 0%
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, growth, tint, fg,
}: {
  label:   string;
  value:   string;
  sub?:    string;
  icon:    React.ElementType;
  growth?: number | null;
  tint:    string;
  fg:      string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-white px-5 py-4"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: tint, color: fg }}>
          <Icon size={17} />
        </div>
        {growth !== undefined && <GrowthBadge value={growth ?? null} />}
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: C.inkFaint }}>{sub}</p>}
    </motion.div>
  );
}

// ── Chart tooltips ────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3 py-2 text-xs shadow-lg" style={{ border: `1px solid ${C.border}` }}>
      <p className="font-semibold mb-1" style={{ color: C.ink }}>{label}</p>
      <p style={{ color: C.blue }}>{fmtVNDFull(payload[0].value)}</p>
    </div>
  );
}

function EnrollTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3 py-2 text-xs shadow-lg" style={{ border: `1px solid ${C.border}` }}>
      <p className="font-semibold mb-1" style={{ color: C.ink }}>{label}</p>
      <p style={{ color: C.emerald }}>{payload[0].value} học viên</p>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl bg-white p-5"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: C.ink }}>{title}</h2>
      {children}
    </div>
  );
}

// ── Top courses table ─────────────────────────────────────────────────────────

function TopCoursesTable({ courses }: { courses: CourseStats[] }) {
  const maxEnroll = Math.max(...courses.map((c) => c.enrollments), 1);

  return (
    <div
      className="rounded-3xl bg-white overflow-hidden"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
    >
      <div className="px-6 py-4 border-b" style={{ borderColor: "#EEF2F9" }}>
        <h2 className="text-sm font-semibold" style={{ color: C.ink }}>Xếp hạng khóa học</h2>
      </div>

      {courses.length === 0 ? (
        <p className="px-6 py-12 text-sm text-center" style={{ color: C.inkFaint }}>Chưa có dữ liệu.</p>
      ) : (
        <>
          {/* Table header */}
          <div className="grid grid-cols-[28px_48px_1fr_120px_160px_80px] gap-4 px-6 py-2.5 border-b" style={{ background: "#F4F8FE", borderColor: "#EEF2F9" }}>
            {["#", "", "Khóa học", "Học viên", "Doanh thu", "Trạng thái"].map((h) => (
              <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkFaint }}>
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y" style={{ borderColor: "#EEF2F9" }}>
            {courses.map((c, i) => (
              <div
                key={c.id}
                className="grid grid-cols-[28px_48px_1fr_120px_160px_80px] gap-4 items-center px-6 py-3.5 transition-colors hover:bg-[#F4F8FE]"
                style={{ borderColor: "#EEF2F9" }}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-center" style={{ color: C.inkFaint }}>
                  {i + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: "#E7EFFB" }}>
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                </div>

                {/* Title + bar */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate mb-1.5" style={{ color: C.ink }}>{c.title}</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EEF2F9" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(c.enrollments / maxEnroll) * 100}%`, background: C.blue, opacity: 0.7 }}
                    />
                  </div>
                </div>

                {/* Enrollments */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.ink }}>{c.enrollments}</p>
                  <p className="text-xs" style={{ color: C.inkFaint }}>học viên</p>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.ink }}>{fmtVNDFull(c.revenue)}</p>
                  <p className="text-xs" style={{ color: C.inkFaint }}>tổng thu</p>
                </div>

                {/* Status */}
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={
                    c.status === "PUBLISHED"
                      ? { background: "rgba(14,159,110,0.12)", color: C.emerald }
                      : { background: "#EAF1FC", color: C.inkSoft }
                  }
                >
                  {c.status === "PUBLISHED" ? "Công bố" : "Nháp"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 rounded-lg" style={{ background: "#E2ECF9" }} />
              <div className="h-4 w-56 rounded-lg" style={{ background: "#EAF1FC" }} />
            </div>
            <div className="h-9 w-36 rounded-full" style={{ background: "#EAF1FC" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-3xl" style={{ background: "#E2ECF9" }} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-3xl" style={{ background: "#E2ECF9" }} />
            <div className="h-64 rounded-3xl" style={{ background: "#E2ECF9" }} />
          </div>
          <div className="h-80 rounded-3xl" style={{ background: "#E2ECF9" }} />
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [months, setMonths] = useState<6 | 12>(6);
  const { data, isLoading }  = useTeacherAnalytics(months);

  if (isLoading) return <Skeleton />;

  const chartData = (data?.monthly ?? []).map((p: MonthlyPoint) => ({
    ...p,
    label: fmtMonth(p.month),
  }));

  const ov = data?.overview;

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Phân tích</h1>
            <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>
              Hiệu suất giảng dạy của bạn
            </p>
          </div>

          {/* Period toggle */}
          <div className="flex gap-1.5">
            {([6, 12] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={months === m
                  ? { background: C.blue, color: "#fff" }
                  : { background: "#EAF1FC", color: C.inkSoft }}
              >
                {m} tháng
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Tổng doanh thu"
            value={fmtVNDFull(ov?.total_revenue ?? 0)}
            sub="so với tháng trước"
            icon={DollarSign}
            tint="rgba(27,97,201,0.10)"
            fg={C.blue}
            growth={ov?.revenue_growth}
          />
          <StatCard
            label="Lượt đăng ký"
            value={String(ov?.total_enrollments ?? 0)}
            sub={`trong ${months} tháng qua`}
            icon={Users}
            tint="rgba(14,159,110,0.12)"
            fg={C.emerald}
            growth={ov?.enrollment_growth}
          />
          <StatCard
            label="Tổng khóa học"
            value={String(ov?.total_courses ?? 0)}
            sub="đã tạo"
            icon={BookOpen}
            tint="rgba(124,92,252,0.12)"
            fg={C.violet}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Doanh thu theo tháng">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                barSize={20}
                margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtVND}
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#EAF1FC" }} />
                <Bar dataKey="revenue" fill="#1b61c9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Đăng ký mới theo tháng">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<EnrollTooltip />} cursor={{ stroke: C.border }} />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#0E9F6E"
                  strokeWidth={2}
                  dot={{ fill: "#0E9F6E", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top courses */}
        <TopCoursesTable courses={data?.top_courses ?? []} />
      </main>
    </div>
  );
}
