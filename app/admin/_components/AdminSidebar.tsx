"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, LogOut, Loader2, ShieldCheck, LayoutDashboard, UsersRound, Tag, BookOpen, KeyRound, X, ChevronUp, FileText, Route } from "lucide-react";
import { Logo } from "@/app/_components/Logo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/axios";

interface Me { id: string; name: string; email: string; avatar: string | null }

const NAV = [
  { href: "/admin/dashboard",  label: "Tổng quan",  icon: LayoutDashboard },
  { href: "/admin/users",      label: "Người dùng", icon: UsersRound },
  { href: "/admin/courses",    label: "Khóa học",   icon: BookOpen },
  { href: "/admin/roadmaps",   label: "Lộ trình",   icon: Route },
  { href: "/admin/categories", label: "Danh mục",   icon: Tag },
  { href: "/admin/posts",      label: "Bài viết",   icon: FileText },
  { href: "/admin/statistics", label: "Thống kê",   icon: BarChart2 },
];

// ── Change password modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 6)       { setError("Mật khẩu mới tối thiểu 6 ký tự"); return; }
    if (next !== confirm)      { setError("Mật khẩu xác nhận không khớp"); return; }
    setSaving(true);
    try {
      await api.post("/user/change-password", { currentPassword: current, newPassword: next });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-[420px] mx-4"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#181d26]">Đổi mật khẩu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">Đổi mật khẩu thành công.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Mật khẩu hiện tại</label>
              <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5">Xác nhận mật khẩu mới</label>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors">Hủy</button>
              <button type="submit" disabled={saving || !current || !next || !confirm} className="px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Lưu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user } = useQuery<Me>({
    queryKey: ["me"],
    queryFn:  async () => (await api.get<{ user: Me }>("/user/me")).data.user,
    staleTime: 60_000,
    retry: false,
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post("/auth/logout"); } finally {
      queryClient.removeQueries({ queryKey: ["me"] });
      setLoggingOut(false);
      router.push("/");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#e0e2e6] flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e0e2e6]">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-semibold text-[#181d26] tracking-[0.08px]">Learnust</span>
        </Link>
        <div className="flex items-center gap-1.5 mt-1 ml-0.5">
          <ShieldCheck size={10} className="text-[#1b61c9]" />
          <p className="text-[10px] text-[rgba(4,14,32,0.4)] tracking-wider uppercase">Quản trị viên</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href.replace(/s$/, ""));
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

      {/* User menu */}
      <div className="border-t border-[#e0e2e6] px-4 py-4 relative">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-4 right-4 bottom-full mb-2 z-20 bg-white rounded-xl border border-[#e0e2e6] py-1"
              style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.12) 0px 8px 24px" }}
            >
              <button
                onClick={() => { setMenuOpen(false); setShowChangePw(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc] transition-colors"
              >
                <KeyRound size={15} strokeWidth={1.8} /> Đổi mật khẩu
              </button>
              <div className="border-t border-[#f0f2f5] my-1" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} strokeWidth={1.8} />}
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="group w-full flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[#1b61c9]">{user?.name?.charAt(0) ?? "A"}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#181d26] truncate">{user?.name ?? ""}</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] truncate">{user?.email ?? ""}</p>
          </div>
          <ChevronUp size={15} className={`shrink-0 text-[rgba(4,14,32,0.35)] transition-transform ${menuOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </aside>
  );
}
