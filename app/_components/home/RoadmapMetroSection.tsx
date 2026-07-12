"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Route } from "lucide-react";
import { useMe } from "@/app/student/dashboard/dashboard.hook";

export type MetroStop = {
  courseId: string;
  title: string;
  description: string;
  instructor: string;
  enrollments: number;
};

export type MetroRoadmap = {
  id: string;
  title: string;
  description: string;
  stops: MetroStop[];
};

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

// Màu tuyến, xoay vòng theo thứ tự roadmap
const LINE_COLORS = ["#1b61c9", "#0e9488", "#d97a1f", "#b3436b", "#5b6472"];

const VIEW_W = 980;
const VIEW_H = 520;

// Tọa độ ga: trái dưới -> phải trên, so le nhẹ cho giống sơ đồ metro
function layoutStops(n: number) {
  if (n === 1) return [{ x: VIEW_W / 2, y: VIEW_H / 2 }];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = 70 + t * (VIEW_W - 140);
    const wiggle = (i % 2 === 0 ? 1 : -1) * 34;
    const y = 430 - t * 340 + (i === 0 || i === n - 1 ? 0 : wiggle);
    pts.push({ x, y });
  }
  return pts;
}

function pathThrough(pts: { x: number; y: number }[]) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
  }
  return d;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export function RoadmapMetroSection({ roadmaps }: { roadmaps: MetroRoadmap[] }) {
  const { data: user } = useMe();
  const reduceMotion = useReducedMotion();
  const [lineIdx, setLineIdx] = useState(0);
  const [stopIdx, setStopIdx] = useState(0);

  // course nằm trên >= 2 tuyến -> ga trung chuyển
  const hubs = useMemo(() => {
    const seen = new Map<string, string[]>();
    for (const rm of roadmaps)
      for (const s of rm.stops)
        seen.set(s.courseId, [...(seen.get(s.courseId) ?? []), rm.title]);
    return seen;
  }, [roadmaps]);

  const dashboardHref = user ? `/${user.role.toLowerCase()}/dashboard` : "/register";

  if (roadmaps.length === 0) {
    // Chưa có roadmap PUBLISHED: hero gọn không có bản đồ
    return (
      <section className="relative px-6 pt-20 pb-16 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.08] tracking-tight mb-6" style={{ color: C.ink }}>
          Học thông minh hơn,
          <br />
          <span className="font-semibold" style={{ color: C.blue }}>vui hơn mỗi ngày</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: C.inkSoft }}>
          Nền tảng học tập dành cho sinh viên: AI Tutor 24/7, lộ trình rõ ràng và cộng đồng cùng tiến bộ.
        </p>
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 bg-[#1b61c9] text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-[#254fad] transition-colors"
          style={{ boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
        >
          {user ? "Vào khu vực học" : "Bắt đầu miễn phí"}
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const rm = roadmaps[Math.min(lineIdx, roadmaps.length - 1)];
  const color = LINE_COLORS[lineIdx % LINE_COLORS.length];
  const stops = rm.stops;
  const stop = stops[Math.min(stopIdx, stops.length - 1)];
  const pts = layoutStops(stops.length);
  const hubLines = (s: MetroStop) => (hubs.get(s.courseId) ?? []).filter((t) => t !== rm.title);

  const selectLine = (i: number) => {
    setLineIdx(i);
    setStopIdx(0);
  };

  return (
    <section className="relative px-6 pt-14 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl font-light leading-[1.08] tracking-tight mb-5" style={{ color: C.ink }}>
            Học đúng lộ trình,
            <br />
            <span className="font-semibold" style={{ color: C.blue }}>tới đúng đích.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mb-8" style={{ color: C.inkSoft }}>
            Mỗi lộ trình gồm các khóa học xếp theo đúng thứ tự nên học. Chọn một lộ trình và chạm vào từng khóa để xem bạn sẽ học gì.
          </p>
        </div>

        {/* Chọn tuyến */}
        <div role="tablist" aria-label="Chọn lộ trình" className="flex flex-wrap gap-2.5 mb-6">
          {roadmaps.map((r, i) => {
            const c = LINE_COLORS[i % LINE_COLORS.length];
            const active = i === lineIdx;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={active}
                onClick={() => selectLine(i)}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold transition-all"
                style={{
                  color: active ? C.ink : C.inkSoft,
                  border: `1.5px solid ${active ? c : C.border}`,
                  boxShadow: active ? `inset 0 0 0 1px ${c}, ${CARD_SHADOW}` : CARD_SHADOW,
                }}
              >
                <span aria-hidden className="inline-block w-5 h-1.5 rounded-full" style={{ background: c }} />
                {r.title}
                <span className="font-medium text-xs" style={{ color: C.inkFaint }}>{r.stops.length} khóa học</span>
              </button>
            );
          })}
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white"
            style={{ color: C.blue }}
          >
            Tất cả lộ trình <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[7fr_4fr] gap-6 items-start">
          {/* Bản đồ */}
          <div className="rounded-3xl bg-white p-5 overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <p className="text-sm leading-relaxed mx-2 mb-1" style={{ color: C.inkSoft }}>{rm.description}</p>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="min-w-[640px] w-full h-auto"
                role="img"
                aria-label={`Sơ đồ các khóa học trong ${rm.title}`}
              >
                {/* key theo tuyến: đổi tuyến là remount, animation chạy lại từ đầu */}
                <g key={rm.id}>
                  <motion.path
                    d={pathThrough(pts)}
                    fill="none"
                    stroke={color}
                    strokeWidth={7}
                    strokeLinecap="round"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                  />
                  {stops.map((s, i) => {
                    const p = pts[i];
                    const isHub = hubLines(s).length > 0;
                    // ga chẵn bị đẩy xuống -> nhãn nằm dưới, ga lẻ đẩy lên -> nhãn nằm trên
                    const above = i % 2 === 1 || i === stops.length - 1;
                    const anchor = i === 0 ? "start" : i === stops.length - 1 ? "end" : "middle";
                    return (
                      <motion.g
                        key={s.courseId}
                        className="cursor-pointer outline-none"
                        role="button"
                        tabIndex={0}
                        aria-label={`Khóa học ${s.title}`}
                        onClick={() => setStopIdx(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setStopIdx(i);
                          }
                        }}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.15 + (i * 0.9) / stops.length }}
                      >
                        {/* vùng bấm rộng hơn chấm ga */}
                        <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                        {stopIdx === i && (
                          <circle cx={p.x} cy={p.y} r={15} fill="none" stroke={color} strokeWidth={8} opacity={0.3} />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHub ? 10 : 9}
                          fill="#fff"
                          stroke={stopIdx === i ? color : C.ink}
                          strokeWidth={isHub ? 5 : 3.5}
                        />
                        <text
                          x={p.x}
                          y={above ? p.y - 24 : p.y + 36}
                          textAnchor={anchor}
                          fontSize={13.5}
                          fontWeight={600}
                          fill={C.ink}
                        >
                          {truncate(s.title, 28)}
                        </text>
                      </motion.g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* Chi tiết ga */}
          <aside
            aria-live="polite"
            className="lg:sticky lg:top-4 rounded-3xl p-6 flex flex-col gap-3.5 min-h-[340px]"
            style={{ background: C.ink, color: "#f2f4f8" }}
          >
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="w-3.5 h-3.5 rounded-full bg-white flex-shrink-0" style={{ border: `3px solid ${color}` }} />
              <span className="font-display text-xl font-semibold leading-snug">{stop.title}</span>
            </div>
            {hubLines(stop).length > 0 && (
              <span className="text-xs ml-6" style={{ color: "#9fb4e8" }}>
                Cũng nằm trong {hubLines(stop).join(", ")}
              </span>
            )}
            <p className="text-sm leading-relaxed line-clamp-5" style={{ color: "#aeb6c4" }}>
              {stop.description}
            </p>
            <p className="text-xs" style={{ color: "#7d8696" }}>
              Giảng viên {stop.instructor}
              {stop.enrollments > 0 && ` · ${stop.enrollments} học viên đang học`}
            </p>
            <div className="mt-auto flex flex-col gap-2.5">
              <Link
                href={`/courses/${stop.courseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-[15px] text-white transition-transform active:scale-[0.98]"
                style={{ background: C.blue }}
              >
                Học khóa này <ArrowRight size={16} />
              </Link>
              <Link
                href={`/roadmaps/${rm.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#c9d2e4" }}
              >
                <Route size={15} /> Xem toàn bộ lộ trình
              </Link>
            </div>
          </aside>
        </div>

        {/* Hai ý dưới bản đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="pt-4" style={{ borderTop: `2px solid ${C.ink}` }}>
            <h3 className="font-display text-lg font-semibold mb-1.5" style={{ color: C.ink }}>Do giảng viên biên soạn</h3>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: C.inkSoft }}>
              Mỗi lộ trình được giảng viên sắp xếp sẵn: khóa nào học trước, khóa nào học sau, không phải tự đoán.
            </p>
          </div>
          <div className="pt-4" style={{ borderTop: `2px solid ${C.ink}` }}>
            <h3 className="font-display text-lg font-semibold mb-1.5" style={{ color: C.ink }}>Học một lần, tính cho nhiều lộ trình</h3>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: C.inkSoft }}>
              Một khóa học có thể nằm trong nhiều lộ trình. Hoàn thành ở lộ trình này, sang lộ trình khác không phải học lại.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
