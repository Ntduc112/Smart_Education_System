import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface MonthlyPoint {
  month:       string; // "2025-01"
  revenue:     number;
  enrollments: number;
}

export interface CourseStats {
  id:          string;
  title:       string;
  thumbnail:   string;
  status:      "DRAFT" | "PUBLISHED";
  enrollments: number;
  revenue:     number;
}

export interface AnalyticsOverview {
  total_revenue:     number;
  total_enrollments: number;
  total_courses:     number;
  revenue_growth:    number | null; // % vs prev month, null if no prev data
  enrollment_growth: number | null;
}

export interface AnalyticsData {
  overview:    AnalyticsOverview;
  monthly:     MonthlyPoint[];
  top_courses: CourseStats[];
}

export function useTeacherAnalytics(months: 6 | 12 = 6) {
  return useQuery<AnalyticsData>({
    queryKey: ["teacher", "analytics", months],
    queryFn:  async () =>
      (await api.get<AnalyticsData>(`/teacher/analytics?months=${months}`)).data,
    staleTime: 60_000,
  });
}
