"use client";

import { Suspense, use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileQuestion,
  MessagesSquare,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { BackButton } from "@/app/student/_components/BackButton";
import { QASection } from "@/app/student/courses/[courseId]/learn/_components/QASection";
import { OwnerLessonMedia } from "./_components/OwnerLessonMedia";
import { useTeacherClassroom, type ClassroomChapter } from "./classroom.hook";

const C = {
  canvas: "#EFF5FE",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
};

function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-28 h-[430px] w-[430px] rounded-full bg-[#BCD7FF]/35 blur-[100px]" />
      <div className="absolute -right-28 top-32 h-[390px] w-[390px] rounded-full bg-[#A7C8FF]/28 blur-[100px]" />
    </div>
  );
}

function ChapterNavigation({
  chapter,
  selectedLessonId,
  onSelectLesson,
}: {
  chapter: ClassroomChapter;
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const questionCount = chapter.lessons.reduce((total, lesson) => total + lesson.question_count, 0);

  return (
    <div className="border-b border-[#EEF2F8] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[#F7FAFE]"
        aria-expanded={open}
      >
        <ChevronDown size={15} className={`shrink-0 text-[rgba(4,14,32,0.38)] transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.08em] text-[rgba(4,14,32,0.55)]">
          {chapter.title}
        </span>
        {questionCount > 0 ? (
          <span className="rounded-full bg-[#1b61c9]/9 px-2 py-0.5 text-[10px] font-semibold text-[#1b61c9]">
            {questionCount} hỏi đáp
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="pb-2">
          {chapter.lessons.map((lesson) => {
            const active = lesson.id === selectedLessonId;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                  active ? "bg-[#1b61c9]/8" : "hover:bg-[#F7FAFE]"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold ${
                  active ? "bg-[#1b61c9] text-white" : "bg-[#EAF1FC] text-[rgba(4,14,32,0.55)]"
                }`}>
                  {lesson.order}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${active ? "font-semibold text-[#1b61c9]" : "text-[rgba(4,14,32,0.68)]"}`}>
                  {lesson.title}
                </span>
                {lesson.unanswered_count > 0 ? (
                  <span
                    className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-700"
                    title={`${lesson.unanswered_count} câu hỏi chưa có trả lời`}
                  >
                    {lesson.unanswered_count}
                  </span>
                ) : lesson.question_count > 0 ? (
                  <MessagesSquare size={14} className="shrink-0 text-[#0E9F6E]" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ClassroomContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: course, isLoading, isError, refetch } = useTeacherClassroom(courseId);

  const lessons = useMemo(
    () => course?.sections.flatMap((section) => section.lessons) ?? [],
    [course?.sections],
  );
  const lessonIdFromUrl = searchParams.get("lesson");
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonIdFromUrl) ?? lessons[0] ?? null;

  const handleSelectLesson = (lessonId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("lesson", lessonId);
    router.replace(`/teacher/courses/${courseId}/classroom?${next.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return <ClassroomLoadingState />;
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen" style={{ background: C.canvas }}>
        <MainNavbar />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="rounded-3xl border bg-white px-8 py-14" style={{ borderColor: C.border }}>
            <CircleHelp size={36} className="mx-auto text-[rgba(4,14,32,0.3)]" />
            <h1 className="mt-4 font-display text-xl font-semibold" style={{ color: C.ink }}>Không thể mở lớp học</h1>
            <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>Khóa học không tồn tại hoặc bạn không phải giảng viên sở hữu.</p>
            <Link href="/teacher/courses" className="mt-6 inline-flex rounded-xl bg-[#1b61c9] px-4 py-2.5 text-sm font-medium text-white">
              Quay lại khóa học
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isPublished = course.status === "PUBLISHED";
  const totalQuestions = lessons.reduce((total, lesson) => total + lesson.question_count, 0);
  const totalUnanswered = lessons.reduce((total, lesson) => total + lesson.unanswered_count, 0);

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
        <BackButton back label="Quay lại chỉnh sửa" />
        <section
          className="rounded-3xl border bg-white px-5 py-5 shadow-[0_10px_30px_rgba(27,60,120,0.05)] sm:px-6"
          style={{ borderColor: C.border }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1b61c9]/10 px-2.5 py-1 text-xs font-semibold text-[#1b61c9]">
                  <ShieldCheck size={13} />
                  Chế độ giảng viên
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {isPublished ? "Đã công bố" : "Bản nháp"}
                </span>
              </div>
              <h1 className="mt-3 truncate font-display text-2xl font-semibold sm:text-3xl">{course.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" style={{ color: C.inkSoft }}>
                <span>{lessons.length} bài học</span>
                <span>{totalQuestions} câu hỏi</span>
                <span className={totalUnanswered > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}>
                  {totalUnanswered > 0 ? `${totalUnanswered} chưa được trả lời` : "Không có câu hỏi tồn đọng"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href={`/teacher/courses/${courseId}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F4] bg-white px-4 py-2.5 text-sm font-medium text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9]"
              >
                <Pencil size={15} />
                Chỉnh sửa khóa học
              </Link>
              {isPublished ? (
                <Link
                  href={`/courses/${courseId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F4] bg-white px-4 py-2.5 text-sm font-medium text-[#181d26] hover:border-[#1b61c9]/40 hover:text-[#1b61c9]"
                >
                  <ExternalLink size={15} />
                  Xem trang công khai
                </Link>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-[#DCE6F4] bg-[#F7F9FC] px-4 py-2.5 text-sm font-medium text-[rgba(4,14,32,0.35)]"
                  title="Xuất bản khóa học để mở trang công khai"
                >
                  <ExternalLink size={15} />
                  Chưa có trang công khai
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="overflow-hidden rounded-3xl border bg-white shadow-[0_10px_30px_rgba(27,60,120,0.05)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-3 border-b border-[#DCE6F4] px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1b61c9]/10 text-[#1b61c9]">
                <BookOpen size={17} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Nội dung khóa học</h2>
                <p className="text-xs" style={{ color: C.inkFaint }}>Chọn bài để xem và trả lời</p>
              </div>
            </div>
            {course.sections.length > 0 ? course.sections.map((chapter) => (
              <ChapterNavigation
                key={chapter.id}
                chapter={chapter}
                selectedLessonId={selectedLesson?.id ?? null}
                onSelectLesson={handleSelectLesson}
              />
            )) : (
              <p className="px-5 py-10 text-center text-sm" style={{ color: C.inkFaint }}>Khóa học chưa có chương nào.</p>
            )}
          </aside>

          <section className="min-w-0">
            {selectedLesson ? (
              <>
                <div className="rounded-3xl border bg-white p-4 shadow-[0_10px_30px_rgba(27,60,120,0.05)] sm:p-6" style={{ borderColor: C.border }}>
                  <div className="mb-5 flex flex-col gap-3 border-b border-[#EEF2F8] pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#1b61c9]">Bài {selectedLesson.order}</p>
                      <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">{selectedLesson.title}</h2>
                    </div>
                    {selectedLesson.unanswered_count > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        <FileQuestion size={14} />
                        {selectedLesson.unanswered_count} câu chưa trả lời
                      </span>
                    ) : null}
                  </div>

                  <OwnerLessonMedia key={selectedLesson.id} lesson={selectedLesson} />

                  {selectedLesson.content ? (
                    <div className="mt-6 rounded-2xl border border-[#DCE6F4] bg-[#F8FAFD] px-5 py-4">
                      <h3 className="text-sm font-semibold">Nội dung bài học</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7" style={{ color: C.inkSoft }}>{selectedLesson.content}</p>
                    </div>
                  ) : null}

                  {selectedLesson.quiz.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold">Bài kiểm tra của bài học</h3>
                      {selectedLesson.quiz.map((quiz) => (
                        <div key={quiz.id} className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-violet-950">{quiz.title}</p>
                            <p className="mt-1 text-xs text-violet-700/75">
                              {quiz.require_pass ? `Cần đạt ${quiz.pass_score}%` : "Chỉ cần nộp bài"}
                              {quiz.max_attempts !== null ? ` · Tối đa ${quiz.max_attempts} lượt` : " · Không giới hạn lượt"}
                              {quiz.time_limit ? ` · ${quiz.time_limit} phút` : ""}
                            </p>
                          </div>
                          <Link href={`/teacher/courses/${courseId}/quizzes/${quiz.id}`} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-3 py-2 text-xs font-medium text-violet-700 ring-1 ring-violet-200 hover:ring-violet-300 sm:self-auto">
                            <Pencil size={13} />
                            Chỉnh sửa quiz
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <QASection
                  lessonId={selectedLesson.id}
                  currentUserId={course.instructor.id}
                  mode="owner"
                  onReplySuccess={() => { void refetch(); }}
                />
              </>
            ) : (
              <div className="rounded-3xl border bg-white px-8 py-16 text-center" style={{ borderColor: C.border }}>
                <BookOpen size={36} className="mx-auto text-[rgba(4,14,32,0.25)]" />
                <h2 className="mt-4 font-display text-xl font-semibold">Chưa có bài học</h2>
                <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>Hãy thêm bài học trong trang chỉnh sửa để bắt đầu lớp học.</p>
                <Link href={`/teacher/courses/${courseId}/edit`} className="mt-6 inline-flex rounded-xl bg-[#1b61c9] px-4 py-2.5 text-sm font-medium text-white">
                  Thêm nội dung khóa học
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ClassroomLoadingState() {
  return (
    <div className="min-h-screen" style={{ background: C.canvas }}>
      <MainNavbar />
      <main className="mx-auto max-w-7xl animate-pulse px-4 py-9 sm:px-6">
        <div className="h-28 rounded-3xl border border-[#DCE6F4] bg-white" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-[560px] rounded-3xl border border-[#DCE6F4] bg-white" />
          <div className="h-[680px] rounded-3xl border border-[#DCE6F4] bg-white" />
        </div>
      </main>
    </div>
  );
}

export default function TeacherClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ClassroomLoadingState />}>
      <ClassroomContent params={params} />
    </Suspense>
  );
}
