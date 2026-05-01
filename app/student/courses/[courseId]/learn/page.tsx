"use client";

import { use, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import {
  useCourseDetail,
  useCourseProgress,
  useMarkLessonComplete,
  useQuizDetail,
  useQuizAttempts,
  useSubmitQuizAttempt,
  Chapter,
  Lesson,
  QuizSummary,
  QuizQuestion,
} from "./learn.hook";

type NavItem =
  | { kind: "lesson"; item: Lesson }
  | { kind: "quiz"; item: QuizSummary };

// ── Helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/youtube\.com\/embed\/([^?&]+)/);
  return m ? m[1] : null;
}

function chapterNavItems(chapter: Chapter): NavItem[] {
  const result: NavItem[] = [];
  for (const lesson of chapter.lessons) {
    result.push({ kind: "lesson", item: lesson });
    if (lesson.quiz && lesson.quiz.length > 0) {
      result.push({ kind: "quiz", item: lesson.quiz[0] });
    }
  }
  return result;
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function ChapterItem({
  chapter,
  completedIds,
  selectedId,
  onSelectLesson,
  onSelectQuiz,
}: {
  chapter: Chapter;
  completedIds: Set<string>;
  selectedId: string | null;
  onSelectLesson: (lesson: Lesson) => void;
  onSelectQuiz: (quiz: QuizSummary) => void;
}) {
  const [open, setOpen] = useState(true);
  const doneCount = chapter.lessons.filter((l) => completedIds.has(l.id)).length;
  const items = chapterNavItems(chapter);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f0f4fc] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#181d26] leading-snug line-clamp-2 tracking-[0.07px]">
            {chapter.title}
          </p>
          <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
            {doneCount}/{chapter.lessons.length} bài
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 ml-2 text-[rgba(4,14,32,0.35)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="pb-1">
          {items.map((navItem) => {
            const id = navItem.item.id;
            const active = id === selectedId;

            if (navItem.kind === "lesson") {
              const lesson = navItem.item;
              const done = completedIds.has(lesson.id);
              return (
                <li key={`lesson-${id}`}>
                  <button
                    onClick={() => onSelectLesson(lesson)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      active ? "bg-[#1b61c9]/8 border-r-2 border-[#1b61c9]" : "hover:bg-[#f8fafc]"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {done ? (
                        <div className="w-4 h-4 rounded-full bg-[#006400] flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded-full border-2 ${active ? "border-[#1b61c9]" : "border-[#d0d5dd]"}`} />
                      )}
                    </div>
                    <span className={`text-sm leading-snug tracking-[0.07px] line-clamp-2 ${
                      active ? "text-[#1b61c9] font-medium" : done ? "text-[rgba(4,14,32,0.55)]" : "text-[#181d26]"
                    }`}>
                      {lesson.title}
                    </span>
                  </button>
                </li>
              );
            }

            // Quiz item
            const quiz = navItem.item;
            return (
              <li key={`quiz-${id}`}>
                <button
                  onClick={() => onSelectQuiz(quiz)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 pl-11 text-left transition-colors ${
                    active ? "bg-[#f5f0ff] border-r-2 border-[#7c3aed]" : "hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      active ? "bg-[#7c3aed]" : "bg-[#ede9fe]"
                    }`}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                        stroke={active ? "white" : "#7c3aed"} strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                  </div>
                  <span className={`text-sm leading-snug tracking-[0.07px] line-clamp-2 ${
                    active ? "text-[#7c3aed] font-medium" : "text-[rgba(4,14,32,0.65)]"
                  }`}>
                    {quiz.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Video Player ───────────────────────────────────────────────────────────

function VideoPlayer({ url }: { url: string }) {
  const ytId = extractYouTubeId(url);

  if (ytId) {
    return (
      <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: "62%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title="Video bài học"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: "62%" }}>
      <video src={url} controls className="absolute inset-0 w-full h-full" />
    </div>
  );
}

// ── PDF Viewer ─────────────────────────────────────────────────────────────

function PdfViewer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 border border-[#e0e2e6] bg-white hover:bg-[#f8fafc] transition-colors group ${open ? "rounded-t-xl border-b-0" : "rounded-xl"}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#181d26] tracking-[0.07px]">Tài liệu bài học</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={url} target="_blank" rel="noopener noreferrer" download
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1b61c9]/8"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Tải xuống
          </a>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[rgba(4,14,32,0.35)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="rounded-b-xl overflow-hidden border border-[#e0e2e6] bg-[#f8fafc]">
          <iframe src={url} title="Tài liệu PDF" className="w-full" style={{ height: "720px" }} />
        </div>
      )}
    </div>
  );
}

// ── No Video Placeholder ───────────────────────────────────────────────────

function NoVideoPlaceholder({ content }: { content?: string | null }) {
  return (
    <div className="w-full aspect-video bg-[#f0f4fc] rounded-xl flex flex-col items-center justify-center gap-4 border border-[#e0e2e6]">
      <div className="w-14 h-14 bg-[#1b61c9]/10 rounded-2xl flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <p className="text-[rgba(4,14,32,0.55)] text-sm">Bài học này chưa có video</p>
      {content && <p className="text-[#181d26] text-sm max-w-md text-center px-4">{content}</p>}
    </div>
  );
}

// ── Quiz Question ──────────────────────────────────────────────────────────

function QuestionItem({
  question,
  answer,
  onChange,
  submitted,
  correctAnswer,
}: {
  question: QuizQuestion;
  answer: string;
  onChange: (val: string) => void;
  submitted: boolean;
  correctAnswer?: string;
}) {
  const isCorrect = submitted && answer !== "" && answer.toLowerCase() === correctAnswer?.toLowerCase();
  const isWrong = submitted && answer !== "" && !isCorrect && question.type !== "SHORT_ANSWER";

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      submitted && question.type !== "SHORT_ANSWER"
        ? isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
        : "border-[#e0e2e6] bg-white"
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 w-6 h-6 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-semibold flex items-center justify-center mt-0.5">
          {question.order}
        </span>
        <p className="text-sm font-medium text-[#181d26] leading-relaxed">{question.content}</p>
      </div>

      {(question.type === "MCQ" || question.type === "TRUE_FALSE") && (
        <div className="flex flex-col gap-2 pl-9">
          {question.options.map((opt) => {
            const selected = answer === opt.content;
            const isOptCorrect = submitted && opt.content.toLowerCase() === correctAnswer?.toLowerCase();
            const isOptWrong = submitted && selected && !isOptCorrect;
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  submitted
                    ? isOptCorrect
                      ? "border-green-300 bg-green-50 text-green-800"
                      : isOptWrong
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-[#e0e2e6] text-[rgba(4,14,32,0.55)]"
                    : selected
                      ? "border-[#7c3aed] bg-[#f5f0ff]"
                      : "border-[#e0e2e6] hover:border-[#7c3aed]/40 hover:bg-[#faf8ff]"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.content}
                  checked={selected}
                  disabled={submitted}
                  onChange={() => onChange(opt.content)}
                  className="accent-[#7c3aed]"
                />
                <span className="text-sm">{opt.content}</span>
                {submitted && isOptCorrect && (
                  <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isOptWrong && (
                  <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <div className="pl-9">
          <textarea
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            disabled={submitted}
            placeholder="Nhập câu trả lời..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 resize-none disabled:bg-[#f8fafc] disabled:text-[rgba(4,14,32,0.55)]"
          />
          {submitted && (
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1.5">Câu trả lời tự luận sẽ được giáo viên chấm điểm</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Quiz View ──────────────────────────────────────────────────────────────

function QuizView({ quizId }: { quizId: string }) {
  const { data: quiz, isLoading } = useQuizDetail(quizId);
  const { data: attempts } = useQuizAttempts(quizId);
  const submit = useSubmitQuizAttempt(quizId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showingResult, setShowingResult] = useState(false);

  const lastAttempt = attempts?.[0] ?? null;

  const handleSubmit = () => {
    if (!quiz) return;
    const payload = quiz.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? "",
    }));
    submit.mutate(payload, {
      onSuccess: () => {
        setSubmitted(true);
        setShowingResult(true);
      },
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setShowingResult(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  const correctAnswerMap = new Map(
    quiz.questions.map((q) => [
      q.id,
      q.options.find((o) => o.is_correct)?.content ?? "",
    ])
  );

  const attemptToShow = showingResult ? submit.data?.data?.attempt : lastAttempt;
  const answerMap = new Map(attemptToShow?.answers.map((a: { question_id: string; answer: string }) => [a.question_id, a.answer]) ?? []);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-xl bg-[#f5f0ff] border border-[#e9d8fd] px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7c3aed] mb-1">Bài tập</p>
          <h2 className="text-lg font-semibold text-[#181d26]">{quiz.title}</h2>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs text-[rgba(4,14,32,0.55)]">{quiz.questions.length} câu hỏi</span>
            <span className="text-xs text-[rgba(4,14,32,0.55)]">Điểm qua: {quiz.pass_score}%</span>
            {quiz.time_limit && (
              <span className="text-xs text-[rgba(4,14,32,0.55)]">{quiz.time_limit} phút</span>
            )}
          </div>
        </div>
      </div>

      {/* Last attempt result (not current submission) */}
      {lastAttempt && !showingResult && (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
          lastAttempt.is_passed ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              lastAttempt.is_passed ? "bg-green-100" : "bg-amber-100"
            }`}>
              {lastAttempt.is_passed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${lastAttempt.is_passed ? "text-green-800" : "text-amber-800"}`}>
                {lastAttempt.is_passed ? "Đã vượt qua" : "Chưa đạt"}
                {lastAttempt.score !== null && ` — ${lastAttempt.score}%`}
              </p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
                Lần làm gần nhất: {new Date(lastAttempt.submitted_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="shrink-0 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] px-3 py-1.5 rounded-lg hover:bg-[#7c3aed]/8 transition-colors"
          >
            Làm lại
          </button>
        </div>
      )}

      {/* Score result after submit */}
      {showingResult && submit.data?.data?.attempt && (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
          submit.data.data.attempt.is_passed ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              submit.data.data.attempt.is_passed ? "bg-green-100" : "bg-amber-100"
            }`}>
              {submit.data.data.attempt.is_passed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${submit.data.data.attempt.is_passed ? "text-green-800" : "text-amber-800"}`}>
                {submit.data.data.attempt.is_passed ? "Vượt qua!" : "Chưa đạt"}
                {submit.data.data.attempt.score !== null && ` — ${submit.data.data.attempt.score}%`}
              </p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">Cần {quiz.pass_score}% để qua</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="shrink-0 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9] px-3 py-1.5 rounded-lg hover:bg-[#7c3aed]/8 transition-colors"
          >
            Làm lại
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-3">
        {quiz.questions.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={showingResult ? (answerMap.get(q.id) ?? "") : (answers[q.id] ?? "")}
            onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            submitted={showingResult}
            correctAnswer={correctAnswerMap.get(q.id)}
          />
        ))}
      </div>

      {/* Submit */}
      {!showingResult && (
        <button
          onClick={handleSubmit}
          disabled={submit.isPending}
          className="self-start flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors disabled:opacity-60"
          style={{ boxShadow: "rgba(0,0,0,0.2) 0px 0px 1px, rgba(124,58,237,0.3) 0px 1px 3px" }}
        >
          {submit.isPending ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          Nộp bài
        </button>
      )}
    </div>
  );
}

// ── Nav Controls ───────────────────────────────────────────────────────────

function NavControls({
  title,
  prevItem,
  nextItem,
  isLesson,
  isCurrentDone,
  isPending,
  onPrev,
  onNext,
  onMarkComplete,
}: {
  title: string;
  prevItem: NavItem | null;
  nextItem: NavItem | null;
  isLesson: boolean;
  isCurrentDone: boolean;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
}) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold text-[#181d26] tracking-[0.1px] leading-snug mb-4">
        {title}
      </h1>
      <div className="flex items-center gap-3 pb-4 border-b border-[#e0e2e6]">
        <button
          onClick={onPrev}
          disabled={!prevItem}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#e0e2e6] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Bài trước
        </button>

        {isLesson && !isCurrentDone && (
          <button
            onClick={onMarkComplete}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-60"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
          >
            {isPending ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {nextItem ? "Hoàn thành & Tiếp theo" : "Hoàn thành khóa học"}
          </button>
        )}

        {isLesson && isCurrentDone && (
          <div className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#006400] border border-[#bbf7d0] rounded-full px-3 py-1.5 text-sm font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã hoàn thành
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onNext}
          disabled={!nextItem || (isLesson && !isCurrentDone)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#e0e2e6] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Bài sau
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: user } = useMe();
  const { data: course, isLoading: courseLoading } = useCourseDetail(courseId);
  const { data: progress } = useCourseProgress(courseId);
  const markComplete = useMarkLessonComplete(courseId);

  const allNavItems: NavItem[] = course?.sections.flatMap(chapterNavItems) ?? [];

  const lessonIdFromUrl = searchParams.get("lesson");
  const quizIdFromUrl = searchParams.get("quiz");

  const selectedItem: NavItem | null = (() => {
    if (quizIdFromUrl) {
      const found = allNavItems.find((n) => n.kind === "quiz" && n.item.id === quizIdFromUrl);
      if (found) return found;
    }
    const lessonId = lessonIdFromUrl ?? progress?.current_lesson_id ?? null;
    const found = allNavItems.find((n) => n.kind === "lesson" && n.item.id === lessonId);
    return found ?? allNavItems[0] ?? null;
  })();

  const selectedIdx = selectedItem
    ? allNavItems.findIndex((n) => n.item.id === selectedItem.item.id)
    : -1;
  const prevItem = selectedIdx > 0 ? allNavItems[selectedIdx - 1] : null;
  const nextItem = selectedIdx < allNavItems.length - 1 ? allNavItems[selectedIdx + 1] : null;

  const completedIds = new Set(progress?.completed_lesson_ids ?? []);
  const isLesson = selectedItem?.kind === "lesson";
  const isCurrentDone = isLesson && selectedItem ? completedIds.has(selectedItem.item.id) : false;

  const navigateToItem = useCallback(
    (navItem: NavItem) => {
      if (navItem.kind === "lesson") {
        router.push(`/student/courses/${courseId}/learn?lesson=${navItem.item.id}`);
      } else {
        router.push(`/student/courses/${courseId}/learn?quiz=${navItem.item.id}`);
      }
    },
    [courseId, router]
  );

  const handleMarkComplete = () => {
    if (!selectedItem || selectedItem.kind !== "lesson" || isCurrentDone) return;
    markComplete.mutate(selectedItem.item.id, {
      onSuccess: () => {
        if (nextItem) navigateToItem(nextItem);
      },
    });
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-[rgba(4,14,32,0.55)]">Không tìm thấy khóa học</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-20">
        <div className="h-14 px-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo size={28} />
            <span className="font-semibold text-[#1b61c9] text-sm hidden sm:block tracking-tight">SmartEdu</span>
          </Link>

          <div className="w-px h-5 bg-[#e0e2e6] hidden sm:block" />

          <p className="text-sm font-medium text-[#181d26] truncate flex-1 tracking-[0.07px]">
            {course.title}
          </p>

          {progress && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="w-24 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1b61c9] rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-xs text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
                {progress.percentage}%
              </span>
            </div>
          )}

          <UserMenu user={user ?? null} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-white border-r border-[#e0e2e6] overflow-y-auto hidden lg:block">
          <div className="px-4 py-4 border-b border-[#e0e2e6]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(4,14,32,0.45)]">
              Nội dung khóa học
            </p>
            {progress && (
              <p className="text-xs text-[rgba(4,14,32,0.55)] mt-1">
                {progress.completed_lessons}/{progress.total_lessons} bài đã hoàn thành
              </p>
            )}
          </div>

          {course.sections.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              completedIds={completedIds}
              selectedId={selectedItem?.item.id ?? null}
              onSelectLesson={(lesson) => navigateToItem({ kind: "lesson", item: lesson })}
              onSelectQuiz={(quiz) => navigateToItem({ kind: "quiz", item: quiz })}
            />
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {selectedItem ? (
              <>
                <NavControls
                  title={selectedItem.item.title}
                  prevItem={prevItem}
                  nextItem={nextItem}
                  isLesson={isLesson}
                  isCurrentDone={isCurrentDone}
                  isPending={markComplete.isPending}
                  onPrev={() => prevItem && navigateToItem(prevItem)}
                  onNext={() => nextItem && navigateToItem(nextItem)}
                  onMarkComplete={handleMarkComplete}
                />

                {selectedItem.kind === "lesson" ? (
                  <>
                    {selectedItem.item.video_url ? (
                      <VideoPlayer url={selectedItem.item.video_url} />
                    ) : (
                      <NoVideoPlaceholder content={selectedItem.item.content} />
                    )}

                    {selectedItem.item.pdf_url && (
                      <PdfViewer url={selectedItem.item.pdf_url} />
                    )}

                    {selectedItem.item.content && selectedItem.item.video_url && (
                      <div className="mt-5">
                        <p className="text-sm text-[rgba(4,14,32,0.55)] leading-relaxed tracking-[0.07px]">
                          {selectedItem.item.content}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <QuizView quizId={selectedItem.item.id} />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 bg-[#1b61c9]/8 rounded-2xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <p className="text-[rgba(4,14,32,0.55)] text-sm">Chọn một bài học để bắt đầu</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
