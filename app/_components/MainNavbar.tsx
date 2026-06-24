"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";


function MainAuth() {
  const { data: user, isLoading } = useMe();
  if (isLoading) return <div className="w-32 h-9" />;
  if (user) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell />
        <UserMenu user={user} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href="/login"
        className="text-sm font-medium text-[rgba(4,14,32,0.65)] px-4 py-2 rounded-xl hover:text-[#181d26] hover:bg-[#f0f4ff] transition-all"
      >
        Đăng nhập
      </Link>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/register"
          className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors"
          style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
        >
          Đăng ký
        </Link>
      </motion.div>
    </div>
  );
}

function roleHome(role?: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TEACHER") return "/teacher/home";
  if (role === "STUDENT") return "/student/home";
  return "/";
}

export function MainNavbar() {
  const { data: user } = useMe();
  const navLinks = [
    { href: roleHome(user?.role), label: "Trang chủ" },
    { href: "/courses", label: "Khóa học" },
    { href: "/roadmaps", label: "Lộ trình" },
    { href: "/posts", label: "Bài viết" },
    // User đã login mới cần link quay lại marketing (guest đã ở "/" sẵn).
    ...(user ? [{ href: "/?view=landing", label: "Giới thiệu" }] : []),
  ];
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-30 relative flex items-center px-8 h-[64px] bg-white/80 backdrop-blur-xl border-b border-[#e4eaf5]"
    >
      {/* Logo — left */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Logo size={30} />
        <span className="text-[#181d26] font-bold text-lg tracking-tight">Learnust</span>
      </Link>

      {/* Nav links — absolute true center of header */}
      <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm text-[rgba(4,14,32,0.55)] hover:text-[#181d26] px-3 py-1.5 rounded-lg hover:bg-[#f0f4ff] transition-all"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Auth — right */}
      <div className="ml-auto">
        <MainAuth />
      </div>
    </motion.header>
  );
}
