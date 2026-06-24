"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Route, Plus, Loader2, X, BookOpen } from "lucide-react";
import { useRoadmaps, useCreateRoadmap } from "./roadmaps.hook";

const inputCls = "w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all";

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
    }`}>
      {status === "PUBLISHED" ? "Công bố" : "Nháp"}
    </span>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateRoadmap();
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [error, setError]             = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) { setError("Nhập tên và mô tả lộ trình"); return; }
    try {
      await create.mutateAsync({ title: title.trim(), description: description.trim() });
      onClose();
    } catch {
      setError("Tạo lộ trình thất bại, vui lòng thử lại");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-[460px] mx-4"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#181d26]">Tạo lộ trình</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Tên lộ trình</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Lập trình Frontend" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Mô tả</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lộ trình này dành cho ai, học xong làm được gì..." className={`${inputCls} resize-none`} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors">Hủy</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60 flex items-center gap-2">
              {create.isPending && <Loader2 size={14} className="animate-spin" />}
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-8 py-8 animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}

export default function AdminRoadmapsPage() {
  const router = useRouter();
  const { data: roadmaps, isLoading } = useRoadmaps();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading && !roadmaps) return <Skeleton />;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Lộ trình</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{roadmaps?.length ?? 0} lộ trình học</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1b61c9] text-white text-sm font-semibold rounded-xl hover:bg-[#254fad] transition-colors"
        >
          <Plus size={16} /> Tạo lộ trình
        </button>
      </div>

      {/* Grid */}
      {(roadmaps?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center py-20 text-[rgba(4,14,32,0.35)]">
          <Route size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Chưa có lộ trình nào. Tạo lộ trình đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps!.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/admin/roadmaps/${r.id}`)}
              className="text-left bg-white rounded-2xl border border-[#e0e2e6] p-5 hover:border-[#1b61c9]/40 transition-colors"
              style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#1b61c9]/[0.09] flex items-center justify-center text-[#1b61c9] shrink-0">
                  <Route size={20} />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <h3 className="font-semibold text-[#181d26] line-clamp-1">{r.title}</h3>
              <p className="text-sm text-[rgba(4,14,32,0.55)] line-clamp-2 mt-1 min-h-[2.5rem]">{r.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-[rgba(4,14,32,0.45)] mt-3 pt-3 border-t border-[#f0f2f5]">
                <BookOpen size={13} /> {r._count.items} khóa học
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
