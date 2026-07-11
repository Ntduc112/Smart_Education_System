"use client";

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  c: "C",
  cpp: "C++",
  java: "Java",
};

export function CodeOutputQuestion({
  questionId,
  content,
  language,
  code,
  points,
  order,
  submitted,
  answer,
  onChange,
  isCorrect,
}: {
  questionId: string;
  content: string;
  language: string;
  code: string;
  points: number;
  order: number;
  submitted: boolean;
  answer: string;
  onChange: (answer: string) => void;
  isCorrect?: boolean | null;
}) {
  return (
    <div id={`code-output-question-${questionId}`} className="overflow-hidden rounded-xl border border-[#DCE6F4] bg-white">
      <div className="flex items-start gap-3 border-b border-[#f0f2f5] p-5 pb-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
          {order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">Dự đoán output</span>
            <span className="rounded-md bg-[#1e1e1e] px-2 py-0.5 text-xs font-medium text-[#e0e0e0]">
              {LANGUAGE_LABELS[language] ?? language}
            </span>
            <span className="text-xs text-[rgba(4,14,32,0.45)]">{points} điểm</span>
          </div>
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#181d26]">{content}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <pre className="max-h-80 overflow-auto rounded-xl border border-[#2d2d2d] bg-[#282c34] p-4 font-mono text-xs leading-relaxed text-[#e6edf3]">
          <code>{code}</code>
        </pre>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgba(4,14,32,0.55)]">Output của đoạn code</label>
          <textarea
            value={answer}
            onChange={(event) => onChange(event.target.value)}
            disabled={submitted}
            rows={3}
            placeholder="Nhập chính xác output, có thể gồm nhiều dòng..."
            className="w-full resize-y rounded-xl border border-[#DCE6F4] px-4 py-3 font-mono text-sm text-[#181d26] outline-none transition-colors placeholder:text-[rgba(4,14,32,0.32)] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 disabled:bg-[#F4F8FE]"
          />
        </div>

        {submitted && isCorrect !== undefined && isCorrect !== null && (
          <div className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
            isCorrect
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {isCorrect ? "✅ Output chính xác" : "❌ Output chưa chính xác"}
          </div>
        )}
      </div>
    </div>
  );
}
