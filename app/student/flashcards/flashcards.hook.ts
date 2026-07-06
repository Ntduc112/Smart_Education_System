import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Flashcard {
  id: string;
  question_id: string;
  question: string;
  correct_answer: string;
  your_answer: string;
  quiz_title: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
}

export interface FlashcardCourse {
  course_id: string;
  course_title: string;
  thumbnail: string;
  wrong_count: number;
}

export function useFlashcardCourses() {
  return useQuery<{ courses: FlashcardCourse[]; total: number }>({
    queryKey: ["student", "flashcards", "courses"],
    queryFn: () => api.get("/student/flashcards/courses").then((r) => r.data),
  });
}

// courseId undefined / "all" → every course's cards combined
export function useFlashcards(courseId?: string) {
  const scoped = courseId && courseId !== "all" ? courseId : undefined;
  return useQuery<{ flashcards: Flashcard[] }>({
    queryKey: ["student", "flashcards", "cards", scoped ?? "all"],
    queryFn: () =>
      api
        .get("/student/flashcards", { params: scoped ? { course_id: scoped } : {} })
        .then((r) => r.data),
  });
}

export function useMarkMastered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (question_id: string) =>
      api.post("/student/flashcards/mastered", { question_id }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "flashcards", "courses"] });
    },
  });
}

// courseId undefined → reset everything
export function useResetMastered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId?: string) =>
      api
        .delete("/student/flashcards/mastered", {
          params: courseId && courseId !== "all" ? { course_id: courseId } : {},
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "flashcards"] });
    },
  });
}
