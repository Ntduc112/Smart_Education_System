import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { AdminUser } from "@/app/admin/admin.hook";

export type { AdminUser };

export interface UserPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface UsersResult {
  users:      AdminUser[];
  pagination: UserPagination;
}

export function useAdminUsers(params: { search: string; role: string; page: number }) {
  return useQuery<UsersResult>({
    queryKey: ["admin", "users", "list", params.search, params.role, params.page],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(params.page), limit: "10" });
      if (params.search.trim()) p.set("search", params.search.trim());
      if (params.role !== "ALL") p.set("role", params.role);
      return (await api.get<UsersResult>(`/admin/users?${p}`)).data;
    },
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });
}
