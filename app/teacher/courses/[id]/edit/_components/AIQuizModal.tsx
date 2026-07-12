"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useAIGenerateQuiz, useCreateQuizWithQuestions, AIQuestion, AIQuestionCounts } from "../edit.hook";
import {
  QuizPolicyFields,
  type QuizPolicyFormValue,
} from "@/app/teacher/courses/[id]/_components/QuizPolicyFields";
import { isExecutableQuestionType } from "@/lib/question-types";

interface AIQuizModalProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

type SourcesUsed = { content: boolean; pdf: boolean; transcript: boolean };

const TYPE_LABEL = {
  MCQ: "Trắc nghiệm",
  TRUE_FALSE: "Đúng/Sai",
  SHORT_ANSWER: "Tự luận",
  CODING: "Lập trình",
  DEBUGGING: "Sửa lỗi code",
  CODE_OUTPUT: "Dự đoán output",
} as const;
const TYPE_COLOR = {
  MCQ: "bg-[#1b61c9]/8 text-[#1b61c9]",
  TRUE_FALSE: "bg-purple-50 text-purple-600",
  SHORT_ANSWER: "bg-amber-50 text-amber-600",
  CODING: "bg-emerald-50 text-emerald-600",
  DEBUGGING: "bg-rose-50 text-rose-600",
  CODE_OUTPUT: "bg-cyan-50 text-cyan-700",
} as const;

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
] as const;

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
  const isExecutable = isExecutableQuestionType(q.type);

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
        <>
          <textarea
            value={q.sample_answer ?? ""}
            onChange={(e) => onChange({ ...q, sample_answer: e.target.value })}
            rows={2}
            placeholder="Đáp án mẫu (gợi ý chấm)"
            className="w-full px-3 py-2 text-xs text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-lg outline-none focus:border-[#1b61c9] resize-y"
          />
          <button
            onClick={() => onChange({ ...q, ai_graded: !q.ai_graded })}
            className="group flex items-center gap-2 py-0.5"
            title="Đổi cách chấm câu này"
          >
            <span className={`relative shrink-0 w-7 h-4 rounded-full transition-colors ${q.ai_graded ? "bg-[#1b61c9]" : "bg-[#cdd2da]"}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${q.ai_graded ? "left-[14px]" : "left-0.5"}`} />
            </span>
            <span className={`text-[11px] font-medium transition-colors ${q.ai_graded ? "text-[#1b61c9]" : "text-[rgba(4,14,32,0.5)] group-hover:text-[rgba(4,14,32,0.7)]"}`}>
              {q.ai_graded ? "AI chấm khi nộp" : "Giáo viên chấm tay"}
            </span>
          </button>
        </>
      )}

      {isExecutable && (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-medium text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select
              value={q.language ?? "python"}
              onChange={(e) => onChange({
                ...q,
                language: e.target.value as NonNullable<AIQuestion["language"]>,
              })}
              className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs text-[#181d26] outline-none focus:border-emerald-500"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.value} value={language.value}>{language.label}</option>
              ))}
            </select>
          </div>

          <textarea
            value={q.starter_code ?? ""}
            onChange={(e) => onChange({ ...q, starter_code: e.target.value })}
            rows={3}
            placeholder={q.type === "DEBUGGING" ? "Đoạn code có lỗi để học viên sửa" : "Code khung cho học viên"}
            className="w-full resize-y rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono text-xs text-[rgba(4,14,32,0.72)] outline-none focus:border-emerald-500"
          />
          <textarea
            value={q.solution_code ?? ""}
            onChange={(e) => onChange({ ...q, solution_code: e.target.value })}
            rows={4}
            placeholder={q.type === "DEBUGGING" ? "Phiên bản code đã sửa (ẩn với học viên)" : "Lời giải mẫu (ẩn với học viên)"}
            className="w-full resize-y rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono text-xs text-[rgba(4,14,32,0.72)] outline-none focus:border-emerald-500"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-[rgba(4,14,32,0.58)]">Test cases</p>
              <button
                type="button"
                onClick={() => onChange({
                  ...q,
                  testCases: [...(q.testCases ?? []), { input: "", expected: "", is_hidden: false }],
                })}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
              >
                + Thêm test case
              </button>
            </div>
            {(q.testCases ?? []).map((testCase, testCaseIndex) => (
              <div key={testCaseIndex} className="rounded-lg border border-emerald-100 bg-white p-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea
                    value={testCase.input}
                    onChange={(e) => onChange({
                      ...q,
                      testCases: q.testCases?.map((item, index) =>
                        index === testCaseIndex ? { ...item, input: e.target.value } : item,
                      ),
                    })}
                    placeholder="Input (stdin)"
                    rows={2}
                    className="min-w-0 resize-y rounded-md border border-[#e7ece8] px-2 py-1.5 font-mono text-[11px] outline-none focus:border-emerald-500"
                  />
                  <textarea
                    value={testCase.expected}
                    onChange={(e) => onChange({
                      ...q,
                      testCases: q.testCases?.map((item, index) =>
                        index === testCaseIndex ? { ...item, expected: e.target.value } : item,
                      ),
                    })}
                    placeholder="Expected output"
                    rows={2}
                    className="min-w-0 resize-y rounded-md border border-[#e7ece8] px-2 py-1.5 font-mono text-[11px] outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-1.5 text-[10px] text-[rgba(4,14,32,0.5)]">
                    <input
                      type="checkbox"
                      checked={testCase.is_hidden}
                      onChange={(e) => onChange({
                        ...q,
                        testCases: q.testCases?.map((item, index) =>
                          index === testCaseIndex ? { ...item, is_hidden: e.target.checked } : item,
                        ),
                      })}
                    />
                    Test ẩn với học viên
                  </label>
                  {(q.testCases?.length ?? 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...q,
                        testCases: q.testCases?.filter((_, index) => index !== testCaseIndex),
                      })}
                      className="text-[10px] font-medium text-red-500 hover:text-red-600"
                    >
                      Xóa test
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {q.type === "CODE_OUTPUT" && (
        <div className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-medium text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select
              value={q.language ?? "python"}
              onChange={(e) => onChange({
                ...q,
                language: e.target.value as NonNullable<AIQuestion["language"]>,
              })}
              className="rounded-lg border border-cyan-200 bg-white px-2.5 py-1.5 text-xs text-[#181d26] outline-none focus:border-cyan-500"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.value} value={language.value}>{language.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={q.starter_code ?? ""}
            onChange={(e) => onChange({ ...q, starter_code: e.target.value })}
            rows={6}
            placeholder="Đoạn code học sinh cần đọc"
            className="w-full resize-y rounded-lg border border-cyan-100 bg-white px-3 py-2 font-mono text-xs text-[rgba(4,14,32,0.72)] outline-none focus:border-cyan-500"
          />
          <textarea
            value={q.sample_answer ?? ""}
            onChange={(e) => onChange({ ...q, sample_answer: e.target.value })}
            rows={3}
            placeholder="Output chính xác (có thể nhiều dòng)"
            className="w-full resize-y rounded-lg border border-cyan-100 bg-white px-3 py-2 font-mono text-xs text-[rgba(4,14,32,0.72)] outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {q.source_excerpt && (
        <p className="text-[11px] text-[rgba(4,14,32,0.5)] bg-[#f8fafc] border-l-2 border-[#1b61c9]/30 rounded-r px-3 py-1.5 leading-snug">
          <span className="font-semibold text-[rgba(4,14,32,0.4)]">Trích từ bài: </span>{q.source_excerpt}
        </p>
      )}
    </div>
  );
}

