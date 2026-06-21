"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart2, ClipboardX } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import { MainNavbar } from "@/app/_components/MainNavbar";
import api from "@/lib/axios";

const C = { canvas:"#EFF5FE", ink:"#181d26", inkSoft:"rgba(4,14,32,0.62)", inkFaint:"rgba(4,14,32,0.40)", border:"#DCE6F4", blue:"#1b61c9", blueDark:"#254fad", sky:"#2E8BE6", emerald:"#0E9F6E", violet:"#7C5CFC", rose:"#E5484D" };
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

const CARD_BORDER = `1px solid ${C.border}`;
const CARD_SHADOW = "rgba(80,60,20,0.06) 0px 10px 30px";
const STAT_SHADOW = "rgba(80,60,20,0.05) 0px 6px 18px";

interface QuizMeta {
  id: string;
  title: string;
  pass_score: number;
  lesson_title: string;
}

interface StudentScore {
  quiz_id: string;
  score: number | null;
  is_passed: boolean | null;
}

interface StudentRow {
  user: { id: string; name: string; email: string; avatar: string | null };
  scores: StudentScore[];
}

interface PerformanceData {
  course: { id: string; title: string };
  quizzes: QuizMeta[];
  students: StudentRow[];
}

function usePerformance(courseId: string) {
  return useQuery<PerformanceData>({
    queryKey: ["teacher", "course", courseId, "performance"],
    queryFn: () =>
      api.get(`/teacher/courses/${courseId}/performance`).then((r) => r.data),
    enabled: !!courseId,
  });
}

