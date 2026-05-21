"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
      <div className="w-full h-10 rounded-lg bg-[#f0f2f5] flex items-center justify-center">
        <span className="text-xs text-[rgba(4,14,32,0.3)]">—</span>
      </div>
    );
  }

  const bg =
    isPassed === true ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    score >= 50        ? "bg-amber-50 text-amber-700 border-amber-200" :
                         "bg-red-50 text-red-600 border-red-200";

  return (
    <div className={`w-full h-10 rounded-lg border flex items-center justify-center ${bg}`}>
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) return <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-[#1b61c9]/12 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function PerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usePerformance(id);

  if (isLoading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { course, quizzes, students } = data;

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teacher/courses/${id}/students`}
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26]">Hiệu suất quiz</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{course.title}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-[rgba(4,14,32,0.55)]">Đạt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span className="text-[rgba(4,14,32,0.55)]">Chưa đạt (≥50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-[rgba(4,14,32,0.55)]">Yếu (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#f0f2f5]" />
          <span className="text-[rgba(4,14,32,0.55)]">Chưa làm</span>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e0e2e6] py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-[rgba(4,14,32,0.45)]">Khóa học này chưa có quiz nào.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e0e2e6] py-16 flex flex-col items-center gap-3">
          <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có học viên nào đăng ký.</p>
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] overflow-auto"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 16px" }}
        >
          <table className="w-full text-sm border-collapse" style={{ minWidth: `${200 + quizzes.length * 100}px` }}>
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[rgba(4,14,32,0.55)] sticky left-0 bg-white w-48 min-w-[180px]">
                  Học viên
                </th>
                {quizzes.map((q) => (
                  <th key={q.id} className="px-2 py-3 text-center min-w-[96px]">
                    <p className="text-xs font-semibold text-[#181d26] line-clamp-1">{q.title}</p>
                    <p className="text-[10px] text-[rgba(4,14,32,0.35)] mt-0.5 font-normal">Qua: {q.pass_score}%</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.user.id} className="border-b border-[#f8fafc] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white hover:bg-[#fafbfc]">
                    <div className="flex items-center gap-2">
                      <Avatar name={student.user.name} avatar={student.user.avatar} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#181d26] truncate">{student.user.name}</p>
                        <p className="text-[10px] text-[rgba(4,14,32,0.4)] truncate">{student.user.email}</p>
                      </div>
                    </div>
                  </td>
                  {quizzes.map((q) => {
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
      )}
    </div>
  );
}
