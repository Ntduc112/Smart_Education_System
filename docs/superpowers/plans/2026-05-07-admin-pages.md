# Admin Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện 3 trang admin còn placeholder: dashboard, users, categories.

**Architecture:** Mỗi trang có file `*.hook.ts` riêng dùng React Query. Tất cả API đã có sẵn, chỉ cần build UI + hook. Categories API cần patch nhỏ để trả về course count.

**Tech Stack:** Next.js 16 App Router, React Query v5, Axios (`@/lib/axios`), Tailwind CSS v4, lucide-react

---

## File Map

| File | Action |
|---|---|
| `app/api/admin/categories/route.ts` | Modify — thêm `_count.courses` vào GET |
| `app/admin/categories/categories.hook.ts` | Create |
| `app/admin/categories/page.tsx` | Rewrite placeholder |
| `app/admin/users/users.hook.ts` | Create |
| `app/admin/users/page.tsx` | Rewrite placeholder |
| `app/admin/dashboard/dashboard.hook.ts` | Create |
| `app/admin/dashboard/page.tsx` | Rewrite placeholder |
| `app/admin/_components/AdminSidebar.tsx` | Modify — thêm Dashboard + Categories vào NAV |

---

## Task 1: Patch Categories API — thêm course count

**Files:**
- Modify: `app/api/admin/categories/route.ts`

- [ ] **Bước 1: Sửa GET handler để include `_count`**

Thay toàn bộ nội dung file `app/api/admin/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const CategorySchema = z.object({
  name:        z.string().min(1, "Name is required"),
  description: z.string(),
});

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include:  { _count: { select: { courses: true } } },
      orderBy:  { name: "asc" },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = CategorySchema.parse(body);
    const category = await prisma.category.create({
      data: { name, description },
      include: { _count: { select: { courses: true } } },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.message }, { status: 400 });
    }
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
```

- [ ] **Bước 2: Commit**

```bash
git add app/api/admin/categories/route.ts
git commit -m "feat(admin): include course count in categories API"
```

---

## Task 2: Tạo categories.hook.ts

**Files:**
- Create: `app/admin/categories/categories.hook.ts`

- [ ] **Bước 1: Tạo file hook**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Category {
  id:          string;
  name:        string;
  description: string;
  _count:      { courses: number };
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn:  async () =>
      (await api.get<{ categories: Category[] }>("/admin/categories")).data.categories,
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post("/admin/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string }) =>
      api.put(`/admin/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/categories/categories.hook.ts
git commit -m "feat(admin): add categories hook (CRUD)"
```

---

## Task 3: Tạo trang Admin Categories

**Files:**
- Modify: `app/admin/categories/page.tsx`

- [ ] **Bước 1: Viết trang categories**

```typescript
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
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/categories/page.tsx
git commit -m "feat(admin): implement categories management page"
```

---

## Task 4: Tạo users.hook.ts

**Files:**
- Create: `app/admin/users/users.hook.ts`

- [ ] **Bước 1: Tạo file hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { AdminUser } from "@/app/admin/admin.hook";

export type { AdminUser };

export interface UserPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface UsersResult {
  users:      AdminUser[];
  pagination: UserPagination;
}

export function useAdminUsers(params: { search: string; role: string; page: number }) {
  return useQuery<UsersResult>({
    queryKey: ["admin", "users", "list", params.search, params.role, params.page],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(params.page), limit: "10" });
      if (params.search.trim()) p.set("search", params.search.trim());
      if (params.role !== "ALL") p.set("role", params.role);
      return (await api.get<UsersResult>(`/admin/users?${p}`)).data;
    },
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });
}
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/users/users.hook.ts
git commit -m "feat(admin): add paginated users hook"
```

---

## Task 5: Tạo trang Admin Users

**Files:**
- Modify: `app/admin/users/page.tsx`

- [ ] **Bước 1: Viết trang users**

```typescript
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
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat(admin): implement users management page"
```

---

## Task 6: Tạo dashboard.hook.ts

**Files:**
- Create: `app/admin/dashboard/dashboard.hook.ts`

- [ ] **Bước 1: Tạo file hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { AdminStats } from "@/app/admin/admin.hook";
import type { AdminUser } from "@/app/admin/admin.hook";

export function useDashboardStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "statistics"],
    queryFn:  async () => (await api.get<AdminStats>("/admin/statistics")).data,
    staleTime: 60_000,
  });
}

export function useRecentUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users", "recent"],
    queryFn:  async () =>
      (await api.get<{ users: AdminUser[] }>("/admin/users?limit=5&page=1")).data.users,
    staleTime: 60_000,
  });
}
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/dashboard/dashboard.hook.ts
git commit -m "feat(admin): add dashboard hooks"
```

---

## Task 7: Tạo trang Admin Dashboard

**Files:**
- Modify: `app/admin/dashboard/page.tsx`

- [ ] **Bước 1: Viết trang dashboard**

