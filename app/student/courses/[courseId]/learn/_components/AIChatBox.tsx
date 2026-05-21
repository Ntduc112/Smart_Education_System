"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatBoxProps {
  lessonTitle: string;
  lessonContent: string | null;
  courseTitle: string;
  chapterTitle: string;
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" fill="currentColor" stroke="none" />
      <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="currentColor" stroke="none" />
      <path d="M5 17L5.5 18.5L7 19L5.5 19.5L5 21L4.5 19.5L3 19L4.5 18.5L5 17Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[rgba(4,14,32,0.35)] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

function AIAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b61c9] to-[#4f8ef7] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      </svg>
    </div>
  );
}

function MessageBubble({ msg, isStreaming }: { msg: Message; isStreaming?: boolean }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-[#1b61c9] text-white text-sm leading-relaxed shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      <AIAvatar />
      <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-[#e8eaf0] text-sm text-[#181d26] leading-relaxed shadow-sm">
        {msg.content === "" && isStreaming ? (
          <TypingDots />
        ) : (
          <>
            {msg.content}
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-[#1b61c9] ml-0.5 align-middle animate-pulse rounded-full" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AIChatBox({
  lessonTitle,
  lessonContent,
  courseTitle,
  chapterTitle,
}: AIChatBoxProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    const placeholderMsg: Message = { role: "assistant", content: "" };
    setMessages([...nextMessages, placeholderMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle,
          lessonContent,
          courseTitle,
          chapterTitle,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại." },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiText },
        ]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Xin lỗi, mất kết nối. Vui lòng thử lại." },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, lessonTitle, lessonContent, courseTitle, chapterTitle]);

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[350px] flex flex-col rounded-2xl shadow-2xl border border-[#e0e4ef] bg-[#f8fafc] overflow-hidden transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "490px", transformOrigin: "bottom right" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-b border-[#e8eaf0] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b61c9] to-[#4f8ef7] flex items-center justify-center shadow-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#181d26] leading-tight">Trợ lý AI</p>
            <p className="text-[10px] text-[rgba(4,14,32,0.45)] truncate leading-tight mt-0.5">
              {lessonTitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title="Xoá lịch sử"
                className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[rgba(4,14,32,0.65)] hover:bg-[#f0f2f5] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[rgba(4,14,32,0.65)] hover:bg-[#f0f2f5] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1b61c9]/10 to-[#4f8ef7]/10 flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" fill="#1b61c9" />
                  <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="#4f8ef7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#181d26] mb-1">Xin chào! Tôi là trợ lý AI</p>
                <p className="text-xs text-[rgba(4,14,32,0.45)] leading-relaxed">
                  Hãy hỏi bất kỳ điều gì về bài học này. Tôi sẽ giúp bạn hiểu rõ hơn nhé!
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {[
                  "Giải thích lại nội dung bài học này",
                  "Cho tôi ví dụ thực tế",
                  "Tôi chưa hiểu phần này, giải thích thêm được không?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#1b61c9] bg-[#1b61c9]/6 hover:bg-[#1b61c9]/12 border border-[#1b61c9]/15 transition-colors leading-snug"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1;
                const isStreamingThis = isStreaming && isLast && msg.role === "assistant";
                return <MessageBubble key={i} msg={msg} isStreaming={isStreamingThis} />;
              })}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-[#e8eaf0] shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e0e4ef] bg-[#f8fafc] focus-within:border-[#1b61c9] focus-within:ring-1 focus-within:ring-[#1b61c9]/25 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi về bài học này..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] outline-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="w-7 h-7 rounded-lg bg-[#1b61c9] text-white flex items-center justify-center hover:bg-[#254fad] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isStreaming ? (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-[rgba(4,14,32,0.28)] mt-1.5">
            Powered by Claude AI · SmartEdu
          </p>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? "bg-[#181d26] text-white scale-95"
            : "bg-[#1b61c9] text-white hover:bg-[#254fad] hover:scale-105"
        }`}
        style={{ boxShadow: open ? "none" : "0 4px 20px rgba(27,97,201,0.45)" }}
        title="Hỏi AI về bài học"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <SparkleIcon />
        )}
      </button>
    </>
  );
}
