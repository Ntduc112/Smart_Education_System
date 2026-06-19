"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, ClipboardX, ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import api from "@/lib/axios";

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
      <div className="w-full h-9 rounded-lg bg-[#f4f5f7] flex items-center justify-center">
        <span className="text-xs text-[rgba(4,14,32,0.25)]">—</span>
      </div>
    );
  }

  const style =
    isPassed === true
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : score >= 50
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-red-50 text-red-600 border border-red-200";

  return (
    <div className={`w-full h-9 rounded-lg flex items-center justify-center ${style}`}>
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar)
    return <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-[#1b61c9]/12 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

const CARD_SHADOW = "rgba(15,48,106,0.06) 0px 0px 0px 1px, rgba(15,48,106,0.04) 0px 4px 16px";

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
    <div className="px-8 py-8 space-y-6">
      {/* ── Header ── */}
      <div>
        <Breadcrumb items={[
          { label: "Khóa học",     href: "/teacher/courses" },
          { label: data?.course.title ?? "…", href: `/teacher/courses/${id}/edit` },
          { label: "Hiệu suất quiz" },
        ]} />
        <h1 className="text-2xl font-semibold text-[#181d26]">Hiệu suất quiz</h1>
      </div>

      {/* ── Tab nav ── */}
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
      ) : !data || quizzes_empty(data) ? (
        /* ── Empty state ── */
        <div
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#f0f4fb] flex items-center justify-center">
            <ClipboardX size={24} className="text-[#1b61c9]/50" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#181d26]">Chưa có dữ liệu quiz</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1">
              Khóa học này chưa có quiz nào hoặc chưa có học viên nào làm bài.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Học viên",   value: totalStudents,           color: "text-[#181d26]" },
              { label: "Bài quiz",   value: totalQuizzes,            color: "text-[#181d26]" },
              { label: "Tỷ lệ đạt", value: passRate !== null ? `${passRate}%` : "—", color: passRate !== null && passRate >= 70 ? "text-emerald-600" : "text-amber-600" },
              { label: "Legend",     value: null,                    color: "" },
            ].map((item, i) =>
              item.value === null ? (
                /* Legend card */
                <div
                  key={i}
                  className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-2.5"
                  style={{ boxShadow: CARD_SHADOW }}
                >
                  <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">Chú thích</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { bg: "bg-emerald-50 border-emerald-200", label: "Đạt" },
                      { bg: "bg-amber-50 border-amber-200",     label: "Chưa đạt (≥50%)" },
                      { bg: "bg-red-50 border-red-200",         label: "Yếu (<50%)" },
                      { bg: "bg-[#f4f5f7]",                     label: "Chưa làm" },
                    ].map(({ bg, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${bg} shrink-0`} />
                        <span className="text-xs text-[rgba(4,14,32,0.55)]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  key={i}
                  className="bg-white rounded-2xl px-5 py-4 flex flex-col justify-between"
                  style={{ boxShadow: CARD_SHADOW }}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#f0f4fb] flex items-center justify-center">
                    <BarChart2 size={15} className="text-[#1b61c9]" strokeWidth={2} />
                  </div>
                  <div className="mt-3">
                    <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.5)] mt-0.5">{item.label}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* ── Heatmap table ── */}
          <div
            className="bg-white rounded-2xl overflow-auto"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <table
              className="w-full text-sm border-collapse"
              style={{ minWidth: `${220 + data.quizzes.length * 110}px` }}
            >
              <thead>
                <tr className="border-b border-[#f0f2f5] bg-[#f8fafc]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[rgba(4,14,32,0.55)] sticky left-0 bg-[#f8fafc] w-52 min-w-[200px] rounded-tl-2xl">
                    Học viên
                  </th>
                  {data.quizzes.map((q, qi) => (
                    <th
                      key={q.id}
                      className={`px-2 py-3.5 text-center min-w-[110px] ${
                        qi === data.quizzes.length - 1 ? "rounded-tr-2xl" : ""
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#181d26] line-clamp-1 px-1">{q.title}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e8edf8] text-[#1b61c9]">
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
                    className={`border-b border-[#f4f5f7] hover:bg-[#fafbfc] transition-colors ${
                      si === data.students.length - 1 ? "last:border-0" : ""
                    }`}
                  >
                    <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-[#fafbfc]">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.user.name} avatar={student.user.avatar} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#181d26] truncate">{student.user.name}</p>
                          <p className="text-[10px] text-[rgba(4,14,32,0.4)] truncate">{student.user.email}</p>
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
    </div>
  );
}

function quizzes_empty(data: PerformanceData) {
  return data.quizzes.length === 0 || data.students.length === 0;
}
