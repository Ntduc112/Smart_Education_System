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
  is_active:  boolean;
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
    mutationFn: async (data: { name?: string; email?: string; password?: string; is_active?: boolean }) =>
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
  price:       string;
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

// ── Course management ──────────────────────────────────────────────────────────

export interface AdminCourseRow {
  id:         string;
  title:      string;
  thumbnail:  string;
  price:      string;
  status:     "DRAFT" | "PUBLISHED";
  level:      string;
  created_at: string;
  category:   { id: string; name: string };
  instructor: { id: string; name: string; email: string };
  _count:     { enrollments: number };
}

export interface AdminCoursesResult {
  courses:    AdminCourseRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useAdminCourses(opts: { search: string; status: string; page: number }) {
  const { search, status, page } = opts;
  return useQuery<AdminCoursesResult>({
    queryKey: ["admin", "courses", "list", { search, status, page }],
    queryFn:  async () => {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search.trim())   params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      return (await api.get<AdminCoursesResult>(`/admin/courses?${params}`)).data;
    },
  });
}

export interface AdminCourseDetail {
  id:               string;
  title:            string;
  description:      string;
  thumbnail:        string;
  price:            string;
  discount_percent: number | null;
  level:            string;
  status:           "DRAFT" | "PUBLISHED";
  category_id:      string;
  created_at:       string;
  category:         { id: string; name: string };
  instructor:       { id: string; name: string; email: string; avatar: string | null };
  _count:           { enrollments: number; sections: number; reviews: number; payments: number };
}

export function useAdminCourse(id: string) {
  return useQuery<AdminCourseDetail>({
    queryKey: ["admin", "course", id],
    queryFn:  async () => (await api.get<{ course: AdminCourseDetail }>(`/admin/courses/${id}`)).data.course,
    enabled:  !!id,
  });
}

export function useUpdateAdminCourse(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title?: string; description?: string; thumbnail?: string;
      price?: number; discount_percent?: number | null; level?: string;
      category_id?: string; status?: "DRAFT" | "PUBLISHED";
    }) => (await api.put<{ course: AdminCourseDetail }>(`/admin/courses/${id}`, data)).data.course,
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "course", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "courses", "list"] });
    },
  });
}

export function useDeleteAdminCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/courses/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["admin", "courses", "list"] }),
  });
}
