"use client";

import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { useAdminPosts, useModeratePost, type PostStatus } from "./posts.hook";

const TABS: { key: PostStatus; label: string }[] = [
    { key: "PENDING", label: "Chờ duyệt" },
    { key: "APPROVED", label: "Đã duyệt" },
    { key: "REJECTED", label: "Từ chối" },
];

function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function AdminPostsPage() {
    const [tab, setTab] = useState<PostStatus>("PENDING");
    const { data: posts, isLoading } = useAdminPosts(tab);
    const moderate = useModeratePost();

    return (
        <div className="px-8 py-7 max-w-3xl">
            <h1 className="text-2xl font-semibold text-[#181d26] mb-1">Bài viết cộng đồng</h1>
            <p className="text-sm text-[rgba(4,14,32,0.5)] mb-6">Duyệt bài viết do người dùng đăng.</p>

            <div className="flex gap-2 mb-6">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                            tab === t.key ? "bg-[#1b61c9] text-white" : "text-[rgba(4,14,32,0.6)] bg-white border border-[#e0e2e6] hover:bg-[#f8fafc]"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#1b61c9]" /></div>
            ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl border border-[#e0e2e6] p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-[#181d26]">{p.author.name} <span className="text-xs text-[rgba(4,14,32,0.4)]">· {p.author.role}</span></p>
                                <span className="text-xs text-[rgba(4,14,32,0.45)]">{timeAgo(p.created_at)}</span>
                            </div>
                            <h3 className="text-base font-semibold text-[#181d26] mb-1">{p.title}</h3>
                            <p className="text-sm text-[rgba(4,14,32,0.8)] whitespace-pre-wrap mb-3">{p.content}</p>
                            {p.media_url && (
                                <div className="rounded-xl overflow-hidden border border-[#e0e2e6] mb-3 max-w-md">
                                    {p.media_type === "VIDEO"
                                        ? <video src={p.media_url} controls className="w-full max-h-72 object-contain bg-black" />
                                        : <img src={p.media_url} alt={p.title} className="w-full max-h-72 object-contain bg-[#f8fafc]" />}
                                </div>
                            )}
                            {tab === "PENDING" && (
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => moderate.mutate({ id: p.id, status: "APPROVED" })}
                                        disabled={moderate.isPending}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                    >
                                        <Check size={15} /> Duyệt
                                    </button>
                                    <button
                                        onClick={() => moderate.mutate({ id: p.id, status: "REJECTED" })}
                                        disabled={moderate.isPending}
                                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
                                    >
                                        <X size={15} /> Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-sm text-[rgba(4,14,32,0.5)]">Không có bài viết.</p>
            )}
        </div>
    );
}