// Ô chọn số câu cho một loại: nút −/+ kèm số, khống chế 0–10.
function CountField({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#e0e2e6] bg-white">
      <span className="text-sm text-[#181d26]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="w-6 h-6 rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.55)] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-[#1b61c9]">{value}</span>
        <button
          onClick={() => onChange(Math.min(10, value + 1))}
          disabled={value >= 10}
          className="w-6 h-6 rounded-lg border border-[#e0e2e6] text-[rgba(4,14,32,0.55)] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none transition-colors"
        >
          +
        </button>
      </div>
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
  const [counts, setCounts] = useState<AIQuestionCounts>({
    mcq: 3,
    trueFalse: 1,
    shortAnswer: 1,
    coding: 0,
    debugging: 0,
    codeOutput: 0,
  });
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiGrading, setAiGrading] = useState(true);
  const [quizTitle, setQuizTitle] = useState(`Kiểm tra: ${lessonTitle}`);
  const [quizPolicy, setQuizPolicy] = useState<QuizPolicyFormValue>({
    requirePass: true,
    passScore: 70,
    maxAttempts: null,
  });
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [sourcesUsed, setSourcesUsed] = useState<SourcesUsed | null>(null);

  const generate = useAIGenerateQuiz();
  const createWithQuestions = useCreateQuizWithQuestions(courseId);

  const generateErrorData =
    (generate.error as AxiosError<{ error?: string; message?: string }>)?.response?.data;
  const noContent = generateErrorData?.error === "no_content";
  const rateLimited = generateErrorData?.error === "rate_limited";

  const totalCount = counts.mcq + counts.trueFalse + counts.shortAnswer + counts.coding + counts.debugging + counts.codeOutput;
  const hasInvalidCodeQuestion = questions.some((question) =>
    (isExecutableQuestionType(question.type) &&
      (!question.language || !question.testCases?.some((testCase) => testCase.expected.trim()))) ||
    (question.type === "CODE_OUTPUT" &&
      (!question.language || !question.starter_code?.trim() || !question.sample_answer?.trim())),
  );

  const handleGenerate = () => {
    generate.mutate(
      { lessonId, counts, customPrompt },
      {
        onSuccess: (res) => {
          // Gắn lựa chọn cách chấm vào từng câu tự luận; sang preview vẫn đổi được từng câu.
          setQuestions(res.questions.map((q) =>
            q.type === "SHORT_ANSWER" ? { ...q, ai_graded: aiGrading } : q
          ));
          setSourcesUsed(res.sourcesUsed);
          setStep("preview");
        },
      }
    );
  };

  const handleSave = () => {
    if (questions.length === 0) return;
    createWithQuestions.mutate(
      {
        lessonId,
        title: quizTitle,
        passScore: quizPolicy.passScore,
        requirePass: quizPolicy.requirePass,
        maxAttempts: quizPolicy.maxAttempts,
        questions,
      },
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">Số câu theo loại</label>
                  <span className={`text-xs font-semibold ${totalCount > 0 ? "text-[#1b61c9]" : "text-red-500"}`}>Tổng: {totalCount}</span>
                </div>
                <div className="space-y-2">
                  <CountField label="Trắc nghiệm" value={counts.mcq} onChange={(v) => setCounts((c) => ({ ...c, mcq: v }))} />
                  <CountField label="Đúng / Sai" value={counts.trueFalse} onChange={(v) => setCounts((c) => ({ ...c, trueFalse: v }))} />
                  <CountField label="Tự luận" value={counts.shortAnswer} onChange={(v) => setCounts((c) => ({ ...c, shortAnswer: v }))} />
                  <CountField label="Lập trình" value={counts.coding} onChange={(v) => setCounts((c) => ({ ...c, coding: v }))} />
                  <CountField label="Sửa lỗi code" value={counts.debugging} onChange={(v) => setCounts((c) => ({ ...c, debugging: v }))} />
                  <CountField label="Dự đoán output" value={counts.codeOutput} onChange={(v) => setCounts((c) => ({ ...c, codeOutput: v }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="ai-quiz-custom-prompt"
                    className="block text-xs font-semibold uppercase tracking-wider text-[rgba(4,14,32,0.55)]"
                  >
                    Yêu cầu thêm <span className="font-normal normal-case tracking-normal text-[rgba(4,14,32,0.38)]">(không bắt buộc)</span>
                  </label>
                  <span className="text-[10px] tabular-nums text-[rgba(4,14,32,0.38)]">{customPrompt.length}/2000</span>
                </div>
                <textarea
                  id="ai-quiz-custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Ví dụ: Thêm nhiều bài tập tính toán; câu tự luận tập trung vào mảng A, B, C; câu lập trình dùng Python và có test case biên."
                  className="w-full resize-y rounded-xl border border-[#e0e2e6] px-3 py-2.5 text-sm leading-relaxed text-[#181d26] outline-none transition-all placeholder:text-[rgba(4,14,32,0.32)] focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10"
                />
                <p className="text-[11px] leading-relaxed text-[rgba(4,14,32,0.42)]">
                  Mô tả trọng tâm, độ khó, dạng tính toán, ngôn ngữ lập trình hoặc ví dụ mong muốn. AI vẫn chỉ dùng kiến thức trong bài học.
                </p>
              </div>

              {counts.shortAnswer > 0 && (
                <button
                  onClick={() => setAiGrading((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#e0e2e6] bg-white text-left hover:border-[#1b61c9]/40 transition-colors"
                >
                  <span>
                    <span className="block text-sm font-medium text-[#181d26]">Chấm tự luận bằng AI</span>
                    <span className="block text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
                      {aiGrading
                        ? "AI chấm điểm và nhận xét ngay khi học viên nộp bài."
                        : "Bài tự luận vào hàng chờ, giáo viên chấm tay."}
                    </span>
                  </span>
                  <span className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${aiGrading ? "bg-[#1b61c9]" : "bg-[#cdd2da]"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${aiGrading ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                </button>
              )}

              <div className="border-t border-[#f0f2f5] pt-4">
                <QuizPolicyFields value={quizPolicy} onChange={setQuizPolicy} />
              </div>

              <p className="text-xs text-[rgba(4,14,32,0.45)] bg-[#f8fafc] border border-[#f0f2f5] rounded-xl px-4 py-2.5 leading-relaxed">
                Câu hỏi được tạo dựa trên nội dung thực của bài học (text, PDF, lời giảng video). Bài chưa có nội dung sẽ không tạo được.
              </p>

              {noContent ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  Bài học chưa có nội dung (text/PDF/transcript video) để tạo câu hỏi sát bài. Thêm nội dung rồi thử lại.
                </p>
              ) : rateLimited ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  {generateErrorData?.message ?? "AI đã hết hạn mức trong ngày. Vui lòng thử lại sau."}
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

              {hasInvalidCodeQuestion && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                  Câu chạy code cần ngôn ngữ và test case; câu dự đoán output cần đoạn code và output đáp án.
                </p>
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
            <button onClick={handleGenerate} disabled={generate.isPending || !quizTitle.trim() || totalCount === 0} className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-white text-sm font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
            <button onClick={handleSave} disabled={questions.length === 0 || hasInvalidCodeQuestion || createWithQuestions.isPending} className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-white text-sm font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
