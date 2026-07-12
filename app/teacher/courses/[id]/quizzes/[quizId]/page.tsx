"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, CheckCircle2, Pencil, X, Check, GripVertical } from "lucide-react";
import api from "@/lib/axios";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { BackButton } from "@/app/student/_components/BackButton";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/_components/ConfirmModal";
import {
  QuizPolicyFields,
  type QuizPolicyFormValue,
} from "@/app/teacher/courses/[id]/_components/QuizPolicyFields";
import { isCodeBasedQuestionType, isExecutableQuestionType } from "@/lib/question-types";

// ── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING" | "DEBUGGING" | "CODE_OUTPUT";

interface Option   { id: string; content: string; is_correct: boolean; order: number }
interface TestCase { id: string; input: string; expected: string; is_hidden: boolean; order: number }
interface Question { id: string; content: string; type: QuestionType; points: number; order: number; sample_answer?: string | null; ai_graded?: boolean; language?: string | null; starter_code?: string | null; solution_code?: string | null; options: Option[]; testCases?: TestCase[] }
interface Quiz     { id: string; title: string; pass_score: number; require_pass: boolean; max_attempts?: number | null; time_limit?: number | null; questions: Question[] }

// ── Palette (đồng bộ teacher/home) ────────────────────────────────────────────
const C = {
  canvas: "#EFF5FE",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  sky: "#2E8BE6",
  emerald: "#0E9F6E",
  violet: "#7C5CFC",
  rose: "#E5484D",
};

// ── Atmosphere (đồng bộ teacher/home) ─────────────────────────────────────────
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

