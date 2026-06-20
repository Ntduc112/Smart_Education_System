import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Post } from "@/app/_components/posts.hook";

export type PostStatus = "PENDING" | "APPROVED" | "REJECTED";

export function useAdminPosts(status: PostStatus) {
    return useQuery<Post[]>({
        queryKey: ["admin", "posts", status],
        queryFn: async () =>
            (await api.get<{ posts: Post[] }>(`/admin/posts?status=${status}`)).data.posts,
        staleTime: 15_000,
    });
}

export function useModeratePost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
            (await api.patch<{ post: Post }>(`/admin/posts/${id}`, { status })).data.post,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "posts"] }),
    });
}
