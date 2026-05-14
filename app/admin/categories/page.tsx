"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, X, Loader2 } from "lucide-react";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  Category,
} from "./categories.hook";
import { getApiError } from "@/lib/api/error";

// ── Modal form ────────────────────────────────────────────────────────────────

function CategoryModal({
  initial,
  onClose,
  onSave,
  isLoading,
}: {
  initial?: Category;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName]               = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 p-6"
        style={{ boxShadow: "rgba(15,48,106,0.12) 0px 8px 40px" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#181d26]">
            {initial ? "Sửa danh mục" : "Thêm danh mục"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f2f5] transition-colors"
          >
            <X size={16} className="text-[rgba(4,14,32,0.5)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#181d26] mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lập trình web"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#181d26] mb-1.5">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về danh mục..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e0e2e6] text-sm font-medium text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-sm font-medium text-white hover:bg-[#1550a8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {initial ? "Lưu thay đổi" : "Thêm danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-100 rounded-lg" />
        <div className="h-10 w-36 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createMut  = useCreateCategory();
  const updateMut  = useUpdateCategory();
  const deleteMut  = useDeleteCategory();

  const [modal, setModal]         = useState<"add" | Category | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const handleSave = async (data: { name: string; description: string }) => {
    setError(null);
    try {
      if (modal === "add") {
        await createMut.mutateAsync(data);
      } else if (modal && typeof modal === "object") {
        await updateMut.mutateAsync({ id: modal.id, ...data });
      }
      setModal(null);
    } catch (err) {
      setError(getApiError(err, "Lưu thất bại"));
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteMut.mutateAsync(id);
      setDeleteId(null);
    } catch (err) {
      setError(getApiError(err, "Xóa thất bại"));
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  if (isLoading) return <Skeleton />;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Danh mục</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
            {categories?.length ?? 0} danh mục
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b61c9] text-sm font-medium text-white hover:bg-[#1550a8] transition-colors"
        >
          <Plus size={16} />
          Thêm danh mục
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}

      {/* Grid */}
      {categories?.length === 0 ? (
        <div className="text-center py-16 text-[rgba(4,14,32,0.4)]">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có danh mục nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {categories?.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#e0e2e6] p-5"
              style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#181d26] truncate">{cat.name}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5 line-clamp-2">
                    {cat.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[rgba(4,14,32,0.45)]">
                  <BookOpen size={13} />
                  <span>{cat._count.courses} khóa học</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal(cat)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f2f5] transition-colors"
                  >
                    <Pencil size={13} className="text-[rgba(4,14,32,0.5)]" />
                  </button>

                  {deleteId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteMut.isPending}
                        className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleteMut.isPending ? <Loader2 size={11} className="animate-spin" /> : "Xóa"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-1 rounded-lg bg-[#f0f2f5] text-xs font-medium text-[rgba(4,14,32,0.6)] hover:bg-[#e8eaed] transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <CategoryModal
          initial={modal === "add" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
