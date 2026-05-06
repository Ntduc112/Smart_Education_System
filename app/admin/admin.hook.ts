import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── User search ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id:         string;
  name:       string;
  email:      string;
  role:       "STUDENT" | "TEACHER" | "ADMIN";
  avatar:     string | null;
  created_at: string;
  _count:     { enrollments: number; courses: number };
}

export function useUserSearch(role: "TEACHER" | "STUDENT", search: string) {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users", role, search],
    queryFn:  async () => {
      const params = new URLSearchParams({ role, limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      const data = await api.get<{ users: AdminUser[] }>(`/admin/users?${params}`);
      return data.data.users;
    },
    enabled:   search.trim().length >= 1,
    staleTime: 30_000,
  });
}

// ── User detail ──────────────────────────────────────────────────────────────

export interface AdminUserDetail {
  id:         string;
  name:       string;
  email:      string;
  role:       "STUDENT" | "TEACHER" | "ADMIN";
  avatar:     string | null;
  created_at: string;
  _count:     { enrollments: number; courses: number; payments: number };
}

export function useAdminUser(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: ["admin", "user", id],
    queryFn:  async () => (await api.get<{ user: AdminUserDetail }>(`/admin/users/${id}`)).data.user,
    enabled:  !!id,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; role?: string }) =>
      api.put(`/admin/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "user", id] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ── Student enrollments ──────────────────────────────────────────────────────

export interface EnrolledCourse {
  id:          string;
  title:       string;
  thumbnail:   string;
  status:      "DRAFT" | "PUBLISHED";
  enrolled_at: string;
  instructor:  { name: string };
}

export function useStudentEnrollments(userId: string) {
  return useQuery<EnrolledCourse[]>({
    queryKey: ["admin", "user", userId, "enrollments"],
    queryFn:  async () =>
      (await api.get<{ enrollments: EnrolledCourse[] }>(`/admin/users/${userId}/enrollments`)).data.enrollments,
    enabled: !!userId,
  });
}

export function useAddEnrollment(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      api.post(`/admin/users/${userId}/enrollments`, { course_id: courseId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId, "enrollments"] }),
  });
}

export function useRemoveEnrollment(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      api.delete(`/admin/users/${userId}/enrollments/${courseId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId, "enrollments"] }),
  });
}

// ── Teacher courses ──────────────────────────────────────────────────────────

export interface TeacherCourseAdmin {
  id:          string;
  title:       string;
  thumbnail:   string;
  status:      "DRAFT" | "PUBLISHED";
  price:       string;
  created_at:  string;
  _count:      { enrollments: number };
}

export function useTeacherCourses(teacherId: string) {
  return useQuery<TeacherCourseAdmin[]>({
    queryKey: ["admin", "teacher", teacherId, "courses"],
    queryFn:  async () =>
      (await api.get<{ courses: TeacherCourseAdmin[] }>(`/admin/users/${teacherId}/courses`)).data.courses,
    enabled: !!teacherId,
  });
}

// ── Course search (for add enrollment modal) ─────────────────────────────────

export interface CourseSearchResult {
  id:          string;
  title:       string;
  thumbnail:   string;
  status:      "DRAFT" | "PUBLISHED";
  instructor:  { name: string };
  _count:      { enrollments: number };
}

export function useCourseSearch(search: string) {
  return useQuery<CourseSearchResult[]>({
    queryKey: ["admin", "courses", search],
    queryFn:  async () => {
      const params = new URLSearchParams({ limit: "10", status: "PUBLISHED" });
      if (search.trim()) params.set("search", search.trim());
      return (await api.get<{ courses: CourseSearchResult[] }>(`/admin/courses?${params}`)).data.courses;
    },
    enabled:   search.trim().length >= 1,
    staleTime: 30_000,
  });
}

// ── Statistics ───────────────────────────────────────────────────────────────

export interface AdminStats {
  overview: {
    total_users:       number;
    total_students:    number;
    total_teachers:    number;
    total_courses:     number;
    total_enrollments: number;
    total_revenue:     number;
    new_users_month:   number;
    new_enrollments_month: number;
  };
  monthly: { month: string; revenue: number; enrollments: number; new_users: number }[];
  top_courses: { id: string; title: string; thumbnail: string; enrollments: number; revenue: number }[];
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "statistics"],
    queryFn:  async () => (await api.get<AdminStats>("/admin/statistics")).data,
    staleTime: 60_000,
  });
}
