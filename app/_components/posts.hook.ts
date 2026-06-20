import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PostAuthor {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
}

export type MediaType = "IMAGE" | "VIDEO";

export interface Post {
    id: string;
    title: string;
    content: string;
    media_url: string | null;
    media_type: MediaType | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    created_at: string;
    author: PostAuthor;
    _count: { likes: number; comments: number };
    likedByMe: boolean;
}

export interface PostComment {
    id: string;
    content: string;
    created_at: string;
    user: PostAuthor;
}

interface FeedResult {
    posts: Post[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Feed ─────────────────────────────────────────────────────────────────────

export function usePostsFeed(page = 1) {
    return useQuery<FeedResult>({
        queryKey: ["posts", "feed", page],
        queryFn: async () => (await api.get<FeedResult>(`/posts?page=${page}&limit=10`)).data,
        staleTime: 15_000,
        placeholderData: (prev) => prev,
    });
}

// ── Tạo post ───────────────────────────────────────────────────────────────

export interface CreatePostInput {
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: MediaType;
}

export function useCreatePost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreatePostInput) =>
            (await api.post<{ post: Post }>("/posts", input)).data.post,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["posts", "feed"] }),
    });
}

// Upload media lên R2 qua presigned PUT. Trả {publicUrl, mediaType}.
export async function uploadPostMedia(file: File): Promise<{ publicUrl: string; mediaType: MediaType }> {
    const { data } = await api.get<{ uploadUrl: string; publicUrl: string; mediaType: MediaType }>(
        `/posts/upload/presigned?contentType=${encodeURIComponent(file.type)}`
    );
    const res = await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("Upload thất bại");
    return { publicUrl: data.publicUrl, mediaType: data.mediaType };
}

// ── Like ─────────────────────────────────────────────────────────────────────

export function useToggleLike() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (postId: string) =>
            (await api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["posts", "feed"] }),
    });
}

// ── Comment ────────────────────────────────────────────────────────────────

export function usePostComments(postId: string, enabled: boolean) {
    return useQuery<PostComment[]>({
        queryKey: ["posts", "comments", postId],
        queryFn: async () =>
            (await api.get<{ comments: PostComment[] }>(`/posts/${postId}/comments`)).data.comments,
        enabled,
    });
}

export function useAddComment(postId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (content: string) =>
            (await api.post<{ comment: PostComment }>(`/posts/${postId}/comments`, { content })).data.comment,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["posts", "comments", postId] });
            qc.invalidateQueries({ queryKey: ["posts", "feed"] });
        },
    });
}
