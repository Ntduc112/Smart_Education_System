import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ClassroomQuiz {
  id: string;
  title: string;
  pass_score: number;
  require_pass: boolean;
  max_attempts: number | null;
  time_limit: number | null;
}

export interface ClassroomLesson {
  id: string;
  title: string;
  order: number;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  pdf_text: string | null;
  is_free: boolean;
  question_count: number;
  unanswered_count: number;
  quiz: ClassroomQuiz[];
}

export interface ClassroomChapter {
  id: string;
  title: string;
  order: number;
  lessons: ClassroomLesson[];
}

export interface TeacherClassroom {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  instructor: { id: string; name: string; avatar: string | null };
  sections: ClassroomChapter[];
}

export function useTeacherClassroom(courseId: string) {
  return useQuery<TeacherClassroom>({
    queryKey: ["teacher", "classroom", courseId],
    queryFn: async () =>
      (await api.get<{ course: TeacherClassroom }>(`/teacher/courses/${courseId}/classroom`)).data.course,
    enabled: !!courseId,
    staleTime: 15_000,
  });
}
