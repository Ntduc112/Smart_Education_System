"use client";

import Link from "next/link";
import { Plus, BookOpen, Users } from "lucide-react";
import {
  useTeacherDashboard,
  RecentCourse,
  RecentEnrollment,
} from "./dashboard.hook";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Me {
  id: string;
  name: string;
  email: string;
}

function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn:  async () => (await api.get<{ user: Me }>("/user/me")).data.user,
    retry: false,
    staleTime: 60_000,
  });
}

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

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6]"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px] mb-1">{label}</p>
      <p className={`text-3xl font-semibold ${accent ?? "text-[#181d26]"}`}>{value}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6] animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-100 rounded" />
    </div>
  );
}

// ── RecentCourseRow ─────────────────────────────────────────────────────────

function RecentCourseRow({ course }: { course: RecentCourse }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#f0f2f5] last:border-0">
      <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#f8fafc] shrink-0">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
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
      <Link
        href={`/teacher/courses/${course.id}/edit`}
        className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium whitespace-nowrap shrink-0"
      >
        Chỉnh sửa →
      </Link>
    </div>
  );
}

// ── RecentEnrollmentRow ─────────────────────────────────────────────────────

function RecentEnrollmentRow({ enrollment }: { enrollment: RecentEnrollment }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f2f5] last:border-0">
      {enrollment.user.avatar ? (
        <img
          src={enrollment.user.avatar}
          alt={enrollment.user.name}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-[#1b61c9]">
            {enrollment.user.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{enrollment.user.name}</p>
        <p className="text-xs text-[rgba(4,14,32,0.55)] truncate">{enrollment.course.title}</p>
      </div>
      <span className="text-xs text-[rgba(4,14,32,0.4)] whitespace-nowrap shrink-0">
        {timeAgo(enrollment.enrolled_at)}
      </span>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TeacherDashboardPage() {
  const { data: user }      = useMe();
  const { data, isLoading } = useTeacherDashboard();

  return (
    <div className="px-8 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-[#181d26]">
            {getGreeting()},{" "}
            <span className="font-semibold">
              {user?.name?.split(" ").pop() ?? "thầy/cô"}!
            </span>
          </h1>
          <p className="text-[rgba(4,14,32,0.55)] mt-1.5 tracking-[0.18px]">
            Đây là tổng quan hoạt động giảng dạy của bạn.
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors shrink-0"
          style={{
            boxShadow:
              "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo khóa học mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Tổng khóa học"    value={data?.stats.total_courses ?? 0} />
            <StatCard label="Đã công bố"        value={data?.stats.published ?? 0}    accent="text-emerald-700" />
            <StatCard label="Đang nháp"         value={data?.stats.draft ?? 0}        accent="text-[rgba(4,14,32,0.55)]" />
            <StatCard label="Tổng học viên"     value={data?.stats.total_students ?? 0} />
            <StatCard
              label="Doanh thu tháng này"
              value={formatVND(data?.stats.revenue_this_month ?? 0)}
              accent="text-[#1b61c9]"
            />
          </>
        )}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <BookOpen size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Khóa học gần đây
            </h2>
            <Link
              href="/teacher/courses"
              className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]"
            >
              Xem tất cả →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-center py-3 border-b border-[#f0f2f5]"
                >
                  <div className="w-14 h-10 bg-gray-100 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-3/4 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recent_courses.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có khóa học nào.</p>
            </div>
          ) : (
            data.recent_courses.map((c) => <RecentCourseRow key={c.id} course={c} />)
          )}
        </div>

        {/* Recent Enrollments */}
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <Users size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Đăng ký mới
            </h2>
            <Link
              href="/teacher/analytics"
              className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]"
            >
              Xem phân tích →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center py-3 border-b border-[#f0f2f5]"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-1/2 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recent_enrollments.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[rgba(4,14,32,0.45)]">
                Chưa có học viên nào đăng ký.
              </p>
            </div>
          ) : (
            data.recent_enrollments.map((e, i) => (
              <RecentEnrollmentRow key={i} enrollment={e} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
