"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ThumbsUp, ThumbsDown, MessageCircle, Loader2, X, ImagePlus, Send, Clock } from "lucide-react";
import {
    usePostsFeed,
    useCreatePost,
    useReactPost,
    usePostComments,
    useAddComment,
    uploadPostMedia,
    type Post,
    type MediaType,
} from "../posts.hook";

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

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
    STUDENT: { label: "Học viên", cls: "bg-[#EAF1FC] text-[#1b61c9]" },
    TEACHER: { label: "Giảng viên", cls: "bg-[rgba(14,159,110,0.12)] text-[#0E9F6E]" },
    ADMIN: { label: "Quản trị", cls: "bg-[rgba(124,92,252,0.12)] text-[#7C5CFC]" },
};

function RoleBadge({ role }: { role?: string }) {
    const b = role ? ROLE_BADGE[role] : undefined;
    if (!b) return null;
    return <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${b.cls}`}>{b.label}</span>;
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
    const [uploadPct, setUploadPct] = useState<number | null>(null);
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
                setUploadPct(0);
                const up = await uploadPostMedia(file, setUploadPct);
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
            setUploadPct(null);
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

                    {uploadPct !== null && (
                        <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-[#f0f2f5] overflow-hidden">
                                <div className="h-full bg-[#1b61c9] transition-all" style={{ width: `${uploadPct}%` }} />
                            </div>
                            <p className="text-xs text-[rgba(4,14,32,0.5)]">Đang tải lên {uploadPct}%</p>
                        </div>
                    )}

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
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#181d26]">
                                {c.user.name}
                                <RoleBadge role={c.user.role} />
                            </p>
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

function PostCard({ post, canInteract }: { post: Post; canInteract: boolean }) {
    const react = useReactPost();
    const router = useRouter();
    const [showComments, setShowComments] = useState(false);
    // SPA navigation — hard window.location reload làm React Query kẹt skeleton khi back.
    const requireLogin = () => router.push("/login");

    return (
        <article className="bg-white rounded-3xl border border-[#DCE6F4] p-6 transition-shadow hover:shadow-[rgba(27,60,120,0.10)_0px_12px_30px]" style={{ boxShadow: "rgba(27,60,120,0.05) 0px 8px 24px" }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full ring-2 ring-[#EAF1FC]"><Avatar user={post.author} /></div>
                <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#181d26]">
                        {post.author.name}
                        <RoleBadge role={post.author.role} />
                    </p>
                    <p className="text-xs text-[rgba(4,14,32,0.45)]">{timeAgo(post.created_at)}</p>
                </div>
            </div>

            <h3 className="font-display text-xl font-semibold text-[#181d26] leading-snug mb-1.5">{post.title}</h3>
            <p className="text-[15px] text-[rgba(4,14,32,0.72)] leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

            {post.media_url && (
                <div className="rounded-2xl overflow-hidden border border-[#DCE6F4] mb-4">
                    {post.media_type === "VIDEO"
                        ? <video src={post.media_url} controls className="w-full max-h-[480px] object-contain bg-black" />
                        : <img src={post.media_url} alt={post.title} className="w-full max-h-[480px] object-contain bg-[#EAF1FC]" />}
                </div>
            )}

            <div className="flex items-center gap-1 text-sm pt-3 border-t border-[#EEF2F9]">
                <button onClick={() => canInteract ? react.mutate({ postId: post.id, value: 1 }) : requireLogin()} disabled={react.isPending} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${post.myReaction === 1 ? "text-[#1b61c9] bg-[#EAF1FC]" : "text-[rgba(4,14,32,0.55)] hover:text-[#1b61c9] hover:bg-[#EAF1FC]"}`}>
                    <ThumbsUp size={17} fill={post.myReaction === 1 ? "currentColor" : "none"} /> {post.likeCount}
                </button>
                <button onClick={() => canInteract ? react.mutate({ postId: post.id, value: -1 }) : requireLogin()} disabled={react.isPending} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${post.myReaction === -1 ? "text-red-500 bg-red-50" : "text-[rgba(4,14,32,0.55)] hover:text-red-500 hover:bg-red-50"}`}>
                    <ThumbsDown size={17} fill={post.myReaction === -1 ? "currentColor" : "none"} /> {post.dislikeCount}
                </button>
                <button onClick={() => canInteract ? setShowComments((s) => !s) : requireLogin()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${showComments ? "text-[#1b61c9] bg-[#EAF1FC]" : "text-[rgba(4,14,32,0.55)] hover:text-[#1b61c9] hover:bg-[#EAF1FC]"}`}>
                    <MessageCircle size={17} /> {post._count.comments}
                </button>
            </div>

            {showComments && canInteract && <CommentBox postId={post.id} />}
        </article>
    );
}

// ── Preview card (compact, dùng ở landing) ───────────────────────────────────

