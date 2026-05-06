"use client";

import Link from "next/link";
import { useState, useEffect, useRef, use } from "react";
import {
  ChevronDown, ChevronRight, Plus, Trash2, Save,
  Video, FileText, ClipboardList, BookOpen, Globe, Lock, ArrowLeft,
} from "lucide-react";
import {
  useCourseBuilder, useUpdateCourse, useTogglePublish,
  useCreateChapter, useUpdateChapter, useDeleteChapter,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
  useUploadPdf, useCreateQuiz,
  BuilderChapter, BuilderLesson,
} from "./edit.hook";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

type Selection =
  | { type: "info" }
  | { type: "chapter"; id: string }
  | { type: "lesson"; id: string };

interface Category { id: string; name: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  { value: "BEGINNER",     label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED",     label: "Nâng cao" },
];

const inputCls = "w-full px-3 py-2 text-sm border border-[#e0e2e6] rounded-xl outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10 transition-all bg-white";
const labelCls = "block text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider mb-1.5";

// ── CourseInfoPanel ──────────────────────────────────────────────────────────

function CourseInfoPanel({
  courseId, course, categories,
}: {
  courseId:   string;
  course:     NonNullable<ReturnType<typeof useCourseBuilder>["data"]>;
  categories: Category[];
}) {
  const updateCourse = useUpdateCourse(courseId);
  const [form, setForm] = useState({
    title:       course.title,
    description: course.description,
    thumbnail:   course.thumbnail,
    price:       parseFloat(course.price),
    level:       course.level,
    category_id: course.category_id,
    status:      course.status,
  });

  useEffect(() => {
    setForm({
      title:       course.title,
      description: course.description,
      thumbnail:   course.thumbnail,
      price:       parseFloat(course.price),
      level:       course.level,
      category_id: course.category_id,
      status:      course.status,
    });
  }, [course]);

  const handleSave = () => updateCourse.mutate(form);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[#181d26]">Thông tin khóa học</h2>

      <div>
        <label className={labelCls}>Tên khóa học</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelCls}>Mô tả</label>
        <textarea
          rows={4}
          className={`${inputCls} resize-none`}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelCls}>URL ảnh bìa</label>
        <input
          className={inputCls}
          value={form.thumbnail}
          onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
        />
        {form.thumbnail && (
          <img
            src={form.thumbnail}
            alt="preview"
            className="mt-2 w-full h-36 object-cover rounded-xl border border-[#e0e2e6]"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Danh mục</label>
          <select
            className={inputCls}
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Cấp độ</label>
          <select
            className={inputCls}
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Giá (VND)</label>
        <input
          type="number"
          min={0}
          step={1000}
          className={inputCls}
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={updateCourse.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {updateCourse.isPending ? "Đang lưu..." : "Lưu thông tin"}
      </button>
    </div>
  );
}

// ── ChapterPanel ─────────────────────────────────────────────────────────────

function ChapterPanel({
  courseId, chapter,
}: {
  courseId: string;
  chapter:  BuilderChapter;
}) {
  const updateChapter = useUpdateChapter(courseId);
  const [title, setTitle] = useState(chapter.title);

  useEffect(() => setTitle(chapter.title), [chapter.title]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[#181d26]">Chỉnh sửa chương</h2>
      <div>
        <label className={labelCls}>Tên chương</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <button
        onClick={() => updateChapter.mutate({ id: chapter.id, title })}
        disabled={updateChapter.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {updateChapter.isPending ? "Đang lưu..." : "Lưu chương"}
      </button>
    </div>
  );
}

// ── LessonPanel ──────────────────────────────────────────────────────────────

function LessonPanel({
  courseId, lesson,
}: {
  courseId: string;
  lesson:   BuilderLesson;
}) {
  const updateLesson = useUpdateLesson(courseId);
  const uploadPdf    = useUploadPdf();
  const createQuiz   = useCreateQuiz(courseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:     lesson.title,
    is_free:   lesson.is_free,
    content:   lesson.content ?? "",
    video_url: lesson.video_url ?? "",
    pdf_url:   lesson.pdf_url ?? "",
  });
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle]       = useState("");
  const [quizScore, setQuizScore]       = useState(70);

  useEffect(() => {
    setForm({
      title:     lesson.title,
      is_free:   lesson.is_free,
      content:   lesson.content ?? "",
      video_url: lesson.video_url ?? "",
      pdf_url:   lesson.pdf_url ?? "",
    });
  }, [lesson]);

  const handleSave = () =>
    updateLesson.mutate({
      id:        lesson.id,
      title:     form.title,
      is_free:   form.is_free,
      content:   form.content || null,
      video_url: form.video_url || null,
      pdf_url:   form.pdf_url || null,
    });

  const handlePdfUpload = async (file: File) => {
    const url = await uploadPdf.mutateAsync(file);
    setForm((f) => ({ ...f, pdf_url: url }));
  };

  const handleCreateQuiz = () => {
    createQuiz.mutate({ lesson_id: lesson.id, title: quizTitle, pass_score: quizScore });
    setShowQuizForm(false);
    setQuizTitle("");
    setQuizScore(70);
  };

  const hasQuiz = lesson.quiz.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#181d26]">Chỉnh sửa bài học</h2>
        {/* is_free toggle */}
        <button
          onClick={() => setForm((f) => ({ ...f, is_free: !f.is_free }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            form.is_free
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#e0e2e6] bg-white text-[rgba(4,14,32,0.55)]"
          }`}
        >
          {form.is_free ? "Miễn phí" : "Trả phí"}
        </button>
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Tên bài học</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      {/* Content */}
      <div>
        <label className={labelCls}>Nội dung (mô tả bài học)</label>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Mô tả ngắn về bài học này..."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />
      </div>

      {/* Video URL */}
      <div>
        <label className={labelCls} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Video size={12} /> Video URL
        </label>
        <input
          className={inputCls}
          placeholder="https://..."
          value={form.video_url}
          onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
        />
      </div>

      {/* PDF */}
      <div>
        <label className={labelCls} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FileText size={12} /> Tài liệu PDF
        </label>
        {form.pdf_url ? (
          <div className="flex items-center gap-3 px-3 py-2.5 border border-[#e0e2e6] rounded-xl bg-[#f8fafc]">
            <FileText size={14} className="text-[#1b61c9] shrink-0" />
            <a
              href={form.pdf_url}
              target="_blank"
              className="text-sm text-[#1b61c9] hover:underline flex-1 truncate"
            >
              Xem file PDF
            </a>
            <button
              onClick={() => setForm((f) => ({ ...f, pdf_url: "" }))}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Xóa
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPdf.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#c0c8d5] rounded-xl text-sm text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors disabled:opacity-50"
            >
              {uploadPdf.isPending ? "Đang tải lên..." : "Tải lên PDF (tối đa 50MB)"}
            </button>
          </>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={updateLesson.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {updateLesson.isPending ? "Đang lưu..." : "Lưu bài học"}
      </button>

      {/* Quiz section */}
      <div className="border-t border-[#f0f2f5] pt-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={15} className="text-[#1b61c9]" />
          <span className="text-sm font-semibold text-[#181d26]">Bài kiểm tra</span>
        </div>

        {hasQuiz ? (
          <div className="px-4 py-3 bg-[#f8fafc] rounded-xl border border-[#e0e2e6]">
            {lesson.quiz.map((q) => (
              <div key={q.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#181d26]">{q.title}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">
                    Điểm đạt: {q.pass_score}%
                    {q.time_limit ? ` · ${q.time_limit} phút` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : showQuizForm ? (
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e0e2e6]">
            <input
              className={inputCls}
              placeholder="Tên bài kiểm tra"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-[rgba(4,14,32,0.55)]">Điểm đạt (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className={`${inputCls} w-24`}
                value={quizScore}
                onChange={(e) => setQuizScore(parseInt(e.target.value) || 70)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuizForm(false)}
                className="flex-1 py-2 text-sm border border-[#e0e2e6] rounded-xl text-[rgba(4,14,32,0.6)] hover:bg-white transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={!quizTitle || createQuiz.isPending}
                className="flex-1 py-2 text-sm bg-[#1b61c9] text-white rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
              >
                {createQuiz.isPending ? "Đang tạo..." : "Tạo quiz"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowQuizForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#c0c8d5] rounded-xl text-sm text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
          >
            <Plus size={14} />
            Thêm bài kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}

// ── OutlineItem (Lesson row in left panel) ───────────────────────────────────

function LessonItem({
  lesson, selected, onSelect, onDelete,
}: {
  lesson:   BuilderLesson;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 pl-8 pr-3 py-2 cursor-pointer rounded-lg mx-1 transition-colors ${
        selected ? "bg-[#1b61c9]/8 text-[#1b61c9]" : "text-[rgba(4,14,32,0.65)] hover:bg-[#f8fafc]"
      }`}
    >
      <BookOpen size={12} className="shrink-0" />
      <span className="text-xs flex-1 truncate">{lesson.title}</span>
      <div className="flex items-center gap-1 shrink-0">
        {lesson.video_url && <Video size={10} className="text-[rgba(4,14,32,0.35)]" />}
        {lesson.pdf_url   && <FileText size={10} className="text-[rgba(4,14,32,0.35)]" />}
        {lesson.quiz.length > 0 && <ClipboardList size={10} className="text-[rgba(4,14,32,0.35)]" />}
        {lesson.is_free && (
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            Free
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: course, isLoading } = useCourseBuilder(id);
  const togglePublish  = useTogglePublish(id, course);
  const createChapter  = useCreateChapter(id);
  const deleteChapter  = useDeleteChapter(id);
  const createLesson   = useCreateLesson(id);
  const deleteLesson   = useDeleteLesson(id);

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn:  async () => (await api.get("/admin/categories")).data,
  });
  const categories = categoriesData?.categories ?? [];

  const [selection, setSelection]           = useState<Selection>({ type: "info" });
  const [expanded, setExpanded]             = useState<Set<string>>(new Set());
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [addLessonChapterId, setAddLessonChapterId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Auto-expand all chapters on first load
  useEffect(() => {
    if (course?.sections) {
      setExpanded(new Set(course.sections.map((c) => c.id)));
    }
  }, [!!course]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    createChapter.mutate({
      title: newChapterTitle.trim(),
      order: (course?.sections.length ?? 0) + 1,
    });
    setNewChapterTitle("");
    setShowNewChapter(false);
  };

  const handleAddLesson = (chapterId: string) => {
    if (!newLessonTitle.trim()) return;
    const chapter = course?.sections.find((c) => c.id === chapterId);
    createLesson.mutate(
      {
        chapter_id: chapterId,
        title:      newLessonTitle.trim(),
        order:      (chapter?.lessons.length ?? 0) + 1,
      },
      {
        onSuccess: (lesson) => {
          setSelection({ type: "lesson", id: lesson.id });
          setAddLessonChapterId(null);
          setNewLessonTitle("");
        },
      }
    );
  };

  // Derive selected objects
  const selectedChapter =
    selection.type === "chapter"
      ? course?.sections.find((c) => c.id === selection.id)
      : undefined;

  const selectedLesson =
    selection.type === "lesson"
      ? course?.sections.flatMap((c) => c.lessons).find((l) => l.id === selection.id)
      : undefined;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[rgba(4,14,32,0.45)]">
        Đang tải...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        Không tìm thấy khóa học.
      </div>
    );
  }

  const isPublished = course.status === "PUBLISHED";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left panel: Outline ── */}
      <div className="w-72 shrink-0 bg-white border-r border-[#e0e2e6] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-4 py-4 border-b border-[#e0e2e6]">
          <Link
            href="/teacher/courses"
            className="flex items-center gap-1.5 text-xs text-[rgba(4,14,32,0.45)] hover:text-[#181d26] mb-3 transition-colors"
          >
            <ArrowLeft size={12} /> Danh sách khóa học
          </Link>
          <button
            onClick={() => setSelection({ type: "info" })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selection.type === "info"
                ? "bg-[#1b61c9]/8 text-[#1b61c9]"
                : "text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc]"
            }`}
          >
            <span className="line-clamp-1">{course.title}</span>
          </button>
        </div>

        {/* Chapters + Lessons */}
        <div className="flex-1 overflow-y-auto py-3">
          {course.sections.map((chapter) => (
            <div key={chapter.id} className="mb-1">
              {/* Chapter row */}
              <div
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg mx-1 transition-colors ${
                  selection.type === "chapter" && selection.id === chapter.id
                    ? "bg-[#1b61c9]/8 text-[#1b61c9]"
                    : "text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc]"
                }`}
              >
                <button
                  onClick={() => toggleExpand(chapter.id)}
                  className="shrink-0"
                >
                  {expanded.has(chapter.id) ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </button>
                <span
                  className="text-sm font-medium flex-1 truncate"
                  onClick={() => setSelection({ type: "chapter", id: chapter.id })}
                >
                  {chapter.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChapter.mutate(chapter.id);
                    if (selection.type === "chapter" && selection.id === chapter.id) {
                      setSelection({ type: "info" });
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Lessons */}
              {expanded.has(chapter.id) && (
                <div className="mt-0.5">
                  {chapter.lessons.map((lesson) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      selected={selection.type === "lesson" && selection.id === lesson.id}
                      onSelect={() => setSelection({ type: "lesson", id: lesson.id })}
                      onDelete={() => {
                        deleteLesson.mutate(lesson.id);
                        if (selection.type === "lesson" && selection.id === lesson.id) {
                          setSelection({ type: "chapter", id: chapter.id });
                        }
                      }}
                    />
                  ))}

                  {/* Add lesson */}
                  {addLessonChapterId === chapter.id ? (
                    <div className="pl-8 pr-3 py-2 mx-1 flex gap-2">
                      <input
                        autoFocus
                        className="flex-1 text-xs px-2 py-1.5 border border-[#1b61c9] rounded-lg outline-none"
                        placeholder="Tên bài học..."
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddLesson(chapter.id);
                          if (e.key === "Escape") {
                            setAddLessonChapterId(null);
                            setNewLessonTitle("");
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddLesson(chapter.id)}
                        className="text-xs text-[#1b61c9] font-medium"
                      >
                        Thêm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddLessonChapterId(chapter.id);
                        setNewLessonTitle("");
                      }}
                      className="flex items-center gap-1.5 pl-8 pr-3 py-2 mx-1 w-full text-left text-xs text-[rgba(4,14,32,0.4)] hover:text-[#1b61c9] transition-colors rounded-lg hover:bg-[#f8fafc]"
                    >
                      <Plus size={11} /> Thêm bài học
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add chapter */}
          <div className="px-2 mt-2">
            {showNewChapter ? (
              <div className="flex gap-2 px-1">
                <input
                  autoFocus
                  className="flex-1 text-xs px-3 py-2 border border-[#1b61c9] rounded-xl outline-none"
                  placeholder="Tên chương..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChapter();
                    if (e.key === "Escape") {
                      setShowNewChapter(false);
                      setNewChapterTitle("");
                    }
                  }}
                />
                <button
                  onClick={handleAddChapter}
                  className="text-xs text-[#1b61c9] font-medium whitespace-nowrap"
                >
                  Thêm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewChapter(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[rgba(4,14,32,0.5)] hover:text-[#1b61c9] hover:bg-[#f8fafc] rounded-xl transition-colors"
              >
                <Plus size={13} /> Thêm chương
              </button>
            )}
          </div>
        </div>

        {/* Publish toggle */}
        <div className="border-t border-[#e0e2e6] px-4 py-4">
          <button
            onClick={() => togglePublish.mutate()}
            disabled={togglePublish.isPending}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
              isPublished
                ? "border border-[#e0e2e6] text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc]"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isPublished ? <Lock size={14} /> : <Globe size={14} />}
            {isPublished ? "Đang công bố" : "Công bố khóa học"}
          </button>
        </div>
      </div>

      {/* ── Right panel: Editor ── */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        <div className="max-w-xl mx-auto px-8 py-8">
          {selection.type === "info" && (
            <CourseInfoPanel courseId={id} course={course} categories={categories} />
          )}
          {selection.type === "chapter" && selectedChapter && (
            <ChapterPanel courseId={id} chapter={selectedChapter} />
          )}
          {selection.type === "lesson" && selectedLesson && (
            <LessonPanel courseId={id} lesson={selectedLesson} />
          )}
          {selection.type === "lesson" && !selectedLesson && (
            <p className="text-sm text-[rgba(4,14,32,0.4)]">Chọn bài học để chỉnh sửa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
