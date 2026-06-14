"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useAdminCourses } from "../admin.hook";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtVND(n: string) {
  const v = parseFloat(n);
  if (v === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Cơ bản", INTERMEDIATE: "Trung cấp", ADVANCED: "Nâng cao",
};

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
    }`}>
      {status === "PUBLISHED" ? "Công bố" : "Nháp"}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
      <div className="h-10 w-full max-w-md bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUSES = ["ALL", "PUBLISHED", "DRAFT"] as const;
const STATUS_LABEL: Record<string, string> = { ALL: "Tất cả", PUBLISHED: "Công bố", DRAFT: "Nháp" };

export default function AdminCoursesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage]     = useState(1);
  const [query, setQuery]   = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminCourses({ search: query, status, page });

  const courses    = data?.courses ?? [];
  const pagination = data?.pagination;

  if (isLoading && !data) return <Skeleton />;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Khóa học</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
          {pagination ? `${pagination.total} khóa học` : ""}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khóa học..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#e0e2e6] rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s
                  ? "bg-[#1b61c9] text-white"
                  : "text-[rgba(4,14,32,0.55)] hover:text-[#181d26] hover:bg-[#f8fafc]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        {/* Head */}
        <div className="grid grid-cols-[1fr_150px_110px_90px_120px_110px] items-center gap-4 px-6 py-3 border-b border-[#f0f2f5] bg-[#f8fafc]">
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Khóa học</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Danh mục</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Cấp độ</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Học viên</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Giá</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Tình trạng</p>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[rgba(4,14,32,0.35)]">
            <BookOpen size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy khóa học nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5]">
            {courses.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/admin/courses/${c.id}`)}
                className="grid grid-cols-[1fr_150px_110px_90px_120px_110px] items-center gap-4 px-6 py-3 hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-[#f0f2f5] shrink-0">
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#181d26] line-clamp-1">{c.title}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.45)] line-clamp-1">{c.instructor.name}</p>
                  </div>
                </div>
                <p className="text-sm text-[rgba(4,14,32,0.6)] truncate">{c.category.name}</p>
                <p className="text-sm text-[rgba(4,14,32,0.6)]">{LEVEL_LABEL[c.level.toUpperCase()] ?? c.level}</p>
                <p className="flex items-center gap-1 text-sm text-[rgba(4,14,32,0.6)]"><Users size={13} /> {c._count.enrollments}</p>
                <span className="text-sm font-semibold text-[#181d26] whitespace-nowrap">{fmtVND(c.price)}</span>
                <div><StatusBadge status={c.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[rgba(4,14,32,0.45)]">
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} kết quả)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.5)] hover:bg-[#f8fafc] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.5)] hover:bg-[#f8fafc] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
