"use client";

import Link from "next/link";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { UserMenu } from "./UserMenu";

export function HeaderAuth() {
  const { data: user, isLoading } = useMe();

  if (isLoading) return <div className="w-32 h-9" />;

  if (user) return <UserMenu user={user} />;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href="/login"
        className="text-sm font-medium text-[#181d26] px-4 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors"
      >
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold bg-[#1b61c9] text-white px-4 py-2 rounded-xl hover:bg-[#254fad] transition-colors"
        style={{ boxShadow: "rgba(45,127,249,0.28) 0px 2px 8px" }}
      >
        Đăng ký
      </Link>
    </div>
  );
}
