import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface RoadmapCard {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string | null;
  created_at:  string;
  _count:      { items: number };
}

export interface RoadmapCourse {
  id:               string;
  title:            string;
  description:      string;
  thumbnail:        string;
  price:            string;
  discount_percent: number | null;
  level:            string;
  instructor:       { id: string; name: string };
  _count:           { enrollments: number };
}

export interface RoadmapDetail {
  id:          string;
  title:       string;
  description: string;
  thumbnail:   string | null;
  items:       { id: string; order: number; course: RoadmapCourse }[];
}

export function useRoadmaps() {
  return useQuery<RoadmapCard[]>({
    queryKey: ["roadmaps", "list"],
    queryFn:  async () => (await api.get<{ roadmaps: RoadmapCard[] }>("/roadmaps")).data.roadmaps,
  });
}

export function useRoadmap(id: string) {
  return useQuery<RoadmapDetail>({
    queryKey: ["roadmaps", id],
    queryFn:  async () => (await api.get<{ roadmap: RoadmapDetail }>(`/roadmaps/${id}`)).data.roadmap,
    enabled:  !!id,
  });
}
