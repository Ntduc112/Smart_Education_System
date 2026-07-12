"use client";

import { use, useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { BackButton } from "@/app/student/_components/BackButton";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import api from "@/lib/axios";
import {
  useCourseDetail,
  useCourseProgress,
  useReportWatchProgress,
  useQuizDetail,
  useQuizAttempts,
  useSubmitQuizAttempt,
  useRequestExtraQuizAttempt,
  useCourseCertificate,
  useIssueCertificate,
  Chapter,
  Lesson,
  QuizSummary,
  QuizQuestion,
} from "./learn.hook";
import { QASection } from "./_components/QASection";
import { NotesSection } from "./_components/NotesSection";
import { AIChatBox } from "./_components/AIChatBox";
import { AISummary } from "./_components/AISummary";
import { CodingQuestion } from "./_components/CodingQuestion";
import { CodeOutputQuestion } from "./_components/CodeOutputQuestion";
import { toast } from "sonner";
import { isExecutableQuestionType } from "@/lib/question-types";

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
  lockedIds,
  selectedId,
  onSelectLesson,
  onSelectQuiz,
}: {
  chapter: Chapter;
  completedIds: Set<string>;
  lockedIds: Set<string>;
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
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F4F8FE] transition-colors"
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
              const done   = completedIds.has(lesson.id);
              const locked = lockedIds.has(lesson.id);
              return (
                <li key={`lesson-${id}`}>
                  <button
                    onClick={() => !locked && onSelectLesson(lesson)}
                    title={locked ? "Hoàn thành bài trước để mở khóa" : undefined}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      locked
                        ? "opacity-50 cursor-not-allowed"
                        : active
                          ? "bg-[#1b61c9]/8 border-r-2 border-[#1b61c9]"
                          : "hover:bg-[#F4F8FE]"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {locked ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#d0d5dd] flex items-center justify-center">
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" className="text-[#9ca3af]">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                        </div>
                      ) : done ? (
                        <div className="w-4 h-4 rounded-full bg-[#0E9F6E] flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded-full border-2 ${active ? "border-[#1b61c9]" : "border-[#d0d5dd]"}`} />
                      )}
                    </div>
                    <span className={`text-sm leading-snug tracking-[0.07px] line-clamp-2 ${
                      locked
                        ? "text-[rgba(4,14,32,0.35)]"
                        : active
                          ? "text-[#1b61c9] font-medium"
                          : done
                            ? "text-[rgba(4,14,32,0.55)]"
                            : "text-[#181d26]"
                    }`}>
                      {lesson.title}
                    </span>
                  </button>
                </li>
              );
            }

            // Quiz item
            const quiz = navItem.item;
            const quizLocked = lockedIds.has(id);
            return (
              <li key={`quiz-${id}`}>
                <button
                  onClick={() => !quizLocked && onSelectQuiz(quiz)}
                  title={quizLocked ? "Hoàn thành bài trước để mở khóa" : undefined}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 pl-11 text-left transition-colors ${
                    quizLocked
                      ? "opacity-50 cursor-not-allowed"
                      : active ? "bg-[#f5f0ff] border-r-2 border-[#7c3aed]" : "hover:bg-[#F4F8FE]"
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

function CFWorkerPlayer({ lessonId, onWatchPercent, videoRef, startTime }: { lessonId: string; onWatchPercent: (pct: number, positionSec: number) => void; videoRef?: React.RefObject<HTMLVideoElement | null>; startTime?: number | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ token: string; workerUrl: string; videoKey: string }>(
      `/student/lessons/${lessonId}/video-token`
    ).then(({ data }) => {
      setSrc(`${data.workerUrl}/${data.videoKey}?token=${data.token}`);
    }).catch(() => setSrc(null));
  }, [lessonId]);

  if (!src) return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(27,60,120,0.22)] flex items-center justify-center" style={{ paddingBottom: "62%" }}>
      <span className="absolute text-white/50 text-sm">Đang tải video...</span>
    </div>
  );

  return <NativePlayer src={src} onWatchPercent={onWatchPercent} videoRef={videoRef} startTime={startTime} />;
}

