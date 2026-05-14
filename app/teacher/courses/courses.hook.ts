import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface TeacherCourse {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string;
  price:       string;
  level:       string;
  status:      "DRAFT" | "PUBLISHED";
  category_id: string;
  updated_at:  string;
  created_at:  string;
  category:    { id: string; name: string };
  _count:      { enrollments: number };
}

export function useTeacherCourses() {
  return useQuery<TeacherCourse[]>({
    queryKey: ["teacher", "courses"],
    queryFn:  async () => (await api.get<{ courses: TeacherCourse[] }>("/teacher/courses")).data.courses,
  });
}

export function useToggleCourseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: TeacherCourse) => {
      const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await api.put(`/teacher/courses/${course.id}`, {
        title:       course.title,
        description: course.description,
        thumbnail:   course.thumbnail,
        status:      newStatus,
        price:       parseFloat(course.price),
        level:       course.level,
        category_id: course.category_id,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/teacher/courses/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] }),
  });
}
