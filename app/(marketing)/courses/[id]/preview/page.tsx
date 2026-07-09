"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useCourse, useEnrollCourse, Lesson } from "../../courses.hook";
import api from "@/lib/axios";

// ── Palette (cozy-blue, đồng bộ trang detail) ────────────────────────────────
const C = {
  canvas: "#EFF5FE",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
};

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// ── Modal mời đăng nhập/đăng ký (guest bấm vào bài có video R2) ──────────────

function AuthPromptModal({ loginHref, onClose }: { loginHref: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full p-7 text-center"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(27,97,201,0.09)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-semibold mb-1.5" style={{ color: C.ink }}>
          Xem thử bài giảng miễn phí
        </h2>
        <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
          Đăng nhập để xem bài giảng này — hoàn toàn miễn phí. Chưa có tài khoản? Đăng ký chỉ mất một phút.
        </p>
        <div className="space-y-2.5">
          <Link
            href={loginHref}
            className="block w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: C.blue }}
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="block w-full py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[#F4F8FE]"
            style={{ color: C.blue, border: `1px solid ${C.border}` }}
          >
            Đăng ký tài khoản miễn phí
          </Link>
          <button onClick={onClose} className="w-full py-2 text-xs transition-colors hover:text-[#254fad]" style={{ color: C.inkFaint }}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Player (rút gọn từ trang learn: R2 token / YouTube / không video) ────────

function PreviewPlayer({ lesson, isLoggedIn, loginHref }: { lesson: Lesson; isLoggedIn: boolean; loginHref: string }) {
  const isR2 = !!lesson.video_url?.startsWith("r2:");
  const ytId = lesson.video_url ? extractYouTubeId(lesson.video_url) : null;
  const [src, setSrc]     = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isR2 || !isLoggedIn) return;
    api.get<{ token: string; workerUrl: string; videoKey: string }>(
      `/student/lessons/${lesson.id}/video-token`
    ).then(({ data }) => setSrc(`${data.workerUrl}/${data.videoKey}?token=${data.token}`))
      .catch(() => setError(true));
  }, [lesson.id, isR2, isLoggedIn]);

  if (!lesson.video_url) {
    return (
      <div className="w-full rounded-2xl bg-white border p-10 text-center" style={{ borderColor: C.border }}>
        <p className="text-sm whitespace-pre-line" style={{ color: C.inkSoft }}>
          {lesson.content || "Bài học này không có video."}
        </p>
      </div>
    );
  }

  if (isR2 && !isLoggedIn) {
    return (
      <div className="w-full rounded-2xl bg-white border p-10 text-center space-y-3" style={{ borderColor: C.border }}>
        <p className="text-sm" style={{ color: C.inkSoft }}>Đăng nhập để xem thử bài học này.</p>
        <Link href={loginHref} className="inline-block px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: C.blue }}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (ytId) {
    return (
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(27,60,120,0.22)]" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl bg-white border p-10 text-center" style={{ borderColor: C.border }}>
        <p className="text-sm text-red-500">Không tải được video. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="relative w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center" style={{ paddingBottom: "56.25%" }}>
        <span className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Đang tải video...</span>
      </div>
    );
  }

  return (
    <video src={src} controls autoPlay className="w-full rounded-2xl bg-black shadow-[0_12px_36px_rgba(27,60,120,0.22)]" style={{ maxHeight: "68vh" }} />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function PreviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: user } = useMe();
  const isLoggedIn = !!user;
  const { data: course, isLoading } = useCourse(id);
  const { mutateAsync: enroll, isPending: enrolling } = useEnrollCourse();

  const freeLessons = course?.sections.flatMap((s) => s.lessons.filter((l) => l.is_free)) ?? [];
  const lessonIdFromUrl = searchParams.get("lesson");
  const selectedLesson =
    freeLessons.find((l) => l.id === lessonIdFromUrl) ?? freeLessons[0] ?? null;

  // Guest gặp bài video R2 → mời đăng nhập/đăng ký; "Để sau" thì thôi cho tới khi đổi bài.
  const [authDismissedFor, setAuthDismissedFor] = useState<string | null>(null);
  const needsAuth = !isLoggedIn && !!selectedLesson?.video_url?.startsWith("r2:");
  const showAuthModal = needsAuth && authDismissedFor !== selectedLesson?.id;
  const loginHref = selectedLesson && course
    ? `/login?redirect=${encodeURIComponent(`/courses/${course.id}/preview?lesson=${selectedLesson.id}`)}`
    : "/login";

  // Đã enroll thì học thật luôn, khỏi xem thử
  useEffect(() => {
    if (course?.is_enrolled) router.replace(`/student/courses/${course.id}/learn`);
  }, [course?.is_enrolled, course?.id, router]);

  const handleEnroll = async () => {
    if (!course) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    try {
      const result = await enroll(course.id);
      if (result.enrolled) router.push(`/student/courses/${course.id}/learn`);
      else if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch {
      router.push(`/courses/${course.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: C.canvas }}>
        <MainNavbar />
        <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse space-y-4">
          <div className="h-6 w-64 rounded" style={{ background: "#E2ECF9" }} />
          <div className="h-80 rounded-3xl" style={{ background: "#E2ECF9" }} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen" style={{ background: C.canvas }}>
        <MainNavbar />
        <div className="text-center py-20">
          <p style={{ color: C.inkSoft }}>Không tìm thấy khóa học.</p>
          <Link href="/courses" className="mt-4 inline-block text-sm" style={{ color: C.blue }}>← Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <MainNavbar />

      {/* Banner chế độ xem thử */}
      <div className="border-b" style={{ background: "#FFF8E6", borderColor: "#F3E3B3" }}>
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm" style={{ color: "#8a6d1a" }}>
            <span className="font-semibold">Chế độ xem thử</span> — bạn đang xem các bài học miễn phí của khóa &ldquo;{course.title}&rdquo;.
          </p>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
            style={{ background: C.blue }}
          >
            {enrolling ? "Đang xử lý..." : course.is_free ? "Đăng ký miễn phí" : "Đăng ký khóa học"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar chương trình học */}
        <aside className="w-full lg:w-80 lg:shrink-0 order-2 lg:order-1">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-1.5 text-xs font-medium mb-3 hover:text-[#254fad]"
            style={{ color: C.blue }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Trang khóa học
          </Link>

          <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.border }}>
            {course.sections.map((chapter) => (
              <div key={chapter.id}>
                <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b" style={{ color: C.inkFaint, background: "#F4F8FE", borderColor: "#EEF3FB" }}>
                  {chapter.title}
                </p>
                <ul>
                  {chapter.lessons.map((lesson) =>
                    lesson.is_free ? (
                      <li key={lesson.id}>
                        <button
                          onClick={() => router.push(`/courses/${course.id}/preview?lesson=${lesson.id}`)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors hover:bg-[#F4F8FE]"
                          style={{
                            color: C.ink,
                            background: selectedLesson?.id === lesson.id ? "rgba(27,97,201,0.08)" : undefined,
                            boxShadow: selectedLesson?.id === lesson.id ? `inset 3px 0 0 ${C.blue}` : undefined,
                          }}
                        >
                          <svg className="shrink-0" style={{ color: C.blue }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                          </svg>
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
                            Miễn phí
                          </span>
                        </button>
                      </li>
                    ) : (
                      <li key={lesson.id} className="flex items-center gap-2.5 px-4 py-3 text-sm" style={{ color: C.inkFaint }} title="Đăng ký khóa học để mở khóa">
                        <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span className="flex-1">{lesson.title}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main: player + nội dung */}
        <main className="flex-1 min-w-0 order-1 lg:order-2">
          {selectedLesson ? (
            <>
              <h1 className="font-display text-xl font-semibold mb-4 tracking-[0.08px]" style={{ color: C.ink }}>
                {selectedLesson.title}
              </h1>
              {/* key = lesson.id: đổi bài thì player remount, tự reset src/error */}
              <PreviewPlayer key={selectedLesson.id} lesson={selectedLesson} isLoggedIn={isLoggedIn} loginHref={loginHref} />
              {selectedLesson.content && selectedLesson.video_url && (
                <p className="mt-4 text-sm leading-relaxed whitespace-pre-line" style={{ color: C.inkSoft }}>
                  {selectedLesson.content}
                </p>
              )}
              {selectedLesson.pdf_url && (
                <div className="mt-4 rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.border }}>
                  <p className="px-4 py-2.5 text-sm font-semibold border-b" style={{ color: C.ink, borderColor: "#EEF3FB" }}>
                    Tài liệu bài học
                  </p>
                  <iframe src={selectedLesson.pdf_url} title="Tài liệu PDF" className="w-full" style={{ height: 560 }} />
                </div>
              )}

              {/* CTA cuối bài */}
              <div className="mt-6 rounded-2xl bg-white border px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: C.border }}>
                <p className="text-sm" style={{ color: C.inkSoft }}>
                  Thích bài giảng này? Đăng ký để học toàn bộ {course.sections.reduce((s, ch) => s + ch.lessons.length, 0)} bài.
                </p>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="shrink-0 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                  style={{ background: C.blue }}
                >
                  {course.is_free ? "Đăng ký miễn phí" : "Đăng ký khóa học"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: C.inkSoft }}>Khóa học này chưa có bài xem thử.</p>
              <Link href={`/courses/${course.id}`} className="mt-3 inline-block text-sm" style={{ color: C.blue }}>
                ← Quay lại trang khóa học
              </Link>
            </div>
          )}
        </main>
      </div>

      {showAuthModal && selectedLesson && (
        <AuthPromptModal
          loginHref={loginHref}
          onClose={() => setAuthDismissedFor(selectedLesson.id)}
        />
      )}
    </div>
  );
}

export default function CoursePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <PreviewContent params={params} />
    </Suspense>
  );
}
