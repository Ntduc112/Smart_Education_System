import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; avatar?: string }) => api.put("/user/me", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
