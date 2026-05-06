"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronRight,
  Users, BookOpen, ClipboardList, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { useStudentsProgress, StudentProgress, QuizResult } from "./students.hook";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Chưa học";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return "Vừa xong";
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function Avatar({ name, avatar, size = 8 }: { name: string; avatar: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover shrink-0`;
  if (avatar) return <img src={avatar} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#1b61c9]/12 flex items-center justify-center shrink-0`}>
      <span className="text-xs font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "bg-emerald-500" :
    pct >= 40 ? "bg-[#1b61c9]"  :
                "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-[rgba(4,14,32,0.55)] w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Quiz detail row (inside expanded student) ─────────────────────────────────

function QuizRow({ q }: { q: QuizResult }) {
  const noAttempt = q.attempts === 0;

  return (
    <div className="flex items-center gap-4 py-2.5 px-4 rounded-xl hover:bg-[#f8fafc]">
      {/* Status icon */}
      <div className="shrink-0">
        {noAttempt ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#e0e2e6]" />
        ) : q.is_passed ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <XCircle size={18} className="text-red-400" />
        )}
      </div>

      {/* Quiz name + lesson */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{q.quiz_title}</p>
        <p className="text-xs text-[rgba(4,14,32,0.4)] truncate">{q.lesson_title}</p>
      </div>

      {/* Attempts */}
      <span className="text-xs text-[rgba(4,14,32,0.45)] w-20 text-center shrink-0">
        {noAttempt ? "—" : `${q.attempts} lần thi`}
      </span>

      {/* Score */}
      <div className="w-24 text-right shrink-0">
        {noAttempt ? (
          <span className="text-xs text-[rgba(4,14,32,0.35)]">Chưa làm</span>
        ) : (
          <>
            <span
              className={`text-sm font-bold ${
                q.is_passed ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {q.best_score !== null ? `${q.best_score}` : "—"}
            </span>
            <span className="text-xs text-[rgba(4,14,32,0.4)]">/{q.pass_score} qua</span>
          </>
        )}
      </div>

      {/* Last attempt */}
      <span className="text-xs text-[rgba(4,14,32,0.4)] w-28 text-right shrink-0">
        {q.last_attempt ? timeAgo(q.last_attempt) : "—"}
      </span>
    </div>
  );
}

// ── Student row ───────────────────────────────────────────────────────────────

function StudentRow({
  student,
  expanded,
  onToggle,
}: {
  student:  StudentProgress;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Main row */}
      <tr
        className="hover:bg-[#fafbfc] cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {/* Student */}
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={student.user.name} avatar={student.user.avatar} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#181d26] truncate">{student.user.name}</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{student.user.email}</p>
            </div>
          </div>
        </td>

        {/* Progress */}
        <td className="px-4 py-3.5 w-48">
          <ProgressBar pct={student.completion_pct} />
          <p className="text-xs text-[rgba(4,14,32,0.4)] mt-1">
            {student.completed_lessons}/{student.total_lessons} bài
          </p>
        </td>

        {/* Current lesson */}
        <td className="px-4 py-3.5 max-w-[200px]">
          <p className="text-xs text-[rgba(4,14,32,0.65)] truncate">
            {student.current_lesson ?? (student.completed_lessons === 0 ? "Chưa bắt đầu" : "Đã hoàn thành")}
          </p>
        </td>

        {/* Last active */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-[rgba(4,14,32,0.3)] shrink-0" />
            <span className="text-xs text-[rgba(4,14,32,0.55)]">
              {timeAgo(student.last_active_at)}
            </span>
          </div>
        </td>

        {/* Quiz */}
        <td className="px-4 py-3.5">
          {student.quiz_total === 0 ? (
            <span className="text-xs text-[rgba(4,14,32,0.35)]">Không có quiz</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-bold ${
                  student.quiz_passed === student.quiz_total
                    ? "text-emerald-600"
                    : student.quiz_passed > 0
                    ? "text-amber-500"
                    : "text-[rgba(4,14,32,0.45)]"
                }`}
              >
                {student.quiz_passed}
              </span>
              <span className="text-xs text-[rgba(4,14,32,0.4)]">/ {student.quiz_total} qua</span>
            </div>
          )}
        </td>

        {/* Expand chevron */}
        <td className="px-4 py-3.5 w-10">
          <div className="text-[rgba(4,14,32,0.35)]">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </td>
      </tr>

      {/* Expanded quiz detail */}
      {expanded && student.quizzes.length > 0 && (
        <tr>
          <td colSpan={6} className="px-6 pb-3 pt-0 bg-[#fafbfc]">
            <div className="border border-[#e0e2e6] rounded-xl overflow-hidden">
              {/* Quiz table header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f0f2f5] border-b border-[#e0e2e6]">
                <div className="w-5 shrink-0" />
                <p className="flex-1 text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                  Bài kiểm tra
                </p>
                <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-20 text-center">
                  Số lần thi
                </p>
                <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-24 text-right">
                  Điểm cao nhất
                </p>
                <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-28 text-right">
                  Lần thi cuối
                </p>
              </div>
              {student.quizzes.map((q) => (
                <QuizRow key={q.quiz_id} q={q} />
              ))}
            </div>
          </td>
        </tr>
      )}

      {expanded && student.quizzes.length === 0 && (
        <tr>
          <td colSpan={6} className="px-8 py-3 bg-[#fafbfc]">
            <p className="text-xs text-[rgba(4,14,32,0.4)]">Khóa học này chưa có bài kiểm tra nào.</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, iconCls,
}: {
  label: string; value: string; icon: React.ElementType; iconCls: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] px-5 py-4 flex items-center gap-4"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-[#181d26]">{value}</p>
        <p className="text-sm text-[rgba(4,14,32,0.55)]">{label}</p>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-96 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useStudentsProgress(id);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (uid: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  if (isLoading) return <Skeleton />;

  const students      = data?.students ?? [];
  const avgCompletion =
    students.length > 0
      ? Math.round(students.reduce((s, u) => s + u.completion_pct, 0) / students.length)
      : 0;
  const avgQuizPass =
    students.length > 0 && (data?.total_quizzes ?? 0) > 0
      ? Math.round(
          (students.reduce((s, u) => s + u.quiz_passed, 0) /
            (students.length * (data?.total_quizzes ?? 1))) *
            100
        )
      : 0;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/courses"
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26]">Tiến độ học viên</h1>
          {data?.course && (
            <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{data.course.title}</p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Tổng học viên"
          value={String(students.length)}
          icon={Users}
          iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
        />
        <SummaryCard
          label="Hoàn thành trung bình"
          value={`${avgCompletion}%`}
          icon={BookOpen}
          iconCls="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Tỉ lệ qua quiz"
          value={(data?.total_quizzes ?? 0) === 0 ? "—" : `${avgQuizPass}%`}
          icon={ClipboardList}
          iconCls="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Student table */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        {students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có học viên nào đăng ký.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f5] bg-[#f8fafc]">
                {["Học viên", "Tiến độ", "Đang học", "Hoạt động cuối", "Quiz", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider first:px-6"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {students.map((s) => (
                <StudentRow
                  key={s.user.id}
                  student={s}
                  expanded={expanded.has(s.user.id)}
                  onToggle={() => toggle(s.user.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
