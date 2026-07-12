import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface AssistantMembership {
  id: string;
  can_manage_lessons: boolean;
  can_manage_quizzes: boolean;
  course: {
    id: string;
    title: string;
    thumbnail: string;
    status: "DRAFT" | "PUBLISHED";
    instructor: { name: string; avatar: string | null };
    _count: { sections: number; enrollments: number };
  };
}

export function useAssistantCourses() {
  return useQuery<AssistantMembership[]>({
    queryKey: ["assistant", "courses"],
    queryFn: async () => (await api.get<{ memberships: AssistantMembership[] }>("/assistant/courses")).data.memberships,
  });
}
