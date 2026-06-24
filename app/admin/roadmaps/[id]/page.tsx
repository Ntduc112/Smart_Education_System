"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Route, Trash2, Loader2, ArrowUp, ArrowDown, X, Check,
  Search, Plus, Save, Clock,
} from "lucide-react";
import {
  useRoadmap, useUpdateRoadmap, useDeleteRoadmap,
  useAttachCourse, useUpdateItem, useRemoveItem,
  type RoadmapItem,
} from "../roadmaps.hook";
import { useCourseSearch } from "../../admin.hook";

const inputCls = "w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all";

// ── Attach course panel ────────────────────────────────────────────────────────

function AttachPanel({ roadmapId, attachedIds }: { roadmapId: string; attachedIds: Set<string> }) {
  const [search, setSearch] = useState("");
  const [query, setQuery]   = useState("");
  const { data: results = [], isLoading } = useCourseSearch(query);
  const attach = useAttachCourse(roadmapId);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] p-5" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
      <h3 className="text-sm font-semibold text-[#181d26] mb-3">Thêm khóa học vào lộ trình</h3>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm khóa học theo tên..."
          className={`${inputCls} pl-9`}
        />
      </div>
      {query.trim().length >= 1 && (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-[rgba(4,14,32,0.45)] py-2">Đang tìm...</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-[rgba(4,14,32,0.45)] py-2">Không tìm thấy khóa học.</p>
          ) : (
            results.map((c) => {
              const already = attachedIds.has(c.id);
              return (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8fafc]">
                  <div className="w-12 h-8 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#181d26] line-clamp-1">{c.title}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.45)] line-clamp-1">{c.instructor.name}</p>
                  </div>
                  <button
                    disabled={already || attach.isPending}
                    onClick={() => attach.mutate(c.id)}
                    className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#e0e2e6] text-[#1b61c9] hover:bg-[#1b61c9]/6 transition-colors disabled:opacity-50"
                  >
                    {already ? "Đã thêm" : <><Plus size={13} /> Thêm</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Course row in the ordered path ─────────────────────────────────────────────

function PathRow({
  item, index, total, roadmapId, onMoveUp, onMoveDown, reordering,
}: {
  item: RoadmapItem; index: number; total: number; roadmapId: string;
  onMoveUp: () => void; onMoveDown: () => void; reordering: boolean;
}) {
  const remove = useRemoveItem(roadmapId);

  return (
    <div className="flex items-center gap-4">
      {/* Step number + connector */}
      <div className="flex flex-col items-center self-stretch">
        <div className="w-8 h-8 rounded-full bg-[#1b61c9] text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {index + 1}
        </div>
        {index < total - 1 && <div className="w-px flex-1 bg-[#dbe4f3] my-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-[#e0e2e6] p-3 mb-3" style={{ boxShadow: "rgba(15,48,106,0.04) 0px 0px 14px" }}>
        <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
          <img src={item.course.thumbnail} alt={item.course.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#181d26] line-clamp-1">{item.course.title}</p>
          <p className="text-xs text-[rgba(4,14,32,0.45)] line-clamp-1">{item.course.instructor.name}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0 || reordering}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.5)] hover:bg-[#f8fafc] disabled:opacity-30 transition-colors">
            <ArrowUp size={13} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1 || reordering}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.5)] hover:bg-[#f8fafc] disabled:opacity-30 transition-colors">
            <ArrowDown size={13} />
          </button>
          <button onClick={() => remove.mutate(item.id)} disabled={remove.isPending}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e0e2e6] text-red-400 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pending proposal row ────────────────────────────────────────────────────────

function PendingRow({ item, roadmapId }: { item: RoadmapItem; roadmapId: string }) {
  const update = useUpdateItem(roadmapId);
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-amber-200 p-3" style={{ boxShadow: "rgba(15,48,106,0.04) 0px 0px 14px" }}>
      <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
        <img src={item.course.thumbnail} alt={item.course.title} className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#181d26] line-clamp-1">{item.course.title}</p>
        <p className="text-xs text-[rgba(4,14,32,0.45)] line-clamp-1">Đề xuất bởi {item.course.instructor.name}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => update.mutate({ itemId: item.id, status: "APPROVED" })} disabled={update.isPending}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          <Check size={13} /> Duyệt
        </button>
        <button onClick={() => update.mutate({ itemId: item.id, status: "REJECTED" })} disabled={update.isPending}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#e0e2e6] text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
          <X size={13} /> Từ chối
        </button>
      </div>
    </div>
  );
}

