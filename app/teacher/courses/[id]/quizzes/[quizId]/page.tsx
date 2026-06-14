"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, ChevronLeft, CheckCircle2, Pencil, X, Check, GripVertical } from "lucide-react";
import api from "@/lib/axios";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/_components/ConfirmModal";

// ── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";

interface Option   { id: string; content: string; is_correct: boolean; order: number }
interface Question { id: string; content: string; type: QuestionType; points: number; order: number; sample_answer?: string | null; options: Option[] }
interface Quiz     { id: string; title: string; pass_score: number; time_limit?: number | null; questions: Question[] }

const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-[#e0e2e6] bg-white focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/30 focus:border-[#1b61c9] transition-all";

const TYPE_META: Record<QuestionType, { label: string; pill: string }> = {
  MCQ:          { label: "Trắc nghiệm", pill: "bg-[#eff4ff] text-[#1b61c9]" },
  TRUE_FALSE:   { label: "Đúng/Sai",    pill: "bg-amber-50 text-amber-600" },
  SHORT_ANSWER: { label: "Tự luận",     pill: "bg-purple-50 text-purple-600" },
};

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
      points: number; order: number; sample_answer?: string;
      options?: { content: string; is_correct: boolean; order: number }[];
    }) => api.post(`/teacher/quizzes/${quizId}/questions`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "quiz", quizId] }),
  });
}

