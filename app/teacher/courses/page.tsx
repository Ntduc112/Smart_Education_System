"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Eye, MoreHorizontal, Trash2, Globe, Lock, Users } from "lucide-react";
import {
  useTeacherCourses,
  useToggleCourseStatus,
  useDeleteCourse,
  TeacherCourse,
} from "./courses.hook";

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER:     "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED:     "Nâng cao",
  beginner:     "Cơ bản",
  intermediate: "Trung cấp",
  advanced:     "Nâng cao",
};

type Tab = "all" | "PUBLISHED" | "DRAFT";

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 86400) return "Hôm nay";
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// ── CourseRow ───────────────────────────────────────────────────────────────

function CourseRow({
  course,
  onToggleStatus,
  onDelete,
  menuOpenId,
  setMenuOpenId,
}: {
  course:         TeacherCourse;
  onToggleStatus: (c: TeacherCourse) => void;
  onDelete:       (id: string) => void;
  menuOpenId:     string | null;
  setMenuOpenId:  (id: string | null) => void;
}) {
  const isOpen = menuOpenId === course.id;

  return (
    <tr className="hover:bg-[#fafbfc] transition-colors group">
      {/* Course info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#f8fafc] shrink-0">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#181d26] line-clamp-1">{course.title}</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
              {course.category.name} · {LEVEL_LABEL[course.level] ?? course.level}
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            course.status === "PUBLISHED"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
          }`}
        >
          {course.status === "PUBLISHED" ? "Đã công bố" : "Nháp"}
        </span>
      </td>

      {/* Enrollments */}
      <td className="px-4 py-4 text-sm text-[#181d26]">{course._count.enrollments}</td>

      {/* Price */}
      <td className="px-4 py-4 text-sm text-[#181d26]">{formatPrice(course.price)}</td>

      {/* Updated */}
      <td className="px-4 py-4 text-xs text-[rgba(4,14,32,0.45)]">{timeAgo(course.updated_at)}</td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/teacher/courses/${course.id}/students`}
            className="p-2 rounded-lg hover:bg-[#f0f4fb] text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors opacity-0 group-hover:opacity-100"
            title="Tiến độ học viên"
          >
            <Users size={14} />
          </Link>
          <Link
            href={`/teacher/courses/${course.id}/edit`}
            className="p-2 rounded-lg hover:bg-[#f0f4fb] text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors opacity-0 group-hover:opacity-100"
            title="Chỉnh sửa"
          >
            <Pencil size={14} />
          </Link>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isOpen ? null : course.id);
              }}
              className="p-2 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.45)] transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {isOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-[#e0e2e6] py-1 z-10"
                style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px" }}
              >
                <Link
                  href={`/courses/${course.id}`}
                  target="_blank"
                  onClick={() => setMenuOpenId(null)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc] transition-colors"
                >
                  <Eye size={14} />
                  Xem trang khóa học
                </Link>
                <button
                  onClick={() => { onToggleStatus(course); setMenuOpenId(null); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc] transition-colors"
                >
                  {course.status === "PUBLISHED" ? <Lock size={14} /> : <Globe size={14} />}
                  {course.status === "PUBLISHED" ? "Chuyển về nháp" : "Công bố"}
                </button>
                <div className="border-t border-[#f0f2f5] my-1" />
                <button
                  onClick={() => { onDelete(course.id); setMenuOpenId(null); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Xóa khóa học
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TeacherCoursesPage() {
  const [tab, setTab]               = useState<Tab>("all");
  const [search, setSearch]         = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const { data: courses = [], isLoading } = useTeacherCourses();
  const toggleStatus = useToggleCourseStatus();
  const deleteCourse = useDeleteCourse();

  const filtered = courses.filter((c) => {
    const matchTab    = tab === "all" || c.status === tab;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const countByStatus = (s: "PUBLISHED" | "DRAFT") => courses.filter((c) => c.status === s).length;

  return (
    <div className="px-8 py-8" onClick={() => setMenuOpenId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Khóa học</h1>
          {!isLoading && (
            <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{courses.length} khóa học</p>
          )}
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors"
          style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo khóa học mới
        </Link>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-[#f0f2f5] rounded-xl p-1 gap-1">
          {(
            [
              ["all", "Tất cả"],
              ["PUBLISHED", "Đã công bố"],
              ["DRAFT", "Nháp"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === value
                  ? "bg-white text-[#181d26] shadow-sm"
                  : "text-[rgba(4,14,32,0.55)] hover:text-[#181d26]"
              }`}
            >
              {label}
              {value !== "all" && (
                <span className="ml-1.5 text-xs text-[rgba(4,14,32,0.4)]">
                  ({countByStatus(value as "PUBLISHED" | "DRAFT")})
                </span>
              )}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm khóa học..."
          className="max-w-sm flex-1 px-4 py-2 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all placeholder:text-[rgba(4,14,32,0.35)] bg-white"
        />
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        {isLoading ? (
          <div className="animate-pulse divide-y divide-[#f0f2f5]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-20 h-14 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[rgba(4,14,32,0.45)]">
              {search ? "Không tìm thấy khóa học nào." : "Chưa có khóa học nào."}
            </p>
            {!search && (
              <Link
                href="/teacher/courses/new"
                className="inline-block mt-3 text-sm text-[#1b61c9] font-medium hover:text-[#254fad]"
              >
                Tạo khóa học đầu tiên →
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f5] bg-[#f8fafc]">
                {["Khóa học", "Trạng thái", "Học viên", "Giá", "Cập nhật", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider first:px-6"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {filtered.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  onToggleStatus={(c) => toggleStatus.mutate(c)}
                  onDelete={(id) => setDeleteId(id)}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-96"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#181d26] mb-2">Xóa khóa học?</h3>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">
              Hành động này không thể hoàn tác. Toàn bộ chương, bài học và dữ liệu liên quan sẽ bị xóa.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { deleteCourse.mutate(deleteId); setDeleteId(null); }}
                disabled={deleteCourse.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteCourse.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
