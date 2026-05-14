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
  const { data: stats, isLoading: statsLoading }       = useDashboardStats();
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
