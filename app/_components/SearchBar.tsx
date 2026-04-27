"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className ?? "w-full"}`}>
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm kiếm khóa học, bài viết..."
        className="w-full pl-10 pr-4 py-2.5 text-sm text-[#181d26] bg-[#f8fafc] border border-[#e0e2e6] rounded-xl outline-none focus:bg-white focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all placeholder:text-[rgba(4,14,32,0.35)]"
      />
    </form>
  );
}
