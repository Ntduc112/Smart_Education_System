import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface QuizResult {
  quiz_id:      string;
  quiz_title:   string;
  lesson_title: string;
  pass_score:   number;
  best_score:   number | null;
  is_passed:    boolean | null;
  attempts:     number;
  last_attempt: string | null;
}

export interface StudentProgress {
  user: {
    id:     string;
    name:   string;
    email:  string;
    avatar: string | null;
  };
  enrolled_at:       string;
  completed_lessons: number;
  total_lessons:     number;
  completion_pct:    number;
  last_active_at:    string | null;
  current_lesson:    string | null;
  quizzes:           QuizResult[];
  quiz_passed:       number;
  quiz_total:        number;
}

export interface StudentsData {
  course: {
    id:    string;
    title: string;
  };
  total_lessons: number;
  total_quizzes: number;
  students:      StudentProgress[];
}

export function useStudentsProgress(courseId: string) {
  return useQuery<StudentsData>({
    queryKey: ["teacher", "course", courseId, "students"],
    queryFn:  async () =>
      (await api.get<StudentsData>(`/teacher/courses/${courseId}/students`)).data,
    enabled:   !!courseId,
    staleTime: 30_000,
  });
}
