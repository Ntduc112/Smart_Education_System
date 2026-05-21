"use client";

import { useState, useRef } from "react";

interface AISummaryProps {
  lessonTitle: string;
  lessonContent: string | null;
  courseTitle: string;
}

export function AISummary({ lessonTitle, lessonContent, courseTitle }: AISummaryProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (loading) return;
    setText("");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonTitle, lessonContent, courseTitle }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) { setText("Không thể tạo tóm tắt."); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setText(accumulated);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setText("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open && !text) handleGenerate();
    setOpen((v) => !v);
  };

  return (
    <div className="mt-5 rounded-xl border border-[#e0e2e6] bg-white overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1b61c9]/10 to-[#4f8ef7]/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1b61c9" stroke="none">
              <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
              <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#181d26]">Tóm tắt AI</span>
          {loading && (
            <svg className="animate-spin text-[#1b61c9]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[rgba(4,14,32,0.35)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[#f0f2f5] px-4 py-4 bg-[#fafbfc]">
          {text ? (
            <>
              <div className="text-sm text-[#181d26] leading-relaxed whitespace-pre-line">
                {text}
                {loading && (
                  <span className="inline-block w-0.5 h-3.5 bg-[#1b61c9] ml-1 align-middle animate-pulse rounded-full" />
                )}
              </div>
              {!loading && (
                <button
                  onClick={handleGenerate}
                  className="mt-3 text-xs text-[#1b61c9] hover:text-[#254fad] font-medium flex items-center gap-1 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Tạo lại
                </button>
              )}
            </>
          ) : (
            <div className="flex justify-center py-4">
              <svg className="animate-spin text-[#1b61c9]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
