"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, GraduationCap, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAdminUsers } from "./users.hook";

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Học viên",
  TEACHER: "Giáo viên",
  ADMIN:   "Admin",
};
const ROLE_CLS: Record<string, string> = {
  STUDENT: "bg-emerald-50 text-emerald-700",
  TEACHER: "bg-violet-50 text-violet-700",
  ADMIN:   "bg-red-50 text-red-600",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_CLS[role] ?? "bg-gray-100 text-gray-600"}`}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-10 w-64 bg-gray-100 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-[#f0f2f5]">
            <div className="w-9 h-9 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROLES = ["ALL", "STUDENT", "TEACHER", "ADMIN"] as const;
const ROLE_FILTER_LABEL: Record<string, string> = {
  ALL:     "Tất cả",
  STUDENT: "Học viên",
  TEACHER: "Giáo viên",
  ADMIN:   "Admin",
};

export default function UsersPage() {
  const router = useRouter();

  const [search, setSearch]   = useState("");
  const [role, setRole]       = useState("ALL");
  const [page, setPage]       = useState(1);
  const [query, setQuery]     = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminUsers({ search: query, role, page });

  const users      = data?.users ?? [];
  const pagination = data?.pagination;

  if (isLoading && !data) return <Skeleton />;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Người dùng</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
          {pagination ? `${pagination.total} người dùng` : ""}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#e0e2e6] rounded-xl p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                role === r
                  ? "bg-[#1b61c9] text-white"
                  : "text-[rgba(4,14,32,0.55)] hover:text-[#181d26] hover:bg-[#f8fafc]"
              }`}
            >
              {ROLE_FILTER_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
      >
        {/* Head */}
        <div className="grid grid-cols-[auto_1fr_160px_120px_80px] items-center gap-4 px-6 py-3 border-b border-[#f0f2f5] bg-[#f8fafc]">
          <div className="w-9" />
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Người dùng</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Vai trò</p>
          <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">Ngày tạo</p>
          <div />
        </div>

        {/* Rows */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[rgba(4,14,32,0.35)]">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5]">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[auto_1fr_160px_120px_80px] items-center gap-4 px-6 py-3.5 hover:bg-[#f8fafc] transition-colors"
              >
                <Avatar name={u.name} avatar={u.avatar} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#181d26] truncate">{u.name}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
                <p className="text-xs text-[rgba(4,14,32,0.45)]">
                  {new Date(u.created_at).toLocaleDateString("vi-VN")}
                </p>
                <button
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                  className="flex items-center gap-1 text-xs text-[#1b61c9] hover:text-[#1550a8] transition-colors font-medium"
                >
                  <ExternalLink size={12} />
                  Xem
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#f0f2f5]">
            <p className="text-xs text-[rgba(4,14,32,0.45)]">
              Trang {pagination.page} / {pagination.totalPages}
              {" "}({pagination.total} kết quả)
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
    </div>
  );
}
