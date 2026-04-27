"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useCourse, useEnrollCourse, Chapter } from "../courses.hook";

// ── Helpers ────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  beginner:     "Cơ bản",
  intermediate: "Trung cấp",
  advanced:     "Nâng cao",
};

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CurriculumChapter({ chapter }: { chapter: Chapter }) {
  const [open, setOpen] = useState(true);
  const freeCount = chapter.lessons.filter((l) => l.is_free).length;

  return (
    <div className="border border-[#e0e2e6] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#f8fafc] hover:bg-white transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`transition-transform duration-200 text-[rgba(4,14,32,0.45)] shrink-0 ${open ? "rotate-90" : ""}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="font-medium text-[#181d26] tracking-[0.08px]">{chapter.title}</span>
        </div>
        <span className="text-xs text-[rgba(4,14,32,0.45)] shrink-0 ml-4">
          {chapter.lessons.length} bài{freeCount > 0 ? ` · ${freeCount} miễn phí` : ""}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-[#f0f2f5]">
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-center gap-3 px-5 py-3.5">
              {lesson.is_free ? (
                <svg className="shrink-0 text-[#1b61c9]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              ) : (
                <svg className="shrink-0 text-[rgba(4,14,32,0.3)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              <span className={`text-sm flex-1 tracking-[0.07px] ${lesson.is_free ? "text-[#181d26]" : "text-[rgba(4,14,32,0.55)]"}`}>
                {lesson.title}
              </span>
              {lesson.is_free && (
                <span className="text-xs text-[#1b61c9] font-medium bg-[#1b61c9]/8 px-2 py-0.5 rounded-full shrink-0">
                  Xem thử
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-40 bg-gray-100 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-3/4 bg-gray-100 rounded" />
          <div className="h-5 w-1/2 bg-gray-100 rounded" />
          <div className="space-y-2 mt-6">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const { data: user }   = useMe();
  const { data: course, isLoading } = useCourse(id);
  const { mutateAsync: enroll, isPending: enrolling } = useEnrollCourse();

  const [enrollError, setEnrollError]     = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const totalLessons = course?.sections.reduce((s, ch) => s + ch.lessons.length, 0) ?? 0;

  const handleEnroll = async () => {
    if (!course) return;
    setEnrollError(null);
    try {
      const result = await enroll(course.id);
      if (result.enrolled) {
        setEnrollSuccess(true);
        setTimeout(() => router.push(`/student/courses/${course.id}/learn`), 2000);
      } else if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (err: any) {
      setEnrollError(err?.response?.data?.error ?? "Đăng ký thất bại, vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/student/dashboard", label: "Dashboard" },
              { href: "/courses",           label: "Khóa học", active: true },
              { href: "/student/ai-tutor",  label: "AI Tutor" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium tracking-[0.08px] transition-colors ${
                  item.active
                    ? "bg-[#1b61c9]/8 text-[#1b61c9]"
                    : "text-[rgba(4,14,32,0.69)] hover:text-[#181d26] hover:bg-[#f8fafc]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <UserMenu user={user ?? null} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[rgba(4,14,32,0.45)] mb-8">
          <Link href="/courses" className="hover:text-[#1b61c9] transition-colors">Khóa học</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#181d26] truncate max-w-xs">{course?.title ?? "..."}</span>
        </div>

        {isLoading ? <DetailSkeleton /> : course ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* ── Left: Content ── */}
            <div className="lg:col-span-2">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-[#1b61c9] bg-[#1b61c9]/8 px-2.5 py-1 rounded-full font-medium">
                  {course.category.name}
                </span>
                <span className="text-xs text-[rgba(4,14,32,0.55)] bg-white px-2.5 py-1 rounded-full border border-[#e0e2e6]">
                  {LEVEL_LABEL[course.level] ?? course.level}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-light text-[#181d26] leading-snug mb-5 tracking-[0.08px]">
                {course.title}
              </h1>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt={course.instructor.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1b61c9]/15 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#1b61c9]">{course.instructor.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[rgba(4,14,32,0.45)] tracking-[0.07px]">Giảng viên</p>
                  <p className="text-sm font-medium text-[#181d26]">{course.instructor.name}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#e0e2e6]">
                {[
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    ),
                    text: `${course._count.enrollments.toLocaleString("vi-VN")} học viên`,
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    ),
                    text: `${course.sections.length} chương`,
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    ),
                    text: `${totalLessons} bài học`,
                  },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[rgba(4,14,32,0.55)]">
                    {s.icon}
                    <span className="text-sm tracking-[0.07px]">{s.text}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-[#181d26] mb-3 tracking-[0.08px]">Mô tả khóa học</h2>
                <p className="text-[rgba(4,14,32,0.69)] leading-relaxed tracking-[0.18px]">
                  {course.description}
                </p>
              </div>

              {/* Curriculum */}
              <div>
                <h2 className="text-lg font-semibold text-[#181d26] mb-4 tracking-[0.08px]">
                  Nội dung khóa học
                  <span className="ml-2 text-sm font-normal text-[rgba(4,14,32,0.45)]">
                    ({course.sections.length} chương · {totalLessons} bài)
                  </span>
                </h2>
                <div className="space-y-3">
                  {course.sections.map((chapter) => (
                    <CurriculumChapter key={chapter.id} chapter={chapter} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div
                  className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
                  style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 0px 2px, rgba(45,127,249,0.28) 0px 1px 3px" }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-6">
                    {/* Price */}
                    <div className="mb-5">
                      {course.is_free ? (
                        <span className="text-2xl font-semibold text-[#006400]">Miễn phí</span>
                      ) : (
                        <span className="text-2xl font-semibold text-[#181d26]">{formatPrice(course.price)}</span>
                      )}
                    </div>

                    {/* CTA */}
                    {enrollSuccess ? (
                      <div className="mb-5 flex flex-col items-center gap-2 py-4 px-4 bg-green-50 border border-green-200 rounded-xl text-center">
                        <svg className="text-green-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <p className="text-sm font-semibold text-green-700">Đăng ký thành công!</p>
                        <p className="text-xs text-green-600">Đang chuyển sang trang học...</p>
                      </div>
                    ) : (
                      <>
                        {enrollError && (
                          <p className="text-xs text-red-500 mb-3 px-1">{enrollError}</p>
                        )}
                      </>
                    )}

                    {!enrollSuccess && (course.is_enrolled ? (
                      <Link
                        href={`/student/courses/${course.id}/learn`}
                        className="w-full flex items-center justify-center gap-2 bg-[#006400] text-white py-3 rounded-xl font-medium text-sm tracking-[0.08px] hover:bg-[#005200] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Vào học ngay
                      </Link>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full flex items-center justify-center gap-2 bg-[#1b61c9] text-white py-3 rounded-xl font-medium text-sm tracking-[0.08px] hover:bg-[#254fad] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
                      >
                        {enrolling ? (
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : null}
                        {course.is_free ? "Đăng ký miễn phí" : `Mua ngay · ${formatPrice(course.price)}`}
                      </button>
                    ))}

                    {/* Features */}
                    <ul className="mt-5 space-y-2.5">
                      {[
                        { icon: "📚", text: `${totalLessons} bài học` },
                        { icon: "🗂️", text: `${course.sections.length} chương học` },
                        { icon: "♾️", text: "Truy cập trọn đời" },
                        { icon: "📱", text: "Học trên mọi thiết bị" },
                      ].map((f) => (
                        <li key={f.text} className="flex items-center gap-2.5 text-sm text-[rgba(4,14,32,0.69)]">
                          <span>{f.icon}</span>
                          <span>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[rgba(4,14,32,0.55)]">Không tìm thấy khóa học.</p>
            <Link href="/courses" className="mt-4 inline-block text-sm text-[#1b61c9] hover:text-[#254fad]">
              ← Quay lại danh sách
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
