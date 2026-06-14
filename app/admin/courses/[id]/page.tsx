"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, ExternalLink, Users, BookOpen,
  Star, CreditCard, Loader2,
} from "lucide-react";
import {
  useAdminCourse, useUpdateAdminCourse, useDeleteAdminCourse,
} from "../../admin.hook";
import { useCategories } from "../../categories/categories.hook";
import { ConfirmModal } from "@/app/_components/ConfirmModal";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

const LEVEL_OPTIONS = [
  { value: "BEGINNER",     label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED",     label: "Nâng cao" },
];

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] p-4 flex items-center gap-3" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
      <div className="w-10 h-10 rounded-xl bg-[#1b61c9]/10 flex items-center justify-center text-[#1b61c9] shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-[#181d26] leading-none truncate">{value}</p>
        <p className="text-xs text-[rgba(4,14,32,0.5)] mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Field shells ───────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all";
const labelCls =
  "block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const { data: course, isLoading } = useAdminCourse(id);
  const { data: categories = [] }   = useCategories();
  const update = useUpdateAdminCourse(id);
  const remove = useDeleteAdminCourse();

  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", thumbnail: "",
    price: "0", discount_percent: "", level: "BEGINNER",
    category_id: "", status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });

  // Seed form once course loads.
  useEffect(() => {
    if (!course) return;
    setForm({
      title:            course.title,
      description:      course.description,
      thumbnail:        course.thumbnail,
      price:            String(parseFloat(course.price)),
      discount_percent: course.discount_percent != null ? String(course.discount_percent) : "",
      level:            course.level,
      category_id:      course.category_id,
      status:           course.status,
    });
  }, [course]);

  if (isLoading) {
    return (
      <div className="px-8 py-8 space-y-6 animate-pulse max-w-6xl mx-auto">
        <div className="h-6 w-40 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">Không tìm thấy khóa học.</p>
      </div>
    );
  }

  const handleSave = () => {
    update.mutate({
      title:            form.title,
      description:      form.description,
      thumbnail:        form.thumbnail,
      price:            parseFloat(form.price) || 0,
      discount_percent: form.discount_percent.trim() === "" ? null : parseInt(form.discount_percent),
      level:            form.level,
      category_id:      form.category_id,
      status:           form.status,
    });
  };

  return (
    <div className="px-8 py-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses"
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-semibold text-[#181d26]">Chi tiết khóa học</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/courses/${course.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
          >
            <ExternalLink size={14} /> Xem trang
          </Link>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
          >
            {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {update.isSuccess && !update.isPending && (
        <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">Đã lưu thay đổi.</p>
      )}
      {update.isError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">Lưu thất bại. Vui lòng thử lại.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: settings form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0e2e6] p-6 space-y-5" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
          <h2 className="text-sm font-semibold text-[#181d26]">Cài đặt khóa học</h2>

          <div>
            <label className={labelCls}>Tên khóa học</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cấp độ</label>
              <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={`${inputCls} bg-white`}>
                {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Danh mục</label>
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className={`${inputCls} bg-white`}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Giá (VND)</label>
              <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Giảm giá (%)</label>
              <input type="number" min={0} max={100} placeholder="0" value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ảnh bìa (URL)</label>
            <input value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Trạng thái</label>
            <div className="flex items-center gap-2">
              {(["DRAFT", "PUBLISHED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    form.status === s
                      ? s === "PUBLISHED"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-[#f0f2f5] border-[#e0e2e6] text-[#181d26]"
                      : "border-[#e0e2e6] text-[rgba(4,14,32,0.5)] hover:bg-[#f8fafc]"
                  }`}
                >
                  {s === "PUBLISHED" ? "Công bố" : "Nháp"}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-[#f0f2f5]">
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> Xóa khóa học
            </button>
          </div>
        </div>

        {/* Right: preview + stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
            <div className="aspect-video bg-[#f0f2f5] overflow-hidden">
              {form.thumbnail
                ? <img src={form.thumbnail} alt={form.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[rgba(4,14,32,0.3)]"><BookOpen size={32} /></div>}
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-[#181d26] line-clamp-2">{form.title || "Chưa có tên"}</p>
              <p className="text-base font-bold text-[#1b61c9] mt-1">{fmtVND(parseFloat(form.price) || 0)}</p>
              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-[#f0f2f5]">
                {course.instructor.avatar
                  ? <img src={course.instructor.avatar} alt={course.instructor.name} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center text-sm font-semibold text-[#1b61c9]">{course.instructor.name.charAt(0).toUpperCase()}</div>}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#181d26] truncate">{course.instructor.name}</p>
                  <p className="text-[11px] text-[rgba(4,14,32,0.45)] truncate">{course.instructor.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <StatCard icon={<Users size={18} />}      value={course._count.enrollments} label="Học viên đăng ký" />
            <StatCard icon={<BookOpen size={18} />}    value={course._count.sections}    label="Chương" />
            <StatCard icon={<Star size={18} />}        value={course._count.reviews}     label="Đánh giá" />
            <StatCard icon={<CreditCard size={18} />}  value={course._count.payments}    label="Giao dịch" />
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmModal
        open={showDelete}
        title="Xóa khóa học?"
        message="Hành động này không thể hoàn tác. Toàn bộ chương, bài học, đăng ký và đánh giá của khóa học sẽ bị xóa."
        confirmLabel="Xóa"
        isLoading={remove.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => remove.mutate(id, { onSuccess: () => router.push("/admin/courses") })}
      />
    </div>
  );
}
