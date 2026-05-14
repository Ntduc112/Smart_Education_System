import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Me ─────────────────────────────────────────────────────────────────────

export interface Me {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  avatar:     string | null;
  created_at: string;
  updated_at: string;
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn:  async () => (await api.get<{ user: Me }>("/user/me")).data.user,
    retry: false,
    staleTime: 60_000,
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_courses:      number;
  published:          number;
  draft:              number;
  total_students:     number;
  revenue_this_month: number;
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
  stats:              DashboardStats;
  recent_courses:     RecentCourse[];
  recent_enrollments: RecentEnrollment[];
}

export function useTeacherDashboard() {
  return useQuery<TeacherDashboard>({
    queryKey: ["teacher", "dashboard"],
    queryFn:  async () => (await api.get<TeacherDashboard>("/teacher/dashboard")).data,
    staleTime: 30_000,
  });
}
