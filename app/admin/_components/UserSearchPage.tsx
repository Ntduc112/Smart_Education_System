"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Users, GraduationCap } from "lucide-react";
import { useUserSearch, AdminUser } from "../admin.hook";

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff < 30)  return `${diff} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function UserCard({ user }: { user: AdminUser }) {
  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-[#e0e2e6] hover:border-[#1b61c9]/40 hover:shadow-md transition-all group"
      style={{ boxShadow: "rgba(15,48,106,0.04) 0px 0px 16px" }}
    >
      {/* Avatar */}
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-[#1b61c9]/12 flex items-center justify-center shrink-0">
          <span className="text-base font-bold text-[#1b61c9]">{user.name.charAt(0).toUpperCase()}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#181d26] group-hover:text-[#1b61c9] transition-colors truncate">
          {user.name}
        </p>
        <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{user.email}</p>
      </div>

      {/* Counts */}
      <div className="flex items-center gap-4 shrink-0">
        {user.role === "TEACHER" ? (
          <div className="flex items-center gap-1 text-xs text-[rgba(4,14,32,0.5)]">
            <BookOpen size={12} />
            <span>{user._count.courses} khóa</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-[rgba(4,14,32,0.5)]">
            <BookOpen size={12} />
            <span>{user._count.enrollments} đang học</span>
          </div>
        )}
        <p className="text-xs text-[rgba(4,14,32,0.35)]">{timeAgo(user.created_at)}</p>
      </div>
    </Link>
  );
}

function EmptyHint({ role }: { role: "TEACHER" | "STUDENT" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#f0f2f5] flex items-center justify-center">
        {role === "TEACHER" ? (
          <GraduationCap size={24} className="text-[rgba(4,14,32,0.3)]" />
        ) : (
          <Users size={24} className="text-[rgba(4,14,32,0.3)]" />
        )}
      </div>
      <p className="text-sm text-[rgba(4,14,32,0.45)]">
        Nhập tên hoặc email để tìm kiếm {role === "TEACHER" ? "giáo viên" : "học sinh"}
      </p>
    </div>
  );
}

export function UserSearchPage({
  role,
  title,
}: {
  role:  "TEACHER" | "STUDENT";
  title: string;
}) {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useUserSearch(role, search);

  const showEmpty  = search.trim().length === 0;
  const showNone   = !showEmpty && !isLoading && users.length === 0;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">{title}</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
          Tìm kiếm và quản lý {role === "TEACHER" ? "giáo viên" : "học sinh"} trong hệ thống
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] pointer-events-none"
        />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Tìm theo tên hoặc email...`}
          className="w-full pl-11 pr-4 py-3 text-sm border border-[#e0e2e6] rounded-2xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 bg-white transition-all placeholder:text-[rgba(4,14,32,0.35)]"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#1b61c9]/30 border-t-[#1b61c9] rounded-full animate-spin" />
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {showEmpty ? (
          <EmptyHint role={role} />
        ) : showNone ? (
          <p className="text-sm text-center text-[rgba(4,14,32,0.45)] py-12">
            Không tìm thấy kết quả nào cho &quot;{search}&quot;.
          </p>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              : users.map((u) => <UserCard key={u.id} user={u} />)}
          </div>
        )}
      </div>
    </div>
  );
}
