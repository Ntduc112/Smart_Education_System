import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Category {
  id:          string;
  name:        string;
  description: string;
  _count:      { courses: number };
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn:  async () =>
      (await api.get<{ categories: Category[] }>("/admin/categories")).data.categories,
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post("/admin/categories", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string }) =>
      api.put(`/admin/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}
