"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

interface User {
  name: string;
  email: string;
  avatar: string | null;
}

export function UserMenu({ user }: { user: User | null }) {
  const router  = useRouter();
  const ref     = useRef<HTMLDivElement>(null);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } finally {
      setLoading(false);
      router.push("/");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#f8fafc] transition-colors"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1b61c9]/15 flex items-center justify-center">
            <span className="text-sm font-semibold text-[#1b61c9]">{user?.name?.charAt(0) ?? "?"}</span>
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-[#181d26] tracking-[0.08px]">
          {user?.name ?? ""}
        </span>
        <svg
          className={`text-[rgba(4,14,32,0.35)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#e0e2e6] py-1.5 z-50"
          style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px" }}
        >
          <div className="px-4 py-3 border-b border-[#f0f2f5]">
            <p className="text-sm font-medium text-[#181d26] truncate">{user?.name}</p>
            <p className="text-xs text-[rgba(4,14,32,0.45)] truncate mt-0.5">{user?.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              {loading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
