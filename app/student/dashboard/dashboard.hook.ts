import { useQuery, useQueries } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
}

export interface StudentCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  level: string;
  status: string;
  instructor_id: string;
  category_id: string;
  created_at: string;
  instructor: { id: string; name: string; avatar: string | null };
  category: { id: string; name: string };
  _count: { sections: number };
}

export interface CourseProgress {
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  completed_lesson_ids: string[];
  current_lesson_id: string | null;
}

// ── Fetchers ───────────────────────────────────────────────────────────────

const fetchMe = async (): Promise<Me> => {
  const { data } = await api.get<{ user: Me }>("/user/me");
  return data.user;
};

const fetchStudentCourses = async (): Promise<StudentCourse[]> => {
  const { data } = await api.get<{ courses: StudentCourse[] }>("/student/courses");
  return data.courses;
};

const fetchCourseProgress = async (courseId: string): Promise<CourseProgress> => {
  const { data } = await api.get<{ progress: CourseProgress }>(
    `/student/courses/${courseId}/progress`
  );
  return data.progress;
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false });
}

export function useStudentCourses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["student", "courses"],
    queryFn: fetchStudentCourses,
    enabled: options?.enabled ?? true,
  });
}

export function useCoursesProgress(courseIds: string[]) {
  return useQueries({
    queries: courseIds.map((id) => ({
      queryKey: ["student", "courses", id, "progress"],
      queryFn: () => fetchCourseProgress(id),
    })),
  });
}