const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-[#DCE6F4] bg-white focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/30 focus:border-[#1b61c9] transition-all";

const TYPE_META: Record<QuestionType, { label: string; pill: string }> = {
  MCQ:          { label: "Trắc nghiệm", pill: "bg-[#EAF1FC] text-[#1b61c9]" },
  TRUE_FALSE:   { label: "Đúng/Sai",    pill: "bg-amber-50 text-amber-600" },
  SHORT_ANSWER: { label: "Tự luận",     pill: "bg-[rgba(124,92,252,0.12)] text-[#7C5CFC]" },
  CODING:       { label: "Lập trình",   pill: "bg-emerald-50 text-emerald-600" },
  DEBUGGING:    { label: "Sửa lỗi code", pill: "bg-rose-50 text-rose-600" },
  CODE_OUTPUT:  { label: "Dự đoán output", pill: "bg-cyan-50 text-cyan-700" },
};

const LANG_OPTIONS = [
  { value: "python",     label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c",          label: "C" },
  { value: "cpp",        label: "C++" },
  { value: "java",       label: "Java" },
];

// ── Hooks ────────────────────────────────────────────────────────────────────

function useQuiz(quizId: string) {
  return useQuery<Quiz>({
    queryKey: ["teacher", "quiz", quizId],
    queryFn:  async () => (await api.get<{ quiz: Quiz }>(`/teacher/quizzes/${quizId}`)).data.quiz,
  });
}

function useUpdateQuiz(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; pass_score?: number; require_pass?: boolean; max_attempts?: number | null; time_limit?: number | null }) =>
      api.put(`/teacher/quizzes/${quizId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

function useDeleteQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => api.delete(`/teacher/questions/${questionId}`),
    onSuccess:  (_res, questionId) =>
      qc.setQueryData<Quiz>(["teacher", "quiz", quizId], (old) =>
        old ? { ...old, questions: old.questions.filter((q) => q.id !== questionId) } : old),
  });
}

function useAddQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string; type: QuestionType;
      points: number; order: number; sample_answer?: string; ai_graded?: boolean;
      options?: { content: string; is_correct: boolean; order: number }[];
      language?: string; starter_code?: string; solution_code?: string;
      testCases?: { input: string; expected: string; is_hidden: boolean; order: number }[];
    }) => api.post(`/teacher/quizzes/${quizId}/questions`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

function useUpdateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string; content?: string; points?: number; sample_answer?: string | null; ai_graded?: boolean;
      options?: { content: string; is_correct: boolean; order: number }[];
      language?: string; starter_code?: string | null; solution_code?: string | null;
      testCases?: { input: string; expected: string; is_hidden: boolean; order: number }[];
    }) => (await api.put<{ question: Question }>(`/teacher/questions/${id}`, data)).data.question,
    onSuccess: (updated) =>
      qc.setQueryData<Quiz>(["teacher", "quiz", quizId], (old) =>
        old ? { ...old, questions: old.questions.map((q) => q.id === updated.id ? updated : q) } : old),
  });
}

// Kéo thả đổi thứ tự câu hỏi: optimistic + PUT chỉ câu đổi order.
function useReorderQuestions(quizId: string) {
  const qc = useQueryClient();
  const key = ["teacher", "quiz", quizId];
  return async (next: Question[]) => {
    const prev = qc.getQueryData<Quiz>(key);
    const renumbered = next.map((q, i) => ({ ...q, order: i + 1 }));
    qc.setQueryData<Quiz>(key, (old) => old ? { ...old, questions: renumbered } : old);
    const prevOrder = new Map(prev?.questions.map((q) => [q.id, q.order]));
    try {
      await Promise.all(
        renumbered.flatMap((q, i) =>
          prevOrder.get(q.id) !== i + 1 ? [api.put(`/teacher/questions/${q.id}`, { order: i + 1 })] : [])
      );
    } catch {
      qc.setQueryData(key, prev);
      toast.error("Đổi thứ tự câu hỏi thất bại, vui lòng thử lại");
    } finally {
      qc.invalidateQueries({ queryKey: key });
    }
  };
}

// ── AI-graded toggle (chỉ cho câu tự luận) ───────────────────────────────────

function AIGradedToggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[#DCE6F4] bg-white text-left hover:border-[#1b61c9]/40 transition-colors">
      <span>
        <span className="block text-xs font-medium text-[#181d26]">Chấm bằng AI</span>
        <span className="block text-[11px] text-[rgba(4,14,32,0.45)] mt-0.5">
          {value ? "AI chấm điểm + nhận xét ngay khi học viên nộp." : "Vào hàng chờ, giáo viên chấm tay."}
        </span>
      </span>
      <span className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${value ? "bg-[#1b61c9]" : "bg-[#C5D4EA]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

// ── Add Question Form ────────────────────────────────────────────────────────

function AddQuestionForm({ quizId, nextOrder, onClose }: { quizId: string; nextOrder: number; onClose: () => void }) {
  const addQuestion = useAddQuestion(quizId);
  const [type, setType]       = useState<QuestionType>("MCQ");
  const [content, setContent] = useState("");
  const [points, setPoints]   = useState(1);
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [aiGraded, setAiGraded] = useState(false);
  const [mcqOptions, setMcqOptions] = useState([
    { content: "", is_correct: true },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ]);
  // CODING state
  const [language, setLanguage] = useState("python");
  const [starterCode, setStarterCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expected: "", is_hidden: false }]);
  const isExecutable = isExecutableQuestionType(type);
  const isCodeBased = isCodeBasedQuestionType(type);

  const handleSubmit = () => {
    if (!content.trim()) return;
    const validTestCases = testCases
      .filter((testCase) => testCase.expected.trim())
      .map((testCase, index) => ({ ...testCase, order: index }));
    if (isExecutable && validTestCases.length === 0) {
      toast.error("Câu hỏi chạy code cần ít nhất một test case có output mong đợi");
      return;
    }
    if (type === "CODE_OUTPUT" && (!starterCode.trim() || !sampleAnswer.trim())) {
      toast.error("Câu dự đoán output cần đoạn code và output đáp án");
      return;
    }
    let options: { content: string; is_correct: boolean; order: number }[] | undefined;
    if (type === "MCQ") {
      options = mcqOptions.map((o, i) => ({ ...o, order: i + 1 }));
    } else if (type === "TRUE_FALSE") {
      options = [
        { content: "Đúng",  is_correct: true,  order: 1 },
        { content: "Sai", is_correct: false, order: 2 },
      ];
    }
    addQuestion.mutate(
      {
        content, type, points, order: nextOrder,
        sample_answer: sampleAnswer || undefined,
        ai_graded: type === "SHORT_ANSWER" ? aiGraded : undefined,
        options,
        ...(isCodeBased ? {
          language,
          starter_code: starterCode || undefined,
        } : {}),
        ...(isExecutable ? {
          solution_code: solutionCode || undefined,
          testCases: validTestCases,
        } : {}),
      },
      {
        onSuccess: onClose,
        onError: () => toast.error("Thêm câu hỏi thất bại, vui lòng kiểm tra dữ liệu"),
      },
    );
  };

  return (
    <div className="p-5 border border-[#1b61c9]/25 rounded-2xl bg-[#EAF1FC] space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING", "DEBUGGING", "CODE_OUTPUT"] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${type === t ? "bg-[#1b61c9] text-white" : "bg-white border border-[#DCE6F4] text-[rgba(4,14,32,0.6)] hover:border-[#1b61c9]/40"}`}>
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      <textarea className={`${inputCls} resize-none`} rows={2} placeholder={isCodeBased ? "Mô tả yêu cầu về đoạn code..." : "Nội dung câu hỏi"}
        value={content} onChange={e => setContent(e.target.value)} />

      <div className="flex items-center gap-3">
        <label className="text-xs text-[rgba(4,14,32,0.55)]">Điểm</label>
        <input type="number" min={1} className={`${inputCls} w-20`} value={points}
          onChange={e => setPoints(parseInt(e.target.value) || 1)} />
      </div>

      {type === "MCQ" && (
        <div className="space-y-2">
          <p className="text-xs text-[rgba(4,14,32,0.55)]">Các lựa chọn (tick vào đáp án đúng)</p>
          {mcqOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setMcqOptions(mcqOptions.map((o, j) => ({ ...o, is_correct: j === i })))}
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${opt.is_correct ? "border-[#1b61c9] bg-[#1b61c9]" : "border-[#C5D4EA]"}`} />
              <input className={inputCls} placeholder={`Lựa chọn ${i + 1}`} value={opt.content}
                onChange={e => setMcqOptions(mcqOptions.map((o, j) => j === i ? { ...o, content: e.target.value } : o))} />
            </div>
          ))}
        </div>
      )}

      {type === "SHORT_ANSWER" && (
        <>
          <input className={inputCls} placeholder="Gợi ý đáp án (không bắt buộc)"
            value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
          <AIGradedToggle value={aiGraded} onChange={setAiGraded} />
        </>
      )}

      {isExecutable && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select className={`${inputCls} w-40`} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[rgba(4,14,32,0.55)] block mb-1">
              {type === "DEBUGGING" ? "Đoạn code có lỗi" : "Code khung (starter code)"}
            </label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={4} placeholder="# Viết code ở đây..."
              value={starterCode} onChange={e => setStarterCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[rgba(4,14,32,0.55)] block mb-1">
              {type === "DEBUGGING" ? "Phiên bản code đã sửa (ẩn với học viên)" : "Lời giải mẫu (ẩn với học viên)"}
            </label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={4} placeholder="# Lời giải..."
              value={solutionCode} onChange={e => setSolutionCode(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[rgba(4,14,32,0.55)]">Test cases</label>
              <button onClick={() => setTestCases([...testCases, { input: "", expected: "", is_hidden: false }])}
                className="text-xs text-[#1b61c9] hover:underline flex items-center gap-1"><Plus size={12} /> Thêm</button>
            </div>
            {testCases.map((tc, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <textarea className={`${inputCls} resize-y text-xs font-mono mb-1`} rows={2} placeholder="Input (stdin)" value={tc.input}
                    onChange={e => setTestCases(testCases.map((t, j) => j === i ? { ...t, input: e.target.value } : t))} />
                  <textarea className={`${inputCls} resize-y text-xs font-mono`} rows={2} placeholder="Expected output" value={tc.expected}
                    onChange={e => setTestCases(testCases.map((t, j) => j === i ? { ...t, expected: e.target.value } : t))} />
                </div>
                <label className="flex items-center gap-1 text-[10px] text-[rgba(4,14,32,0.45)] mt-2 shrink-0">
                  <input type="checkbox" checked={tc.is_hidden}
                    onChange={e => setTestCases(testCases.map((t, j) => j === i ? { ...t, is_hidden: e.target.checked } : t))} />
                  Ẩn
                </label>
                {testCases.length > 1 && (
                  <button onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}
                    className="text-[rgba(4,14,32,0.3)] hover:text-red-500 mt-2"><Trash2 size={12} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {type === "CODE_OUTPUT" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select className={`${inputCls} w-40`} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[rgba(4,14,32,0.55)]">Đoạn code học sinh cần đọc</label>
            <textarea className={`${inputCls} resize-y font-mono text-xs`} rows={7}
              value={starterCode} onChange={e => setStarterCode(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[rgba(4,14,32,0.55)]">Output đáp án</label>
            <textarea className={`${inputCls} resize-y font-mono text-xs`} rows={3} placeholder="Có thể nhập nhiều dòng"
              value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2 text-sm border border-[#DCE6F4] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-white transition-colors">
          Hủy
        </button>
        <button onClick={handleSubmit}
          disabled={!content.trim() || addQuestion.isPending ||
            (isExecutable && !testCases.some((testCase) => testCase.expected.trim())) ||
            (type === "CODE_OUTPUT" && (!starterCode.trim() || !sampleAnswer.trim()))}
          className="flex-1 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
          {addQuestion.isPending ? "Đang lưu..." : "Thêm câu hỏi"}
        </button>
      </div>
    </div>
  );
}

// ── Question Card — Edit mode ─────────────────────────────────────────────────

function QuestionEditor({ q, quizId, onClose }: { q: Question; quizId: string; onClose: () => void }) {
  const updateQuestion = useUpdateQuestion(quizId);
  const [content, setContent] = useState(q.content);
  const [points, setPoints]   = useState(q.points);
  const [sampleAnswer, setSampleAnswer] = useState(q.sample_answer ?? "");
  const [aiGraded, setAiGraded] = useState(q.ai_graded ?? false);
  const [options, setOptions] = useState(
    q.options.map(o => ({ content: o.content, is_correct: o.is_correct })),
  );
  const [language, setLanguage] = useState(q.language ?? "python");
  const [starterCode, setStarterCode] = useState(q.starter_code ?? "");
  const [solutionCode, setSolutionCode] = useState(q.solution_code ?? "");
  const [testCases, setTestCases] = useState(
    q.testCases?.map((testCase) => ({
      input: testCase.input,
      expected: testCase.expected,
      is_hidden: testCase.is_hidden,
    })) ?? [{ input: "", expected: "", is_hidden: false }],
  );
  const isExecutable = isExecutableQuestionType(q.type);

  const setCorrect = (i: number) =>
    setOptions(options.map((o, j) => ({ ...o, is_correct: j === i })));

  const handleSave = () => {
    if (!content.trim()) return;
    const payload: Parameters<typeof updateQuestion.mutate>[0] = { id: q.id, content, points };
    if (q.type === "SHORT_ANSWER") {
      payload.sample_answer = sampleAnswer || null;
      payload.ai_graded = aiGraded;
    } else if (isExecutable) {
      const validTestCases = testCases
        .filter((testCase) => testCase.expected.trim())
        .map((testCase, index) => ({ ...testCase, order: index }));
      if (validTestCases.length === 0) {
        toast.error("Câu hỏi chạy code cần ít nhất một test case có output mong đợi");
        return;
      }
      payload.language = language;
      payload.starter_code = starterCode || null;
      payload.solution_code = solutionCode || null;
      payload.testCases = validTestCases;
    } else if (q.type === "CODE_OUTPUT") {
      if (!starterCode.trim() || !sampleAnswer.trim()) {
        toast.error("Câu dự đoán output cần đoạn code và output đáp án");
        return;
      }
      payload.language = language;
      payload.starter_code = starterCode;
      payload.sample_answer = sampleAnswer;
    } else {
      payload.options = options.map((o, i) => ({ content: o.content, is_correct: o.is_correct, order: i + 1 }));
    }
    updateQuestion.mutate(payload, {
      onSuccess: onClose,
      onError: () => toast.error("Lưu câu hỏi thất bại, vui lòng kiểm tra dữ liệu"),
    });
  };

  return (
    <div className="p-5 border border-[#1b61c9]/25 rounded-2xl bg-[#EAF1FC] space-y-4">
      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Nội dung câu hỏi"
        value={content} onChange={e => setContent(e.target.value)} />

      <div className="flex items-center gap-3">
        <label className="text-xs text-[rgba(4,14,32,0.55)]">Điểm</label>
        <input type="number" min={1} className={`${inputCls} w-20`} value={points}
          onChange={e => setPoints(parseInt(e.target.value) || 1)} />
      </div>

      {(q.type === "MCQ" || q.type === "TRUE_FALSE") && (
        <div className="space-y-2">
          <p className="text-xs text-[rgba(4,14,32,0.55)]">Các lựa chọn (tick vào đáp án đúng)</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setCorrect(i)}
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${opt.is_correct ? "border-[#1b61c9] bg-[#1b61c9]" : "border-[#C5D4EA]"}`} />
              <input className={inputCls} value={opt.content} disabled={q.type === "TRUE_FALSE"}
                placeholder={`Lựa chọn ${i + 1}`}
                onChange={e => setOptions(options.map((o, j) => j === i ? { ...o, content: e.target.value } : o))} />
            </div>
          ))}
        </div>
      )}

      {q.type === "SHORT_ANSWER" && (
        <>
          <input className={inputCls} placeholder="Gợi ý đáp án (không bắt buộc)"
            value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
          <AIGradedToggle value={aiGraded} onChange={setAiGraded} />
        </>
      )}

      {isExecutable && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select className={`${inputCls} w-40`} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[rgba(4,14,32,0.55)] block mb-1">
              {q.type === "DEBUGGING" ? "Đoạn code có lỗi" : "Code khung"}
            </label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={4}
              value={starterCode} onChange={e => setStarterCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[rgba(4,14,32,0.55)] block mb-1">
              {q.type === "DEBUGGING" ? "Phiên bản code đã sửa (ẩn với học viên)" : "Lời giải mẫu (ẩn với học viên)"}
            </label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={4}
              value={solutionCode} onChange={e => setSolutionCode(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[rgba(4,14,32,0.55)]">Test cases</label>
              <button onClick={() => setTestCases([...testCases, { input: "", expected: "", is_hidden: false }])}
                className="text-xs text-[#1b61c9] hover:underline flex items-center gap-1">
                <Plus size={12} /> Thêm
              </button>
            </div>
            {testCases.map((testCase, index) => (
              <div key={index} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <textarea className={`${inputCls} resize-y text-xs font-mono mb-1`} rows={2} placeholder="Input (stdin)"
                    value={testCase.input}
                    onChange={e => setTestCases(testCases.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, input: e.target.value } : item))} />
                  <textarea className={`${inputCls} resize-y text-xs font-mono`} rows={2} placeholder="Expected output"
                    value={testCase.expected}
                    onChange={e => setTestCases(testCases.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, expected: e.target.value } : item))} />
                </div>
                <label className="flex items-center gap-1 text-[10px] text-[rgba(4,14,32,0.45)] mt-2 shrink-0">
                  <input type="checkbox" checked={testCase.is_hidden}
                    onChange={e => setTestCases(testCases.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, is_hidden: e.target.checked } : item))} />
                  Ẩn
                </label>
                {testCases.length > 1 && (
                  <button onClick={() => setTestCases(testCases.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-[rgba(4,14,32,0.3)] hover:text-red-500 mt-2">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {q.type === "CODE_OUTPUT" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[rgba(4,14,32,0.55)]">Ngôn ngữ</label>
            <select className={`${inputCls} w-40`} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANG_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[rgba(4,14,32,0.55)]">Đoạn code học sinh cần đọc</label>
            <textarea className={`${inputCls} resize-y font-mono text-xs`} rows={7}
              value={starterCode} onChange={e => setStarterCode(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[rgba(4,14,32,0.55)]">Output đáp án</label>
            <textarea className={`${inputCls} resize-y font-mono text-xs`} rows={3}
              value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-[#DCE6F4] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-white transition-colors">
          <X size={14} /> Hủy
        </button>
        <button onClick={handleSave}
          disabled={!content.trim() || updateQuestion.isPending ||
            (isExecutable && !testCases.some((testCase) => testCase.expected.trim())) ||
            (q.type === "CODE_OUTPUT" && (!starterCode.trim() || !sampleAnswer.trim()))}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
          <Check size={14} /> {updateQuestion.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

// ── Question Card — Display ────────────────────────────────────────────────────

function QuestionCard({ q, quizId, index }: { q: Question; quizId: string; index: number }) {
  const deleteQuestion = useDeleteQuestion(quizId);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const meta = TYPE_META[q.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: q.id, disabled: editing });

  if (editing) return <QuestionEditor q={q} quizId={quizId} onClose={() => setEditing(false)} />;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className={`p-5 bg-white border rounded-2xl space-y-3.5 transition-colors ${
        isDragging ? "outline-2 outline-dashed outline-[#1b61c9] bg-[#1b61c9]/5 border-transparent" : "border-[#DCE6F4] hover:border-[#C5D4EA]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-[rgba(4,14,32,0.3)] hover:text-[#1b61c9] transition-colors touch-none"
            title="Kéo để đổi thứ tự"
          >
            <GripVertical size={16} />
          </button>
          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#EAF1FC] text-xs font-semibold text-[#1b61c9]">
            {index + 1}
          </span>
          <p className="text-sm text-[#181d26] leading-relaxed pt-0.5">{q.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-[rgba(4,14,32,0.35)] hover:text-[#1b61c9] hover:bg-[#EAF1FC] rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setShowDelete(true)} disabled={deleteQuestion.isPending}
            className="p-1.5 text-[rgba(4,14,32,0.35)] hover:text-[#E5484D] hover:bg-[rgba(229,72,77,0.10)] rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Xóa câu hỏi?"
        message="Hành động này không thể hoàn tác."
        onConfirm={() => deleteQuestion.mutate(q.id, { onSuccess: () => setShowDelete(false) })}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteQuestion.isPending}
      />

      <div className="flex items-center gap-2 pl-9 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${meta.pill}`}>{meta.label}</span>
        <span className="text-xs text-[rgba(4,14,32,0.45)]">{q.points} điểm</span>
        {q.type === "SHORT_ANSWER" && (
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
            q.ai_graded ? "bg-[#1b61c9]/8 text-[#1b61c9]" : "bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]"
          }`}>
            {q.ai_graded ? "AI chấm" : "Chấm tay"}
          </span>
        )}
        {isCodeBasedQuestionType(q.type) && q.language && (
          <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700">
            {LANG_OPTIONS.find(l => l.value === q.language)?.label ?? q.language}
          </span>
        )}
        {isExecutableQuestionType(q.type) && q.testCases && (
          <span className="text-xs text-[rgba(4,14,32,0.45)]">
            {q.testCases.length} test case{q.testCases.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {q.options.length > 0 && (
        <div className="space-y-1.5 pl-9">
          {q.options.map(opt => (
            <div key={opt.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${opt.is_correct ? "bg-[rgba(14,159,110,0.10)] border border-[rgba(14,159,110,0.30)]" : "border border-transparent"}`}>
              {opt.is_correct
                ? <CheckCircle2 size={14} className="text-[#0E9F6E] shrink-0" />
                : <span className="w-3.5 h-3.5 rounded-full border border-[#C5D4EA] shrink-0" />}
              <span className={`text-xs ${opt.is_correct ? "font-medium text-[#0E9F6E]" : "text-[rgba(4,14,32,0.6)]"}`}>{opt.content}</span>
            </div>
          ))}
        </div>
      )}

      {q.sample_answer && (
        <p className="pl-9 text-xs text-[rgba(4,14,32,0.5)] italic whitespace-pre-wrap">
          {q.type === "CODE_OUTPUT" ? "Output đáp án: " : "Gợi ý: "}{q.sample_answer}
        </p>
      )}

      {isExecutableQuestionType(q.type) && q.testCases && q.testCases.length > 0 && (
        <div className="pl-9 space-y-1">
          <p className="text-xs text-[rgba(4,14,32,0.5)] font-medium">Test cases:</p>
          {q.testCases.slice(0, 3).map((tc, i) => (
            <div key={tc.id} className="flex gap-3 text-xs font-mono bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#f0f2f5]">
              <span className="text-[rgba(4,14,32,0.4)]">#{i + 1}</span>
              <span className="text-[rgba(4,14,32,0.6)]">in: {tc.input || "(trống)"}</span>
              <span className="text-[rgba(4,14,32,0.6)]">→ {tc.expected}</span>
              {tc.is_hidden && <span className="text-amber-500 text-[10px]">ẩn</span>}
            </div>
          ))}
          {q.testCases.length > 3 && (
            <p className="text-[10px] text-[rgba(4,14,32,0.4)]">+{q.testCases.length - 3} test cases khác</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="max-w-2xl mx-auto space-y-7 animate-pulse">
          {/* Header */}
          <div className="space-y-3">
            <div className="h-3.5 w-36 bg-[#E2ECF9] rounded" />
            <div className="h-7 w-64 bg-[#D6E3F6] rounded" />
            <div className="h-3.5 w-48 bg-[#E2ECF9] rounded" />
          </div>

          {/* Quiz meta card */}
          <div className="p-5 bg-white rounded-2xl flex items-center justify-between"
            style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-[#D6E3F6] rounded" />
              <div className="h-3 w-24 bg-[#E2ECF9] rounded" />
            </div>
            <div className="h-8 w-8 bg-[#E2ECF9] rounded-lg" />
          </div>

          {/* Questions */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-[#D6E3F6] rounded" />
              <div className="h-3 w-20 bg-[#E2ECF9] rounded" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-5 bg-white rounded-2xl space-y-3.5"
                style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-[#E2ECF9] rounded-full shrink-0" />
                  <div className="h-4 w-4/5 bg-[#E2ECF9] rounded" />
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <div className="h-4 w-20 bg-[#EAF1FC] rounded-md" />
                  <div className="h-3 w-12 bg-[#EAF1FC] rounded" />
                </div>
                <div className="space-y-1.5 pl-9">
                  <div className="h-7 w-2/3 bg-[#EAF1FC] rounded-lg" />
                  <div className="h-7 w-1/2 bg-[#EAF1FC] rounded-lg" />
                </div>
              </div>
            ))}
            <div className="h-12 w-full bg-[#EAF1FC] border border-dashed rounded-2xl" style={{ borderColor: C.border }} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuizEditPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = use(params);
  const { data: quiz, isLoading } = useQuiz(quizId);
  const updateQuiz = useUpdateQuiz(quizId);
  const reorderQuestions = useReorderQuestions(quizId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !quiz) return;
    const oldIdx = quiz.questions.findIndex((q) => q.id === active.id);
    const newIdx = quiz.questions.findIndex((q) => q.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    reorderQuestions(arrayMove(quiz.questions, oldIdx, newIdx));
  };

  const [title, setTitle]         = useState("");
  const [policy, setPolicy] = useState<QuizPolicyFormValue>({
    requirePass: true,
    passScore: 70,
    maxAttempts: null,
  });
  const [titleEditing, setTitleEditing] = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);

  const handleSaveMeta = () => {
    updateQuiz.mutate(
      {
        title: title || quiz?.title,
        pass_score: policy.passScore,
        require_pass: policy.requirePass,
        max_attempts: policy.maxAttempts,
      },
      {
        onSuccess: () => {
          setTitleEditing(false);
          toast.success("Đã lưu thiết lập bài kiểm tra");
        },
        onError: () => toast.error("Lưu thiết lập thất bại"),
      },
    );
  };

  if (isLoading) return <QuizSkeleton />;
  if (!quiz) return null;

  const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="max-w-2xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <BackButton href={`/teacher/courses/${id}/edit`} />
        <h1 className="font-display text-3xl font-semibold text-[#181d26]">Chỉnh sửa bài kiểm tra</h1>
        <p className="text-sm text-[rgba(4,14,32,0.45)] mt-1">
          {quiz.questions.length} câu hỏi · {totalPoints} điểm · {quiz.require_pass ? `đạt từ ${quiz.pass_score}%` : "không cần điểm qua"}
        </p>
      </div>

      {/* Quiz meta */}
      <div className="p-5 bg-white rounded-2xl"
        style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(80,60,20,0.05) 0px 6px 18px" }}>
        {titleEditing ? (
          <div className="space-y-3">
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên bài kiểm tra" />

            <div className="border-t border-[#E7EEF8] pt-4">
              <QuizPolicyFields
                value={policy}
                onChange={setPolicy}
                disabled={updateQuiz.isPending}
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setTitleEditing(false)}
                className="flex-1 py-2 text-sm border border-[#DCE6F4] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-[#EAF1FC] transition-colors">
                Hủy
              </button>
              <button onClick={handleSaveMeta} disabled={updateQuiz.isPending}
                className="flex-1 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
                {updateQuiz.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-[#181d26]">{quiz.title}</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1">
                {quiz.require_pass ? `Cần đạt ${quiz.pass_score}% để qua` : "Không cần điểm qua môn"}
                {` · ${quiz.max_attempts ? `${quiz.max_attempts} lần làm` : "không giới hạn lượt"}`}
                {quiz.time_limit ? ` · ${quiz.time_limit} phút` : ""}
              </p>
            </div>
            <button onClick={() => {
                setTitle(quiz.title);
                setPolicy({
                  passScore: quiz.pass_score,
                  requirePass: quiz.require_pass,
                  maxAttempts: quiz.max_attempts ?? null,
                });
                setTitleEditing(true);
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#DCE6F4] rounded-lg text-[rgba(4,14,32,0.6)] hover:bg-[#EAF1FC] hover:border-[#1b61c9]/40 transition-colors">
              <Pencil size={12} /> Sửa
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#181d26]">
            Câu hỏi ({quiz.questions.length})
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.45)]">
            Tổng: {totalPoints} điểm
          </span>
        </div>

        {quiz.questions.length === 0 && !showAddForm && (
          <p className="text-sm text-[rgba(4,14,32,0.45)] text-center py-6">Chưa có câu hỏi nào.</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={quiz.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3.5">
              {quiz.questions.map((q, i) => (
                <QuestionCard key={q.id} q={q} quizId={quizId} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {showAddForm ? (
          <AddQuestionForm quizId={quizId} nextOrder={quiz.questions.length + 1} onClose={() => setShowAddForm(false)} />
        ) : (
          <button onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#C5D4EA] rounded-2xl text-sm text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] hover:bg-[#1b61c9]/4 transition-colors">
            <Plus size={14} />
            Thêm câu hỏi
          </button>
        )}
      </div>
        </div>
      </main>
    </div>
  );
}
