"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Heart, MessageCircle, Loader2, X, ImagePlus, Send, Clock } from "lucide-react";
import {
    usePostsFeed,
    useCreatePost,
    useToggleLike,
    usePostComments,
    useAddComment,
    uploadPostMedia,
    type Post,
    type MediaType,
} from "./posts.hook";

interface Me { id: string; name: string; avatar: string | null }

function useMe() {
    return useQuery<Me | null>({
        queryKey: ["me"],
        queryFn: async () => (await api.get<{ user: Me }>("/user/me")).data.user,
        retry: false,
        staleTime: 60_000,
    });
}

function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

function Avatar({ user, size = 40 }: { user: { name: string; avatar: string | null }; size?: number }) {
    if (user.avatar) {
        return <img src={user.avatar} alt={user.name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
    }
    return (
        <div className="rounded-full bg-[#1b61c9]/15 flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <span className="font-semibold text-[#1b61c9]" style={{ fontSize: size * 0.4 }}>{user.name.charAt(0)}</span>
        </div>
    );
}

// ── Composer ─────────────────────────────────────────────────────────────────

function Composer({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const create = useCreatePost();

    const previewUrl = file ? URL.createObjectURL(file) : null;
    const isVideo = file?.type.startsWith("video/");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!title.trim() || !content.trim()) { setError("Nhập tiêu đề và nội dung"); return; }
        setSubmitting(true);
        try {
            let mediaUrl: string | undefined;
            let mediaType: MediaType | undefined;
            if (file) {
                const up = await uploadPostMedia(file);
                mediaUrl = up.publicUrl;
                mediaType = up.mediaType;
            }
            await create.mutateAsync({ title: title.trim(), content: content.trim(), mediaUrl, mediaType });
            onClose();
        } catch (err) {
            const e = err as { response?: { data?: { error?: string } } };
            setError(e.response?.data?.error ?? "Đăng bài thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = "w-full px-3 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all";

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-[#181d26]">Tạo bài viết</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]"><X size={16} /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" maxLength={200} className={inputCls} />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Bạn đang nghĩ gì?" maxLength={5000} rows={4} className={inputCls + " resize-none"} />

                    {previewUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-[#e0e2e6]">
                            {isVideo
                                ? <video src={previewUrl} controls className="w-full max-h-64 object-contain bg-black" />
                                : <img src={previewUrl} alt="preview" className="w-full max-h-64 object-contain bg-[#f8fafc]" />}
                            <button type="button" onClick={() => setFile(null)} className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70"><X size={14} /></button>
                        </div>
                    )}

                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex items-center justify-between pt-1">
                        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors">
                            <ImagePlus size={16} /> Ảnh / Video
                        </button>
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
                            {submitting && <Loader2 size={14} className="animate-spin" />} Đăng bài
                        </button>
                    </div>
                    <p className="text-xs text-[rgba(4,14,32,0.45)]">Bài viết sẽ chờ quản trị viên duyệt trước khi hiển thị.</p>
                </form>
            </div>
        </div>
    );
}

// ── Comments ─────────────────────────────────────────────────────────────────

function CommentBox({ postId }: { postId: string }) {
    const { data: comments, isLoading } = usePostComments(postId, true);
    const add = useAddComment(postId);
    const [text, setText] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        await add.mutateAsync(text.trim());
        setText("");
    };

    return (
        <div className="mt-4 pt-4 border-t border-[#f0f2f5] space-y-3">
            {isLoading ? (
                <Loader2 size={16} className="animate-spin text-[rgba(4,14,32,0.4)]" />
            ) : comments && comments.length > 0 ? (
                comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                        <Avatar user={c.user} size={30} />
                        <div className="bg-[#f8fafc] rounded-2xl px-3.5 py-2 flex-1">
                            <p className="text-xs font-semibold text-[#181d26]">{c.user.name}</p>
                            <p className="text-sm text-[rgba(4,14,32,0.8)]">{c.content}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-xs text-[rgba(4,14,32,0.45)]">Chưa có bình luận.</p>
            )}
            <form onSubmit={submit} className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Viết bình luận..." maxLength={2000} className="flex-1 px-3 py-2 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9]" />
                <button type="submit" disabled={add.isPending || !text.trim()} className="p-2.5 rounded-xl bg-[#1b61c9] text-white hover:bg-[#254fad] disabled:opacity-50">
                    {add.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
            </form>
        </div>
    );
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
    const like = useToggleLike();
    const [showComments, setShowComments] = useState(false);

    return (
        <article className="bg-white rounded-2xl border border-[#e0e2e6] p-5" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
            <div className="flex items-center gap-3 mb-3">
                <Avatar user={post.author} />
                <div>
                    <p className="text-sm font-semibold text-[#181d26]">{post.author.name}</p>
                    <p className="text-xs text-[rgba(4,14,32,0.45)]">{timeAgo(post.created_at)}</p>
                </div>
            </div>

            <h3 className="text-base font-semibold text-[#181d26] mb-1">{post.title}</h3>
            <p className="text-sm text-[rgba(4,14,32,0.8)] whitespace-pre-wrap mb-3">{post.content}</p>

            {post.media_url && (
                <div className="rounded-xl overflow-hidden border border-[#e0e2e6] mb-3">
                    {post.media_type === "VIDEO"
                        ? <video src={post.media_url} controls className="w-full max-h-[480px] object-contain bg-black" />
                        : <img src={post.media_url} alt={post.title} className="w-full max-h-[480px] object-contain bg-[#f8fafc]" />}
                </div>
            )}

            <div className="flex items-center gap-5 text-sm">
                <button onClick={() => like.mutate(post.id)} disabled={like.isPending} className={`flex items-center gap-1.5 transition-colors ${post.likedByMe ? "text-red-500" : "text-[rgba(4,14,32,0.55)] hover:text-red-500"}`}>
                    <Heart size={17} fill={post.likedByMe ? "currentColor" : "none"} /> {post._count.likes}
                </button>
                <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-1.5 text-[rgba(4,14,32,0.55)] hover:text-[#1b61c9] transition-colors">
                    <MessageCircle size={17} /> {post._count.comments}
                </button>
            </div>

            {showComments && <CommentBox postId={post.id} />}
        </article>
    );
}

// ── Section ─────────────────────────────────────────────────────────────────

export function PostsFeedSection() {
    const { data: me } = useMe();
    const { data, isLoading } = usePostsFeed(1);
    const [showComposer, setShowComposer] = useState(false);

    // Khách chưa đăng nhập → không hiển thị feed.
    if (!me) return null;

    return (
        <section className="max-w-2xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[#181d26]">Cộng đồng</h2>
                <button onClick={() => setShowComposer(true)} className="px-4 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors">
                    Đăng bài
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#1b61c9]" /></div>
            ) : data && data.posts.length > 0 ? (
                <div className="space-y-5">
                    {data.posts.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
            ) : (
                <div className="text-center py-10 text-[rgba(4,14,32,0.5)]">
                    <Clock size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có bài viết nào. Hãy là người đầu tiên!</p>
                </div>
            )}

            {showComposer && <Composer onClose={() => setShowComposer(false)} />}
        </section>
    );
}
