"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, BarChart2, LogOut, Loader2 } from "lucide-react";
import { Logo } from "@/app/_components/Logo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/axios";

interface Me {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  avatar:     string | null;
  created_at: string;
  updated_at: string;
}

const NAV = [
  { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teacher/courses",   label: "Khóa học",  icon: BookOpen },
  { href: "/teacher/analytics", label: "Phân tích", icon: BarChart2 },
];

export function TeacherSidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const queryClient = useQueryClient();
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
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["teacher", "dashboard"] });
      setLoggingOut(false);
      router.push("/");
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
          const active =
            pathname === href ||
            (href !== "/teacher/dashboard" && pathname.startsWith(href));
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
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[#1b61c9]">
                {user?.name?.charAt(0) ?? "?"}
              </span>
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
          {loggingOut ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <LogOut size={15} strokeWidth={1.8} />
          )}
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}