function VideoPlayer({ url, lessonId, onWatchPercent, videoRef, startTime }: { url: string; lessonId: string; onWatchPercent: (pct: number, positionSec: number) => void; videoRef?: React.RefObject<HTMLVideoElement | null>; startTime?: number | null }) {
  if (url.startsWith("r2:")) {
    return <CFWorkerPlayer lessonId={lessonId} onWatchPercent={onWatchPercent} videoRef={videoRef} startTime={startTime} />;
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return (
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(27,60,120,0.22)]" style={{ paddingBottom: "62%" }}>
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
    <NativePlayer src={url} onWatchPercent={onWatchPercent} videoRef={videoRef} startTime={startTime} />
  );
}

function NativePlayer({ src, onWatchPercent, videoRef: externalRef, startTime }: { src: string; onWatchPercent: (pct: number, positionSec: number) => void; videoRef?: React.RefObject<HTMLVideoElement | null>; startTime?: number | null }) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef    = externalRef ?? internalRef;
  const lastPctRef = useRef(0);

  // Tua tới mốc thời gian từ URL (?t= của note) hoặc vị trí xem dở (resume).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || startTime == null) return;
    let done = false;
    const seek = () => {
      if (done) return;
      done = true;
      // Đã xem quá 1s (progress query về muộn) → không giật vị trí nữa
      if (video.currentTime > 1) return;
      video.currentTime = startTime;
      video.play().catch(() => {});
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
    return () => video.removeEventListener("loadedmetadata", seek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, startTime]);

  useEffect(() => {
    lastPctRef.current = 0;
    const video = videoRef.current;
    if (!video) return;

    const reportProgress = () => {
      if (!video.duration) return;
      const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      if (pct - lastPctRef.current >= 5) {
        lastPctRef.current = pct;
        onWatchPercent(pct, Math.floor(video.currentTime));
      }
    };
    // Pause là điểm dừng tự nhiên — luôn báo vị trí để resume chính xác
    const handlePause = () => {
      if (!video.duration || video.ended) return;
      const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      onWatchPercent(pct, Math.floor(video.currentTime));
    };
    // Xem hết: vị trí về 0 để lần sau mở lại từ đầu
    const handleEnded = () => { lastPctRef.current = 100; onWatchPercent(100, 0); };

    video.addEventListener("timeupdate", reportProgress);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", reportProgress);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [src, onWatchPercent]);

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(27,60,120,0.22)]" style={{ paddingBottom: "62%" }}>
      <video ref={videoRef} src={src} controls className="absolute inset-0 w-full h-full" />
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
        className={`w-full flex items-center justify-between px-4 py-3 border border-[#DCE6F4] bg-white hover:bg-[#F4F8FE] transition-colors group ${open ? "rounded-t-xl border-b-0" : "rounded-xl"}`}
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
        <div className="rounded-b-xl overflow-hidden border border-[#DCE6F4] bg-[#F4F8FE]">
          <iframe src={url} title="Tài liệu PDF" className="w-full" style={{ height: "720px" }} />
        </div>
      )}
    </div>
  );
}

// ── No Video Placeholder ───────────────────────────────────────────────────

