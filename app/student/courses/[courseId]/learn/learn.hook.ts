"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_no: string;
  course: { title: string; instructor: { name: string } };
  user: { name: string };
}

// ── Course / Lesson types ──────────────────────────────────────────────────

export interface QuizSummary {
  id: string;
  title: string;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  is_free: boolean;
  chapter_id: string;
  quiz: QuizSummary[];
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  instructor: { id: string; name: string; avatar: string | null };
  category: { id: string; name: string };
  sections: Chapter[];
}

export interface CourseProgress {
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  completed_lesson_ids: string[];
  current_lesson_id: string | null;
}

// ── Quiz detail types ──────────────────────────────────────────────────────

export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface QuizOption {
  id: string;
  content: string;
  order: number;
  is_correct?: boolean;
}

export interface QuizQuestion {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  options: QuizOption[];
}

export interface QuizDetail {
  id: string;
  title: string;
  pass_score: number;
  time_limit: number | null;
  lesson_id: string;
  questions: QuizQuestion[];
}

export interface AttemptAnswer {
  question_id: string;
  answer: string;
  is_correct: boolean | null;
  points_earned: number | null;
}

export interface QuizAttempt {
  id: string;
  score: number | null;
  is_passed: boolean | null;
  submitted_at: string;
  answers: AttemptAnswer[];
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useCourseDetail(courseId: string) {
  return useQuery<CourseDetail>({
    queryKey: ["course-detail", courseId],
    queryFn: async () => {
      const res = await api.get(`/student/courses/${courseId}`);
      return res.data.course as CourseDetail;
    },
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery<CourseProgress>({
    queryKey: ["course-progress", courseId],
    queryFn: async () => {
      const res = await api.get(`/student/courses/${courseId}/progress`);
      return res.data.progress;
    },
  });
}

export function useMarkLessonComplete(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) =>
      api.post(`/student/lessons/${lessonId}/progress`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
    },
  });
}

export function useQuizDetail(quizId: string | null) {
  return useQuery<QuizDetail>({
    queryKey: ["quiz-detail", quizId],
    queryFn: async () => {
      const res = await api.get(`/student/quizzes/${quizId}`);
      return res.data.quiz;
    },
    enabled: !!quizId,
  });
}

export function useQuizAttempts(quizId: string | null) {
  return useQuery<QuizAttempt[]>({
    queryKey: ["quiz-attempts", quizId],
    queryFn: async () => {
      const res = await api.get(`/student/quizzes/${quizId}/attempts`);
      return res.data.attempts;
    },
    enabled: !!quizId,
  });
}

export function useSubmitQuizAttempt(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: { question_id: string; answer: string }[]) =>
      api.post(`/student/quizzes/${quizId}/attempts`, { answers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz-attempts", quizId] });
    },
  });
}

export function useCourseCertificate(courseId: string) {
  return useQuery({
    queryKey: ["certificate", courseId],
    queryFn: async () => {
      const res = await api.get(`/student/courses/${courseId}/certificate`);
      return res.data.certificate as Certificate | null;
    },
  });
}

export function useIssueCertificate(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/student/courses/${courseId}/certificate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificate", courseId] }),
  });
}

// ── Q&A types ──────────────────────────────────────────────────────────────

export interface QAUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface QAReply {
  id: string;
  content: string;
  created_at: string;
  vote_count: number;
  has_voted: boolean;
  user: QAUser;
}

export interface QAQuestion {
  id: string;
  content: string;
  created_at: string;
  vote_count: number;
  reply_count: number;
  has_voted: boolean;
  user: QAUser;
  replies: QAReply[];
}

// ── Q&A hooks ──────────────────────────────────────────────────────────────

export function useQuestions(lessonId: string) {
  return useQuery<QAQuestion[]>({
    queryKey: ["questions", lessonId],
    queryFn: async () => {
      const res = await api.get(`/lessons/${lessonId}/questions`);
      return res.data.questions;
    },
  });
}

export function useAskQuestion(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/lessons/${lessonId}/questions`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", lessonId] }),
  });
}

export function usePostReply(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      api.post(`/questions/${questionId}/replies`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", lessonId] }),
  });
}

export function useToggleQuestionVote(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      api.post(`/questions/${questionId}/vote`),
    onMutate: async (questionId) => {
      await qc.cancelQueries({ queryKey: ["questions", lessonId] });
      const prev = qc.getQueryData<QAQuestion[]>(["questions", lessonId]);
      qc.setQueryData<QAQuestion[]>(["questions", lessonId], (old) =>
        old?.map((q) =>
          q.id === questionId
            ? { ...q, has_voted: !q.has_voted, vote_count: q.has_voted ? q.vote_count - 1 : q.vote_count + 1 }
            : q
        )
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["questions", lessonId], ctx.prev);
    },
  });
}

export function useToggleReplyVote(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId }: { replyId: string; questionId: string }) =>
      api.post(`/replies/${replyId}/vote`),
    onMutate: async ({ replyId, questionId }) => {
      await qc.cancelQueries({ queryKey: ["questions", lessonId] });
      const prev = qc.getQueryData<QAQuestion[]>(["questions", lessonId]);
      qc.setQueryData<QAQuestion[]>(["questions", lessonId], (old) =>
        old?.map((q) =>
          q.id === questionId
            ? {
                ...q,
                replies: q.replies.map((r) =>
                  r.id === replyId
                    ? { ...r, has_voted: !r.has_voted, vote_count: r.has_voted ? r.vote_count - 1 : r.vote_count + 1 }
                    : r
                ),
              }
            : q
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["questions", lessonId], ctx.prev);
    },
  });
}
