"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { MainNavbar } from "@/app/_components/MainNavbar";

const C = { canvas:"#EFF5FE", ink:"#181d26", inkSoft:"rgba(4,14,32,0.62)", inkFaint:"rgba(4,14,32,0.40)", border:"#DCE6F4", blue:"#1b61c9", blueDark:"#254fad", sky:"#2E8BE6", emerald:"#0E9F6E", violet:"#7C5CFC", rose:"#E5484D" };
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)", top: b.top, left: b.left, right: b.right, bottom: b.bottom }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }} />
      ))}
    </div>
  );
}

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
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/courses/${id}/students`}
            className="p-2 rounded-xl transition-colors hover:bg-[#EAF1FC]"
            style={{ color: C.inkSoft }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: C.ink }}>Gửi thông báo</h1>
            <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>
              Thông báo sẽ được gửi đến tất cả học viên đang đăng ký khóa học
            </p>
          </div>
        </div>

        {sent && (
          <div className="rounded-3xl bg-white px-5 py-4 flex items-start gap-3"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            <svg className="shrink-0 mt-0.5" style={{ color: C.emerald }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.emerald }}>Đã gửi thành công!</p>
              <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                Thông báo &ldquo;{sent.title}&rdquo; đã được gửi đến{" "}
                <strong>{sent.count}</strong> học viên.
              </p>
            </div>
            <button onClick={() => setSent(null)} className="ml-auto transition-colors" style={{ color: C.inkFaint }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {announce.isError && (
          <div className="rounded-3xl bg-white px-5 py-3 text-sm"
            style={{ border: `1px solid ${C.border}`, color: C.rose, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}>
            Không thể gửi thông báo. Vui lòng thử lại.
          </div>
        )}

        <div
          className="bg-white rounded-3xl p-6 space-y-5"
          style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.06) 0px 10px 30px" }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkSoft }}>
              Tiêu đề thông báo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vd: Cập nhật bài học mới..."
              maxLength={200}
              className="w-full px-4 py-2.5 text-sm bg-white rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all text-[#181d26] placeholder:text-[rgba(4,14,32,0.40)]"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkSoft }}>
              Nội dung
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo cho học viên..."
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-3 text-sm bg-white rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all resize-none text-[#181d26] placeholder:text-[rgba(4,14,32,0.40)]"
              style={{ border: `1px solid ${C.border}` }}
            />
            <p className="text-xs text-right" style={{ color: C.inkFaint }}>{message.length}/2000</p>
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
      </main>
    </div>
  );
}