function NoVideoPlaceholder({ content }: { content?: string | null }) {
  return (
    <div className="w-full aspect-video bg-[#EAF1FC] rounded-2xl flex flex-col items-center justify-center gap-4 border border-[#DCE6F4]">
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
  answerCorrect,
}: {
  question: QuizQuestion;
  answer: string;
  onChange: (val: string) => void;
  submitted: boolean;
  correctAnswer?: string;
  answerCorrect?: boolean | null;
}) {
  const matchesRevealedAnswer = !!correctAnswer && answer.toLowerCase() === correctAnswer.toLowerCase();
  const isCorrect = submitted && answer !== "" && (answerCorrect === true || matchesRevealedAnswer);
  const isWrong = submitted && answer !== "" && question.type !== "SHORT_ANSWER" &&
    (answerCorrect === false || (!!correctAnswer && !matchesRevealedAnswer));
  const hasGradedResult = isCorrect || isWrong;

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      submitted && question.type !== "SHORT_ANSWER" && hasGradedResult
        ? isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
        : "border-[#DCE6F4] bg-white"
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
            const isRevealedCorrect = !!correctAnswer && opt.content.toLowerCase() === correctAnswer.toLowerCase();
            const isOptCorrect = submitted && (isRevealedCorrect || (selected && answerCorrect === true));
            const isOptWrong = submitted && selected &&
              (answerCorrect === false || (!!correctAnswer && !isRevealedCorrect));
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  submitted
                    ? isOptCorrect
                      ? "border-green-300 bg-green-50 text-green-800"
                      : isOptWrong
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-[#DCE6F4] text-[rgba(4,14,32,0.55)]"
                    : selected
                      ? "border-[#7c3aed] bg-[#f5f0ff]"
                      : "border-[#DCE6F4] hover:border-[#7c3aed]/40 hover:bg-[#faf8ff]"
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
            className="w-full px-4 py-3 rounded-lg border border-[#DCE6F4] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 resize-none disabled:bg-[#F4F8FE] disabled:text-[rgba(4,14,32,0.55)]"
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

function QuizView({ quizId, courseId }: { quizId: string; courseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: quiz, isLoading } = useQuizDetail(quizId);
  const { data: attemptsData, isLoading: attemptsLoading } = useQuizAttempts(quizId);
  const submit = useSubmitQuizAttempt(quizId, courseId);
  const requestExtraAttempt = useRequestExtraQuizAttempt(quizId);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const attempts = attemptsData?.attempts ?? [];
  const lastAttempt = attempts[0] ?? null;
  const attemptIdFromUrl = searchParams.get("attempt");
  const takingQuiz = searchParams.get("take") === "1";
  const selectedAttempt = attemptIdFromUrl
    ? attempts.find((attempt) => attempt.id === attemptIdFromUrl) ?? null
    : null;
  const attemptState = attemptIdFromUrl === submit.data?.attempt.id
    ? submit.data.attemptState
    : attemptsData?.attemptState;
  const attemptsUsed = attemptState?.used ?? attempts.length;
  const exhausted = attemptState?.exhausted ?? false;
  const canAttempt = attemptState?.canAttempt ?? false;
  const pendingAttemptRequest = attemptsData?.attemptRequest ?? null;

  const replaceQuizViewInUrl = useCallback((attemptId: string | null, takeQuiz = false) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quiz", quizId);
    if (attemptId) params.set("attempt", attemptId);
    else params.delete("attempt");
    if (takeQuiz) params.set("take", "1");
    else params.delete("take");
    router.replace(`/student/courses/${courseId}/learn?${params.toString()}`, { scroll: false });
  }, [courseId, quizId, router, searchParams]);

  const handleSubmit = () => {
    if (!quiz) return;
    const payload = quiz.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? "",
    }));
    if (payload.some((answer) => !answer.answer.trim())) {
      toast.error("Vui lòng trả lời đầy đủ tất cả câu hỏi trước khi nộp");
      return;
    }
    submit.mutate(payload, {
      onSuccess: (result) => {
        replaceQuizViewInUrl(result.attempt.id);
      },
      onError: () => toast.error("Không thể nộp bài. Vui lòng kiểm tra số lượt và thử lại."),
    });
  };

  const handleRetry = () => {
    setAnswers({});
    replaceQuizViewInUrl(null, true);
  };

  const handleSelectAttempt = (attemptId: string) => {
    if (!attemptId) return;
    replaceQuizViewInUrl(attemptId);
  };

  const handleRequestExtraAttempt = () => {
    requestExtraAttempt.mutate(undefined, {
      onSuccess: () => toast.success("Đã gửi yêu cầu thêm lượt tới giáo viên"),
      onError: () => toast.error("Không thể gửi yêu cầu. Vui lòng tải lại và thử lại."),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  const correctAnswerMap = new Map<string, string | undefined>(
    quiz.questions.map((q) => [
      q.id,
      q.options.find((o) => o.is_correct)?.content,
    ])
  );

  const submittedAttempt = attemptIdFromUrl === submit.data?.attempt.id
    ? submit.data.attempt
    : null;
  const attemptToShow = selectedAttempt ?? submittedAttempt ?? lastAttempt;
  const reviewingAttempt = !!attemptToShow && !takingQuiz;
  const selectedAttemptIndex = attemptToShow
    ? attempts.findIndex((attempt) => attempt.id === attemptToShow.id)
    : -1;
  const selectedAttemptNumber = selectedAttemptIndex >= 0
    ? attempts.length - selectedAttemptIndex
    : attempts.length;
  const answerMap = new Map<string, string>(attemptToShow?.answers?.map((a: { question_id: string; answer: string }) => [a.question_id, a.answer] as [string, string]) ?? []);
  const answerResultMap = new Map<string, boolean | null>(
    attemptToShow?.answers?.map((answer) => [answer.question_id, answer.is_correct]) ?? [],
  );

  const awaitingGrade = !!attemptToShow && quiz.require_pass && attemptToShow.score === null;
  const resultPassed = !!attemptToShow && (!quiz.require_pass || attemptToShow.is_passed === true);
  const resultTone = awaitingGrade ? "blue" : resultPassed ? "green" : "amber";
  const resultTitle = awaitingGrade
    ? "Đang chờ chấm"
    : !quiz.require_pass
      ? "Đã hoàn thành"
      : resultPassed
        ? "Đã vượt qua"
        : "Chưa đạt";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-xl bg-[#f5f0ff] border border-[#e9d8fd] px-6 py-5 flex flex-wrap items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7c3aed] mb-1">Bài tập</p>
          <h2 className="font-display text-lg font-semibold text-[#181d26]">{quiz.title}</h2>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs text-[rgba(4,14,32,0.55)]">{quiz.questions.length} câu hỏi</span>
            <span className="text-xs text-[rgba(4,14,32,0.55)]">
              {quiz.require_pass ? `Điểm qua: ${quiz.pass_score}%` : "Không cần điểm qua"}
            </span>
            <span className="text-xs text-[rgba(4,14,32,0.55)]">
              {quiz.max_attempts != null
                ? exhausted
                  ? `Đã dùng hết ${attemptState?.maxAllowed ?? quiz.max_attempts} lượt`
                  : `Đã dùng ${attemptsUsed}/${attemptState?.maxAllowed ?? quiz.max_attempts} lượt`
                : `Đã làm ${attemptsUsed} lượt · Không giới hạn`}
            </span>
            {quiz.time_limit && (
              <span className="text-xs text-[rgba(4,14,32,0.55)]">{quiz.time_limit} phút</span>
            )}
          </div>
        </div>
        {attempts.length > 0 && (
          <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-52">
            <span className="text-xs font-medium text-[rgba(4,14,32,0.55)]">Lịch sử làm bài</span>
            <select
              aria-label="Chọn lần làm bài"
              value={reviewingAttempt && attemptToShow ? attemptToShow.id : ""}
              onChange={(event) => handleSelectAttempt(event.target.value)}
              className="h-10 rounded-lg border border-[#d8c9f4] bg-white px-3 text-sm font-medium text-[#4c1d95] outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15"
            >
              <option value="" disabled>Xem {attempts.length} lần đã làm</option>
              {attempts.map((attempt, index) => (
                <option key={attempt.id} value={attempt.id}>
                  Lần {attempts.length - index} · {attempt.score === null ? "Chờ chấm" : `${attempt.score}%`}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Kết quả gần nhất / kết quả vừa nộp */}
      {attemptToShow && reviewingAttempt ? (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
          resultTone === "green"
            ? "border-green-200 bg-green-50"
            : resultTone === "blue"
              ? "border-blue-200 bg-blue-50"
              : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              resultTone === "green" ? "bg-green-100" : resultTone === "blue" ? "bg-blue-100" : "bg-amber-100"
            }`}>
              {resultPassed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : awaitingGrade ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${
                resultTone === "green" ? "text-green-800" : resultTone === "blue" ? "text-blue-800" : "text-amber-800"
              }`}>
                {selectedAttemptNumber > 0 && `Lần ${selectedAttemptNumber} · `}
                {resultTitle}
                {attemptToShow.score !== null && ` — ${attemptToShow.score}%`}
              </p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
                {awaitingGrade
                  ? "Lượt này đã được ghi nhận và sẽ có kết quả sau khi chấm."
                  : quiz.require_pass
                    ? resultPassed
                      ? `Điểm cao nhất: ${attemptState?.bestScore ?? attemptToShow.score ?? 0}%`
                      : exhausted
                        ? pendingAttemptRequest
                          ? `Cần ${quiz.pass_score}% để qua · Đang chờ giáo viên mở thêm lượt`
                          : `Cần ${quiz.pass_score}% để qua · Bạn đã hết lượt làm`
                        : `Cần ${quiz.pass_score}% để qua · Còn ${attemptState?.remaining ?? "—"} lượt`
                    : "Bài nộp đã được ghi nhận; điểm chỉ dùng để theo dõi kết quả."}
              </p>
            </div>
          </div>
          <button
            onClick={exhausted ? handleRequestExtraAttempt : handleRetry}
            disabled={exhausted && (!!pendingAttemptRequest || requestExtraAttempt.isPending)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              exhausted
                ? "bg-[#1b61c9] text-white hover:bg-[#254fad]"
                : "text-[#7c3aed] hover:bg-[#7c3aed]/8 hover:text-[#6d28d9]"
            }`}
          >
            {exhausted
              ? pendingAttemptRequest
                ? "Đã gửi yêu cầu"
                : requestExtraAttempt.isPending
                  ? "Đang gửi..."
                  : "Xin thêm 1 lượt"
              : resultPassed
                ? "Làm lại để cải thiện"
                : "Làm lại"}
          </button>
        </div>
      ) : null}

      {/* Questions */}
      <div className="flex flex-col gap-3">
        {quiz.questions.map((q) => {
          const currentAnswer = reviewingAttempt ? (answerMap.get(q.id) ?? "") : (answers[q.id] ?? "");

          if (isExecutableQuestionType(q.type) && q.language) {
            const attemptAnswer = attemptToShow?.answers?.find((a: { question_id: string }) => a.question_id === q.id);
            return (
              <CodingQuestion
                key={q.id}
                questionType={q.type}
                questionId={q.id}
                content={q.content}
                language={q.language}
                starterCode={q.starter_code ?? null}
                testCases={q.testCases ?? []}
                points={q.points}
                order={q.order}
                submitted={reviewingAttempt}
                answer={currentAnswer}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                attemptResult={attemptAnswer ? {
                  is_correct: attemptAnswer.is_correct,
                  code_output: attemptAnswer.code_output ?? null,
                  ai_feedback: attemptAnswer.ai_feedback ?? null,
                  points_earned: attemptAnswer.points_earned,
                } : undefined}
              />
            );
          }

          if (q.type === "CODE_OUTPUT" && q.language && q.starter_code) {
            return (
              <CodeOutputQuestion
                key={q.id}
                questionId={q.id}
                content={q.content}
                language={q.language}
                code={q.starter_code}
                points={q.points}
                order={q.order}
                submitted={reviewingAttempt}
                answer={currentAnswer}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                isCorrect={answerResultMap.get(q.id)}
              />
            );
          }

          return (
            <QuestionItem
              key={q.id}
              question={q}
              answer={currentAnswer}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              submitted={reviewingAttempt}
              correctAnswer={correctAnswerMap.get(q.id)}
              answerCorrect={answerResultMap.get(q.id)}
            />
          );
        })}
      </div>

      {/* Submit */}
      {!reviewingAttempt && canAttempt && !attemptsLoading && (
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
  canGoNext,
  canComplete,
  hasVideo,
  onComplete,
  onPrev,
  onNext,
}: {
  title: string;
  prevItem: NavItem | null;
  nextItem: NavItem | null;
  isLesson: boolean;
  isCurrentDone: boolean;
  canGoNext: boolean;
  canComplete: boolean;
  hasVideo: boolean;
  onComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-semibold text-[#181d26] tracking-[0.1px] leading-snug mb-4">
        {title}
      </h1>
      <div className="flex items-center gap-3 pb-4 border-b border-[#DCE6F4]">
        <button
          onClick={onPrev}
          disabled={!prevItem}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#DCE6F4] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Bài trước
        </button>

        <div className="flex-1" />

        {isLesson && (
          isCurrentDone ? (
            <div className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#0E9F6E] border border-[#bbf7d0] rounded-full px-3 py-2 text-sm font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Đã hoàn thành
            </div>
          ) : (
            <span
              title={!canComplete && hasVideo ? "Cần xem 80% video để hoàn thành" : undefined}
              className={!canComplete ? "cursor-not-allowed" : undefined}
            >
              <button
                onClick={onComplete}
                disabled={!canComplete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#0E9F6E]/40 bg-[#f0fdf4] text-[#0E9F6E] hover:bg-[#dcfce7] hover:border-[#0E9F6E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-[#f0fdf4]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Hoàn thành bài
              </button>
            </span>
          )
        )}

        <button
          onClick={onNext}
          disabled={!nextItem || !canGoNext}
          title={!canGoNext && nextItem ? (isLesson ? "Hoàn thành bài này để tiếp tục" : "Làm bài kiểm tra để tiếp tục") : undefined}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#DCE6F4] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

function LearnContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [watchPercent, setWatchPercent] = useState(0);

  const { data: user } = useMe();
  const { data: course, isLoading: courseLoading } = useCourseDetail(courseId);
  const { data: progress } = useCourseProgress(courseId);
  const reportWatchProgress  = useReportWatchProgress(courseId);
  const { data: certificate } = useCourseCertificate(courseId);
  const issueCertificate = useIssueCertificate(courseId);

  const allNavItems: NavItem[] = course?.sections.flatMap(chapterNavItems) ?? [];

  const lessonIdFromUrl = searchParams.get("lesson");
  const quizIdFromUrl = searchParams.get("quiz");
  const startTimeFromUrl = (() => {
    const raw = searchParams.get("t");
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

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
  const quizSatisfiedSet = new Set(
    (progress?.quiz_states ?? []).filter((q) => q.satisfied).map((q) => q.quiz_id)
  );
  const isLesson = selectedItem?.kind === "lesson";
  const isCurrentDone = isLesson && selectedItem ? completedIds.has(selectedItem.item.id) : false;

  // Nút "Hoàn thành bài": bài không video bật ngay; bài có video cần xem ≥80%.
  const currentHasVideo = selectedItem?.kind === "lesson" ? !!selectedItem.item.video_url : false;
  const canComplete = isLesson && (!currentHasVideo || watchPercent >= 80);

  // Một item "thỏa" = bài học đã hoàn thành, hoặc quiz đã thỏa điều kiện gate.
  const isItemSatisfied = (nav: NavItem | null): boolean => {
    if (!nav) return false;
    return nav.kind === "lesson"
      ? completedIds.has(nav.item.id)
      : quizSatisfiedSet.has(nav.item.id);
  };

  // Item bị khóa nếu có bất kỳ item nào trước nó (bài học HOẶC quiz) chưa thỏa.
  const lockedIds = useMemo(() => {
    const locked = new Set<string>();
    let blocked = false;
    for (const nav of allNavItems) {
      if (blocked) locked.add(nav.item.id);
      const satisfied = nav.kind === "lesson"
        ? completedIds.has(nav.item.id)
        : quizSatisfiedSet.has(nav.item.id);
      if (!satisfied) blocked = true;
    }
    return locked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNavItems, progress?.completed_lesson_ids, progress?.quiz_states]);

  const getVideoTime = useCallback((): number | null => {
    const t = videoRef.current?.currentTime;
    return t != null ? Math.floor(t) : null;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Vị trí xem trong phiên hiện tại — ưu tiên hơn server (progress query có thể stale)
  const localPositionsRef = useRef<Record<string, number>>({});

  // Stable callback để tránh re-register event listeners mỗi render
  const handleWatchPercent = useCallback(
    (pct: number, positionSec: number) => {
      if (!selectedItem || selectedItem.kind !== "lesson") return;
      setWatchPercent((p) => Math.max(p, pct));
      localPositionsRef.current[selectedItem.item.id] = positionSec;
      reportWatchProgress.mutate({ lessonId: selectedItem.item.id, watchPercent: pct, positionSec });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedItem?.item.id]
  );

  // Mốc bắt đầu video: ?t= từ note ưu tiên, sau đó vị trí xem dở (phiên này > server)
  const resumeStartTime = (() => {
    if (!selectedItem || selectedItem.kind !== "lesson") return null;
    if (selectedItem.item.id === lessonIdFromUrl && startTimeFromUrl != null) return startTimeFromUrl;
    const pos = localPositionsRef.current[selectedItem.item.id]
      ?? progress?.last_positions?.[selectedItem.item.id]
      ?? 0;
    return pos > 5 ? pos : null;
  })();

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

  // Nút "Hoàn thành bài": đánh dấu xong rồi chuyển sang bài tiếp theo.
  const completeLesson = useCallback(() => {
    if (!selectedItem || selectedItem.kind !== "lesson") return;
    reportWatchProgress.mutate(
      { lessonId: selectedItem.item.id, watchPercent: 100 },
      { onSuccess: () => { if (nextItem) navigateToItem(nextItem); } }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.item.id, nextItem, navigateToItem]);

  // Reset tiến độ xem cục bộ khi đổi bài.
  useEffect(() => {
    setWatchPercent(0);
  }, [selectedItem?.item.id]);

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)" }}>
        <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)" }}>
        <p className="text-[rgba(4,14,32,0.55)]">Không tìm thấy khóa học</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)" }}>
      {/* Navbar dùng chung */}
      <MainNavbar />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="w-72 shrink-0 bg-white/70 backdrop-blur-xl border-r border-[#DCE6F4] overflow-y-auto hidden lg:block"
        >
          <div className="px-4 py-4 border-b border-[#DCE6F4]">
            <BackButton />
            <p className="font-display text-base font-semibold text-[#181d26] leading-snug line-clamp-2">
              {course.title}
            </p>
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2ECF9]">
                <motion.div
                  className="h-full rounded-full bg-[#1b61c9]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress?.percentage ?? 0}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[rgba(4,14,32,0.55)]">
                Đã học {progress?.completed_lessons ?? 0}/{progress?.total_lessons ?? 0} bài · {progress?.percentage ?? 0}%
              </p>
            </div>
          </div>

          {course.sections.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              completedIds={completedIds}
              lockedIds={lockedIds}
              selectedId={selectedItem?.item.id ?? null}
              onSelectLesson={(lesson) => navigateToItem({ kind: "lesson", item: lesson })}
              onSelectQuiz={(quiz) => navigateToItem({ kind: "quiz", item: quiz })}
            />
          ))}
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={selectedItem?.item.id ?? "empty"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="max-w-5xl mx-auto px-4 sm:px-6 py-6"
          >
            {progress?.percentage === 100 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎉</span>
                  <p className="text-sm font-medium text-[#166534]">
                    Chúc mừng! Bạn đã hoàn thành khóa học.
                  </p>
                </div>
                {certificate ? (
                  <Link
                    href={`/student/certificates/${certificate.id}`}
                    className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-[#1b61c9] hover:text-[#254fad] px-4 py-2 rounded-lg hover:bg-[#1b61c9]/8 transition-colors"
                  >
                    Xem chứng chỉ
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      issueCertificate.mutate(undefined, {
                        onSuccess: (res) => {
                          router.push(`/student/certificates/${res.data.certificate.id}`);
                        },
                      });
                    }}
                    disabled={issueCertificate.isPending}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-60"
                  >
                    {issueCertificate.isPending ? (
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                    ) : null}
                    Nhận chứng chỉ
                  </button>
                )}
              </motion.div>
            )}
            {selectedItem ? (
              <>
                <NavControls
                  title={selectedItem.item.title}
                  prevItem={prevItem}
                  nextItem={nextItem}
                  isLesson={isLesson}
                  isCurrentDone={isCurrentDone}
                  canGoNext={isItemSatisfied(selectedItem)}
                  canComplete={canComplete}
                  hasVideo={currentHasVideo}
                  onComplete={completeLesson}
                  onPrev={() => prevItem && navigateToItem(prevItem)}
                  onNext={() => nextItem && navigateToItem(nextItem)}
                />

                {selectedItem.kind === "lesson" ? (
                  <>
                    {/* Video + Notes side by side */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                      {/* Left column: video, pdf, content */}
                      <div className="flex-1 min-w-0">
                        {selectedItem.item.video_url ? (
                          <VideoPlayer url={selectedItem.item.video_url} lessonId={selectedItem.item.id} onWatchPercent={handleWatchPercent} videoRef={videoRef} startTime={resumeStartTime} />
                        ) : (
                          <NoVideoPlaceholder content={selectedItem.item.content} />
                        )}

                        {selectedItem.item.pdf_url && (
                          <PdfViewer url={selectedItem.item.pdf_url} />
                        )}

                        {selectedItem.item.content && selectedItem.item.video_url && (
                          <div className="mt-4">
                            <p className="text-sm text-[rgba(4,14,32,0.55)] leading-relaxed tracking-[0.07px]">
                              {selectedItem.item.content}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right column: notes panel */}
                      <div className="w-full lg:w-72 lg:shrink-0 lg:flex lg:flex-col">
                        <NotesSection lessonId={selectedItem.item.id} getVideoTime={getVideoTime} seekTo={seekTo} />
                      </div>
                    </div>

                    {/* key theo lesson: đổi bài thì reset summary/chat, tránh dính nội dung bài cũ */}
                    <AISummary key={selectedItem.item.id} lessonId={selectedItem.item.id} />

                    {user && (
                      <QASection
                        lessonId={selectedItem.item.id}
                        currentUserId={user.id}
                      />
                    )}

                    <AIChatBox
                      key={selectedItem.item.id}
                      lessonId={selectedItem.item.id}
                      lessonTitle={selectedItem.item.title}
                    />
                  </>
                ) : (
                  <QuizView quizId={selectedItem.item.id} courseId={courseId} />
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
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  return (
    <Suspense>
      <LearnContent params={params} />
    </Suspense>
  );
}
