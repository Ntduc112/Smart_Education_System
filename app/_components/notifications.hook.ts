import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Notification {
  id:         string;
  type:       string;
  title:      string;
  message:    string;
  link:       string | null;
  is_read:    boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count:  number;
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey:        ["notifications"],
    queryFn:         async () => (await api.get<NotificationsResponse>("/notifications")).data,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime:       10_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<NotificationsResponse>(["notifications"]);
      qc.setQueryData<NotificationsResponse>(["notifications"], (old) => {
        if (!old) return old;
        const notifications = old.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        );
        return { notifications, unread_count: notifications.filter((n) => !n.is_read).length };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<NotificationsResponse>(["notifications"]);
      qc.setQueryData<NotificationsResponse>(["notifications"], (old) => {
        if (!old) return old;
        return { notifications: old.notifications.map((n) => ({ ...n, is_read: true })), unread_count: 0 };
      });
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
  });
}