function useUpdateQuestion(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string; content?: string; points?: number; sample_answer?: string | null;
      options?: { content: string; is_correct: boolean; order: number }[];
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

// ── Add Question Form ────────────────────────────────────────────────────────

function AddQuestionForm({ quizId, nextOrder, onClose }: { quizId: string; nextOrder: number; onClose: () => void }) {
  const addQuestion = useAddQuestion(quizId);
  const [type, setType]       = useState<QuestionType>("MCQ");
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
    <div className="p-5 border border-[#1b61c9]/25 rounded-2xl bg-[#f8fafc] space-y-4">
      <div className="flex gap-2">
        {(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${type === t ? "bg-[#1b61c9] text-white" : "bg-white border border-[#e0e2e6] text-[rgba(4,14,32,0.6)] hover:border-[#1b61c9]/40"}`}>
            {TYPE_META[t].label}
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

// ── Question Card — Edit mode ─────────────────────────────────────────────────

function QuestionEditor({ q, quizId, onClose }: { q: Question; quizId: string; onClose: () => void }) {
  const updateQuestion = useUpdateQuestion(quizId);
  const [content, setContent] = useState(q.content);
  const [points, setPoints]   = useState(q.points);
  const [sampleAnswer, setSampleAnswer] = useState(q.sample_answer ?? "");
  const [options, setOptions] = useState(
    q.options.map(o => ({ content: o.content, is_correct: o.is_correct })),
  );

  const setCorrect = (i: number) =>
    setOptions(options.map((o, j) => ({ ...o, is_correct: j === i })));

  const handleSave = () => {
    if (!content.trim()) return;
    const payload: Parameters<typeof updateQuestion.mutate>[0] = { id: q.id, content, points };
    if (q.type === "SHORT_ANSWER") {
      payload.sample_answer = sampleAnswer || null;
    } else {
      payload.options = options.map((o, i) => ({ content: o.content, is_correct: o.is_correct, order: i + 1 }));
    }
    updateQuestion.mutate(payload, { onSuccess: onClose });
  };

  return (
    <div className="p-5 border border-[#1b61c9]/25 rounded-2xl bg-[#f8fafc] space-y-4">
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
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${opt.is_correct ? "border-[#1b61c9] bg-[#1b61c9]" : "border-[#c0c8d5]"}`} />
              <input className={inputCls} value={opt.content} disabled={q.type === "TRUE_FALSE"}
                placeholder={`Lựa chọn ${i + 1}`}
                onChange={e => setOptions(options.map((o, j) => j === i ? { ...o, content: e.target.value } : o))} />
            </div>
          ))}
        </div>
      )}

      {q.type === "SHORT_ANSWER" && (
        <input className={inputCls} placeholder="Gợi ý đáp án (không bắt buộc)"
          value={sampleAnswer} onChange={e => setSampleAnswer(e.target.value)} />
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-[#e0e2e6] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-white transition-colors">
          <X size={14} /> Hủy
        </button>
        <button onClick={handleSave} disabled={!content.trim() || updateQuestion.isPending}
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
        isDragging ? "outline-2 outline-dashed outline-[#1b61c9] bg-[#1b61c9]/5 border-transparent" : "border-[#e0e2e6] hover:border-[#c0c8d5]"
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
          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#f0f4ff] text-xs font-semibold text-[#1b61c9]">
            {index + 1}
          </span>
          <p className="text-sm text-[#181d26] leading-relaxed pt-0.5">{q.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-[rgba(4,14,32,0.35)] hover:text-[#1b61c9] hover:bg-[#f0f4ff] rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setShowDelete(true)} disabled={deleteQuestion.isPending}
            className="p-1.5 text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

      <div className="flex items-center gap-2 pl-9">
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${meta.pill}`}>{meta.label}</span>
        <span className="text-xs text-[rgba(4,14,32,0.45)]">{q.points} điểm</span>
      </div>

      {q.options.length > 0 && (
        <div className="space-y-1.5 pl-9">
          {q.options.map(opt => (
            <div key={opt.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${opt.is_correct ? "bg-green-50 border border-green-200" : "border border-transparent"}`}>
              {opt.is_correct
                ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                : <span className="w-3.5 h-3.5 rounded-full border border-[#c0c8d5] shrink-0" />}
              <span className={`text-xs ${opt.is_correct ? "font-medium text-green-700" : "text-[rgba(4,14,32,0.6)]"}`}>{opt.content}</span>
            </div>
          ))}
        </div>
      )}

      {q.sample_answer && (
        <p className="pl-9 text-xs text-[rgba(4,14,32,0.5)] italic">Gợi ý: {q.sample_answer}</p>
      )}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <div className="px-8 py-10 max-w-2xl mx-auto space-y-7 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-3.5 w-36 bg-[#eef1f5] rounded" />
        <div className="h-7 w-64 bg-[#e7eaef] rounded" />
        <div className="h-3.5 w-48 bg-[#eef1f5] rounded" />
      </div>

      {/* Quiz meta card */}
      <div className="p-5 bg-white border border-[#e9ecf1] rounded-2xl flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-[#e7eaef] rounded" />
          <div className="h-3 w-24 bg-[#eef1f5] rounded" />
        </div>
        <div className="h-8 w-8 bg-[#eef1f5] rounded-lg" />
      </div>

      {/* Questions */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-[#e7eaef] rounded" />
          <div className="h-3 w-20 bg-[#eef1f5] rounded" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-5 bg-white border border-[#e9ecf1] rounded-2xl space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-[#eef1f5] rounded-full shrink-0" />
              <div className="h-4 w-4/5 bg-[#eef1f5] rounded" />
            </div>
            <div className="flex items-center gap-2 pl-9">
              <div className="h-4 w-20 bg-[#f2f4f7] rounded-md" />
              <div className="h-3 w-12 bg-[#f2f4f7] rounded" />
            </div>
            <div className="space-y-1.5 pl-9">
              <div className="h-7 w-2/3 bg-[#f2f4f7] rounded-lg" />
              <div className="h-7 w-1/2 bg-[#f2f4f7] rounded-lg" />
            </div>
          </div>
        ))}
        <div className="h-12 w-full bg-[#f2f4f7] border border-dashed border-[#e0e2e6] rounded-2xl" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuizEditPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id: courseId, quizId } = use(params);
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
  const [passScore, setPassScore] = useState(70);
  const [titleEditing, setTitleEditing] = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);

  const handleSaveMeta = () => {
    updateQuiz.mutate({ title: title || quiz?.title, pass_score: passScore });
    setTitleEditing(false);
  };

  if (isLoading) return <QuizSkeleton />;
  if (!quiz) return null;

  const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="px-8 py-10 max-w-2xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <Link href={`/teacher/courses/${courseId}/edit`}
          className="group inline-flex items-center gap-1 text-sm text-[rgba(4,14,32,0.4)] hover:text-[#1b61c9] transition-colors mb-4">
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Chỉnh sửa khóa học
        </Link>
        <h1 className="text-2xl font-semibold text-[#181d26]">Chỉnh sửa bài kiểm tra</h1>
        <p className="text-sm text-[rgba(4,14,32,0.45)] mt-1">
          {quiz.questions.length} câu hỏi · {totalPoints} điểm · đạt từ {quiz.pass_score}%
        </p>
      </div>

      {/* Quiz meta */}
      <div className="p-5 bg-white border border-[#e0e2e6] rounded-2xl">
        {titleEditing ? (
          <div className="space-y-3">
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
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-[#181d26]">{quiz.title}</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-1">
                Điểm đạt: {quiz.pass_score}%
                {quiz.time_limit ? ` · ${quiz.time_limit} phút` : ""}
              </p>
            </div>
            <button onClick={() => { setTitle(quiz.title); setPassScore(quiz.pass_score); setTitleEditing(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e0e2e6] rounded-lg text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] hover:border-[#1b61c9]/40 transition-colors">
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
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#c0c8d5] rounded-2xl text-sm text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] hover:bg-[#1b61c9]/4 transition-colors">
            <Plus size={14} />
            Thêm câu hỏi
          </button>
        )}
      </div>
    </div>
  );
}
