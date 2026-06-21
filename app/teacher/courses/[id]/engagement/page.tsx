"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Activity, TrendingDown, Users } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { useCourseEngagement, LessonEngagement } from "./engagement.hook";

// ── Palette (cozy-blue, đồng bộ teacher/home) ───────────────────────────────
const C = { canvas:"#EFF5FE", ink:"#181d26", inkSoft:"rgba(4,14,32,0.62)", inkFaint:"rgba(4,14,32,0.40)", border:"#DCE6F4", blue:"#1b61c9", blueDark:"#254fad", sky:"#2E8BE6", emerald:"#0E9F6E", violet:"#7C5CFC", rose:"#E5484D" };

const CARD_SHADOW = "rgba(80,60,20,0.06) 0px 10px 30px";
const STAT_SHADOW = "rgba(80,60,20,0.05) 0px 6px 18px";

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

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as LessonEngagement;
  return (
    <div className="bg-white rounded-xl px-3 py-2 text-xs shadow-lg max-w-[240px]" style={{ border: `1px solid ${C.border}` }}>
      <p className="font-semibold mb-1 line-clamp-2" style={{ color: C.ink }}>Bài {d.position}. {d.lesson_title}</p>
      <p style={{ color: C.blue }}>Xem trung bình: {d.avg_watch_percent}%</p>
      <p style={{ color: C.emerald }}>Hoàn thành: {d.completion_rate}%</p>
      <p style={{ color: C.inkFaint }}>Bắt đầu: {d.students_started} · Xong: {d.students_completed}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint, fg }: {
  icon: React.ElementType; label: string; value: string; sub?: string; tint: string; fg: string;
}) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4" style={{ border: `1px solid ${C.border}`, boxShadow: STAT_SHADOW }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tint, color: fg }}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-semibold mt-3" style={{ color: C.ink }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>{label}</p>
      {sub && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.inkFaint }}>{sub}</p>}
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
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div>
          <Breadcrumb items={[
            { label: "Khóa học",     href: "/teacher/courses" },
            { label: data?.course.title ?? "…", href: `/teacher/courses/${id}/edit` },
            { label: "Mức độ tương tác" },
          ]} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Mức độ tương tác</h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>
            Phát hiện bài học khiến học viên bỏ giữa chừng dựa trên tỷ lệ xem video
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b" style={{ borderColor: C.border }}>
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
                style={active
                  ? { color: C.blue, borderBottom: `2px solid ${C.blue}`, marginBottom: "-1px" }
                  : { color: C.inkSoft }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: C.blue, borderTopColor: "transparent" }} />
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-3xl flex flex-col items-center justify-center py-20 gap-4" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#EAF1FC" }}>
              <Activity size={24} style={{ color: C.blue, opacity: 0.5 }} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: C.ink }}>Chưa có dữ liệu tương tác</p>
              <p className="text-xs mt-1" style={{ color: C.inkFaint }}>
                Khóa học chưa có bài học hoặc chưa có học viên nào xem video.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Users}
                label="Học viên"
                value={String(data?.total_enrolled ?? 0)}
                sub={`${data?.total_lessons ?? 0} bài học`}
                tint="rgba(27,97,201,0.10)" fg={C.blue}
              />
              <StatCard
                icon={TrendingDown}
                label="Bài mất hứng thú nhất"
                value={worst ? `${worst.avg_watch_percent}%` : "—"}
                sub={worst ? `Bài ${worst.position}. ${worst.lesson_title}` : undefined}
                tint="rgba(229,72,77,0.10)" fg={C.rose}
              />
              <StatCard
                icon={TrendingDown}
                label="Điểm rơi lớn nhất"
                value={biggestDrop && biggestDrop.drop_from_prev > 0 ? `-${biggestDrop.drop_from_prev}%` : "—"}
                sub={biggestDrop && biggestDrop.drop_from_prev > 0 ? `Bài ${biggestDrop.position}. ${biggestDrop.lesson_title}` : "Không có sụt giảm rõ rệt"}
                tint="rgba(229,72,77,0.10)" fg={C.rose}
              />
            </div>

            {/* Bar chart: avg watch percent per lesson */}
            <div className="bg-white rounded-3xl p-5" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Tỷ lệ xem trung bình theo bài học</h2>
              <p className="text-xs mb-4" style={{ color: C.inkFaint }}>
                Cột thấp = học viên xem ít, dấu hiệu bài học gây mất hứng thú (bài thấp nhất tô đỏ).
              </p>
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={300} minWidth={360}>
                  <BarChart data={lessons} barSize={28} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F9" vertical={false} />
                    <XAxis
                      dataKey="position"
                      tickFormatter={(v: number) => `B${v}`}
                      tick={{ fontSize: 11, fill: C.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                      tick={{ fontSize: 11, fill: C.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F4F8FE" }} />
                    <Bar dataKey="avg_watch_percent" radius={[4, 4, 0, 0]}>
                      {lessons.map((l) => (
                        <Cell
                          key={l.lesson_id}
                          fill={l.lesson_id === data?.worst_lesson_id ? C.rose : C.blue}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
