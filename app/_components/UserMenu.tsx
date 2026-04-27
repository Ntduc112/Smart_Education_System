"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, ChevronDown, LogOut, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface User {
  name: string;
  email: string;
  avatar: string | null;
}

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string | null;
}

function useEnrolledCourses(enabled: boolean) {
  return useQuery<EnrolledCourse[]>({
    queryKey: ["enrolled-courses"],
    queryFn: async () => {
      const res = await api.get("/student/courses");
      return res.data.courses as EnrolledCourse[];
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function UserMenu({ user }: { user: User | null }) {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const menuRef     = useRef<HTMLDivElement>(null);

  const [userOpen,    setUserOpen]    = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useEnrolledCourses(coursesOpen);

  // Đóng cả 2 dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserOpen(false);
        setCoursesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.post("/auth/logout");
    } finally {
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["enrolled-courses"] });
      setLogoutLoading(false);
      router.push("/");
    }
  };

  return (
    <div ref={menuRef} className="flex items-center gap-1">

      {/* ── Dropdown: Khóa học đã đăng ký ── */}
      <div className="relative">
        <button
          onClick={() => { setCoursesOpen((v) => !v); setUserOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#f0f4fb] text-[#1b61c9] transition-colors"
        >
          <BookOpen size={16} strokeWidth={2} />
          <span className="hidden sm:block text-sm font-medium">Khóa học của tôi</span>
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={`transition-transform duration-200 ${coursesOpen ? "rotate-180" : ""}`}
          />
        </button>

        {coursesOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#e0e2e6] py-1.5 z-50"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 16px" }}
          >
            <p className="px-4 pt-2.5 pb-2 text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
              Khóa học đã đăng ký
            </p>

            {coursesLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={22} className="animate-spin text-[#1b61c9]" />
              </div>
            )}

            {!coursesLoading && (!courses || courses.length === 0) && (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-[rgba(4,14,32,0.45)]">Bạn chưa đăng ký khóa học nào.</p>
                <Link
                  href="/courses"
                  onClick={() => setCoursesOpen(false)}
                  className="inline-block mt-2 text-sm text-[#1b61c9] font-medium hover:underline"
                >
                  Khám phá khóa học →
                </Link>
              </div>
            )}

            {!coursesLoading && courses && courses.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/student/courses/${course.id}/learn`}
                    onClick={() => setCoursesOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors"
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#1b61c9]/10 flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-[#1b61c9]" />
                      </div>
                    )}
                    <span className="text-sm text-[#181d26] font-medium line-clamp-2 leading-snug">
                      {course.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-[#f0f2f5] mt-1 pt-1 px-4 pb-2">
              <Link
                href="/student/dashboard"
                onClick={() => setCoursesOpen(false)}
                className="text-xs text-[#1b61c9] font-medium hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Dropdown: Avatar + tên ── */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen((v) => !v); setCoursesOpen(false); }}
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
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={`text-[rgba(4,14,32,0.35)] transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`}
          />
        </button>

        {userOpen && (
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
                disabled={logoutLoading}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {logoutLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogOut size={15} strokeWidth={2} />
                )}
                {logoutLoading ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
