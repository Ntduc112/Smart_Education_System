"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useCourse, useEnrollCourse, Chapter } from "../courses.hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useWishlist } from "@/app/student/wishlist/wishlist.hook";
import { WishlistButton } from "@/app/_components/WishlistButton";

// ── Palette (cozy-blue) ──────────────────────────────────────────────────────
const C = {
  canvas: "#EFF5FE",
  card: "#FFFFFF",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  emerald: "#0E9F6E",
  danger: "#e53e3e",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};

// ── Decorative floating blobs ─────────────────────────────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ] as const;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)",
            top: "top" in b ? b.top : undefined, left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined, bottom: "bottom" in b ? b.bottom : undefined,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

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
            <StarEmpty className="text-[#cdd9ec] hover:text-[#f59e0b] w-7 h-7" />
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
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: "#F4F8FE", border: `1px solid ${C.border}` }}>
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: C.ink }}>Đánh giá của bạn</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1b61c9] resize-none bg-white"
          style={{ color: C.ink, border: `1px solid ${C.border}` }}
        />
      </div>
      {formError && <p className="text-xs" style={{ color: C.danger }}>{formError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
        >
          {isPending ? "Đang gửi..." : initialReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium transition-colors hover:text-[#181d26]"
            style={{ color: C.inkSoft }}
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
        <h2 className="font-display text-xl font-semibold" style={{ color: C.ink }}>Đánh giá</h2>
        {reviewsData && reviewsData.averageRating !== null && (
          <span className="text-sm" style={{ color: C.inkSoft }}>
            {reviewsData.averageRating} ★ ({reviewsData.totalCount} đánh giá)
          </span>
        )}
      </div>

      {reviewsData && reviewsData.averageRating !== null && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl w-fit bg-white" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
          <span className="font-display text-4xl font-light" style={{ color: C.ink }}>{reviewsData.averageRating}</span>
          <div>
            <StarRating rating={Math.round(reviewsData.averageRating)} />
            <p className="text-xs mt-1" style={{ color: C.inkFaint }}>{reviewsData.totalCount} đánh giá</p>
          </div>
        </div>
      )}

      {isEnrolled && isLoggedIn && (
        <div className="mb-6">
          {myReview && !editing ? (
            <div className="rounded-2xl p-5" style={{ background: "#F4F8FE", border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: C.ink }}>Đánh giá của bạn</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs hover:text-[#254fad] font-medium transition-colors"
                  style={{ color: C.blue }}
                >
                  Sửa đánh giá
                </button>
              </div>
              <StarRating rating={myReview.rating} />
              {myReview.comment && (
                <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>{myReview.comment}</p>
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
              <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "#E2ECF9" }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded" style={{ background: "#E2ECF9" }} />
                <div className="h-3 w-full rounded" style={{ background: "#E2ECF9" }} />
              </div>
            </div>
          ))}
        </div>
      ) : reviewsData && reviewsData.reviews.length > 0 ? (
        <div className="space-y-5">
          {reviewsData.reviews.map((review) => (
            <div key={review.id} className="flex gap-4 pb-5 border-b last:border-0 last:pb-0" style={{ borderColor: "#EEF3FB" }}>
              {review.user.avatar ? (
                <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(27,97,201,0.12)" }}>
                  <span className="text-sm font-bold" style={{ color: C.blue }}>{review.user.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium" style={{ color: C.ink }}>{review.user.name}</span>
                  <span className="text-xs" style={{ color: C.inkFaint }}>{formatDate(review.created_at)}</span>
                </div>
                <StarRating rating={review.rating} />
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.inkSoft }}>{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: C.inkFaint }}>Chưa có đánh giá nào.</p>
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

function formatPriceNum(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function discountedPrice(price: string, percent: number | null | undefined): number | null {
  if (!percent || percent <= 0) return null;
  return parseFloat(price) * (1 - percent / 100);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CurriculumChapter({ chapter }: { chapter: Chapter }) {
  const [open, setOpen] = useState(true);
  const freeCount = chapter.lessons.filter((l) => l.is_free).length;

  return (
    <div className="rounded-2xl overflow-hidden bg-white" style={{ border: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left hover:bg-[#F4F8FE]"
        style={{ background: "#F4F8FE" }}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`}
            style={{ color: C.inkFaint }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="font-medium tracking-[0.08px]" style={{ color: C.ink }}>{chapter.title}</span>
        </div>
        <span className="text-xs shrink-0 ml-4" style={{ color: C.inkFaint }}>
          {chapter.lessons.length} bài{freeCount > 0 ? ` · ${freeCount} miễn phí` : ""}
        </span>
      </button>

      {open && (
        <ul className="divide-y" style={{ borderColor: "#EEF3FB" }}>
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 border-t first:border-t-0" style={{ borderColor: "#EEF3FB" }}>
              {lesson.is_free ? (
                <svg className="shrink-0" style={{ color: C.blue }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              ) : (
                <svg className="shrink-0" style={{ color: C.inkFaint }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              <span className="text-sm flex-1 tracking-[0.07px]" style={{ color: lesson.is_free ? C.ink : C.inkSoft }}>
                {lesson.title}
              </span>
              {lesson.is_free && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
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
      <div className="h-5 w-40 rounded mb-8" style={{ background: "#E2ECF9" }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
          <div className="h-5 w-1/2 rounded" style={{ background: "#E2ECF9" }} />
          <div className="space-y-2 mt-6">
            <div className="h-4 w-full rounded" style={{ background: "#E2ECF9" }} />
            <div className="h-4 w-full rounded" style={{ background: "#E2ECF9" }} />
            <div className="h-4 w-2/3 rounded" style={{ background: "#E2ECF9" }} />
          </div>
        </div>
        <div className="h-80 rounded-3xl" style={{ background: "#E2ECF9" }} />
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
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {isLoading ? <DetailSkeleton /> : course ? (
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* ── Left: Content ── */}
            <div className="lg:col-span-2">
              {/* Meta row: back + badges */}
              <div className="flex items-center gap-3 mb-4">
                <motion.button
                  onClick={() => router.back()}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex items-center gap-1.5 rounded-lg bg-white py-1.5 pl-2 pr-3 text-xs font-medium transition-colors hover:text-[#254fad]"
                  style={{ border: `1px solid ${C.border}`, color: C.blue, boxShadow: CARD_SHADOW }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Quay lại
                </motion.button>
                <span className="h-4 w-px shrink-0" style={{ background: C.border }} />
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
                  {course.category.name}
                </span>
                <span className="rounded-full px-2.5 py-1 text-xs" style={{ color: C.inkSoft, background: "#EAF1FC" }}>
                  {LEVEL_LABEL[course.level] ?? course.level}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl font-semibold leading-snug mb-5 tracking-[0.08px]" style={{ color: C.ink }}>
                {course.title}
              </h1>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt={course.instructor.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(27,97,201,0.12)" }}>
                    <span className="text-sm font-bold" style={{ color: C.blue }}>{course.instructor.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm tracking-[0.07px]" style={{ color: C.inkFaint }}>Giảng viên</p>
                  <p className="text-sm font-medium" style={{ color: C.ink }}>{course.instructor.name}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b" style={{ borderColor: C.border }}>
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
                  <div key={i} className="flex items-center gap-2" style={{ color: C.inkSoft }}>
                    {s.icon}
                    <span className="text-sm tracking-[0.07px]">{s.text}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-10">
                <h2 className="font-display text-xl font-semibold mb-3 tracking-[0.08px]" style={{ color: C.ink }}>Mô tả khóa học</h2>
                <p className="leading-relaxed tracking-[0.18px]" style={{ color: C.inkSoft }}>
                  {course.description}
                </p>
              </div>

              {/* Curriculum */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-4 tracking-[0.08px]" style={{ color: C.ink }}>
                  Nội dung khóa học
                  <span className="ml-2 text-sm font-normal" style={{ color: C.inkFaint }}>
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
                  className="rounded-3xl overflow-hidden bg-white"
                  style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-6">
                    {/* Price */}
                    <div className="mb-5">
                      {course.is_free ? (
                        <span className="font-display text-2xl font-semibold" style={{ color: C.emerald }}>Miễn phí</span>
                      ) : discountedPrice(course.price, course.discount_percent) !== null ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-display text-2xl font-semibold" style={{ color: C.danger }}>
                            {formatPriceNum(discountedPrice(course.price, course.discount_percent)!)}
                          </span>
                          <span className="text-sm line-through" style={{ color: C.inkFaint }}>
                            {formatPrice(course.price)}
                          </span>
                          <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded" style={{ background: C.danger }}>
                            -{course.discount_percent}%
                          </span>
                        </div>
                      ) : (
                        <span className="font-display text-2xl font-semibold" style={{ color: C.ink }}>{formatPrice(course.price)}</span>
                      )}
                    </div>

                    {/* CTA */}
                    {enrollSuccess ? (
                      <div className="mb-5 flex flex-col items-center gap-2 py-4 px-4 rounded-xl text-center" style={{ background: "rgba(14,159,110,0.08)", border: `1px solid rgba(14,159,110,0.25)` }}>
                        <svg style={{ color: C.emerald }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <p className="text-sm font-semibold" style={{ color: C.emerald }}>Đăng ký thành công!</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>Đang chuyển sang trang học...</p>
                      </div>
                    ) : (
                      <>
                        {enrollError && (
                          <p className="text-xs mb-3 px-1" style={{ color: C.danger }}>{enrollError}</p>
                        )}
                      </>
                    )}

                    {!enrollSuccess && (course.is_enrolled ? (
                      <Link
                        href={`/student/courses/${course.id}/learn`}
                        className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-medium text-sm tracking-[0.08px] hover:brightness-95 transition-all"
                        style={{ background: C.emerald }}
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
                          className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-medium text-sm tracking-[0.08px] hover:bg-[#254fad] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
                        >
                          {enrolling ? (
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                          ) : null}
                          {course.is_free
                            ? "Đăng ký miễn phí"
                            : discountedPrice(course.price, course.discount_percent) !== null
                              ? `Mua ngay · ${formatPriceNum(discountedPrice(course.price, course.discount_percent)!)}`
                              : `Mua ngay · ${formatPrice(course.price)}`
                          }
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
                        <li key={f.text} className="flex items-center gap-2.5 text-sm" style={{ color: C.inkSoft }}>
                          <span>{f.icon}</span>
                          <span>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p style={{ color: C.inkSoft }}>Không tìm thấy khóa học.</p>
            <Link href="/courses" className="mt-4 inline-block text-sm hover:text-[#254fad]" style={{ color: C.blue }}>
              ← Quay lại danh sách
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
