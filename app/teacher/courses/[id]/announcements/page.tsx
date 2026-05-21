"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

function useAnnounce(courseId: string) {
  return useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const res = await api.post<{ sent: number; message: string }>(
        `/teacher/courses/${courseId}/announcements`,
        { title, message }
      );
      return res.data;
    },
  });
}

export default function AnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent]       = useState<{ count: number; title: string } | null>(null);

  const announce = useAnnounce(id);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    announce.mutate(
      { title: title.trim(), message: message.trim() },
      {
        onSuccess: (data) => {
          setSent({ count: data.sent, title: title.trim() });
          setTitle("");
          setMessage("");
        },
      }
    );
  };

  return (
    <div className="px-8 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/teacher/courses/${id}/students`}
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26]">Gửi thông báo</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
            Thông báo sẽ được gửi đến tất cả học viên đang đăng ký khóa học
          </p>
        </div>
      </div>

      {sent && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
          <svg className="text-emerald-500 shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Đã gửi thành công!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Thông báo &ldquo;{sent.title}&rdquo; đã được gửi đến{" "}
              <strong>{sent.count}</strong> học viên.
            </p>
          </div>
          <button onClick={() => setSent(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {announce.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          Không thể gửi thông báo. Vui lòng thử lại.
        </div>
      )}

      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] p-6 space-y-5"
        style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 16px" }}
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">
            Tiêu đề thông báo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Vd: Cập nhật bài học mới..."
            maxLength={200}
            className="w-full px-4 py-2.5 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">
            Nội dung
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo cho học viên..."
            maxLength={2000}
            rows={5}
            className="w-full px-4 py-3 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all resize-none text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)]"
          />
          <p className="text-xs text-[rgba(4,14,32,0.35)] text-right">{message.length}/2000</p>
        </div>

        <button
          onClick={handleSend}
          disabled={!title.trim() || !message.trim() || announce.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: "rgba(27,97,201,0.28) 0px 1px 4px" }}
        >
          {announce.isPending ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
          {announce.isPending ? "Đang gửi..." : "Gửi thông báo"}
        </button>
      </div>
    </div>
  );
}