function ScoreCell({ score, isPassed }: { score: number | null; isPassed: boolean | null }) {
  if (score === null) {
    return (
      <div className="w-full h-9 rounded-lg flex items-center justify-center" style={{ background: "#EAF1FC" }}>
        <span className="text-xs" style={{ color: C.inkFaint }}>—</span>
      </div>
    );
  }

  const cellStyle =
    isPassed === true
      ? { background: "rgba(14,159,110,0.12)", color: C.emerald, border: "1px solid rgba(14,159,110,0.30)" }
      : score >= 50
      ? { background: "rgba(245,158,11,0.12)", color: "#B45309", border: "1px solid rgba(245,158,11,0.30)" }
      : { background: "rgba(229,72,77,0.12)", color: C.rose, border: "1px solid rgba(229,72,77,0.30)" };

  return (
    <div className="w-full h-9 rounded-lg flex items-center justify-center" style={cellStyle}>
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar)
    return <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(27,97,201,0.12)" }}>
      <span className="text-[10px] font-semibold" style={{ color: C.blue }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function PerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usePerformance(id);
  const pathname = usePathname();

  const tabs = [
    { label: "Tiến độ học viên", href: `/teacher/courses/${id}/students` },
    { label: "Hiệu suất quiz",   href: `/teacher/courses/${id}/performance` },
    { label: "Mức độ tương tác", href: `/teacher/courses/${id}/engagement` },
  ];

  // Summary stats derived from data
  const totalStudents = data?.students.length ?? 0;
  const totalQuizzes  = data?.quizzes.length ?? 0;
  const passRate = (() => {
    if (!data || !data.students.length || !data.quizzes.length) return null;
    let passed = 0, attempted = 0;
    for (const s of data.students) {
      for (const sc of s.scores) {
        if (sc.score !== null) {
          attempted++;
          if (sc.is_passed) passed++;
        }
      }
    }
    return attempted === 0 ? null : Math.round((passed / attempted) * 100);
  })();

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        {/* ── Header ── */}
        <div>
          <Breadcrumb items={[
            { label: "Khóa học",     href: "/teacher/courses" },
            { label: data?.course.title ?? "…", href: `/teacher/courses/${id}/edit` },
            { label: "Hiệu suất quiz" },
          ]} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Hiệu suất quiz</h1>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex items-center gap-1 border-b" style={{ borderColor: C.border }}>
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
                style={
                  active
                    ? { color: C.blue, borderBottom: `2px solid ${C.blue}`, marginBottom: -1 }
                    : { color: C.inkSoft }
                }
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
        ) : !data || quizzes_empty(data) ? (
          /* ── Empty state ── */
          <div
            className="rounded-3xl bg-white flex flex-col items-center justify-center py-20 gap-4"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#EAF1FC" }}>
              <ClipboardX size={24} style={{ color: C.blue }} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: C.ink }}>Chưa có dữ liệu quiz</p>
              <p className="text-xs mt-1" style={{ color: C.inkFaint }}>
                Khóa học này chưa có quiz nào hoặc chưa có học viên nào làm bài.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Summary stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Học viên",   value: totalStudents,           color: C.ink },
                { label: "Bài quiz",   value: totalQuizzes,            color: C.ink },
                { label: "Tỷ lệ đạt", value: passRate !== null ? `${passRate}%` : "—", color: passRate !== null && passRate >= 70 ? C.emerald : "#B45309" },
                { label: "Legend",     value: null,                    color: "" },
              ].map((item, i) =>
                item.value === null ? (
                  /* Legend card */
                  <div
                    key={i}
                    className="rounded-2xl bg-white px-5 py-4 flex flex-col gap-2.5"
                    style={{ border: CARD_BORDER, boxShadow: STAT_SHADOW }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkFaint }}>Chú thích</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { bg: "rgba(14,159,110,0.12)", bd: "rgba(14,159,110,0.30)", label: "Đạt" },
                        { bg: "rgba(245,158,11,0.12)", bd: "rgba(245,158,11,0.30)", label: "Chưa đạt (≥50%)" },
                        { bg: "rgba(229,72,77,0.12)",  bd: "rgba(229,72,77,0.30)",  label: "Yếu (<50%)" },
                        { bg: "#EAF1FC",               bd: C.border,                label: "Chưa làm" },
                      ].map(({ bg, bd, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border shrink-0" style={{ background: bg, borderColor: bd }} />
                          <span className="text-xs" style={{ color: C.inkSoft }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="rounded-2xl bg-white px-5 py-4 flex flex-col justify-between"
                    style={{ border: CARD_BORDER, boxShadow: STAT_SHADOW }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EAF1FC" }}>
                      <BarChart2 size={15} style={{ color: C.blue }} strokeWidth={2} />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-semibold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{item.label}</p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* ── Heatmap table ── */}
            <div
              className="rounded-3xl bg-white overflow-x-auto"
              style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
            >
              <table
                className="w-full text-sm border-collapse"
                style={{ minWidth: `${220 + data.quizzes.length * 110}px` }}
              >
                <thead>
                  <tr className="border-b" style={{ borderColor: "#EEF2F9", background: "#F4F8FE" }}>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold sticky left-0 w-52 min-w-[200px] rounded-tl-3xl" style={{ color: C.inkSoft, background: "#F4F8FE" }}>
                      Học viên
                    </th>
                    {data.quizzes.map((q, qi) => (
                      <th
                        key={q.id}
                        className={`px-2 py-3.5 text-center min-w-[110px] ${
                          qi === data.quizzes.length - 1 ? "rounded-tr-3xl" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold line-clamp-1 px-1" style={{ color: C.ink }}>{q.title}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#EAF1FC", color: C.blue }}>
                          Qua: {q.pass_score}%
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((student, si) => (
                    <tr
                      key={student.user.id}
                      className={`border-b transition-colors hover:bg-[#F4F8FE] ${
                        si === data.students.length - 1 ? "last:border-0" : ""
                      }`}
                      style={{ borderColor: "#EEF2F9" }}
                    >
                      <td className="px-5 py-3 sticky left-0 bg-white">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.user.name} avatar={student.user.avatar} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: C.ink }}>{student.user.name}</p>
                            <p className="text-[10px] truncate" style={{ color: C.inkFaint }}>{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      {data.quizzes.map((q) => {
                        const s = student.scores.find((sc) => sc.quiz_id === q.id);
                        return (
                          <td key={q.id} className="px-2 py-3">
                            <ScoreCell score={s?.score ?? null} isPassed={s?.is_passed ?? null} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function quizzes_empty(data: PerformanceData) {
  return data.quizzes.length === 0 || data.students.length === 0;
}
