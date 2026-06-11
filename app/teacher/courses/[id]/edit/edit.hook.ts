import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import api from "@/lib/axios";
import axios from "axios";

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
  pdf_text:  string | null;
  quiz:      BuilderQuiz[];
}

export interface BuilderChapter {
  id:      string;
  title:   string;
  order:   number;
  lessons: BuilderLesson[];
}

export interface BuilderCourse {
  id:               string;
  title:            string;
  description:      string;
  thumbnail:        string;
  price:            string;
  discount_percent: number | null;
  level:            string;
  status:           "DRAFT" | "PUBLISHED";
  category_id:      string;
  category:         { id: string; name: string };
  sections:         BuilderChapter[];
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
      discount_percent?: number | null;
    }) => (await api.put<{ course: Partial<BuilderCourse> }>(`/teacher/courses/${id}`, data)).data.course,
    onSuccess: (updated) => {
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", id], (old) =>
        old ? { ...old, ...updated } : old);
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
    onSuccess: () =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", id], (old) =>
        old ? { ...old, status: old.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } : old),
  });
}

export function useCreateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, order }: { title: string; order: number }) =>
      (await api.post<{ chapter: BuilderChapter }>("/teacher/chapters", { course_id: courseId, title, order })).data.chapter,
    onSuccess: (chapter) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? { ...old, sections: [...old.sections, { ...chapter, lessons: [] }] } : old),
  });
}

export function useUpdateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) =>
      api.put(`/teacher/chapters/${id}`, { title }),
    onSuccess: (_res, { id, title }) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? { ...old, sections: old.sections.map((s) => s.id === id ? { ...s, title } : s) } : old),
  });
}

export function useDeleteChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/teacher/chapters/${id}`),
    onSuccess: (_res, id) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? { ...old, sections: old.sections.filter((s) => s.id !== id) } : old),
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chapter_id, title, order }: { chapter_id: string; title: string; order: number }) =>
      (await api.post<{ lesson: BuilderLesson }>("/teacher/lessons", { chapter_id, title, order })).data.lesson,
    onSuccess: (lesson, { chapter_id }) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? {
          ...old,
          sections: old.sections.map((s) =>
            s.id === chapter_id ? { ...s, lessons: [...s.lessons, { ...lesson, quiz: [] }] } : s),
        } : old),
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, title, is_free, content, video_url, pdf_url, pdf_text,
    }: {
      id: string; title: string; is_free: boolean;
      content: string | null; video_url: string | null;
      pdf_url: string | null; pdf_text: string | null;
    }) => (await api.put<{ lesson: BuilderLesson }>(`/teacher/lessons/${id}`, { title, is_free, content, video_url, pdf_url, pdf_text })).data.lesson,
    onSuccess: (updated, { id }) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? {
          ...old,
          sections: old.sections.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) => l.id === id ? { ...l, ...updated } : l),
          })),
        } : old),
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/teacher/lessons/${id}`),
    onSuccess: (_res, id) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? {
          ...old,
          sections: old.sections.map((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) })),
        } : old),
  });
}

export function useUploadPdf() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string; pdfText: string | null }>(
        "/teacher/upload", formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { url: data.url, pdfText: data.pdfText ?? null };
    },
  });
}

export function useUploadThumbnail(onProgress?: (pct: number) => void) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>(
        "/teacher/upload-image", formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      return data.url;
    },
  });
}

export type UploadPhase = "idle" | "uploading" | "done" | "error";

/**
 * Hook upload video 2 phase:
 *   1. uploading — browser PUT thẳng lên R2 qua presigned URL (0-100%)
 *   2. done      — videoUrl sẵn sàng (r2:videos/uuid.mp4)
 */
export function useUploadVideo() {
  const [phase, setPhase]       = useState<UploadPhase>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setUploadPct(0);
    setErrorMsg(null);
  }, []);

  const upload = useCallback(async (file: File, onComplete: (url: string) => void) => {
    try {
      reset();

      // Bước 1: lấy presigned URL từ server
      setPhase("uploading");
      const { data: { uploadUrl, videoKey } } = await api.get<{ uploadUrl: string; videoKey: string }>(
        `/teacher/upload-video/presigned?contentType=${encodeURIComponent(file.type)}`
      );

      // Bước 2: browser PUT thẳng lên R2 (không qua server)
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      // Bước 3: enqueue faststart job trên Railway (fire-and-forget)
      api.post("/teacher/upload-video/confirm", { videoKey }).catch(() => {});

      setPhase("done");
      onComplete(`r2:${videoKey}`);
    } catch {
      setPhase("error");
      setErrorMsg("Upload thất bại, vui lòng thử lại.");
    }
  }, [reset]);

  return { phase, uploadPct, processPct: 0, errorMsg, upload, reset };
}

export function useCreateQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lesson_id, title, pass_score }: { lesson_id: string; title: string; pass_score: number }) =>
      (await api.post<{ quiz: BuilderQuiz }>("/teacher/quizzes", { lesson_id, title, pass_score })).data.quiz,
    onSuccess: (quiz, { lesson_id }) =>
      queryClient.setQueryData<BuilderCourse>(["teacher", "course", courseId], (old) =>
        old ? {
          ...old,
          sections: old.sections.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) => l.id === lesson_id ? { ...l, quiz: [...l.quiz, quiz] } : l),
          })),
        } : old),
  });
}

export interface AIQuestion {
  content: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  points: number;
  sample_answer?: string;
  options?: { content: string; is_correct: boolean }[];
}

export function useAIGenerateQuiz() {
  return useMutation({
    mutationFn: async ({
      lessonTitle, lessonContent, questionCount,
    }: {
      lessonTitle: string;
      lessonContent: string | null;
      questionCount: number;
    }) => {
      const res = await api.post<{ questions: AIQuestion[] }>(
        "/teacher/ai/generate-quiz",
        { lessonTitle, lessonContent, questionCount }
      );
      return res.data.questions;
    },
  });
}

export function useCreateQuizWithQuestions(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId, title, passScore, questions,
    }: {
      lessonId: string;
      title: string;
      passScore: number;
      questions: AIQuestion[];
    }) => {
      const quizRes = await api.post<{ quiz: BuilderQuiz }>(
        "/teacher/quizzes",
        { lesson_id: lessonId, title, pass_score: passScore }
      );
      const quizId = quizRes.data.quiz.id;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await api.post(`/teacher/quizzes/${quizId}/questions`, {
          content:       q.content,
          type:          q.type,
          points:        q.points,
          order:         i + 1,
          sample_answer: q.sample_answer,
          options:       q.options?.map((o, idx) => ({ ...o, order: idx + 1 })),
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
  });
}
