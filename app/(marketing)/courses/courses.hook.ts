import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CourseInList {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  level: string;
  created_at: string;
  instructor: { id: string; name: string; avatar: string | null };
  category: { id: string; name: string };
  _count: { enrollments: number; sections: number };
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  is_free: boolean;
  video_url: string | null;
  pdf_url: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseDetail extends CourseInList {
  sections: Chapter[];
  is_enrolled: boolean;
  is_free: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CoursesFilter {
  search?: string;
  category_id?: string;
  level?: string;
  page?: number;
  limit?: number;
}

// ── Fetchers ───────────────────────────────────────────────────────────────

const fetchCourses = async (filter: CoursesFilter) => {
  const params = new URLSearchParams();
  if (filter.search)      params.set("search",      filter.search);
  if (filter.category_id) params.set("category_id", filter.category_id);
  if (filter.level)       params.set("level",        filter.level);
  params.set("page",  String(filter.page ?? 1));
  params.set("limit", String(filter.limit ?? 9));

  const { data } = await api.get<{ courses: CourseInList[]; pagination: Pagination }>(
    `/courses?${params.toString()}`
  );
  return data;
};

const fetchCourse = async (id: string): Promise<CourseDetail> => {
  const { data } = await api.get<{ course: CourseDetail }>(`/courses/${id}`);
  return data.course;
};

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<{ categories: Category[] }>("/admin/categories");
  return data.categories;
};

const enrollCourse = async (courseId: string) => {
  const { data } = await api.post<{ enrolled?: boolean; checkoutUrl?: string }>(
    "/payment/create",
    { course_id: courseId }
  );
  return data;
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useCourses(filter: CoursesFilter) {
  return useQuery({
    queryKey: ["courses", "list", filter],
    queryFn: () => fetchCourses(filter),
    placeholderData: (prev) => prev,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollCourse,
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["student", "courses"] });
    },
  });
}
