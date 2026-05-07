import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { AdminStats, AdminUser } from "@/app/admin/admin.hook";

export function useDashboardStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "statistics"],
    queryFn:  async () => (await api.get<AdminStats>("/admin/statistics")).data,
    staleTime: 60_000,
  });
}

export function useRecentUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users", "recent"],
    queryFn:  async () =>
      (await api.get<{ users: AdminUser[] }>("/admin/users?limit=5&page=1")).data.users,
    staleTime: 60_000,
  });
}
