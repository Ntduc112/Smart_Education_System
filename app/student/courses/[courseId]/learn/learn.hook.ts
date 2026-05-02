"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

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
