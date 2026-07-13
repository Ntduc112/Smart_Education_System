"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCreateQuizWithQuestions, AIQuestion } from "../edit.hook";
import { extractQuizFromPdf } from "../bulk-import.hook";
import { QuestionEditor } from "./AIQuizModal";
import {
  QuizPolicyFields,
  type QuizPolicyFormValue,
} from "@/app/teacher/courses/[id]/_components/QuizPolicyFields";

interface UploadQuizModalProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadQuizModal({
  courseId, lessonId, lessonTitle, onClose, onSuccess,
}: UploadQuizModalProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState(`Kiểm tra: ${lessonTitle}`);
  const [quizPolicy, setQuizPolicy] = useState<QuizPolicyFormValue>({
    requirePass: true,
    passScore: 70,
    maxAttempts: null,
  });
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [emptyResult, setEmptyResult] = useState(false);

  const extract = useMutation({
    mutationFn: (f: File) => extractQuizFromPdf(f, lessonTitle),
    onSuccess: (quiz) => {
      if (!quiz || quiz.questions.length === 0) {
        setEmptyResult(true);
        return;
      }
      setEmptyResult(false);
      setQuestions(quiz.questions.map((q) => (q.type === "SHORT_ANSWER" ? { ...q, ai_graded: true } : q)));
      setStep("preview");
    },
  });
  const createWithQuestions = useCreateQuizWithQuestions(courseId);

  const handleExtract = () => {
    if (!file) return;
    setEmptyResult(false);
    extract.mutate(file);
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181d26]">Tải đề có sẵn</p>
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
          {step === "upload" ? (
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
                <label className="block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">File đề (PDF)</label>
                <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[#C2D4EE] rounded-xl text-center cursor-pointer hover:border-[#1b61c9] transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm font-medium text-[#181d26]">{file ? file.name : "Chọn file PDF đề kiểm tra"}</span>
                  <span className="text-xs text-[rgba(4,14,32,0.45)]">Đề đã có sẵn câu hỏi + đáp án đánh dấu rõ</span>
                </label>
              </div>

              <div className="border-t border-[#f0f2f5] pt-4">
                <QuizPolicyFields value={quizPolicy} onChange={setQuizPolicy} />
              </div>

              <p className="text-xs text-[rgba(4,14,32,0.45)] bg-[#f8fafc] border border-[#f0f2f5] rounded-xl px-4 py-2.5 leading-relaxed">
                AI trích nguyên văn câu hỏi và đáp án có sẵn trong file, không bịa câu mới. Đề cần đánh dấu rõ đáp án đúng (in đậm, dấu *, &ldquo;Đáp án: B&rdquo;...).
              </p>

              {emptyResult ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  Không tìm thấy câu hỏi hợp lệ trong file. Kiểm tra file có đúng định dạng đề + đáp án rõ ràng không.
                </p>
              ) : extract.isError ? (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">Không thể đọc file. Vui lòng thử lại.</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-[#181d26]">{questions.length} câu hỏi</p>
                <button onClick={() => { setStep("upload"); setQuestions([]); }} className="text-xs text-[#1b61c9] hover:text-[#254fad] font-medium flex items-center gap-1 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Tải file khác
                </button>
              </div>

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
                <p className="text-sm text-[rgba(4,14,32,0.45)] text-center py-4">Đã xóa hết câu hỏi. Vui lòng tải lại file.</p>
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
          {step === "upload" ? (
            <button onClick={handleExtract} disabled={extract.isPending || !file || !quizTitle.trim()} className="flex-1 py-2.5 rounded-xl bg-[#1b61c9] text-white text-sm font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {extract.isPending ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Đang trích...
                </>
              ) : (
                "Trích câu hỏi"
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
