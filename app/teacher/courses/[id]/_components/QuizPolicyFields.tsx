"use client";

import { MAX_QUIZ_ATTEMPTS } from "@/lib/quiz-policy";

export interface QuizPolicyFormValue {
  requirePass: boolean;
  passScore: number;
  maxAttempts: number | null;
}

interface QuizPolicyFieldsProps {
  value: QuizPolicyFormValue;
  onChange: (value: QuizPolicyFormValue) => void;
  heading?: boolean;
  disabled?: boolean;
}

const optionBase =
  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b61c9]/30";

export function QuizPolicyFields({
  value,
  onChange,
  heading = true,
  disabled = false,
}: QuizPolicyFieldsProps) {
  const limited = value.maxAttempts !== null;
  const summary = [
    value.requirePass ? `Cần đạt ≥ ${value.passScore}%` : "Chỉ cần nộp một bài hợp lệ",
    limited ? `Tối đa ${value.maxAttempts} lượt` : "Không giới hạn lượt",
  ].join(" · ");

  return (
    <div className="space-y-5">
      {heading ? (
        <div>
          <h3 className="text-sm font-semibold text-[#181d26]">Thiết lập làm bài</h3>
          <p className="mt-0.5 text-xs text-[rgba(4,14,32,0.45)]">
            Quy định cách hoàn thành và số lượt học viên được nộp.
          </p>
        </div>
      ) : null}

      <fieldset disabled={disabled} className="space-y-2">
        <legend className="text-xs font-medium text-[rgba(4,14,32,0.62)]">
          Điều kiện hoàn thành
        </legend>
        <div className="flex gap-1 rounded-xl bg-[#F4F8FE] p-1" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={!value.requirePass}
            onClick={() => onChange({ ...value, requirePass: false })}
            className={`${optionBase} ${
              !value.requirePass
                ? "bg-white text-[#1b61c9] shadow-sm"
                : "text-[rgba(4,14,32,0.52)] hover:text-[#181d26]"
            }`}
          >
            Chỉ cần nộp bài
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={value.requirePass}
            onClick={() => onChange({ ...value, requirePass: true })}
            className={`${optionBase} ${
              value.requirePass
                ? "bg-white text-[#1b61c9] shadow-sm"
                : "text-[rgba(4,14,32,0.52)] hover:text-[#181d26]"
            }`}
          >
            Phải đạt điểm
          </button>
        </div>

        {value.requirePass ? (
          <label className="flex items-center justify-between gap-4 pt-1">
            <span>
              <span className="block text-xs font-medium text-[#181d26]">Điểm cần đạt</span>
              <span className="mt-0.5 block text-[11px] text-[rgba(4,14,32,0.42)]">
                Từ 1 đến 100 phần trăm
              </span>
            </span>
            <span className="flex items-center overflow-hidden rounded-xl border border-[#DCE6F4] bg-white focus-within:border-[#1b61c9] focus-within:ring-2 focus-within:ring-[#1b61c9]/10">
              <input
                type="number"
                min={1}
                max={100}
                value={value.passScore}
                onChange={(event) => {
                  const next = Math.min(100, Math.max(1, Number(event.target.value) || 1));
                  onChange({ ...value, passScore: next });
                }}
                className="w-16 bg-transparent px-3 py-2 text-right text-sm font-semibold text-[#181d26] outline-none"
                aria-label="Điểm cần đạt"
              />
              <span className="border-l border-[#DCE6F4] px-2.5 py-2 text-xs text-[rgba(4,14,32,0.45)]">%</span>
            </span>
          </label>
        ) : null}
      </fieldset>

      <fieldset disabled={disabled} className="space-y-2 border-t border-[#E7EEF8] pt-4">
        <legend className="text-xs font-medium text-[rgba(4,14,32,0.62)]">
          Giới hạn lượt làm
        </legend>
        <div className="flex gap-1 rounded-xl bg-[#F4F8FE] p-1" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={!limited}
            onClick={() => onChange({ ...value, maxAttempts: null })}
            className={`${optionBase} ${
              !limited
                ? "bg-white text-[#1b61c9] shadow-sm"
                : "text-[rgba(4,14,32,0.52)] hover:text-[#181d26]"
            }`}
          >
            Không giới hạn
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={limited}
            onClick={() => onChange({ ...value, maxAttempts: value.maxAttempts ?? 3 })}
            className={`${optionBase} ${
              limited
                ? "bg-white text-[#1b61c9] shadow-sm"
                : "text-[rgba(4,14,32,0.52)] hover:text-[#181d26]"
            }`}
          >
            Giới hạn số lượt
          </button>
        </div>

        {limited ? (
          <label className="flex items-center justify-between gap-4 pt-1">
            <span>
              <span className="block text-xs font-medium text-[#181d26]">Tổng số lượt làm</span>
              <span className="mt-0.5 block text-[11px] text-[rgba(4,14,32,0.42)]">
                Bao gồm cả lượt làm đầu tiên
              </span>
            </span>
            <input
              type="number"
              min={1}
              max={MAX_QUIZ_ATTEMPTS}
              value={value.maxAttempts ?? 3}
              onChange={(event) => {
                const next = Math.min(
                  MAX_QUIZ_ATTEMPTS,
                  Math.max(1, Number(event.target.value) || 1),
                );
                onChange({ ...value, maxAttempts: next });
              }}
              className="w-24 rounded-xl border border-[#DCE6F4] bg-white px-3 py-2 text-right text-sm font-semibold text-[#181d26] outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10"
              aria-label="Tổng số lượt làm"
            />
          </label>
        ) : null}
      </fieldset>

      <p className="border-l-2 border-[#1b61c9] bg-[#F4F8FE] px-3 py-2 text-xs font-medium text-[rgba(4,14,32,0.62)]">
        {summary}
      </p>
    </div>
  );
}
