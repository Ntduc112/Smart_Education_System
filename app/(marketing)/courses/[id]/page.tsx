"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useCourse, useEnrollCourse, Chapter } from "../courses.hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useWishlist } from "@/app/student/wishlist/wishlist.hook";
import { WishlistButton } from "@/app/_components/WishlistButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user: { name: string; avatar: string | null };
}

// ── Review hooks ───────────────────────────────────────────────────────────

function useReviews(courseId: string) {
  return useQuery({
    queryKey: ["reviews", courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}/reviews`);
      return res.data as { reviews: Review[]; averageRating: number | null; totalCount: number };
    },
  });
}

function useMyReview(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["my-review", courseId],
    queryFn: async () => {
      const res = await api.get(`/student/courses/${courseId}/review`);
      return res.data.review as Review | null;
    },
    enabled,
  });
}

// ── Star components ────────────────────────────────────────────────────────

function StarFilled({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarEmpty({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <StarFilled key={i} className="text-[#f59e0b]" />
        ) : (
          <StarEmpty key={i} className="text-[#f59e0b]" />
        )
      )}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          {i <= (hovered || value) ? (
            <StarFilled className="text-[#f59e0b] w-7 h-7" />
          ) : (
            <StarEmpty className="text-[#e0e2e6] hover:text-[#f59e0b] w-7 h-7" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Review form ────────────────────────────────────────────────────────────

function ReviewForm({
  courseId,
  initialReview,
  onCancel,
}: {
  courseId: string;
  initialReview: Review | null;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/student/courses/${courseId}/review`, { rating, comment });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-review", courseId] });
      if (onCancel) onCancel();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error ?? "Gửi đánh giá thất bại.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (rating === 0) {
      setFormError("Vui lòng chọn số sao.");
      return;
    }
    mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#f8fafc] border border-[#e0e2e6] rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-[#181d26] mb-2">Đánh giá của bạn</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
          rows={4}
          className="w-full border border-[#e0e2e6] rounded-xl px-4 py-3 text-sm text-[#181d26] placeholder-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#1b61c9] resize-none bg-white"
        />
      </div>
      {formError && <p className="text-xs text-red-500">{formError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
        >
          {isPending ? "Đang gửi..." : initialReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}

// ── Reviews section ────────────────────────────────────────────────────────

function ReviewsSection({ courseId, isEnrolled, isLoggedIn }: { courseId: string; isEnrolled: boolean; isLoggedIn: boolean }) {
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(courseId);
  const { data: myReview } = useMyReview(courseId, isLoggedIn);
  const [editing, setEditing] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-[#181d26] tracking-[0.08px]">Đánh giá</h2>
        {reviewsData && reviewsData.averageRating !== null && (
          <span className="text-sm text-[rgba(4,14,32,0.55)]">
            {reviewsData.averageRating} ★ ({reviewsData.totalCount} đánh giá)
          </span>
        )}
      </div>

      {reviewsData && reviewsData.averageRating !== null && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-white border border-[#e0e2e6] rounded-2xl w-fit">
          <span className="text-4xl font-light text-[#181d26]">{reviewsData.averageRating}</span>
          <div>
            <StarRating rating={Math.round(reviewsData.averageRating)} />
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1">{reviewsData.totalCount} đánh giá</p>
          </div>
        </div>
      )}

      {isEnrolled && isLoggedIn && (
        <div className="mb-6">
          {myReview && !editing ? (
            <div className="bg-[#f8fafc] border border-[#e0e2e6] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#181d26]">Đánh giá của bạn</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium transition-colors"
                >
                  Sửa đánh giá
                </button>
              </div>
              <StarRating rating={myReview.rating} />
              {myReview.comment && (
                <p className="mt-2 text-sm text-[rgba(4,14,32,0.69)]">{myReview.comment}</p>
              )}
            </div>
          ) : (
            <ReviewForm
              courseId={courseId}
              initialReview={myReview ?? null}
              onCancel={myReview ? () => setEditing(false) : undefined}
            />
          )}
        </div>
      )}

      {reviewsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : reviewsData && reviewsData.reviews.length > 0 ? (
        <div className="space-y-5">
          {reviewsData.reviews.map((review) => (
            <div key={review.id} className="flex gap-4 pb-5 border-b border-[#f0f2f5] last:border-0 last:pb-0">
              {review.user.avatar ? (
                <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#1b61c9]">{review.user.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-[#181d26]">{review.user.name}</span>
                  <span className="text-xs text-[rgba(4,14,32,0.35)]">{formatDate(review.created_at)}</span>
                </div>
                <StarRating rating={review.rating} />
                {review.comment && (
                  <p className="mt-2 text-sm text-[rgba(4,14,32,0.69)] leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có đánh giá nào.</p>
      )}
    </div>
  );
}

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
  const isLoggedIn = !!user;
  const { data: course, isLoading } = useCourse(id);
  const { mutateAsync: enroll, isPending: enrolling } = useEnrollCourse();
  const { data: wishlist = [] } = useWishlist(isLoggedIn);
  const isWishlisted = wishlist.some((w) => w.course_id === id);

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

              {/* Reviews */}
              <ReviewsSection
                courseId={course.id}
                isEnrolled={course.is_enrolled}
                isLoggedIn={!!user}
              />
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
                      <div className="flex gap-2">
                        <button
                          onClick={handleEnroll}
                          disabled={enrolling}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#1b61c9] text-white py-3 rounded-xl font-medium text-sm tracking-[0.08px] hover:bg-[#254fad] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
                        >
                          {enrolling ? (
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                          ) : null}
                          {course.is_free ? "Đăng ký miễn phí" : `Mua ngay · ${formatPrice(course.price)}`}
                        </button>
                        <WishlistButton courseId={course.id} isWishlisted={isWishlisted} isLoggedIn={isLoggedIn} size="md" />
                      </div>
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
