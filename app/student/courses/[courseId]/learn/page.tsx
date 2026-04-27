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
  Chapter,
  Lesson,
} from "./learn.hook";

// ── Helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/youtube\.com\/embed\/([^?&]+)/);
  return m ? m[1] : null;
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function ChapterItem({
  chapter,
  completedIds,
  selectedId,
  onSelect,
}: {
  chapter: Chapter;
  completedIds: Set<string>;
  selectedId: string | null;
  onSelect: (lesson: Lesson) => void;
}) {
  const [open, setOpen] = useState(true);
  const doneCount = chapter.lessons.filter((l) => completedIds.has(l.id)).length;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f0f4fc] transition-colors group"
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
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ml-2 text-[rgba(4,14,32,0.35)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="pb-1">
          {chapter.lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const active = lesson.id === selectedId;
            return (
              <li key={lesson.id}>
                <button
                  onClick={() => onSelect(lesson)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${active
                      ? "bg-[#1b61c9]/8 border-r-2 border-[#1b61c9]"
                      : "hover:bg-[#f8fafc]"
                    }`}
                >
                  {/* Status icon */}
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
                  <span
                    className={`text-sm leading-snug tracking-[0.07px] line-clamp-2 ${active
                        ? "text-[#1b61c9] font-medium"
                        : done
                          ? "text-[rgba(4,14,32,0.55)]"
                          : "text-[#181d26]"
                      }`}
                  >
                    {lesson.title}
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
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
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

  // Generic video fallback
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
      <video src={url} controls className="w-full h-full" />
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
      {content && (
        <p className="text-[#181d26] text-sm max-w-md text-center px-4">{content}</p>
      )}
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

  // Flatten all lessons for navigation
  const allLessons: Lesson[] = course?.sections.flatMap((ch) => ch.lessons) ?? [];

  const lessonIdFromUrl = searchParams.get("lesson");
  const selectedLesson =
    allLessons.find((l) => l.id === lessonIdFromUrl) ?? allLessons[0] ?? null;

  const selectedIdx = selectedLesson ? allLessons.indexOf(selectedLesson) : -1;
  const prevLesson = selectedIdx > 0 ? allLessons[selectedIdx - 1] : null;
  const nextLesson = selectedIdx < allLessons.length - 1 ? allLessons[selectedIdx + 1] : null;

  const completedIds = new Set(progress?.completed_lesson_ids ?? []);
  const isCurrentDone = selectedLesson ? completedIds.has(selectedLesson.id) : false;

  const navigateTo = useCallback(
    (lesson: Lesson) => {
      router.push(`/student/courses/${courseId}/learn?lesson=${lesson.id}`);
    },
    [courseId, router]
  );

  const handleMarkComplete = () => {
    if (!selectedLesson || isCurrentDone) return;
    markComplete.mutate(selectedLesson.id, {
      onSuccess: () => {
        if (nextLesson) navigateTo(nextLesson);
      },
    });
  };

  // Loading skeleton
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
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-20">
        <div className="h-14 px-4 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo size={28} />
            <span className="font-semibold text-[#1b61c9] text-sm hidden sm:block tracking-tight">SmartEdu</span>
          </Link>

          <div className="w-px h-5 bg-[#e0e2e6] hidden sm:block" />

          {/* Course title */}
          <p className="text-sm font-medium text-[#181d26] truncate flex-1 tracking-[0.07px]">
            {course.title}
          </p>

          {/* Progress pill */}
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

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
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
              selectedId={selectedLesson?.id ?? null}
              onSelect={navigateTo}
            />
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {selectedLesson ? (
              <>
                {/* Video */}
                {selectedLesson.video_url ? (
                  <VideoPlayer url={selectedLesson.video_url} />
                ) : (
                  <NoVideoPlaceholder content={selectedLesson.content} />
                )}

                {/* Lesson info */}
                <div className="mt-5 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-semibold text-[#181d26] tracking-[0.1px] leading-snug">
                        {selectedLesson.title}
                      </h1>
                      {selectedLesson.content && selectedLesson.video_url && (
                        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-2 leading-relaxed tracking-[0.07px]">
                          {selectedLesson.content}
                        </p>
                      )}
                    </div>

                    {/* Mark complete badge */}
                    {isCurrentDone && (
                      <div className="shrink-0 flex items-center gap-1.5 bg-[#f0fdf4] text-[#006400] border border-[#bbf7d0] rounded-full px-3 py-1.5 text-sm font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Đã hoàn thành
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#e0e2e6]">
                  <button
                    onClick={() => prevLesson && navigateTo(prevLesson)}
                    disabled={!prevLesson}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#e0e2e6] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Bài trước
                  </button>

                  {!isCurrentDone && (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markComplete.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-60"
                      style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
                    >
                      {markComplete.isPending ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {nextLesson ? "Hoàn thành & Tiếp theo" : "Hoàn thành khóa học"}
                    </button>
                  )}

                  {isCurrentDone && nextLesson && (
                    <button
                      onClick={() => navigateTo(nextLesson)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors"
                      style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
                    >
                      Bài tiếp theo
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  )}

                  <div className="flex-1" />

                  <button
                    onClick={() => nextLesson && navigateTo(nextLesson)}
                    disabled={!nextLesson || !isCurrentDone}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#e0e2e6] text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Bài sau
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
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
