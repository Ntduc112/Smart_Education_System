import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; avatar?: string }) => api.put("/user/me", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ url: string }>("/user/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}
