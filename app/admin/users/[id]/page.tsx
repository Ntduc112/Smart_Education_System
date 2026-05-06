"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, X, Check, Plus, Search,
  BookOpen, Users, CreditCard, Globe, Lock,
} from "lucide-react";
import {
  useAdminUser, useUpdateUser, useDeleteUser,
  useStudentEnrollments, useAddEnrollment, useRemoveEnrollment,
  useTeacherCourses, useCourseSearch,
} from "../../admin.hook";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtVND(n: string) {
  const v = parseFloat(n);
  if (v === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    STUDENT: "bg-blue-50 text-blue-700",
    TEACHER: "bg-violet-50 text-violet-700",
    ADMIN:   "bg-amber-50 text-amber-700",
  };
  const label: Record<string, string> = { STUDENT: "Học sinh", TEACHER: "Giáo viên", ADMIN: "Admin" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[role] ?? ""}`}>
      {label[role] ?? role}
    </span>
  );
}

// ── Edit user modal ──────────────────────────────────────────────────────────

function EditModal({
  user,
  onClose,
}: {
  user:    { id: string; name: string; email: string; role: string };
  onClose: () => void;
}) {
  const update = useUpdateUser(user.id);
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });

  const handleSave = async () => {
    await update.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-[420px]"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#181d26]">Chỉnh sửa người dùng</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">
              Họ tên
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">
              Vai trò
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] bg-white transition-all"
            >
              <option value="STUDENT">Học sinh</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {update.isError && (
          <p className="mt-3 text-xs text-red-500">Cập nhật thất bại. Vui lòng thử lại.</p>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
          >
            {update.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add enrollment modal ─────────────────────────────────────────────────────

function AddEnrollmentModal({
  userId,
  enrolledIds,
  onClose,
}: {
  userId:      string;
  enrolledIds: string[];
  onClose:     () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: courses = [], isLoading } = useCourseSearch(search);
  const addEnrollment = useAddEnrollment(userId);

  const handleAdd = async (courseId: string) => {
    await addEnrollment.mutateAsync(courseId);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] flex flex-col"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#181d26]">Thêm khóa học</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên khóa học..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {search.trim().length === 0 && (
            <p className="text-xs text-center text-[rgba(4,14,32,0.4)] py-8">Nhập tên khóa học để tìm kiếm</p>
          )}
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          )}
          {courses.map((c) => {
            const enrolled = enrolledIds.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#e0e2e6] hover:bg-[#f8fafc]">
                <div className="w-10 h-7 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#181d26] truncate">{c.title}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)]">{c.instructor.name}</p>
                </div>
                {enrolled ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={12} /> Đã đăng ký
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(c.id)}
                    disabled={addEnrollment.isPending}
                    className="px-3 py-1.5 text-xs font-medium text-[#1b61c9] border border-[#1b61c9]/30 rounded-lg hover:bg-[#1b61c9]/5 transition-colors disabled:opacity-50"
                  >
                    Thêm
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Student courses section ──────────────────────────────────────────────────

function StudentCoursesSection({ userId }: { userId: string }) {
  const { data: enrollments = [], isLoading } = useStudentEnrollments(userId);
  const removeEnrollment = useRemoveEnrollment(userId);
  const [showAdd, setShowAdd]     = useState(false);
  const [removeId, setRemoveId]   = useState<string | null>(null);

  const enrolledIds = enrollments.map((e) => e.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#181d26]">Khóa học đã đăng ký</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1b61c9] border border-[#1b61c9]/30 rounded-xl hover:bg-[#1b61c9]/5 transition-colors"
        >
          <Plus size={12} /> Thêm khóa học
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-[rgba(4,14,32,0.4)] py-6 text-center">Chưa đăng ký khóa học nào.</p>
      ) : (
        <div className="space-y-2">
          {enrollments.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#e0e2e6] hover:bg-[#f8fafc] group"
            >
              <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#181d26] truncate">{course.title}</p>
                <p className="text-xs text-[rgba(4,14,32,0.45)]">{course.instructor.name}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                course.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
              }`}>
                {course.status === "PUBLISHED" ? "Công bố" : "Nháp"}
              </span>
              <button
                onClick={() => setRemoveId(course.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-[rgba(4,14,32,0.4)] hover:text-red-500 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Remove confirm */}
      {removeId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRemoveId(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-96"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#181d26] mb-2">Xóa khỏi khóa học?</h3>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">Học sinh sẽ mất quyền truy cập vào khóa học này.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemoveId(null)} className="px-4 py-2 text-sm font-medium border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc]">Hủy</button>
              <button
                onClick={() => { removeEnrollment.mutate(removeId); setRemoveId(null); }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <AddEnrollmentModal
          userId={userId}
          enrolledIds={enrolledIds}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── Teacher courses section ──────────────────────────────────────────────────

function TeacherCoursesSection({ userId }: { userId: string }) {
  const { data: courses = [], isLoading } = useTeacherCourses(userId);

  return (
    <div>
      <h2 className="text-sm font-semibold text-[#181d26] mb-4">Khóa học đã tạo</h2>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-[rgba(4,14,32,0.4)] py-6 text-center">Chưa tạo khóa học nào.</p>
      ) : (
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#e0e2e6] hover:bg-[#f8fafc]">
              <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#181d26] truncate">{c.title}</p>
                <p className="text-xs text-[rgba(4,14,32,0.45)]">{fmtVND(c.price)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-[rgba(4,14,32,0.5)] shrink-0">
                <Users size={11} /> {c._count.enrollments}
              </div>
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                c.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
              }`}>
                {c.status === "PUBLISHED" ? "Công bố" : "Nháp"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const { data: user, isLoading } = useAdminUser(id);
  const deleteUser = useDeleteUser();

  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="px-8 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-100 rounded-lg" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">Không tìm thấy người dùng.</p>
      </div>
    );
  }

  const backHref = user.role === "TEACHER" ? "/admin/teachers" : "/admin/students";

  return (
    <div className="px-8 py-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-semibold text-[#181d26]">Chi tiết người dùng</h1>
      </div>

      {/* User info card */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#1b61c9]/12 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-[#1b61c9]">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-[#181d26]">{user.name}</h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{user.email}</p>
            <p className="text-xs text-[rgba(4,14,32,0.35)] mt-1">
              Tham gia {new Date(user.created_at).toLocaleDateString("vi-VN")}
            </p>

            {/* Count badges */}
            <div className="flex items-center gap-4 mt-3">
              {user.role === "STUDENT" && (
                <div className="flex items-center gap-1.5 text-sm text-[rgba(4,14,32,0.6)]">
                  <BookOpen size={14} /> {user._count.enrollments} khóa đang học
                </div>
              )}
              {user.role === "TEACHER" && (
                <div className="flex items-center gap-1.5 text-sm text-[rgba(4,14,32,0.6)]">
                  <BookOpen size={14} /> {user._count.courses} khóa học đã tạo
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-[rgba(4,14,32,0.6)]">
                <CreditCard size={14} /> {user._count.payments} giao dịch
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
            >
              <Pencil size={13} /> Chỉnh sửa
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Courses section */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        {user.role === "STUDENT" ? (
          <StudentCoursesSection userId={id} />
        ) : (
          <TeacherCoursesSection userId={id} />
        )}
      </div>

      {/* Edit modal */}
      {showEdit && <EditModal user={user} onClose={() => setShowEdit(false)} />}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDelete(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-96"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#181d26] mb-2">Xóa người dùng?</h3>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu liên quan của người dùng sẽ bị xóa.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm font-medium border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc]">Hủy</button>
              <button
                onClick={() => { deleteUser.mutate(id); router.push(backHref); }}
                disabled={deleteUser.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60"
              >
                {deleteUser.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
