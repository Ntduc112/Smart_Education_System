"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, ChevronLeft, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

interface Option   { id: string; content: string; is_correct: boolean; order: number }
interface Question { id: string; content: string; type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER"; points: number; order: number; sample_answer?: string | null; options: Option[] }
interface Quiz     { id: string; title: string; pass_score: number; time_limit?: number | null; questions: Question[] }

const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-[#e0e2e6] bg-white focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/30 focus:border-[#1b61c9] transition-all";

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
    mutationFn: (data: { title?: string; pass_score?: number; time_limit?: number | null }) =>
      api.put(`/teacher/quizzes/${quizId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

function useDeleteQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => api.delete(`/teacher/questions/${questionId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

function useAddQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string; type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
      points: number; order: number; sample_answer?: string;
      options?: { content: string; is_correct: boolean; order: number }[];
    }) => api.post(`/teacher/quizzes/${quizId}/questions`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

// ── Add Question Form ────────────────────────────────────────────────────────

function AddQuestionForm({ quizId, nextOrder, onClose }: { quizId: string; nextOrder: number; onClose: () => void }) {
  const addQuestion = useAddQuestion(quizId);
  const [type, setType]       = useState<"MCQ" | "TRUE_FALSE" | "SHORT_ANSWER">("MCQ");
  const [content, setContent] = useState("");
  const [points, setPoints]   = useState(1);
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [mcqOptions, setMcqOptions] = useState([
    { content: "", is_correct: true },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ]);

  const handleSubmit = () => {
    if (!content.trim()) return;
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
      { content, type, points, order: nextOrder, sample_answer: sampleAnswer || undefined, options },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="p-4 border border-[#1b61c9]/20 rounded-xl bg-[#f8fafc] space-y-3">
      <div className="flex gap-2">
        {(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${type === t ? "bg-[#1b61c9] text-white" : "bg-white border border-[#e0e2e6] text-[rgba(4,14,32,0.6)]"}`}>
            {t === "MCQ" ? "Trắc nghiệm" : t === "TRUE_FALSE" ? "Đúng/Sai" : "Tự luận"}
          </button>
        ))}
      </div>

      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Nội dung câu hỏi"
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
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${opt.is_correct ? "border-[#1b61c9] bg-[#1b61c9]" : "border-[#c0c8d5]"}`} />
              <input className={inputCls} placeholder={`Lựa chọn ${i + 1}`} value={opt.content}
                onChange={e => setMcqOptions(mcqOptions.map((o, j) => j === i ? { ...o, content: e.target.value } : o))} />
            </div>
          ))}
        </div>
      )}

