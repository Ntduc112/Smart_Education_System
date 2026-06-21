"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useAIGenerateQuiz, useCreateQuizWithQuestions, AIQuestion } from "../edit.hook";

interface AIQuizModalProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

type SourcesUsed = { content: boolean; pdf: boolean; transcript: boolean };

const TYPE_LABEL = { MCQ: "Trắc nghiệm", TRUE_FALSE: "Đúng/Sai", SHORT_ANSWER: "Tự luận" } as const;
const TYPE_COLOR = {
  MCQ: "bg-[#1b61c9]/8 text-[#1b61c9]",
  TRUE_FALSE: "bg-purple-50 text-purple-600",
  SHORT_ANSWER: "bg-amber-50 text-amber-600",
} as const;

function QuestionEditor({
  q, index, onChange, onRemove,
}: {
  q: AIQuestion;
  index: number;
  onChange: (next: AIQuestion) => void;
  onRemove: () => void;
}) {
  const setOption = (i: number, patch: Partial<{ content: string; is_correct: boolean }>) => {
    const options = (q.options ?? []).map((o, idx) => (idx === i ? { ...o, ...patch } : o));
    onChange({ ...q, options });
  };
  // MCQ/TRUE_FALSE chỉ 1 đáp án đúng → chọn đáp án này tắt các đáp án khác.
  const setCorrect = (i: number) => {
    const options = (q.options ?? []).map((o, idx) => ({ ...o, is_correct: idx === i }));
    onChange({ ...q, options });
  };

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[rgba(4,14,32,0.45)]">#{index + 1}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type]}`}>{TYPE_LABEL[q.type]}</span>
          <label className="flex items-center gap-1 text-[10px] text-[rgba(4,14,32,0.4)]">
            <input
              type="number"
              min={1}
              value={q.points}
              onChange={(e) => onChange({ ...q, points: Math.max(1, Number(e.target.value) || 1) })}
              className="w-10 px-1 py-0.5 border border-[#e0e2e6] rounded text-center text-[rgba(4,14,32,0.6)]"
            />
            điểm
          </label>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 p-1 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Xóa câu"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <textarea
        value={q.content}
        onChange={(e) => onChange({ ...q, content: e.target.value })}
        rows={2}
        className="w-full px-3 py-2 text-sm font-medium text-[#181d26] border border-[#e0e2e6] rounded-lg outline-none focus:border-[#1b61c9] resize-y leading-snug"
      />

      {q.options && q.options.length > 0 && (
        <ul className="space-y-1.5">
          {q.options.map((opt, i) => (
            <li key={i} className="flex items-center gap-2">
              <button
                onClick={() => setCorrect(i)}
                className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  opt.is_correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#cdd2da] text-transparent hover:border-emerald-400"
                }`}
                title="Đặt làm đáp án đúng"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <input
                value={opt.content}
                onChange={(e) => setOption(i, { content: e.target.value })}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-[#1b61c9] ${
                  opt.is_correct ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[#f8fafc] border-[#f0f2f5] text-[rgba(4,14,32,0.7)]"
                }`}
              />
            </li>
          ))}
        </ul>
      )}

      {q.type === "SHORT_ANSWER" && (
        <textarea
          value={q.sample_answer ?? ""}
          onChange={(e) => onChange({ ...q, sample_answer: e.target.value })}
          rows={2}
          placeholder="Đáp án mẫu (gợi ý chấm)"
          className="w-full px-3 py-2 text-xs text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-lg outline-none focus:border-[#1b61c9] resize-y"
        />
      )}

      {q.source_excerpt && (
        <p className="text-[11px] text-[rgba(4,14,32,0.5)] bg-[#f8fafc] border-l-2 border-[#1b61c9]/30 rounded-r px-3 py-1.5 leading-snug">
          <span className="font-semibold text-[rgba(4,14,32,0.4)]">Trích từ bài: </span>{q.source_excerpt}
        </p>
      )}
    </div>
  );
}

function SourceBadge({ ok, label }: { ok: boolean; label: string }) {
  if (!ok) return null;
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{label}</span>;
}