function PreviewCard({ post }: { post: Post }) {
    return (
        <Link
            href="/posts"
            className="group flex flex-col rounded-3xl bg-white border border-[#DCE6F4] overflow-hidden transition-transform hover:-translate-y-1"
            style={{ boxShadow: "rgba(27,60,120,0.05) 0px 8px 24px" }}
        >
            {post.media_url && post.media_type === "IMAGE" && (
                <div className="aspect-video overflow-hidden bg-[#EAF1FC]">
                    <img src={post.media_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
            )}
            <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                    <Avatar user={post.author} size={32} />
                    <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#181d26]">
                            <span className="truncate">{post.author.name}</span>
                            <RoleBadge role={post.author.role} />
                        </p>
                        <p className="text-xs text-[rgba(4,14,32,0.45)]">{timeAgo(post.created_at)}</p>
                    </div>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#181d26] leading-snug line-clamp-2 mb-1.5 group-hover:text-[#1b61c9] transition-colors">{post.title}</h3>
                <p className="text-sm text-[rgba(4,14,32,0.6)] leading-relaxed line-clamp-3 mb-4">{post.content}</p>
                <div className="mt-auto flex items-center gap-4 text-xs text-[rgba(4,14,32,0.5)]">
                    <span className="flex items-center gap-1.5"><ThumbsUp size={14} /> {post.likeCount}</span>
                    <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {post._count.comments}</span>
                </div>
            </div>
        </Link>
    );
}

// ── Landing preview: rộng bằng cụm khóa học, 3 bài + "Xem thêm" → /posts ──────

export function PostsFeedSection() {
    const { data, isLoading } = usePostsFeed(1);
    const posts = data?.posts.slice(0, 3) ?? [];

    return (
        <section id="posts" className="relative max-w-7xl mx-auto px-6 py-16 border-t border-[#DCE6F4]">
            <div className="flex items-end justify-between mb-7">
                <div>
                    <h2 className="font-display text-3xl font-semibold text-[#181d26] tracking-tight">Cộng đồng</h2>
                    <p className="text-sm text-[rgba(4,14,32,0.6)] mt-1.5">Chia sẻ, hỏi đáp và học hỏi cùng cộng đồng SmartEdu</p>
                </div>
                <Link href="/posts" className="text-sm text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors shrink-0 ml-4">
                    Xem thêm →
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#1b61c9]" /></div>
            ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {posts.map((p) => <PreviewCard key={p.id} post={p} />)}
                </div>
            ) : (
                <div className="text-center py-10 text-[rgba(4,14,32,0.5)]">
                    <Clock size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có bài viết nào. Hãy là người đầu tiên!</p>
                </div>
            )}
        </section>
    );
}

// ── Trang /posts: feed đầy đủ + phân trang + đăng bài ─────────────────────────

export function PostsFeedFull() {
    const { data: me } = useMe();
    const [page, setPage] = useState(1);
    const { data, isLoading } = usePostsFeed(page);
    const [showComposer, setShowComposer] = useState(false);
    const totalPages = data?.pagination.totalPages ?? 1;

    return (
        <section className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-7">
                <h1 className="font-display text-4xl font-light text-[#181d26]">Cộng đồng <span className="font-semibold text-[#1b61c9]">SmartEdu</span></h1>
                <p className="text-sm text-[rgba(4,14,32,0.6)] mt-1.5">Chia sẻ, hỏi đáp và cùng nhau tiến bộ mỗi ngày</p>
            </div>

            {/* Compose box */}
            {me ? (
                <button
                    onClick={() => setShowComposer(true)}
                    className="w-full mb-7 flex items-center gap-3 bg-white rounded-2xl border border-[#DCE6F4] p-3.5 text-left transition-shadow hover:shadow-[rgba(27,60,120,0.08)_0px_8px_22px]"
                    style={{ boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}
                >
                    <Avatar user={me} size={40} />
                    <span className="flex-1 text-sm text-[rgba(4,14,32,0.45)]">Chia sẻ điều gì đó với cộng đồng…</span>
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-[#1b61c9] text-white text-sm font-medium rounded-xl shrink-0">
                        <ImagePlus size={15} /> Đăng bài
                    </span>
                </button>
            ) : (
                <div className="mb-7 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-[#DCE6F4] p-4" style={{ boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}>
                    <span className="text-sm text-[rgba(4,14,32,0.6)]">Đăng nhập để chia sẻ bài viết với cộng đồng.</span>
                    <Link href="/login" className="px-5 py-2 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-colors shrink-0">
                        Đăng nhập
                    </Link>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#1b61c9]" /></div>
            ) : data && data.posts.length > 0 ? (
                <div className="space-y-5">
                    {data.posts.map((p) => <PostCard key={p.id} post={p} canInteract={!!me} />)}
                </div>
            ) : (
                <div className="text-center py-16 text-[rgba(4,14,32,0.5)]">
                    <Clock size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có bài viết nào. Hãy là người đầu tiên!</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        disabled={page <= 1}
                        onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-[#DCE6F4] bg-white text-[#181d26] hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Trước
                    </button>
                    <span className="text-sm text-[rgba(4,14,32,0.6)]">Trang {page} / {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0 }); }}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-[#DCE6F4] bg-white text-[#181d26] hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Sau →
                    </button>
                </div>
            )}

            {showComposer && <Composer onClose={() => setShowComposer(false)} />}
        </section>
    );
}
