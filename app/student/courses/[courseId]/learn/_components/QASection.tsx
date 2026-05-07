"use client";

import { useState } from "react";
import {
  useQuestions,
  useAskQuestion,
  usePostReply,
  useToggleQuestionVote,
  useToggleReplyVote,
  QAQuestion,
  QAReply,
} from "../learn.hook";

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

function Avatar({ avatar, name }: { avatar: string | null; name: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#1b61c9]/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-[#1b61c9]">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "TEACHER" || role === "ADMIN") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1b61c9]/10 text-[#1b61c9] uppercase tracking-wide">
        Giáo viên
      </span>
    );
  }
  return null;
}

function VoteButton({
  count,
  hasVoted,
  disabled,
  onVote,
  isPending,
}: {
  count: number;
  hasVoted: boolean;
  disabled: boolean;
  onVote: () => void;
  isPending: boolean;
}) {
  return (
    <button
      onClick={onVote}
      disabled={disabled || isPending}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
        hasVoted
          ? "text-[#1b61c9] bg-[#1b61c9]/8 font-medium"
          : "text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] hover:bg-[#1b61c9]/8"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill={hasVoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      {count}
    </button>
  );
}

function ReplyItem({
  reply,
  lessonId,
  questionId,
  currentUserId,
}: {
  reply: QAReply;
  lessonId: string;
  questionId: string;
  currentUserId: string;
}) {
  const toggleVote = useToggleReplyVote(lessonId);
  const isOwn = reply.user.id === currentUserId;

  return (
    <div className="flex gap-2.5 py-3 border-t border-[#f0f2f5] first:border-t-0">
      <Avatar avatar={reply.user.avatar} name={reply.user.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[#181d26]">{reply.user.name}</span>
          <RoleBadge role={reply.user.role} />
          <span className="text-[10px] text-[rgba(4,14,32,0.35)]">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-sm text-[#181d26] leading-relaxed">{reply.content}</p>
        <div className="mt-1.5">
          <VoteButton
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

function QuestionCard({
  question,
  lessonId,
  currentUserId,
}: {
  question: QAQuestion;
  lessonId: string;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const toggleVote = useToggleQuestionVote(lessonId);
  const postReply = usePostReply(lessonId);
  const isOwn = question.user.id === currentUserId;

  const handleReply = () => {
    if (!replyText.trim()) return;
    postReply.mutate(
      { questionId: question.id, content: replyText.trim() },
      { onSuccess: () => { setReplyText(""); setExpanded(true); } }
    );
  };

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar avatar={question.user.avatar} name={question.user.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#181d26]">{question.user.name}</span>
              <RoleBadge role={question.user.role} />
              <span className="text-xs text-[rgba(4,14,32,0.35)]">{timeAgo(question.created_at)}</span>
            </div>
            <p className="text-sm text-[#181d26] leading-relaxed">{question.content}</p>
            <div className="flex items-center gap-3 mt-2.5">
              <VoteButton
                count={question.vote_count}
                hasVoted={question.has_voted}
                disabled={isOwn}
                onVote={() => toggleVote.mutate(question.id)}
                isPending={toggleVote.isPending}
              />
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] px-2 py-1 rounded-lg hover:bg-[#1b61c9]/8 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {question.reply_count > 0
                  ? `${expanded ? "Ẩn" : "Xem"} ${question.reply_count} trả lời`
                  : "Trả lời"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#f0f2f5] bg-[#fafbfc] px-4 py-3">
          {question.replies.length > 0 && (
            <div className="mb-3">
              {question.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  lessonId={lessonId}
                  questionId={question.id}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1b61c9]/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                placeholder="Viết câu trả lời..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 bg-white"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || postReply.isPending}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postReply.isPending ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function QASection({
  lessonId,
  currentUserId,
}: {
  lessonId: string;
  currentUserId: string;
}) {
  const { data: questions, isLoading } = useQuestions(lessonId);
  const askQuestion = useAskQuestion(lessonId);
  const [text, setText] = useState("");

  const handleAsk = () => {
    if (!text.trim()) return;
    askQuestion.mutate(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 className="text-base font-semibold text-[#181d26]">
          Hỏi &amp; Đáp
          {questions && questions.length > 0 && (
            <span className="ml-1 text-[rgba(4,14,32,0.45)] font-normal">({questions.length} câu hỏi)</span>
          )}
        </h2>
      </div>

      {/* Ask form */}
      <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Đặt câu hỏi cho bài học này..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAsk}
            disabled={!text.trim() || askQuestion.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "rgba(45,127,249,0.28) 0px 1px 4px" }}
          >
            {askQuestion.isPending ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            Gửi câu hỏi
          </button>
        </div>
      </div>

      {/* Question list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions && questions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <QuestionCard
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
          <p className="text-sm">Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>
      )}
    </div>
  );
}
