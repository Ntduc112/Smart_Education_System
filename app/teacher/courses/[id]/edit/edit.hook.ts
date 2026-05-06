import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ───────────────────────────────────────────────────────────────────

export interface BuilderQuiz {
  id:         string;
  title:      string;
  pass_score: number;
  time_limit: number | null;
}

export interface BuilderLesson {
  id:        string;
  title:     string;
  order:     number;
  is_free:   boolean;
  content:   string | null;
  video_url: string | null;
  pdf_url:   string | null;
  quiz:      BuilderQuiz[];
}

export interface BuilderChapter {
  id:      string;
  title:   string;
  order:   number;
  lessons: BuilderLesson[];
}

export interface BuilderCourse {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string;
  price:       string;
  level:       string;
  status:      "DRAFT" | "PUBLISHED";
  category_id: string;
  category:    { id: string; name: string };
  sections:    BuilderChapter[];
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useCourseBuilder(id: string) {
  return useQuery<BuilderCourse>({
    queryKey: ["teacher", "course", id],
    queryFn:  async () => (await api.get<{ course: BuilderCourse }>(`/teacher/courses/${id}`)).data.course,
    enabled:  !!id,
  });
}

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string; description: string; thumbnail: string;
      price: number; level: string; status: string; category_id: string;
    }) => api.put(`/teacher/courses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "course", id] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] });
    },
  });
}

export function useTogglePublish(id: string, course: BuilderCourse | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!course) return;
      await api.put(`/teacher/courses/${id}`, {
        title:       course.title,
        description: course.description,
        thumbnail:   course.thumbnail,
        price:       parseFloat(course.price),
        level:       course.level,
        category_id: course.category_id,
        status:      course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", id] }),
  });
}

export function useCreateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, order }: { title: string; order: number }) =>
      api.post("/teacher/chapters", { course_id: courseId, title, order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useUpdateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) =>
      api.put(`/teacher/chapters/${id}`, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useDeleteChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/teacher/chapters/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chapter_id, title, order }: { chapter_id: string; title: string; order: number }) =>
      (await api.post<{ lesson: BuilderLesson }>("/teacher/lessons", { chapter_id, title, order })).data.lesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, title, is_free, content, video_url, pdf_url,
    }: {
      id: string; title: string; is_free: boolean;
      content: string | null; video_url: string | null; pdf_url: string | null;
    }) => api.put(`/teacher/lessons/${id}`, { title, is_free, content, video_url, pdf_url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/teacher/lessons/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}

export function useUploadPdf() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>("/teacher/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}

export function useCreateQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lesson_id, title, pass_score }: { lesson_id: string; title: string; pass_score: number }) =>
      api.post("/teacher/quizzes", { lesson_id, title, pass_score }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}
