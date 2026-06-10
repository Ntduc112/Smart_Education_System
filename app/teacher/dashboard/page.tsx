"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Users, TrendingUp } from "lucide-react";
import {
  useMe,
  useTeacherDashboard,
  RecentCourse,
  RecentEnrollment,
} from "./dashboard.hook";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ── RecentCourseRow ─────────────────────────────────────────────────────────

function RecentCourseRow({ course }: { course: RecentCourse }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#f0f2f5] last:border-0">
      <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#f8fafc] shrink-0">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{course.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider ${
              course.status === "PUBLISHED"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
            }`}
          >
            {course.status === "PUBLISHED" ? "Đã công bố" : "Nháp"}
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.45)]">
            {course.enrollment_count} học viên
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {course.status === "PUBLISHED" && (
          <Link
            href={`/teacher/courses/${course.id}/students`}
            className="text-xs text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap"
          >
            Học sinh →
          </Link>
        )}
        <Link
          href={`/teacher/courses/${course.id}/edit`}
          className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium whitespace-nowrap"
        >
          Chỉnh sửa →
        </Link>
      </div>
    </div>
  );
}

// ── RecentEnrollmentRow ─────────────────────────────────────────────────────

function RecentEnrollmentRow({ enrollment }: { enrollment: RecentEnrollment }) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative shrink-0">
        {enrollment.user.avatar ? (
          <img
            src={enrollment.user.avatar}
            alt={enrollment.user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#1b61c9]">
              {enrollment.user.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-[#f0f2f5] last:border-0 last:pb-0">
        <p className="text-sm font-medium text-[#181d26] leading-tight">{enrollment.user.name}</p>
        <p className="text-xs text-[rgba(4,14,32,0.55)] truncate mt-0.5">
          đăng ký{" "}
          <span className="text-[#1b61c9]">{enrollment.course.title}</span>
        </p>
        <p className="text-[11px] text-[rgba(4,14,32,0.35)] mt-0.5">{timeAgo(enrollment.enrolled_at)}</p>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const CARD_SHADOW = "rgba(15,48,106,0.06) 0px 0px 0px 1px, rgba(15,48,106,0.04) 0px 4px 16px";

type CourseFilter = "all" | "PUBLISHED" | "DRAFT";

export default function TeacherDashboardPage() {
  const { data: user }      = useMe();
  const { data, isLoading } = useTeacherDashboard();
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");

  return (
    <div className="p-6" style={{ minHeight: "100vh" }}>
      <div
        className="grid gap-4 h-full"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "180px 1fr",
          gridTemplateAreas: `
            "welcome welcome students revenue"
            "courses courses courses  enroll"
          `,
          minHeight: "calc(100vh - 48px)",
        }}
      >
        {/* ── Welcome Hero ── */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col justify-between"
          style={{ gridArea: "welcome", boxShadow: CARD_SHADOW }}
        >
          <div>
            <p className="text-sm text-[rgba(4,14,32,0.45)] mb-1">{getGreeting()},</p>
            <h1 className="text-2xl font-semibold text-[#181d26] leading-tight">
              {user?.name ?? "Thầy/cô"}
            </h1>
            <p className="text-sm text-[rgba(4,14,32,0.5)] mt-1.5">
              Tổng quan hoạt động giảng dạy của bạn.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/teacher/courses/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors"
              style={{ boxShadow: "rgba(27,97,201,0.35) 0px 4px 14px" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Tạo khóa học
            </Link>
            <Link
              href="/teacher/analytics"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc] text-[#181d26] text-sm font-medium rounded-xl hover:bg-[#f0f2f5] transition-colors border border-[#e0e2e6]"
            >
              <TrendingUp size={15} strokeWidth={2} />
              Phân tích
            </Link>
          </div>
        </div>

        {/* ── Students Stat ── */}
        <div
          className="bg-white rounded-2xl p-5 flex flex-col justify-between"
          style={{ gridArea: "students", boxShadow: CARD_SHADOW }}
        >
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Users size={18} className="text-violet-600" strokeWidth={2} />
          </div>
          <div>
            <p className="text-3xl font-semibold text-[#181d26]">
              {isLoading ? <span className="text-[rgba(4,14,32,0.2)]">—</span> : (data?.stats.total_students ?? 0)}
            </p>
            <p className="text-sm text-[rgba(4,14,32,0.5)] mt-0.5">Tổng học viên</p>
          </div>
        </div>

        {/* ── Revenue Stat ── */}
        <div
          className="rounded-2xl p-5 flex flex-col justify-between"
          style={{
            gridArea: "revenue",
            background: "linear-gradient(135deg, #1b61c9 0%, #3b82f6 100%)",
            boxShadow: "rgba(27,97,201,0.4) 0px 8px 24px",
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white leading-tight">
              {isLoading ? <span className="text-white/40">—</span> : formatVND(data?.stats.revenue_this_month ?? 0)}
            </p>
            <p className="text-sm text-white/65 mt-0.5">Doanh thu tháng này</p>
          </div>
        </div>

        {/* ── Recent Courses ── */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col overflow-hidden"
          style={{ gridArea: "courses", boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <BookOpen size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Khóa học gần đây
            </h2>
            <Link href="/teacher/courses" className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]">
              Xem tất cả →
            </Link>
          </div>
          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
            {(
              [
                { key: "all",       label: "Tất cả",     count: data?.stats.total_courses },
                { key: "PUBLISHED", label: "Đã công bố", count: data?.stats.published },
                { key: "DRAFT",     label: "Nháp",       count: data?.stats.draft },
              ] as { key: CourseFilter; label: string; count?: number }[]
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setCourseFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  courseFilter === key
                    ? "bg-[#1b61c9] text-white"
                    : "bg-[#f0f2f5] text-[rgba(4,14,32,0.6)] hover:bg-[#e5e8ec]"
                }`}
              >
                {label}
                {!isLoading && count !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      courseFilter === key
                        ? "bg-white/25 text-white"
                        : "bg-[#e0e2e6] text-[rgba(4,14,32,0.5)]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-1 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center py-3 border-b border-[#f0f2f5]">
                    <div className="w-14 h-10 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-3/4 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const filtered = (data?.recent_courses ?? []).filter(
                (c) => courseFilter === "all" || c.status === courseFilter
              );
              return filtered.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có khóa học nào.</p>
                </div>
              ) : (
                filtered.map((c) => <RecentCourseRow key={c.id} course={c} />)
              );
            })()}
          </div>
        </div>

        {/* ── Recent Enrollments ── */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col overflow-hidden"
          style={{ gridArea: "enroll", boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <Users size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Đăng ký mới
            </h2>
            <Link href="/teacher/analytics" className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]">
              Xem phân tích →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-1/2 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-3/4 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.recent_enrollments.length ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có học viên nào đăng ký.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recent_enrollments.map((e, i) => (
                  <RecentEnrollmentRow key={i} enrollment={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
