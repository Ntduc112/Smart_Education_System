# Teacher Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a teacher dashboard with sidebar navigation, stat cards (total/published/draft courses, total students, monthly revenue), recent courses list, and recent enrollments feed.

**Architecture:** Sidebar fixed-left layout injected via `app/teacher/layout.tsx`; a single aggregated API endpoint `/api/teacher/dashboard` fetched via React Query hook; dashboard page renders stats + two-column content section.

**Tech Stack:** Next.js 15 App Router, TypeScript, TailwindCSS, @tanstack/react-query, Prisma ORM (PostgreSQL), lucide-react icons.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/api/teacher/dashboard/route.ts` | Create | Aggregated stats + recent data endpoint |
| `app/teacher/_components/TeacherSidebar.tsx` | Create | Client sidebar with active nav highlighting |
| `app/teacher/layout.tsx` | Modify | Wrap all teacher pages with sidebar layout |
| `app/teacher/dashboard/dashboard.hook.ts` | Create | React Query hook for dashboard data |
| `app/teacher/dashboard/page.tsx` | Modify | Full dashboard UI replacing placeholder |

---

## Task 1: API endpoint `/api/teacher/dashboard`

**Files:**
- Create: `app/api/teacher/dashboard/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// app/api/teacher/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      total_courses,
      published,
      draft,
      total_students,
      revenueResult,
      recent_courses_raw,
      recent_enrollments_raw,
    ] = await Promise.all([
      prisma.course.count({ where: { instructor_id: userId } }),
      prisma.course.count({ where: { instructor_id: userId, status: "PUBLISHED" } }),
      prisma.course.count({ where: { instructor_id: userId, status: "DRAFT" } }),
      prisma.enrollment.count({ where: { course: { instructor_id: userId } } }),
      prisma.payment.aggregate({
        where: {
          course: { instructor_id: userId },
          status: "PAID",
          created_at: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.course.findMany({
        where:   { instructor_id: userId },
        orderBy: { created_at: "desc" },
        take: 5,
        include: { _count: { select: { enrollments: true } } },
      }),
      prisma.enrollment.findMany({
        where:   { course: { instructor_id: userId } },
        orderBy: { enrolled_at: "desc" },
        take: 8,
        include: {
          user:   { select: { name: true, avatar: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    const revenue_this_month = revenueResult._sum.amount
      ? Number(revenueResult._sum.amount)
      : 0;

    const recent_courses = recent_courses_raw.map((c) => ({
      id:               c.id,
      title:            c.title,
      thumbnail:        c.thumbnail,
      status:           c.status,
      enrollment_count: c._count.enrollments,
      updated_at:       c.updated_at,
    }));

    const recent_enrollments = recent_enrollments_raw.map((e) => ({
      enrolled_at: e.enrolled_at,
      user:        e.user,
      course:      e.course,
    }));

    return NextResponse.json(
      { stats: { total_courses, published, draft, total_students, revenue_this_month }, recent_courses, recent_enrollments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify server starts without errors**

```bash
npm run dev
```

Open `http://localhost:3000` — confirm no compile errors in terminal. (Cannot call the endpoint without auth token, but TypeScript must compile.)

- [ ] **Step 3: Commit**

```bash
git add app/api/teacher/dashboard/route.ts
git commit -m "feat: add /api/teacher/dashboard aggregated endpoint"
```

---

## Task 2: TeacherSidebar component

**Files:**
- Create: `app/teacher/_components/TeacherSidebar.tsx`

- [ ] **Step 1: Create the sidebar**

```tsx
// app/teacher/_components/TeacherSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BarChart2, FileText, LogOut, Loader2 } from "lucide-react";
import { Logo } from "@/app/_components/Logo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/axios";

interface Me {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

const NAV = [
  { href: "/teacher/dashboard", label: "Tổng quan",   icon: LayoutDashboard },
  { href: "/teacher/courses",   label: "Khóa học",    icon: BookOpen },
  { href: "/teacher/analytics", label: "Phân tích",   icon: BarChart2 },
];

export function TeacherSidebar() {
  const pathname              = usePathname();
  const router                = useRouter();
  const queryClient           = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: user } = useQuery<Me>({
    queryKey: ["me"],
    queryFn:  async () => (await api.get<{ user: Me }>("/user/me")).data.user,
    retry: false,
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post("/auth/logout"); } finally {
      queryClient.clear();
      setLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#e0e2e6] flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e0e2e6]">
        <Link href="/teacher/dashboard" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
        </Link>
        <p className="text-[10px] text-[rgba(4,14,32,0.4)] mt-1 ml-0.5 tracking-wider uppercase">
          Giảng viên
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/teacher/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-[#1b61c9]/8 text-[#1b61c9]"
                  : "text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] hover:text-[#181d26]"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#e0e2e6] px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[#1b61c9]">{user?.name?.charAt(0) ?? "?"}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#181d26] truncate">{user?.name ?? ""}</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} strokeWidth={1.8} />}
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/teacher/_components/TeacherSidebar.tsx
git commit -m "feat: add TeacherSidebar component"
```

---

## Task 3: Update teacher layout

**Files:**
- Modify: `app/teacher/layout.tsx`

- [ ] **Step 1: Replace placeholder layout**

```tsx
// app/teacher/layout.tsx
import { TeacherSidebar } from "./_components/TeacherSidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <TeacherSidebar />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify layout renders**

Start dev server and navigate to `http://localhost:3000/teacher/dashboard` — confirm sidebar appears on the left and the placeholder "Teacher Dashboard" text appears in main content.

- [ ] **Step 3: Commit**

```bash
git add app/teacher/layout.tsx
git commit -m "feat: add sidebar layout to teacher section"
```

---

## Task 4: Dashboard hook

**Files:**
- Create: `app/teacher/dashboard/dashboard.hook.ts`

- [ ] **Step 1: Create the hook file**

```ts
// app/teacher/dashboard/dashboard.hook.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface DashboardStats {
  total_courses:       number;
  published:           number;
  draft:               number;
  total_students:      number;
  revenue_this_month:  number;
}

export interface RecentCourse {
  id:               string;
  title:            string;
  thumbnail:        string;
  status:           "DRAFT" | "PUBLISHED";
  enrollment_count: number;
  updated_at:       string;
}

export interface RecentEnrollment {
  enrolled_at: string;
  user:        { name: string; avatar: string | null };
  course:      { id: string; title: string };
}

export interface TeacherDashboard {
  stats:               DashboardStats;
  recent_courses:      RecentCourse[];
  recent_enrollments:  RecentEnrollment[];
}

export function useTeacherDashboard() {
  return useQuery<TeacherDashboard>({
    queryKey: ["teacher", "dashboard"],
    queryFn:  async () => (await api.get<TeacherDashboard>("/teacher/dashboard")).data,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/teacher/dashboard/dashboard.hook.ts
git commit -m "feat: add useTeacherDashboard React Query hook"
```

---

## Task 5: Dashboard page UI

**Files:**
- Modify: `app/teacher/dashboard/page.tsx`

- [ ] **Step 1: Write the full dashboard page**

```tsx
// app/teacher/dashboard/page.tsx
"use client";

import Link from "next/link";
import { Plus, BookOpen, Users, TrendingUp } from "lucide-react";
import { useTeacherDashboard, RecentCourse, RecentEnrollment } from "./dashboard.hook";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Me { id: string; name: string; email: string; }

function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn:  async () => (await api.get<{ user: Me }>("/user/me")).data.user,
    retry: false,
    staleTime: 60_000,
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6]"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <p className="text-sm text-[rgba(4,14,32,0.55)] tracking-[0.07px] mb-1">{label}</p>
      <p className={`text-3xl font-semibold ${accent ?? "text-[#181d26]"}`}>{value}</p>
      {sub && <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1 tracking-[0.07px]">{sub}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl px-6 py-5 border border-[#e0e2e6] animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-100 rounded" />
    </div>
  );
}

// ── RecentCourseRow ─────────────────────────────────────────────────────────

function RecentCourseRow({ course }: { course: RecentCourse }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#f0f2f5] last:border-0">
      <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#f8fafc] shrink-0">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{course.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider ${
              course.status === "PUBLISHED"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f0f2f5] text-[rgba(4,14,32,0.55)]"
            }`}
          >
            {course.status === "PUBLISHED" ? "Đã công bố" : "Nháp"}
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.45)]">{course.enrollment_count} học viên</span>
        </div>
      </div>
      <Link
        href={`/teacher/courses/${course.id}/edit`}
        className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium whitespace-nowrap shrink-0"
      >
        Chỉnh sửa →
      </Link>
    </div>
  );
}

// ── RecentEnrollmentRow ─────────────────────────────────────────────────────

function RecentEnrollmentRow({ enrollment }: { enrollment: RecentEnrollment }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f2f5] last:border-0">
      {enrollment.user.avatar ? (
        <img src={enrollment.user.avatar} alt={enrollment.user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-[#1b61c9]">{enrollment.user.name.charAt(0)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181d26] truncate">{enrollment.user.name}</p>
        <p className="text-xs text-[rgba(4,14,32,0.55)] truncate">{enrollment.course.title}</p>
      </div>
      <span className="text-xs text-[rgba(4,14,32,0.4)] whitespace-nowrap shrink-0">
        {timeAgo(enrollment.enrolled_at)}
      </span>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TeacherDashboardPage() {
  const { data: user }      = useMe();
  const { data, isLoading } = useTeacherDashboard();

  return (
    <div className="px-8 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-[#181d26]">
            {getGreeting()},{" "}
            <span className="font-semibold">{user?.name?.split(" ").pop() ?? "thầy/cô"}!</span>
          </h1>
          <p className="text-[rgba(4,14,32,0.55)] mt-1.5 tracking-[0.18px]">
            Đây là tổng quan hoạt động giảng dạy của bạn.
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors shrink-0"
          style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo khóa học mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Tổng khóa học"    value={data?.stats.total_courses ?? 0} />
            <StatCard label="Đã công bố"        value={data?.stats.published ?? 0}     accent="text-emerald-700" />
            <StatCard label="Đang nháp"         value={data?.stats.draft ?? 0}         accent="text-[rgba(4,14,32,0.55)]" />
            <StatCard label="Tổng học viên"     value={data?.stats.total_students ?? 0} />
            <StatCard
              label="Doanh thu tháng này"
              value={formatVND(data?.stats.revenue_this_month ?? 0)}
              accent="text-[#1b61c9]"
            />
          </>
        )}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <BookOpen size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Khóa học gần đây
            </h2>
            <Link href="/teacher/courses" className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]">
              Xem tất cả →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center py-3 border-b border-[#f0f2f5]">
                  <div className="w-14 h-10 bg-gray-100 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-3/4 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recent_courses.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có khóa học nào.</p>
            </div>
          ) : (
            data?.recent_courses.map((c) => <RecentCourseRow key={c.id} course={c} />)
          )}
        </div>

        {/* Recent Enrollments */}
        <div
          className="bg-white rounded-2xl border border-[#e0e2e6] p-6"
          style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#181d26] flex items-center gap-2">
              <Users size={17} className="text-[#1b61c9]" strokeWidth={2} />
              Đăng ký mới
            </h2>
            <Link href="/teacher/analytics" className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad]">
              Xem phân tích →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center py-3 border-b border-[#f0f2f5]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-1/2 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recent_enrollments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[rgba(4,14,32,0.45)]">Chưa có học viên nào đăng ký.</p>
            </div>
          ) : (
            data?.recent_enrollments.map((e, i) => <RecentEnrollmentRow key={i} enrollment={e} />)
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/teacher/dashboard` after logging in as a teacher account. Confirm:
- Sidebar renders on the left with Logo, nav links, user info
- 5 stat cards appear in a row
- Two-column section shows "Khóa học gần đây" and "Đăng ký mới"
- Skeleton loading appears before data loads
- "Tạo khóa học mới" button in top-right navigates to `/teacher/courses/new`

- [ ] **Step 3: Commit**

```bash
git add app/teacher/dashboard/dashboard.hook.ts app/teacher/dashboard/page.tsx
git commit -m "feat: implement teacher dashboard page with stats and recent activity"
```

---

## Self-Review

**Spec coverage:**
- ✅ Sidebar fixed-left with Logo, nav, UserMenu
- ✅ Teacher layout wraps all teacher pages
- ✅ 5 stat cards: total courses, published, draft, total students, monthly revenue
- ✅ Recent courses (5 newest) with thumbnail, status badge, enrollment count, edit link
- ✅ Recent enrollments (8 newest) with avatar, student name, course, relative time
- ✅ "Tạo khóa học mới" quick action button
- ✅ Skeleton loading for all async sections
- ✅ Empty states for zero-data scenarios

**Type consistency:**
- `RecentCourse` defined in hook Task 4, used in page Task 5 — consistent
- `RecentEnrollment` defined in hook Task 4, used in page Task 5 — consistent
- `TeacherDashboard` interface matches exactly what API returns
- `DashboardStats` field names match API response keys exactly

**Placeholder check:** None found.
