import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface CourseCollaborator {
  id: string;
  can_manage_lessons: boolean;
  can_manage_quizzes: boolean;
  user: { id: string; name: string; email: string; avatar: string | null };
}

export interface CollaboratorPermissions {
  can_manage_lessons: boolean;
  can_manage_quizzes: boolean;
}

export interface CreateAssistantInput extends CollaboratorPermissions {
  email: string;
  name?: string;
  password?: string;
}

export interface CreateAssistantResult {
  collaborator: CourseCollaborator;
  created: boolean;
  emailSent: boolean;
}

export function useCourseCollaborators(courseId: string) {
  return useQuery<CourseCollaborator[]>({
    queryKey: ["teacher", "course", courseId, "collaborators"],
    queryFn: async () => (await api.get<{ collaborators: CourseCollaborator[] }>(`/teacher/courses/${courseId}/collaborators`)).data.collaborators,
  });
}

export function useCreateCourseAssistant(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAssistantInput) =>
      (await api.post<CreateAssistantResult>(`/teacher/courses/${courseId}/collaborators`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "collaborators"] }),
  });
}

export function useUpdateCourseCollaborator(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: CollaboratorPermissions }) => api.patch(`/teacher/courses/${courseId}/collaborators/${id}`, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "collaborators"] }),
  });
}

export function useRevokeCourseCollaborator(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/courses/${courseId}/collaborators/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "collaborators"] }),
  });
}

export interface CourseActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  created_at: string;
  actor: { id: string; name: string; email: string; avatar: string | null; role: string };
}

export function useCourseActivity(courseId: string, actorId: string | null, enabled: boolean) {
  return useQuery<CourseActivity[]>({
    queryKey: ["teacher", "course", courseId, "activity", actorId ?? "all"],
    queryFn: async () => (await api.get<{ activities: CourseActivity[] }>(
      `/teacher/courses/${courseId}/activity${actorId ? `?actor_id=${actorId}` : ""}`,
    )).data.activities,
    enabled,
  });
}