      {type === "SHORT_ANSWER" && (
        <input className={inputCls} placeholder="Gợi ý đáp án (không bắt buộc)"
          value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2 text-sm border border-[#e0e2e6] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-white transition-colors">
          Hủy
        </button>
        <button onClick={handleSubmit} disabled={!content.trim() || addQuestion.isPending}
          className="flex-1 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
          {addQuestion.isPending ? "Đang lưu..." : "Thêm câu hỏi"}
        </button>
      </div>
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({ q, quizId, index }: { q: Question; quizId: string; index: number }) {
  const deleteQuestion = useDeleteQuestion(quizId);
  const typeLabel = q.type === "MCQ" ? "Trắc nghiệm" : q.type === "TRUE_FALSE" ? "Đúng/Sai" : "Tự luận";

  return (
    <div className="p-4 bg-white border border-[#e0e2e6] rounded-xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="shrink-0 mt-0.5 text-xs font-semibold text-[rgba(4,14,32,0.4)] w-5">{index + 1}.</span>
          <p className="text-sm text-[#181d26] leading-relaxed">{q.content}</p>
        </div>
        <button onClick={() => deleteQuestion.mutate(q.id)} disabled={deleteQuestion.isPending}
          className="shrink-0 p-1.5 text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-[#f0f4ff] text-[#1b61c9] rounded-md font-medium">{typeLabel}</span>
        <span className="text-xs text-[rgba(4,14,32,0.45)]">{q.points} điểm</span>
      </div>

      {q.options.length > 0 && (
        <div className="space-y-1.5 pl-5">
          {q.options.map(opt => (
            <div key={opt.id} className="flex items-center gap-2">
              {opt.is_correct
                ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                : <span className="w-3.5 h-3.5 rounded-full border border-[#c0c8d5] shrink-0" />}
              <span className={`text-xs ${opt.is_correct ? "font-medium text-[#181d26]" : "text-[rgba(4,14,32,0.55)]"}`}>{opt.content}</span>
            </div>
          ))}
        </div>
      )}

      {q.sample_answer && (
        <p className="pl-5 text-xs text-[rgba(4,14,32,0.5)] italic">Gợi ý: {q.sample_answer}</p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuizEditPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id: courseId, quizId } = use(params);
  const { data: quiz, isLoading } = useQuiz(quizId);
  const updateQuiz = useUpdateQuiz(quizId);

  const [title, setTitle]         = useState("");
  const [passScore, setPassScore] = useState(70);
  const [titleEditing, setTitleEditing] = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);

  const handleSaveMeta = () => {
    updateQuiz.mutate({ title: title || quiz?.title, pass_score: passScore });
    setTitleEditing(false);
  };

  if (isLoading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center min-h-[40vh]">
        <span className="text-sm text-[rgba(4,14,32,0.45)]">Đang tải...</span>
      </div>
    );
  }
  if (!quiz) return null;

  const currentTitle     = titleEditing ? title : quiz.title;
  const currentPassScore = titleEditing ? passScore : quiz.pass_score;

  return (
    <div className="px-8 py-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link href={`/teacher/courses/${courseId}/edit`}
          className="group inline-flex items-center gap-1 text-sm text-[rgba(4,14,32,0.4)] hover:text-[#1b61c9] transition-colors mb-4">
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Chỉnh sửa khóa học
        </Link>
        <h1 className="text-2xl font-semibold text-[#181d26]">Chỉnh sửa bài kiểm tra</h1>
      </div>

      {/* Quiz meta */}
      <div className="p-4 bg-white border border-[#e0e2e6] rounded-xl space-y-3">
        {titleEditing ? (
          <>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên bài kiểm tra" />
            <div className="flex items-center gap-3">
              <label className="text-xs text-[rgba(4,14,32,0.55)]">Điểm đạt (%)</label>
              <input type="number" min={0} max={100} className={`${inputCls} w-24`}
                value={passScore} onChange={e => setPassScore(parseInt(e.target.value) || 70)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTitleEditing(false)}
                className="flex-1 py-2 text-sm border border-[#e0e2e6] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] transition-colors">
                Hủy
              </button>
              <button onClick={handleSaveMeta} disabled={updateQuiz.isPending}
                className="flex-1 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60">
                {updateQuiz.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#181d26]">{quiz.title}</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
                Điểm đạt: {quiz.pass_score}%
                {quiz.time_limit ? ` · ${quiz.time_limit} phút` : ""}
              </p>
            </div>
            <button onClick={() => { setTitle(quiz.title); setPassScore(quiz.pass_score); setTitleEditing(true); }}
              className="text-xs px-3 py-1.5 border border-[#e0e2e6] rounded-lg text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] transition-colors">
              Sửa
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#181d26]">
            Câu hỏi ({quiz.questions.length})
          </span>
          <span className="text-xs text-[rgba(4,14,32,0.45)]">
            Tổng: {quiz.questions.reduce((s, q) => s + q.points, 0)} điểm
          </span>
        </div>

        {quiz.questions.length === 0 && !showAddForm && (
          <p className="text-sm text-[rgba(4,14,32,0.45)] text-center py-6">Chưa có câu hỏi nào.</p>
        )}

        {quiz.questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} quizId={quizId} index={i} />
        ))}

        {showAddForm ? (
          <AddQuestionForm quizId={quizId} nextOrder={quiz.questions.length + 1} onClose={() => setShowAddForm(false)} />
        ) : (
          <button onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#c0c8d5] rounded-xl text-sm text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors">
            <Plus size={14} />
            Thêm câu hỏi
          </button>
        )}
      </div>
    </div>
  );
}
