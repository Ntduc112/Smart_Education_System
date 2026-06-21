"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Eye, MoreHorizontal, Trash2, Globe, Lock } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import {
  useTeacherCourses,
  useToggleCourseStatus,
  useDeleteCourse,
  TeacherCourse,
} from "./courses.hook";

// ── Palette (đồng bộ với teacher/home) ──────────────────────────────────────
const C = {
  canvas: "#EFF5FE", ink: "#181d26", inkSoft: "rgba(4,14,32,0.62)", inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4", blue: "#1b61c9", blueDark: "#254fad", sky: "#2E8BE6", emerald: "#0E9F6E", violet: "#7C5CFC", rose: "#E5484D",
};

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

// ── Atmosphere (đồng bộ teacher/home) ────────────────────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)", top: b.top, left: b.left, right: b.right, bottom: b.bottom }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }} />
      ))}
    </div>
  );
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
  const router = useRouter();

  return (
    <tr
      className="hover:bg-[#F4F8FE] transition-colors group cursor-pointer"
      onClick={() => router.push(`/teacher/courses/${course.id}/edit`)}
    >
      {/* Course info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "#E7EFFB" }}>
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-1" style={{ color: C.ink }}>{course.title}</p>
            <p className="text-xs mt-0.5" style={{ color: C.inkFaint }}>
              {course.category.name} · {LEVEL_LABEL[course.level] ?? course.level}
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
          style={
            course.status === "PUBLISHED"
              ? { background: "rgba(14,159,110,0.12)", color: C.emerald }
              : { background: "#EAF1FC", color: C.inkSoft }
          }
        >
          {course.status === "PUBLISHED" ? "Đã công bố" : "Nháp"}
        </span>
      </td>

      {/* Enrollments */}
      <td className="px-4 py-4 text-sm" style={{ color: C.ink }}>{course._count.enrollments}</td>

      {/* Price */}
      <td className="px-4 py-4 text-sm" style={{ color: C.ink }}>{formatPrice(course.price)}</td>

      {/* Updated */}
      <td className="px-4 py-4 text-xs" style={{ color: C.inkFaint }}>{timeAgo(course.updated_at)}</td>

      {/* Actions */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          {course.status === "PUBLISHED" && (
            <Link
              href={`/teacher/courses/${course.id}/students`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap hover:bg-[#F1ECFF]"
              style={{ color: C.violet }}
            >
              Tiến độ học viên
            </Link>
          )}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isOpen ? null : course.id);
              }}
              className="p-2 rounded-lg hover:bg-[#EAF1FC] transition-colors"
              style={{ color: C.inkFaint }}
            >
              <MoreHorizontal size={14} />
            </button>
            {isOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-52 bg-white rounded-xl py-1 z-50"
                style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
              >
                <Link
                  href={`/courses/${course.id}`}
                  target="_blank"
                  onClick={() => setMenuOpenId(null)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F4F8FE] transition-colors"
                  style={{ color: C.inkSoft }}
                >
                  <Eye size={14} />
                  Xem trang khóa học
                </Link>
                <button
                  onClick={() => { onToggleStatus(course); setMenuOpenId(null); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F4F8FE] transition-colors"
                  style={{ color: C.inkSoft }}
                >
                  {course.status === "PUBLISHED" ? <Lock size={14} /> : <Globe size={14} />}
                  {course.status === "PUBLISHED" ? "Chuyển về nháp" : "Công bố"}
                </button>
                <div className="border-t my-1" style={{ borderColor: "#EEF2F9" }} />
                <button
                  onClick={() => { onDelete(course.id); setMenuOpenId(null); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                  style={{ color: C.rose }}
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
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }} onClick={() => setMenuOpenId(null)}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Khóa học</h1>
            {!isLoading && (
              <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>{courses.length} khóa học</p>
            )}
          </div>
          <Link
            href="/teacher/courses/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b61c9] text-white text-sm font-semibold rounded-xl hover:bg-[#254fad] transition-colors"
            style={{ boxShadow: "rgba(27,97,201,0.32) 0px 6px 16px" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Tạo khóa học mới
          </Link>
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={tab === value ? { background: C.blue, color: "#fff" } : { background: "#EAF1FC", color: C.inkSoft }}
              >
                {label}
                {value !== "all" && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={tab === value ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "#DCE6F4", color: C.inkFaint }}
                  >
                    {countByStatus(value as "PUBLISHED" | "DRAFT")}
                  </span>
                )}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm khóa học..."
            className="max-w-sm flex-1 px-4 py-2 text-sm rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all placeholder:text-[rgba(4,14,32,0.35)] bg-white"
            style={{ border: `1px solid ${C.border}` }}
          />
        </div>

        {/* Table */}
        <div
          className="bg-white rounded-3xl"
          style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
        >
          {isLoading ? (
            <div className="animate-pulse">
              {/* Header */}
              <div className="flex items-center gap-4 px-6 py-3 border-b" style={{ borderColor: "#EEF2F9", background: "#F4F8FE" }}>
                <div className="h-3 w-24 rounded flex-1" style={{ background: "#E2ECF9" }} />
                <div className="h-3 w-20 rounded" style={{ background: "#E2ECF9" }} />
                <div className="h-3 w-14 rounded" style={{ background: "#E2ECF9" }} />
                <div className="h-3 w-16 rounded" style={{ background: "#E2ECF9" }} />
                <div className="h-3 w-20 rounded" style={{ background: "#E2ECF9" }} />
              </div>
              {/* Rows */}
              <div className="divide-y" style={{ borderColor: "#EEF2F9" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-14 h-10 rounded-lg shrink-0" style={{ background: "#E2ECF9" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded" style={{ background: "#E2ECF9" }} />
                      <div className="h-3 w-1/3 rounded" style={{ background: "#EAF1FC" }} />
                    </div>
                    <div className="h-6 w-20 rounded-full" style={{ background: "#EAF1FC" }} />
                    <div className="h-4 w-8 rounded" style={{ background: "#E2ECF9" }} />
                    <div className="h-4 w-14 rounded" style={{ background: "#E2ECF9" }} />
                    <div className="h-3 w-20 rounded" style={{ background: "#EAF1FC" }} />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: C.inkFaint }}>
                {search ? "Không tìm thấy khóa học nào." : "Chưa có khóa học nào."}
              </p>
              {!search && (
                <Link
                  href="/teacher/courses/new"
                  className="inline-block mt-3 text-sm font-medium hover:text-[#254fad]"
                  style={{ color: C.blue }}
                >
                  Tạo khóa học đầu tiên →
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "#EEF2F9", background: "#F4F8FE" }}>
                  {["Khóa học", "Trạng thái", "Học viên", "Giá", "Cập nhật", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider first:px-6 first:rounded-tl-3xl last:rounded-tr-3xl"
                      style={{ color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#EEF2F9" }}>
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
              className="bg-white rounded-3xl p-6 w-96"
              style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-base font-semibold mb-2" style={{ color: C.ink }}>Xóa khóa học?</h3>
              <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
                Hành động này không thể hoàn tác. Toàn bộ chương, bài học và dữ liệu liên quan sẽ bị xóa.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[#F4F8FE] transition-colors"
                  style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}
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
      </main>
    </div>
  );
}