// ── Edit info ───────────────────────────────────────────────────────────────────

function InfoPanel({ roadmapId, roadmap }: { roadmapId: string; roadmap: { title: string; description: string; status: "DRAFT" | "PUBLISHED" } }) {
  const update = useUpdateRoadmap(roadmapId);
  const [title, setTitle]             = useState(roadmap.title);
  const [description, setDescription] = useState(roadmap.description);

  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] p-5 space-y-4" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
      <h3 className="text-sm font-semibold text-[#181d26]">Thông tin lộ trình</h3>
      <div>
        <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Tên</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Mô tả</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
      </div>
      <button
        onClick={() => update.mutate({ title, description })}
        disabled={update.isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
      >
        {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminRoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: roadmap, isLoading } = useRoadmap(id);
  const updateRoadmap = useUpdateRoadmap(id);
  const deleteRoadmap = useDeleteRoadmap();
  const updateItem    = useUpdateItem(id);

  if (isLoading) {
    return (
      <div className="px-8 py-8 animate-pulse space-y-6">
        <div className="h-6 w-40 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!roadmap) {
    return <div className="px-8 py-20 text-center text-sm text-red-500">Không tìm thấy lộ trình.</div>;
  }

  const approved = roadmap.items.filter((i) => i.status === "APPROVED");
  const pending  = roadmap.items.filter((i) => i.status === "PENDING");
  const attachedIds = new Set(roadmap.items.filter((i) => i.status !== "REJECTED").map((i) => i.course.id));
  const isPublished = roadmap.status === "PUBLISHED";

  const handleDelete = () => {
    if (!confirm("Xóa lộ trình này? Hành động không thể hoàn tác.")) return;
    deleteRoadmap.mutate(id, { onSuccess: () => router.push("/admin/roadmaps") });
  };

  // Move an item up/down, then normalise every order to its 0-based position.
  // Robust against tied/non-contiguous orders (proposals approved with default order 0).
  const moveItem = async (index: number, dir: -1 | 1) => {
    const arr = [...approved];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].order !== i) await updateItem.mutateAsync({ itemId: arr[i].id, order: i });
    }
  };

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <button onClick={() => router.push("/admin/roadmaps")} className="flex items-center gap-1 text-sm text-[rgba(4,14,32,0.5)] hover:text-[#1b61c9] transition-colors mb-3">
          <ChevronLeft size={15} /> Lộ trình
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1b61c9]/[0.09] flex items-center justify-center text-[#1b61c9] shrink-0">
              <Route size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#181d26]">{roadmap.title}</h1>
              <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{approved.length} khóa học trong lộ trình</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => updateRoadmap.mutate({ status: isPublished ? "DRAFT" : "PUBLISHED" })}
              disabled={updateRoadmap.isPending}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-60 ${
                isPublished
                  ? "border border-[#e0e2e6] text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc]"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isPublished ? "Đang công bố" : "Công bố"}
            </button>
            <button onClick={handleDelete} disabled={deleteRoadmap.isPending}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e0e2e6] text-red-400 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: ordered path + pending */}
        <div className="space-y-8">
          {/* Pending proposals */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-[#181d26]">Đề xuất chờ duyệt ({pending.length})</h2>
              </div>
              <div className="space-y-2.5">
                {pending.map((item) => <PendingRow key={item.id} item={item} roadmapId={id} />)}
              </div>
            </div>
          )}

          {/* Ordered path */}
          <div>
            <h2 className="text-sm font-semibold text-[#181d26] mb-4">Chuỗi khóa học (thứ tự học)</h2>
            {approved.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dbe4f3] py-12 text-center text-sm text-[rgba(4,14,32,0.4)]">
                Chưa có khóa học nào trong lộ trình. Thêm từ bảng bên phải.
              </div>
            ) : (
              <div>
                {approved.map((item, i) => (
                  <PathRow
                    key={item.id}
                    item={item}
                    index={i}
                    total={approved.length}
                    roadmapId={id}
                    reordering={updateItem.isPending}
                    onMoveUp={() => moveItem(i, -1)}
                    onMoveDown={() => moveItem(i, 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: attach + info */}
        <div className="space-y-6">
          <AttachPanel roadmapId={id} attachedIds={attachedIds} />
          <InfoPanel roadmapId={id} roadmap={roadmap} />
        </div>
      </div>
    </div>
  );
}
