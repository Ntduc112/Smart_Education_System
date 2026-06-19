import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface LessonEngagement {
  lesson_id:          string;
  lesson_title:       string;
  chapter_title:      string;
  position:           number;
  avg_watch_percent:  number;
  completion_rate:    number;
  students_started:   number;
  students_completed: number;
  drop_from_prev:     number;
}

export interface EngagementData {
  course:          { id: string; title: string };
  total_enrolled:  number;
  total_lessons:   number;
  lessons:         LessonEngagement[];
  worst_lesson_id: string | null;
}

export function useCourseEngagement(courseId: string) {
  return useQuery<EngagementData>({
    queryKey: ["teacher", "course", courseId, "engagement"],
    queryFn:  async () =>
      (await api.get<EngagementData>(`/teacher/courses/${courseId}/engagement`)).data,
    enabled:   !!courseId,
    staleTime: 30_000,
  });
}
