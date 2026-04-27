"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Lesson {
  id: string;
  title: string;
  order: number;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  is_free: boolean;
  chapter_id: string;
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
}

export function useCourseDetail(courseId: string) {
  return useQuery<CourseDetail>({
    queryKey: ["course-detail", courseId],
    queryFn: async () => {
      const res = await api.get(`/student/courses/${courseId}`);
      return res.data.course;
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
