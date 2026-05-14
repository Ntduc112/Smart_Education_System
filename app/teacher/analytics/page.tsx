"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, BookOpen, DollarSign } from "lucide-react";
import { useTeacherAnalytics, MonthlyPoint, CourseStats } from "./analytics.hook";

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
    return <span className="text-xs text-[rgba(4,14,32,0.35)]">—</span>;
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
        <TrendingUp size={11} /> +{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
        <TrendingDown size={11} /> {value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-[rgba(4,14,32,0.4)]">
      <Minus size={11} /> 0%
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, growth, iconCls,
}: {
  label:   string;
  value:   string;
  sub?:    string;
  icon:    React.ElementType;
  growth?: number | null;
  iconCls: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] px-5 py-4"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconCls}`}>
          <Icon size={17} />
        </div>
        {growth !== undefined && <GrowthBadge value={growth ?? null} />}
      </div>
      <p className="text-2xl font-bold text-[#181d26] tracking-tight">{value}</p>
      <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.35)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Chart tooltips ────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#181d26] mb-1">{label}</p>
      <p className="text-[#1b61c9]">{fmtVNDFull(payload[0].value)}</p>
    </div>
  );
}

function EnrollTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#181d26] mb-1">{label}</p>
      <p className="text-emerald-600">{payload[0].value} học viên</p>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] p-5"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <h2 className="text-sm font-semibold text-[#181d26] mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ── Top courses table ─────────────────────────────────────────────────────────

function TopCoursesTable({ courses }: { courses: CourseStats[] }) {
  const maxEnroll = Math.max(...courses.map((c) => c.enrollments), 1);

  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className="px-6 py-4 border-b border-[#f0f2f5]">
        <h2 className="text-sm font-semibold text-[#181d26]">Xếp hạng khóa học</h2>
      </div>

      {courses.length === 0 ? (
        <p className="px-6 py-12 text-sm text-center text-[rgba(4,14,32,0.4)]">Chưa có dữ liệu.</p>
      ) : (
        <>
          {/* Table header */}
          <div className="grid grid-cols-[28px_48px_1fr_120px_160px_80px] gap-4 px-6 py-2.5 bg-[#f8fafc] border-b border-[#f0f2f5]">
            {["#", "", "Khóa học", "Học viên", "Doanh thu", "Trạng thái"].map((h) => (
              <span key={h} className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-[#f0f2f5]">
            {courses.map((c, i) => (
              <div
                key={c.id}
                className="grid grid-cols-[28px_48px_1fr_120px_160px_80px] gap-4 items-center px-6 py-3.5 hover:bg-[#fafbfc] transition-colors"
              >
                {/* Rank */}
                <span className="text-xs font-bold text-[rgba(4,14,32,0.3)] text-center">
                  {i + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-12 h-8 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                </div>

                {/* Title + bar */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#181d26] truncate mb-1.5">{c.title}</p>
                  <div className="h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1b61c9]/70 transition-all"
                      style={{ width: `${(c.enrollments / maxEnroll) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Enrollments */}
                <div>
                  <p className="text-sm font-semibold text-[#181d26]">{c.enrollments}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.4)]">học viên</p>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-sm font-semibold text-[#181d26]">{fmtVNDFull(c.revenue)}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.4)]">tổng thu</p>
                </div>

                {/* Status */}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    c.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
                  }`}
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
    <div className="px-8 py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-100 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-80 bg-gray-100 rounded-2xl" />
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
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Phân tích</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
            Hiệu suất giảng dạy của bạn
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex bg-[#f0f2f5] rounded-xl p-1 gap-1">
          {([6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                months === m
                  ? "bg-white text-[#181d26] shadow-sm"
                  : "text-[rgba(4,14,32,0.55)] hover:text-[#181d26]"
              }`}
            >
              {m} tháng
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Tổng doanh thu"
          value={fmtVNDFull(ov?.total_revenue ?? 0)}
          sub="so với tháng trước"
          icon={DollarSign}
          iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
          growth={ov?.revenue_growth}
        />
        <StatCard
          label="Lượt đăng ký"
          value={String(ov?.total_enrollments ?? 0)}
          sub={`trong ${months} tháng qua`}
          icon={Users}
          iconCls="bg-emerald-50 text-emerald-600"
          growth={ov?.enrollment_growth}
        />
        <StatCard
          label="Tổng khóa học"
          value={String(ov?.total_courses ?? 0)}
          sub="đã tạo"
          icon={BookOpen}
          iconCls="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Doanh thu theo tháng">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              barSize={20}
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
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
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#f0f4fb" }} />
              <Bar dataKey="revenue" fill="#1b61c9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Đăng ký mới theo tháng">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
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
              <Tooltip content={<EnrollTooltip />} cursor={{ stroke: "#e0e2e6" }} />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top courses */}
      <TopCoursesTable courses={data?.top_courses ?? []} />
    </div>
  );
}
