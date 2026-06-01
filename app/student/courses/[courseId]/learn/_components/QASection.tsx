"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQuestions,
  useAskQuestion,
  usePostReply,
  useToggleQuestionVote,
  useToggleReplyVote,
  QAQuestion,
  QAReply,
} from "../learn.hook";
import { useMe } from "@/app/student/dashboard/dashboard.hook";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function Avatar({ avatar, name, size = "md" }: { avatar: string | null; name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  if (avatar) {
    return <img src={avatar} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-[#1b61c9]/10 flex items-center justify-center shrink-0`}>
      <span className="font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role !== "TEACHER" && role !== "ADMIN") return null;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1b61c9]/10 text-[#1b61c9] uppercase tracking-wide">
      Giáo viên
    </span>
  );
}

function LikeButton({ count, hasVoted, disabled, onVote, isPending }: {
  count: number; hasVoted: boolean; disabled: boolean; onVote: () => void; isPending: boolean;
}) {
  return (
    <button
      onClick={onVote}
      disabled={disabled || isPending}
      className={`flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        hasVoted ? "text-[#1b61c9]" : "text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9]"
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24"
        fill={hasVoted ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      {count > 0 && count}
    </button>
  );
}

function ReplyItem({ reply, lessonId, questionId, currentUserId }: {
  reply: QAReply; lessonId: string; questionId: string; currentUserId: string;
}) {
  const toggleVote = useToggleReplyVote(lessonId);
  const isOwn = reply.user.id === currentUserId;

  return (
    <div className="flex gap-2 group">
      <Avatar avatar={reply.user.avatar} name={reply.user.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-full bg-[#f0f2f5] rounded-2xl px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold text-[#181d26]">{reply.user.name}</span>
            <RoleBadge role={reply.user.role} />
          </div>
          <p className="text-sm text-[#181d26] leading-relaxed">{reply.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 pl-1">
          <span className="text-[11px] text-[rgba(4,14,32,0.4)]">{timeAgo(reply.created_at)}</span>
          <LikeButton
            count={reply.vote_count}
            hasVoted={reply.has_voted}
            disabled={isOwn}
            onVote={() => toggleVote.mutate({ replyId: reply.id, questionId })}
            isPending={toggleVote.isPending}
          />
        </div>
      </div>
    </div>
  );
}

function QuestionItem({ question, lessonId, currentUserId }: {
  question: QAQuestion; lessonId: string; currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const toggleVote = useToggleQuestionVote(lessonId);
  const postReply = usePostReply(lessonId);
  const isOwn = question.user.id === currentUserId;
  const { data: me } = useMe();

  const handleReply = () => {
    if (!replyText.trim()) return;
    postReply.mutate(
      { questionId: question.id, content: replyText.trim() },
      { onSuccess: () => { setReplyText(""); setExpanded(true); } }
    );
  };

  return (
    <div className="px-5 py-4 border-b border-[#f0f2f5] last:border-0">
      {/* Question row */}
      <div className="flex gap-3">
        <Avatar avatar={question.user.avatar} name={question.user.name} />
        <div className="flex-1 min-w-0">
          <div className="inline-block max-w-full bg-[#f0f2f5] rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-[#181d26]">{question.user.name}</span>
              <RoleBadge role={question.user.role} />
            </div>
            <p className="text-sm text-[#181d26] leading-relaxed">{question.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-1.5 pl-1">
            <span className="text-[11px] text-[rgba(4,14,32,0.4)]">{timeAgo(question.created_at)}</span>
            <LikeButton
              count={question.vote_count}
              hasVoted={question.has_voted}
              disabled={isOwn}
              onVote={() => toggleVote.mutate(question.id)}
              isPending={toggleVote.isPending}
            />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors"
            >
              {question.reply_count > 0
                ? `${expanded ? "Ẩn" : "Xem"} ${question.reply_count} trả lời`
                : "Trả lời"}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="overflow-hidden"
          >
            <div className="ml-11 mt-3 space-y-3">
              {question.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  lessonId={lessonId}
                  questionId={question.id}
                  currentUserId={currentUserId}
                />
              ))}

              {/* Reply input */}
              <div className="flex gap-2 items-center">
                {me ? (
                  <Avatar avatar={me.avatar ?? null} name={me.name} size="sm" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1b61c9]/10 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  placeholder="Viết câu trả lời..."
                  className="flex-1 min-w-0 pl-3.5 pr-3.5 py-1.5 rounded-full border border-[#e0e2e6] bg-[#f0f2f5] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.4)] focus:outline-none focus:border-[#1b61c9] focus:bg-white focus:ring-1 focus:ring-[#1b61c9]/20 transition-colors"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || postReply.isPending}
                  className="w-7 h-7 rounded-full bg-[#1b61c9] flex items-center justify-center hover:bg-[#254fad] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {postReply.isPending ? (
                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function QASection({ lessonId, currentUserId }: { lessonId: string; currentUserId: string }) {
  const { data: questions, isLoading } = useQuestions(lessonId);
  const askQuestion = useAskQuestion(lessonId);
  const { data: me } = useMe();
  const [text, setText] = useState("");

  const handleAsk = () => {
    if (!text.trim()) return;
    askQuestion.mutate(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <div className="mt-8 rounded-2xl border border-[#e0e2e6] bg-white overflow-hidden" style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#f0f2f5] flex items-center gap-2">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 className="text-base font-semibold text-[#181d26]">
          Hỏi &amp; Đáp
          {questions && questions.length > 0 && (
            <span className="ml-1.5 text-sm font-normal text-[rgba(4,14,32,0.45)]">({questions.length})</span>
          )}
        </h2>
      </div>

      {/* Questions */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions && questions.length > 0 ? (
        <div>
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              lessonId={lessonId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 gap-2 text-[rgba(4,14,32,0.35)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm">Chưa có câu hỏi nào. Hãy là người đầu tiên!</p>
        </div>
      )}

      {/* Ask input — Facebook style, pinned to bottom */}
      <div className="px-5 py-3.5 border-t border-[#f0f2f5] bg-white">
        <div className="flex gap-2.5 items-center">
          {me ? (
            <Avatar avatar={me.avatar ?? null} name={me.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1b61c9]/10 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
            placeholder="Đặt câu hỏi cho bài học này..."
            className="flex-1 min-w-0 pl-4 pr-4 py-2.5 rounded-full border border-[#e0e2e6] bg-[#f0f2f5] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.4)] focus:outline-none focus:border-[#1b61c9] focus:bg-white focus:ring-1 focus:ring-[#1b61c9]/20 transition-colors"
          />
          <button
            onClick={handleAsk}
            disabled={!text.trim() || askQuestion.isPending}
            className="w-9 h-9 rounded-full bg-[#1b61c9] flex items-center justify-center hover:bg-[#254fad] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ boxShadow: "rgba(45,127,249,0.3) 0px 1px 4px" }}
          >
            {askQuestion.isPending ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
