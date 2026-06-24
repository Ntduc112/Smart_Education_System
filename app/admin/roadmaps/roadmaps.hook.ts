import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

export type RoadmapStatus     = "DRAFT" | "PUBLISHED";
export type RoadmapItemStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RoadmapRow {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string | null;
  status:      RoadmapStatus;
  created_at:  string;
  _count:      { items: number };
}

export interface RoadmapItem {
  id:          string;
  order:       number;
  status:      RoadmapItemStatus;
  proposed_by: string | null;
  course: {
    id:         string;
    title:      string;
    thumbnail:  string;
    status:     "DRAFT" | "PUBLISHED";
    instructor: { id: string; name: string };
  };
}

export interface RoadmapDetail {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string | null;
  status:      RoadmapStatus;
  items:       RoadmapItem[];
}

// ── List + create ────────────────────────────────────────────────────────────

export function useRoadmaps() {
  return useQuery<RoadmapRow[]>({
    queryKey: ["admin", "roadmaps"],
    queryFn:  async () => (await api.get<{ roadmaps: RoadmapRow[] }>("/admin/roadmaps")).data.roadmaps,
  });
}

export function useCreateRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description: string; thumbnail?: string | null; status?: RoadmapStatus }) =>
      (await api.post<{ roadmap: RoadmapRow }>("/admin/roadmaps", data)).data.roadmap,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmaps"] }),
  });
}

// ── Detail + update + delete ──────────────────────────────────────────────────

export function useRoadmap(id: string) {
  return useQuery<RoadmapDetail>({
    queryKey: ["admin", "roadmap", id],
    queryFn:  async () => (await api.get<{ roadmap: RoadmapDetail }>(`/admin/roadmaps/${id}`)).data.roadmap,
    enabled:  !!id,
  });
}

export function useUpdateRoadmap(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title?: string; description?: string; thumbnail?: string | null; status?: RoadmapStatus }) =>
      (await api.put(`/admin/roadmaps/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roadmap", id] });
      qc.invalidateQueries({ queryKey: ["admin", "roadmaps"] });
    },
  });
}

export function useDeleteRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/roadmaps/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin", "roadmaps"] }),
  });
}

// ── Items: attach / update (approve·reject·reorder) / remove ──────────────────

export function useAttachCourse(roadmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) =>
      api.post(`/admin/roadmaps/${roadmapId}/items`, { course_id: courseId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmap", roadmapId] }),
  });
}

export function useUpdateItem(roadmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: string; status?: RoadmapItemStatus; order?: number }) =>
      api.put(`/admin/roadmaps/items/${itemId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roadmap", roadmapId] }),
  });
}

export function useRemoveItem(roadmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => api.delete(`/admin/roadmaps/items/${itemId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin", "roadmap", roadmapId] }),
  });
}
