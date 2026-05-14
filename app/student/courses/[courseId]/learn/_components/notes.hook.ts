"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface LessonNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AllNote extends LessonNote {
  lesson: {
    id: string;
    title: string;
    chapter: {
      course: { id: string; title: string; thumbnail: string };
    };
  };
}

export function useNotes(lessonId: string) {
  return useQuery<LessonNote[]>({
    queryKey: ["notes", lessonId],
    queryFn: async () => {
      const res = await api.get(`/lessons/${lessonId}/notes`);
      return res.data.notes;
    },
  });
}

export function useAddNote(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/lessons/${lessonId}/notes`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", lessonId] }),
  });
}

export function useUpdateNote(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.patch(`/notes/${id}`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", lessonId] });
      qc.invalidateQueries({ queryKey: ["all-notes"] });
    },
  });
}

export function useDeleteNote(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", lessonId] });
      qc.invalidateQueries({ queryKey: ["all-notes"] });
    },
  });
}

export function useAllNotes() {
  return useQuery<AllNote[]>({
    queryKey: ["all-notes"],
    queryFn: async () => {
      const res = await api.get("/student/notes");
      return res.data.notes;
    },
  });
}