```typescript
"use client";

import Link from "next/link";
import {
  Users, BookOpen, GraduationCap, DollarSign,
  ClipboardList, BarChart2, Tag, ChevronRight,
} from "lucide-react";
import { useDashboardStats, useRecentUsers } from "./dashboard.hook";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconCls,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconCls: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e2e6] px-5 py-4"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconCls}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-bold text-[#181d26] tracking-tight">{value}</p>
      <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.35)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Quick Link Card ───────────────────────────────────────────────────────────

function QuickCard({
  href, label, desc, icon: Icon, iconCls,
}: {
  href: string; label: string; desc: string;
  icon: React.ElementType; iconCls: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-[#e0e2e6] px-5 py-4 flex items-center gap-4 hover:border-[#1b61c9]/30 hover:shadow-md transition-all"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#181d26] group-hover:text-[#1b61c9] transition-colors">{label}</p>
        <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-[rgba(4,14,32,0.3)] group-hover:text-[#1b61c9] transition-colors shrink-0" />
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-8 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = { STUDENT: "Học viên", TEACHER: "Giáo viên", ADMIN: "Admin" };
const ROLE_CLS: Record<string, string>   = {
  STUDENT: "bg-emerald-50 text-emerald-700",
  TEACHER: "bg-violet-50 text-violet-700",
  ADMIN:   "bg-red-50 text-red-600",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading }   = useDashboardStats();
  const { data: recentUsers, isLoading: usersLoading } = useRecentUsers();

  if (statsLoading || usersLoading) return <Skeleton />;

  const ov = stats?.overview;

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-[0.08px]">Tổng quan</h1>
        <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">Chào mừng trở lại, Admin</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Tổng người dùng"
          value={String(ov?.total_users ?? 0)}
          sub={`+${ov?.new_users_month ?? 0} tháng này`}
          icon={Users}
          iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
        />
        <KpiCard
          label="Học viên"
          value={String(ov?.total_students ?? 0)}
          icon={GraduationCap}
          iconCls="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Khóa học"
          value={String(ov?.total_courses ?? 0)}
          icon={BookOpen}
          iconCls="bg-sky-50 text-sky-600"
        />
        <KpiCard
          label="Doanh thu"
          value={fmtVND(ov?.total_revenue ?? 0)}
          sub={`${ov?.new_enrollments_month ?? 0} đăng ký tháng này`}
          icon={DollarSign}
          iconCls="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide mb-3">
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard
            href="/admin/users"
            label="Quản lý người dùng"
            desc={`${ov?.total_users ?? 0} tài khoản`}
            icon={Users}
            iconCls="bg-[#1b61c9]/10 text-[#1b61c9]"
          />
          <QuickCard
            href="/admin/categories"
            label="Danh mục khóa học"
            desc="Thêm, sửa, xóa danh mục"
            icon={Tag}
            iconCls="bg-violet-50 text-violet-600"
          />
          <QuickCard
            href="/admin/statistics"
            label="Thống kê chi tiết"
            desc="Doanh thu, enrollment theo tháng"
            icon={BarChart2}
            iconCls="bg-amber-50 text-amber-600"
          />
          <QuickCard
            href="/admin/students"
            label="Tìm học viên"
            desc={`${ov?.total_students ?? 0} học viên đang học`}
            icon={ClipboardList}
            iconCls="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>

      {/* Recent users */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wide">
            Người dùng mới nhất
          </h2>
          <Link href="/admin/users" className="text-xs text-[#1b61c9] hover:underline font-medium">
            Xem tất cả
          </Link>
        </div>
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        >
          {!recentUsers?.length ? (
            <p className="text-sm text-center text-[rgba(4,14,32,0.4)] py-10">Chưa có người dùng.</p>
          ) : (
            <div className="divide-y divide-[#f0f2f5]">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-3.5">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-[#1b61c9]">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181d26] truncate">{u.name}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{u.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_CLS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <p className="text-xs text-[rgba(4,14,32,0.4)] shrink-0">
                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat(admin): implement admin dashboard page"
```

---

## Task 8: Cập nhật AdminSidebar — thêm Dashboard và Categories

**Files:**
- Modify: `app/admin/_components/AdminSidebar.tsx`

- [ ] **Bước 1: Thêm 2 link vào mảng NAV**

Tìm đoạn:

```typescript
const NAV = [
  { href: "/admin/teachers",   label: "Giáo viên",  icon: GraduationCap },
  { href: "/admin/students",   label: "Học sinh",   icon: Users },
  { href: "/admin/statistics", label: "Thống kê",   icon: BarChart2 },
];
```

Thay bằng:

```typescript
const NAV = [
  { href: "/admin/dashboard",  label: "Tổng quan",  icon: LayoutDashboard },
  { href: "/admin/users",      label: "Người dùng", icon: UsersRound },
  { href: "/admin/teachers",   label: "Giáo viên",  icon: GraduationCap },
  { href: "/admin/students",   label: "Học sinh",   icon: Users },
  { href: "/admin/categories", label: "Danh mục",   icon: Tag },
  { href: "/admin/statistics", label: "Thống kê",   icon: BarChart2 },
];
```

Cập nhật import lucide-react để thêm `LayoutDashboard`, `UsersRound`, `Tag`:

```typescript
import { Users, GraduationCap, BarChart2, LogOut, Loader2, ShieldCheck, LayoutDashboard, UsersRound, Tag } from "lucide-react";
```

- [ ] **Bước 2: Commit**

```bash
git add app/admin/_components/AdminSidebar.tsx
git commit -m "feat(admin): add Dashboard, Users, Categories to sidebar nav"
```
