import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface LessonDetail {
  lesson_id:       string;
  lesson_title:    string;
  chapter_title:   string;
  watch_percent:   number;
  is_completed:    boolean;
  last_watched_at: string | null;
}

export interface QuizResult {
  quiz_id:      string;
  quiz_title:   string;
  lesson_title: string;
  pass_score:   number;
  require_pass: boolean;
  max_attempts: number | null;
  effective_max_attempts: number | null;
  extra_attempts: number;
  remaining_attempts: number | null;
  exhausted: boolean;
  pending_request: { id: string; requested_at: string } | null;
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
  lessons_detail:    LessonDetail[];
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

export function useApproveQuizAttemptRequest(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post(`/teacher/quiz-attempt-requests/${requestId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
