"use client";

import { use, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import { MainNavbar } from "@/app/_components/MainNavbar";
import {
  ChevronDown, ChevronRight, ChevronLeft,
  Users, BookOpen, ClipboardList, CheckCircle2, XCircle, Clock, Lock,
  Trophy, BarChart3, X,
} from "lucide-react";
import { useStudentsProgress, StudentProgress, QuizResult, LessonDetail } from "./students.hook";

// ── Palette (đồng bộ teacher/home) ─────────────────────────────────────────────
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
      <div className="flex-1 h-1.5 bg-[#E2ECF9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-[rgba(4,14,32,0.55)] w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Lesson detail row ─────────────────────────────────────────────────────────

function LessonDetailRow({ lesson }: { lesson: LessonDetail }) {
  const watchColor =
    lesson.watch_percent >= 80 ? "bg-emerald-500" :
    lesson.watch_percent > 0   ? "bg-[#1b61c9]"  :
                                  "bg-[#E2ECF9]";
  return (
    <div className="flex items-center gap-4 py-2.5 px-4 rounded-xl hover:bg-[#F4F8FE]">
      <div className="shrink-0">
        {lesson.is_completed ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : lesson.watch_percent > 0 ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#1b61c9] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1b61c9]" />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-[#DCE6F4]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{lesson.lesson_title}</p>
        <p className="text-xs text-[rgba(4,14,32,0.4)] truncate">{lesson.chapter_title}</p>
      </div>
      <div className="w-36 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#E2ECF9] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${watchColor}`} style={{ width: `${lesson.watch_percent}%` }} />
          </div>
          <span className="text-xs font-semibold text-[rgba(4,14,32,0.55)] w-8 text-right">
            {lesson.watch_percent}%
          </span>
        </div>
      </div>
      <span className="text-xs text-[rgba(4,14,32,0.4)] w-28 text-right shrink-0">
        {lesson.last_watched_at ? timeAgo(lesson.last_watched_at) : "Chưa xem"}
      </span>
    </div>
  );
}

// ── Quiz detail row (inside expanded student) ─────────────────────────────────

function QuizRow({ q }: { q: QuizResult }) {
  const noAttempt = q.attempts === 0;

  return (
    <div className="flex items-center gap-4 py-2.5 px-4 rounded-xl hover:bg-[#F4F8FE]">
      {/* Status icon */}
      <div className="shrink-0">
        {noAttempt ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#DCE6F4]" />
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

      {/* Điểm cao nhất */}
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
            {q.best_score !== null && (
              <span className="text-xs text-[rgba(4,14,32,0.4)]">/100</span>
            )}
          </>
        )}
      </div>

      {/* Điểm qua bài */}
      <div className="w-24 text-right shrink-0">
        <span className="text-sm font-semibold text-[rgba(4,14,32,0.55)]">{q.pass_score}</span>
        <span className="text-xs text-[rgba(4,14,32,0.4)]">/100</span>
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
  const [tab, setTab] = useState<"lessons" | "quizzes">("lessons");

  return (
    <>
      {/* Main row */}
      <tr
        className="hover:bg-[#F4F8FE] cursor-pointer transition-colors"
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

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 pb-3 pt-0 bg-[#F4F8FE]">
            <div className="border border-[#DCE6F4] rounded-xl overflow-hidden bg-white">
              {/* Tab bar */}
              <div className="flex border-b border-[#DCE6F4] bg-[#F4F8FE]" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setTab("lessons")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
                    tab === "lessons"
                      ? "text-[#1b61c9] border-[#1b61c9]"
                      : "text-[rgba(4,14,32,0.45)] border-transparent hover:text-[#181d26]"
                  }`}
                >
                  <BookOpen size={12} />
                  Tiến độ bài học
                </button>
                <button
                  onClick={() => setTab("quizzes")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
                    tab === "quizzes"
                      ? "text-[#7c3aed] border-[#7c3aed]"
                      : "text-[rgba(4,14,32,0.45)] border-transparent hover:text-[#181d26]"
                  }`}
                >
                  <ClipboardList size={12} />
                  Bài kiểm tra
                  {student.quiz_total > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#EAF1FC] text-[rgba(4,14,32,0.55)] text-[10px]">
                      {student.quiz_total}
                    </span>
                  )}
                </button>
              </div>

              {/* Lessons tab */}
              {tab === "lessons" && (
                <>
                  <div className="flex items-center gap-4 px-4 py-2 bg-[#F4F8FE] border-b border-[#DCE6F4]">
                    <div className="w-4 shrink-0" />
                    <p className="flex-1 text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">Bài học</p>
                    <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-36">Đã xem</p>
                    <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-28 text-right">Xem lần cuối</p>
                  </div>
                  {student.lessons_detail.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[rgba(4,14,32,0.4)]">Chưa có bài học nào.</p>
                  ) : (
                    student.lessons_detail.map((l) => <LessonDetailRow key={l.lesson_id} lesson={l} />)
                  )}
                </>
              )}

              {/* Quizzes tab */}
              {tab === "quizzes" && (
                <>
                  {student.quizzes.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[rgba(4,14,32,0.4)]">Khóa học này chưa có bài kiểm tra nào.</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 px-4 py-2 bg-[#F4F8FE] border-b border-[#DCE6F4]">
                        <div className="w-5 shrink-0" />
                        <p className="flex-1 text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">Bài kiểm tra</p>
                        <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-20 text-center">Số lần thi</p>
                        <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-24 text-right">Điểm cao nhất</p>
                        <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-24 text-right">Điểm qua bài</p>
                        <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider w-28 text-right">Lần thi cuối</p>
                      </div>
                      {student.quizzes.map((q) => <QuizRow key={q.quiz_id} q={q} />)}
                    </>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, tint, fg,
}: {
  label: string; value: string; icon: React.ElementType; tint: string; fg: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
      style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint, color: fg }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-display text-xl font-bold" style={{ color: C.ink }}>{value}</p>
        <p className="text-sm" style={{ color: C.inkSoft }}>{label}</p>
      </div>
    </div>
  );
}

// ── Stuck-lesson analysis modal ───────────────────────────────────────────────

type StuckRow = { lesson_id: string; lesson_title: string; chapter_title: string; count: number };

function StuckAnalysisModal({
  rows, inProgress, notStarted, onClose,
}: {
  rows: StuckRow[]; inProgress: number; notStarted: number; onClose: () => void;
}) {
  const max = rows.length > 0 ? rows[0].count : 0;
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#EEF2F9]">
          <div>
            <h3 className="text-base font-semibold text-[#181d26]">Học viên dừng ở đâu?</h3>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
              {inProgress} học viên đang học dở, theo bài xa nhất đã học
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F8FE] text-[rgba(4,14,32,0.45)]">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 space-y-3.5">
          {rows.length === 0 ? (
            <p className="text-sm text-[rgba(4,14,32,0.45)] py-6 text-center">
              {notStarted > 0
                ? "Chưa có học viên nào bắt đầu học."
                : "Tất cả học viên đã hoàn thành khóa học. 🎉"}
            </p>
          ) : (
            rows.map((r, i) => (
              <div key={r.lesson_id}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#181d26] truncate">{r.lesson_title}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.4)] truncate">{r.chapter_title}</p>
                  </div>
                  <span className="text-sm font-bold text-[#181d26] shrink-0">{r.count}</span>
                </div>
                <div className="h-2 bg-[#E2ECF9] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-amber-500" : "bg-[#1b61c9]"}`}
                    style={{ width: `${max > 0 ? (r.count / max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
          {notStarted > 0 && (
            <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-[#EEF2F9]">
              <p className="text-sm text-[rgba(4,14,32,0.55)]">Chưa bắt đầu</p>
              <span className="text-sm font-bold text-[rgba(4,14,32,0.55)] shrink-0">{notStarted}</span>
            </div>
          )}
        </div>
      </div>
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
          <div className="h-6 w-48 rounded-lg" style={{ background: "#E2ECF9" }} />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl" style={{ background: "#EAF1FC" }} />)}
          </div>
          <div className="h-96 rounded-3xl" style={{ background: "#EAF1FC" }} />
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useStudentsProgress(id);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showStuck, setShowStuck] = useState(false);
  const pathname = usePathname();

  const tabs = [
    { label: "Tiến độ học viên", href: `/teacher/courses/${id}/students` },
    { label: "Hiệu suất quiz",   href: `/teacher/courses/${id}/performance` },
    { label: "Mức độ tương tác", href: `/teacher/courses/${id}/engagement` },
  ];

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
  const completedCount = students.filter((u) => u.completion_pct >= 100).length;

  // Điểm dừng = bài XA NHẤT học viên đã chạm tới (theo thứ tự khóa học).
  // Bỏ qua học viên chưa hoàn thành nhưng đã bắt đầu = đang học dở; đếm riêng nhóm chưa bắt đầu.
  const { rows: stuckRows, inProgress: stuckTotal, notStarted } = (() => {
    const map = new Map<string, StuckRow>();
    let inProgress = 0;
    let notStarted = 0;
    const touched = (l: LessonDetail) => l.is_completed || l.watch_percent > 0 || l.last_watched_at != null;
    for (const u of students) {
      if (u.completion_pct >= 100) continue;
      // lessons_detail đã theo thứ tự khóa học → bài chạm cuối cùng là điểm xa nhất.
      let furthest: LessonDetail | undefined;
      for (const l of u.lessons_detail) if (touched(l)) furthest = l;
      if (!furthest) { notStarted++; continue; }
      inProgress++;
      const cur = map.get(furthest.lesson_id);
      if (cur) cur.count++;
      else map.set(furthest.lesson_id, {
        lesson_id: furthest.lesson_id, lesson_title: furthest.lesson_title,
        chapter_title: furthest.chapter_title, count: 1,
      });
    }
    return { rows: [...map.values()].sort((a, b) => b.count - a.count), inProgress, notStarted };
  })();

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Khóa học",        href: "/teacher/courses" },
          { label: data?.course?.title ?? "…", href: `/teacher/courses/${id}/edit` },
          { label: "Tiến độ học viên" },
        ]} />
        <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Tiến độ học viên</h1>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: C.border }}>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Tổng học viên"
          value={String(students.length)}
          icon={Users}
          tint="rgba(27,97,201,0.10)" fg={C.blue}
        />
        <SummaryCard
          label="Hoàn thành khóa học"
          value={String(completedCount)}
          icon={Trophy}
          tint="rgba(124,92,252,0.12)" fg={C.violet}
        />
        <SummaryCard
          label="Hoàn thành trung bình"
          value={`${avgCompletion}%`}
          icon={BookOpen}
          tint="rgba(14,159,110,0.12)" fg={C.emerald}
        />
        <SummaryCard
          label="Tỉ lệ qua quiz"
          value={(data?.total_quizzes ?? 0) === 0 ? "—" : `${avgQuizPass}%`}
          icon={ClipboardList}
          tint="rgba(124,92,252,0.12)" fg={C.violet}
        />
      </div>

      {/* Stuck-lesson analysis trigger */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowStuck(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1b61c9] bg-[#1b61c9]/8 rounded-xl hover:bg-[#1b61c9]/14 transition-colors"
          >
            <BarChart3 size={16} />
            Phân tích điểm dừng
          </button>
        </div>
      )}

      {/* Student table */}
      <div
        className="bg-white rounded-3xl overflow-hidden"
        style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
      >
        {students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có học viên nào đăng ký.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EEF2F9] bg-[#F4F8FE]">
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
              <tbody className="divide-y divide-[#EEF2F9]">
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
          </div>
        )}
      </div>

      {showStuck && (
        <StuckAnalysisModal
          rows={stuckRows}
          inProgress={stuckTotal}
          notStarted={notStarted}
          onClose={() => setShowStuck(false)}
        />
      )}
      </main>
    </div>
  );
}
