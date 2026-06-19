"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Activity, TrendingDown, Users } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import { useCourseEngagement, LessonEngagement } from "./engagement.hook";

const CARD_SHADOW = "rgba(15,48,106,0.06) 0px 0px 0px 1px, rgba(15,48,106,0.04) 0px 4px 16px";

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as LessonEngagement;
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-xl px-3 py-2 text-xs shadow-lg max-w-[240px]">
      <p className="font-semibold text-[#181d26] mb-1 line-clamp-2">Bài {d.position}. {d.lesson_title}</p>
      <p className="text-[#1b61c9]">Xem trung bình: {d.avg_watch_percent}%</p>
      <p className="text-emerald-600">Hoàn thành: {d.completion_rate}%</p>
      <p className="text-[rgba(4,14,32,0.5)]">Bắt đầu: {d.students_started} · Xong: {d.students_completed}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconCls }: {
  icon: React.ElementType; label: string; value: string; sub?: string; iconCls: string;
}) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: CARD_SHADOW }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconCls}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-semibold text-[#181d26] mt-3">{value}</p>
      <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.4)] mt-0.5 line-clamp-1">{sub}</p>}
    </div>
  );
}

export default function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useCourseEngagement(id);
  const pathname = usePathname();

  const tabs = [
    { label: "Tiến độ học viên", href: `/teacher/courses/${id}/students` },
    { label: "Hiệu suất quiz",   href: `/teacher/courses/${id}/performance` },
    { label: "Mức độ tương tác", href: `/teacher/courses/${id}/engagement` },
  ];

  const lessons   = data?.lessons ?? [];
  const worst     = lessons.find((l) => l.lesson_id === data?.worst_lesson_id) ?? null;
  const biggestDrop = lessons.reduce<LessonEngagement | null>(
    (max, l) => (l.drop_from_prev > (max?.drop_from_prev ?? 0) ? l : max), null
  );

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <Breadcrumb items={[
          { label: "Khóa học",     href: "/teacher/courses" },
          { label: data?.course.title ?? "…", href: `/teacher/courses/${id}/edit` },
          { label: "Mức độ tương tác" },
        ]} />
        <h1 className="text-2xl font-semibold text-[#181d26]">Mức độ tương tác</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
          Phát hiện bài học khiến học viên bỏ giữa chừng dựa trên tỷ lệ xem video
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-[#e0e2e6]">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                active
                  ? "text-[#1b61c9] border-b-2 border-[#1b61c9] -mb-px"
                  : "text-[rgba(4,14,32,0.55)] hover:text-[#181d26]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-7 h-7 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 gap-4" style={{ boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl bg-[#f0f4fb] flex items-center justify-center">
            <Activity size={24} className="text-[#1b61c9]/50" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#181d26]">Chưa có dữ liệu tương tác</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1">
              Khóa học chưa có bài học hoặc chưa có học viên nào xem video.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Học viên"
              value={String(data?.total_enrolled ?? 0)}
              sub={`${data?.total_lessons ?? 0} bài học`}
              iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
            />
            <StatCard
              icon={TrendingDown}
              label="Bài mất hứng thú nhất"
              value={worst ? `${worst.avg_watch_percent}%` : "—"}
              sub={worst ? `Bài ${worst.position}. ${worst.lesson_title}` : undefined}
              iconCls="bg-red-50 text-red-500"
            />
            <StatCard
              icon={TrendingDown}
              label="Điểm rơi lớn nhất"
              value={biggestDrop && biggestDrop.drop_from_prev > 0 ? `-${biggestDrop.drop_from_prev}%` : "—"}
              sub={biggestDrop && biggestDrop.drop_from_prev > 0 ? `Bài ${biggestDrop.position}. ${biggestDrop.lesson_title}` : "Không có sụt giảm rõ rệt"}
              iconCls="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Bar chart: avg watch percent per lesson */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: CARD_SHADOW }}>
            <h2 className="text-sm font-semibold text-[#181d26] mb-1">Tỷ lệ xem trung bình theo bài học</h2>
            <p className="text-xs text-[rgba(4,14,32,0.45)] mb-4">
              Cột thấp = học viên xem ít, dấu hiệu bài học gây mất hứng thú (bài thấp nhất tô đỏ).
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessons} barSize={28} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                <XAxis
                  dataKey="position"
                  tickFormatter={(v: number) => `B${v}`}
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: "rgba(4,14,32,0.45)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f0f4fb" }} />
                <Bar dataKey="avg_watch_percent" radius={[4, 4, 0, 0]}>
                  {lessons.map((l) => (
                    <Cell
                      key={l.lesson_id}
                      fill={l.lesson_id === data?.worst_lesson_id ? "#ef4444" : "#1b61c9"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
