"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Users, BookOpen, GraduationCap, DollarSign,
  TrendingUp, UserPlus, ClipboardList,
} from "lucide-react";
import { useAdminStats } from "../admin.hook";

// ── Formatters ─────────────────────────────────────────────────────────────

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

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconCls,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconCls: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] px-5 py-4"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconCls}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-bold text-[#181d26] tracking-tight">{value}</p>
      <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.35)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Chart tooltips ─────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#181d26] mb-1">{label}</p>
      <p className="text-[#1b61c9]">{fmtVNDFull(payload[0].value)}</p>
    </div>
  );
}
function CountTooltip({ active, payload, label, color, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#181d26] mb-1">{label}</p>
      <p style={{ color }}>{payload[0].value} {unit}</p>
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────

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

// ── Top courses ────────────────────────────────────────────────────────────

function TopCoursesTable({ courses }: { courses: { id: string; title: string; thumbnail: string; enrollments: number; revenue: number }[] }) {
  const max = Math.max(...courses.map((c) => c.enrollments), 1);
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className="px-6 py-4 border-b border-[#f0f2f5]">
        <h2 className="text-sm font-semibold text-[#181d26]">Top khóa học phổ biến</h2>
      </div>
      {courses.length === 0 ? (
        <p className="text-sm text-center text-[rgba(4,14,32,0.4)] py-10">Chưa có dữ liệu.</p>
      ) : (
        <div className="divide-y divide-[#f0f2f5]">
          {courses.map((c, i) => (
            <div key={c.id} className="flex items-center gap-4 px-6 py-3.5">
              <span className="w-5 text-xs font-bold text-[rgba(4,14,32,0.3)] text-center shrink-0">{i + 1}</span>
              <div className="w-12 h-8 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#181d26] truncate mb-1.5">{c.title}</p>
                <div className="h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#1b61c9]/70" style={{ width: `${(c.enrollments / max) * 100}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0 w-20">
                <p className="text-sm font-semibold text-[#181d26]">{c.enrollments}</p>
                <p className="text-xs text-[rgba(4,14,32,0.4)]">học viên</p>
              </div>
              <div className="text-right shrink-0 w-28">
                <p className="text-sm font-semibold text-[#181d26]">{fmtVNDFull(c.revenue)}</p>
                <p className="text-xs text-[rgba(4,14,32,0.4)]">doanh thu</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[0,1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
      <div className="h-72 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { data, isLoading } = useAdminStats();

  if (isLoading) return <Skeleton />;

  const ov = data?.overview;
  const chartData = (data?.monthly ?? []).map((p) => ({ ...p, label: fmtMonth(p.month) }));

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Thống kê</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">Tổng quan toàn hệ thống</p>
      </div>

      {/* Stat cards — 4 tổng quan */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={String(ov?.total_users ?? 0)}
          sub={`+${ov?.new_users_month ?? 0} tháng này`}
          icon={Users}
          iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
        />
        <StatCard
          label="Học sinh"
          value={String(ov?.total_students ?? 0)}
          icon={GraduationCap}
          iconCls="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Giáo viên"
          value={String(ov?.total_teachers ?? 0)}
          icon={UserPlus}
          iconCls="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Tổng doanh thu"
          value={fmtVNDFull(ov?.total_revenue ?? 0)}
          icon={DollarSign}
          iconCls="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Stat cards — 3 cột thứ 2 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Tổng khóa học"
          value={String(ov?.total_courses ?? 0)}
          icon={BookOpen}
          iconCls="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="Lượt đăng ký"
          value={String(ov?.total_enrollments ?? 0)}
          sub={`+${ov?.new_enrollments_month ?? 0} tháng này`}
          icon={ClipboardList}
          iconCls="bg-rose-50 text-rose-600"
        />
        <StatCard
          label="Tăng trưởng"
          value={`+${ov?.new_users_month ?? 0}`}
          sub="người dùng mới tháng này"
          icon={TrendingUp}
          iconCls="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Doanh thu 6 tháng">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={20} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtVND} tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#f0f4fb" }} />
              <Bar dataKey="revenue" fill="#1b61c9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Đăng ký & người dùng mới theo tháng">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<CountTooltip color="#10b981" unit="đăng ký" />} cursor={{ stroke: "#e0e2e6" }} />
              <Line type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} name="Đăng ký" />
              <Line type="monotone" dataKey="new_users" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }} name="Người dùng mới" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top courses */}
      <TopCoursesTable courses={data?.top_courses ?? []} />
    </div>
  );
}