export function AIQuizModal({
  courseId, lessonId, lessonTitle, onClose, onSuccess,
}: AIQuizModalProps) {
  const [step, setStep] = useState<"config" | "preview">("config");
  const [questionCount, setQuestionCount] = useState(5);
  const [quizTitle, setQuizTitle] = useState(`Kiểm tra: ${lessonTitle}`);
  const [passScore, setPassScore] = useState(70);
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [sourcesUsed, setSourcesUsed] = useState<SourcesUsed | null>(null);

  const generate = useAIGenerateQuiz();
  const createWithQuestions = useCreateQuizWithQuestions(courseId);

  const noContent =
    (generate.error as AxiosError<{ error?: string }>)?.response?.data?.error === "no_content";

  const handleGenerate = () => {
    generate.mutate(
      { lessonId, questionCount },
      {
        onSuccess: (res) => {
          setQuestions(res.questions);
          setSourcesUsed(res.sourcesUsed);
          setStep("preview");
        },
      }
    );
  };

  const handleSave = () => {
    if (questions.length === 0) return;
    createWithQuestions.mutate(
      { lessonId, title: quizTitle, passScore, questions },
      { onSuccess: () => { onSuccess(); onClose(); } }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 560, maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b61c9]/10 to-[#4f8ef7]/10 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1b61c9" stroke="none">
                <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181d26]">Tạo quiz bằng AI</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] truncate max-w-[300px]">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[rgba(4,14,32,0.65)] hover:bg-[#f0f2f5] transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === "config" ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">Tên quiz</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all text-[#181d26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">Số câu hỏi</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={3} max={10} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="flex-1 accent-[#1b61c9]" />
                    <span className="text-sm font-semibold text-[#1b61c9] w-6 text-center">{questionCount}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">Điểm đạt (%)</label>
                  <input type="number" min={0} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] transition-all text-[#181d26]" />
                </div>
              </div>

              <p className="text-xs text-[rgba(4,14,32,0.45)] bg-[#f8fafc] border border-[#f0f2f5] rounded-xl px-4 py-2.5 leading-relaxed">
                Câu hỏi được tạo dựa trên nội dung thực của bài học (text, PDF, lời giảng video). Bài chưa có nội dung sẽ không tạo được.
              </p>

              {noContent ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  Bài học chưa có nội dung (text/PDF/transcript video) để tạo câu hỏi sát bài. Thêm nội dung rồi thử lại.
                </p>
              ) : generate.isError ? (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">Không thể tạo câu hỏi. Vui lòng thử lại.</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-[#181d26]">{questions.length} câu hỏi</p>
                <button onClick={() => { setStep("config"); setQuestions([]); }} className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium flex items-center gap-1 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Tạo lại
                </button>
              </div>

              {sourcesUsed && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[rgba(4,14,32,0.4)]">Dựa trên:</span>
                  <SourceBadge ok={sourcesUsed.content} label="Nội dung bài" />
                  <SourceBadge ok={sourcesUsed.pdf} label="PDF" />
                  <SourceBadge ok={sourcesUsed.transcript} label="Lời giảng video" />
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={i}
                    q={q}
                    index={i}
                    onChange={(next) => setQuestions((prev) => prev.map((item, idx) => (idx === i ? next : item)))}
                    onRemove={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>

              {questions.length === 0 && (
                <p className="text-sm text-[rgba(4,14,32,0.45)] text-center py-4">Đã xóa hết câu hỏi. Vui lòng tạo lại.</p>
              )}

              {createWithQuestions.isError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">Không thể lưu quiz. Vui lòng thử lại.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0f2f5] flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e0e2e6] text-sm font-medium text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] transition-colors">Hủy</button>
          {step === "config" ? (
            <button onClick={handleGenerate} disabled={generate.isPending || !quizTitle.trim()} className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-white text-sm font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {generate.isPending ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
                  </svg>
                  Tạo câu hỏi
                </>
              )}
            </button>
          ) : (
            <button onClick={handleSave} disabled={questions.length === 0 || createWithQuestions.isPending} className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-white text-sm font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {createWithQuestions.isPending ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Lưu quiz ({questions.length} câu)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
