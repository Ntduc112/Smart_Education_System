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
      id, title, is_free, content, video_url, pdf_url, pdf_text,
    }: {
      id: string; title: string; is_free: boolean;
      content: string | null; video_url: string | null;
      pdf_url: string | null; pdf_text: string | null;
    }) => api.put(`/teacher/lessons/${id}`, { title, is_free, content, video_url, pdf_url, pdf_text }),
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

export type UploadPhase = "idle" | "uploading" | "queued" | "processing" | "done" | "error";

/**
 * Hook upload video 3 phase:
 *   1. uploading  — browser PUT thẳng lên MinIO qua presigned URL (0-100%)
 *   2. queued     — job đã vào queue, chờ worker
 *   3. processing — worker đang chạy ffmpeg (0-100%)
 *   4. done       — videoUrl sẵn sàng
 */
export function useUploadVideo() {
  const [phase, setPhase]           = useState<UploadPhase>("idle");
  const [uploadPct, setUploadPct]   = useState(0);
  const [processPct, setProcessPct] = useState(0);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const pollingRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPhase("idle");
    setUploadPct(0);
    setProcessPct(0);
    setErrorMsg(null);
  }, []);

  const upload = useCallback(async (file: File, onComplete: (url: string) => void) => {
    try {
      reset();

      // Bước 1: lấy presigned URL từ server
      setPhase("uploading");
      const { data: { uploadUrl, rawKey } } = await api.get<{ uploadUrl: string; rawKey: string }>(
        `/teacher/upload-video/presigned?contentType=${encodeURIComponent(file.type)}`
      );

      // Bước 2: browser upload thẳng lên MinIO (không qua server)
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      // Bước 3: kích hoạt job xử lý HLS
      setPhase("queued");
      const { data: { jobId } } = await api.post<{ jobId: string }>(
        "/teacher/upload-video/process", { rawKey }
      );

      // Bước 4: poll trạng thái job mỗi 2 giây
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await api.get<{
            status: string; progress: number; videoUrl?: string; error?: string;
          }>(`/teacher/upload-video/status/${jobId}`);

          if (data.status === "active") {
            setPhase("processing");
            setProcessPct(data.progress);
          } else if (data.status === "completed" && data.videoUrl) {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setPhase("done");
            onComplete(data.videoUrl);
          } else if (data.status === "failed") {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setPhase("error");
            setErrorMsg(data.error ?? "Xử lý video thất bại");
          }
        } catch {
          // lỗi tạm thời khi poll → thử lại lần sau
        }
      }, 2000);
    } catch {
      setPhase("error");
      setErrorMsg("Upload thất bại, vui lòng thử lại.");
    }
  }, [reset]);

  return { phase, uploadPct, processPct, errorMsg, upload, reset };
}

export function useCreateQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lesson_id, title, pass_score }: { lesson_id: string; title: string; pass_score: number }) =>
      (await api.post<{ quiz: BuilderQuiz }>("/teacher/quizzes", { lesson_id, title, pass_score })).data.quiz,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
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
