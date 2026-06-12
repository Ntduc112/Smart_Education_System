import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import axios from "axios";

// ── Folder parsing ───────────────────────────────────────────────────────────
//
// Cấu trúc folder mong đợi (folder chọn = course đã tạo sẵn):
//   <root>/ 1. Chương A / 1. Bài 1 / video.mp4
//                                  / slide.pdf
//                                  / quiz.json
// - Tên chương & bài BẮT BUỘC có số thứ tự đầu: "1. ", "2-", "3_"...
// - order = số đầu, title = phần còn lại.
// - quiz.json (tùy chọn) định dạng quiz cho bài đó.

const ORDER_RE = /^(\d+)[.\-_)\s]+(.*)$/;
const VIDEO_EXT = ["mp4", "mov", "avi", "webm"] as const;
const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", webm: "video/webm",
};
const QUESTION_TYPES = ["MCQ", "TRUE_FALSE", "SHORT_ANSWER"] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

export interface ParsedQuestion {
  content:       string;
  type:          QuestionType;
  points:        number;
  sample_answer?: string;
  options?:      { content: string; is_correct: boolean }[];
}

export interface ParsedQuiz {
  title:      string;
  pass_score: number;
  questions:  ParsedQuestion[];
}

export interface ParsedLesson {
  rawName: string;
  order:   number | null;
  title:   string;
  video:   File | null;
  pdf:     File | null;
  quiz:    ParsedQuiz | null;   // từ quiz.json (đã parse)
  quizPdf: File | null;         // từ quiz.pdf (AI trích lúc import)
}

export interface ParsedChapter {
  rawName: string;
  order:   number | null;
  title:   string;
  lessons: ParsedLesson[];
}

export interface ParsedTree {
  chapters: ParsedChapter[];
  errors:   string[];   // chặn import
  warnings: string[];   // không chặn
}

function parseName(raw: string): { order: number | null; title: string } {
  const m = ORDER_RE.exec(raw.trim());
  if (!m) return { order: null, title: raw.trim() };
  return { order: parseInt(m[1], 10), title: m[2].trim() || raw.trim() };
}

function ext(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Validate nội dung quiz.json. Trả về quiz hợp lệ hoặc thông báo lỗi.
 * Lỗi → bỏ qua quiz, không chặn import bài.
 */
function validateQuiz(text: string, lessonTitle: string): { quiz?: ParsedQuiz; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: "quiz.json không phải JSON hợp lệ" };
  }
  const obj = raw as Record<string, unknown>;
  const rawQuestions = obj.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { error: "quiz.json thiếu mảng \"questions\"" };
  }

  const questions: ParsedQuestion[] = [];
  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i] as Record<string, unknown>;
    const idx = i + 1;
    if (typeof q.content !== "string" || !q.content.trim()) {
      return { error: `câu ${idx} thiếu "content"` };
    }
    if (typeof q.type !== "string" || !QUESTION_TYPES.includes(q.type as QuestionType)) {
      return { error: `câu ${idx} có "type" không hợp lệ (MCQ | TRUE_FALSE | SHORT_ANSWER)` };
    }
    const type = q.type as QuestionType;
    const points = typeof q.points === "number" ? q.points : type === "SHORT_ANSWER" ? 2 : 1;

    if (type === "SHORT_ANSWER") {
      questions.push({
        content: q.content.trim(),
        type,
        points,
        sample_answer: typeof q.sample_answer === "string" ? q.sample_answer : undefined,
      });
      continue;
    }

    // MCQ / TRUE_FALSE cần options
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return { error: `câu ${idx} cần ít nhất 2 đáp án (options)` };
    }
    const options = q.options.map((o) => {
      const opt = o as Record<string, unknown>;
      return { content: String(opt.content ?? "").trim(), is_correct: opt.is_correct === true };
    });
    if (options.some((o) => !o.content)) return { error: `câu ${idx} có đáp án trống` };
    if (!options.some((o) => o.is_correct)) return { error: `câu ${idx} chưa đánh dấu đáp án đúng` };

    questions.push({ content: q.content.trim(), type, points, options });
  }

  return {
    quiz: {
      title:      typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : `Kiểm tra: ${lessonTitle}`,
      pass_score: typeof obj.pass_score === "number" ? obj.pass_score : 70,
      questions,
    },
  };
}

/** Parse FileList từ <input webkitdirectory> thành cây chapter/lesson. */
export async function parseFolder(files: FileList | File[]): Promise<ParsedTree> {
  // chapterName -> lessonName -> slot
  type Slot = { video: File | null; pdf: File | null; quizFile: File | null; quizPdf: File | null };
  const map = new Map<string, Map<string, Slot>>();

  for (const file of Array.from(files)) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
    const parts = rel.split("/").filter(Boolean);
    if (parts.length !== 4) continue; // [root, chapter, lesson, filename]

    const [, chapterName, lessonName, fileName] = parts;
    if (!map.has(chapterName)) map.set(chapterName, new Map());
    const lessons = map.get(chapterName)!;
    if (!lessons.has(lessonName)) lessons.set(lessonName, { video: null, pdf: null, quizFile: null, quizPdf: null });
    const slot = lessons.get(lessonName)!;

    const lower = fileName.toLowerCase();
    const e = ext(fileName);
    if (lower === "quiz.json") slot.quizFile = file;
    else if (lower === "quiz.pdf") slot.quizPdf = file;
    else if (VIDEO_EXT.includes(e as (typeof VIDEO_EXT)[number])) slot.video = file;
    else if (e === "pdf") slot.pdf = file;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const chapters: ParsedChapter[] = [];
  for (const [chapterName, lessonMap] of map.entries()) {
    const { order, title } = parseName(chapterName);
    if (order === null) errors.push(`Chương "${chapterName}" thiếu số thứ tự đầu tên.`);

    const lessons: ParsedLesson[] = [];
    for (const [lessonName, slot] of lessonMap.entries()) {
      const p = parseName(lessonName);
      const label = `${chapterName} / ${lessonName}`;
      if (p.order === null) errors.push(`Bài "${label}" thiếu số thứ tự đầu tên.`);
      if (!slot.video && !slot.pdf) warnings.push(`Bài "${label}" không có video lẫn PDF.`);
      else if (!slot.video) warnings.push(`Bài "${label}" không có video.`);

      let quiz: ParsedQuiz | null = null;
      if (slot.quizFile) {
        const { quiz: q, error } = validateQuiz(await slot.quizFile.text(), p.title);
        if (error) warnings.push(`Quiz bài "${label}" bị bỏ qua: ${error}.`);
        else quiz = q ?? null;
      }
      // quiz.pdf chỉ dùng khi không có quiz.json; trích bằng AI lúc import.
      const quizPdf = !quiz && slot.quizPdf ? slot.quizPdf : null;

      lessons.push({ rawName: lessonName, order: p.order, title: p.title, video: slot.video, pdf: slot.pdf, quiz, quizPdf });
    }
    lessons.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.rawName.localeCompare(b.rawName));
    chapters.push({ rawName: chapterName, order, title, lessons });
  }
  chapters.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.rawName.localeCompare(b.rawName));

  if (chapters.length === 0) errors.push("Không tìm thấy chương/bài hợp lệ trong folder.");

  return { chapters, errors, warnings };
}

// ── Upload helpers ───────────────────────────────────────────────────────────

async function uploadVideo(file: File, onPct: (pct: number) => void): Promise<string> {
  const e = ext(file.name);
  const contentType = VIDEO_MIME[e] ?? file.type ?? "video/mp4";
  const { data } = await api.get<{ uploadUrl: string; videoKey: string }>(
    `/teacher/upload-video/presigned?contentType=${encodeURIComponent(contentType)}`
  );
  await axios.put(data.uploadUrl, file, {
    headers: { "Content-Type": contentType },
    onUploadProgress: (ev) => { if (ev.total) onPct(Math.round((ev.loaded / ev.total) * 100)); },
  });
  api.post("/teacher/upload-video/confirm", { videoKey: data.videoKey }).catch(() => {});
  return `r2:${data.videoKey}`;
}

async function uploadPdf(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<{ url: string }>(
    "/teacher/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.url;
}

/** Upload quiz.pdf → lấy text → nhờ Groq trích nguyên văn câu hỏi → ParsedQuiz. */
async function extractQuizFromPdf(file: File, lessonTitle: string): Promise<ParsedQuiz | null> {
  const fd = new FormData();
  fd.append("file", file);
  const { data: up } = await api.post<{ pdfText: string | null }>(
    "/teacher/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }
  );
  if (!up.pdfText) return null;

  const { data } = await api.post<{ questions: ParsedQuestion[] }>(
    "/teacher/ai/extract-quiz", { pdfText: up.pdfText }
  );
  const questions = (data.questions ?? []).filter((q) => q?.content && q?.type);
  if (!questions.length) return null;

  return {
    title:      `Kiểm tra: ${lessonTitle}`,
    pass_score: 70,
    questions:  questions.map((q) => ({
      ...q,
      points: q.points || (q.type === "SHORT_ANSWER" ? 2 : 1),
    })),
  };
}

async function createQuiz(lessonId: string, quiz: ParsedQuiz): Promise<void> {
  const { data } = await api.post<{ quiz: { id: string } }>("/teacher/quizzes", {
    lesson_id:  lessonId,
    title:      quiz.title,
    pass_score: quiz.pass_score,
  });
  const quizId = data.quiz.id;
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    await api.post(`/teacher/quizzes/${quizId}/questions`, {
      content:       q.content,
      type:          q.type,
      points:        q.points,
      order:         i + 1,
      sample_answer: q.sample_answer,
      options:       q.options?.map((o, idx) => ({ ...o, order: idx + 1 })),
    });
  }
}

// ── Orchestration hook ─────────────────────────────────────────────────────────

export type ItemStatus = "pending" | "uploading" | "done" | "error";

export interface ImportProgress {
  key:     string;
  chapter: string;
  lesson:  string;
  status:  ItemStatus;
  pct:     number;
  error?:  string;
}

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string; errors?: string } | undefined;
    return data?.error || data?.errors || `${e.response?.status ?? ""} ${e.message}`.trim();
  }
  return e instanceof Error ? e.message : "Lỗi không xác định";
}

export function useBulkImport(courseId: string, existingChapterCount: number) {
  const queryClient = useQueryClient();
  const [running, setRunning]   = useState(false);
  const [progress, setProgress] = useState<ImportProgress[]>([]);
  const [done, setDone]         = useState(false);

  const run = useCallback(async (tree: ParsedTree) => {
    setRunning(true);
    setDone(false);

    const init: ImportProgress[] = tree.chapters.flatMap((ch, ci) =>
      ch.lessons.map((l, li) => ({
        key: `${ci}-${li}`, chapter: ch.title, lesson: l.title,
        status: "pending" as ItemStatus, pct: 0,
      }))
    );
    setProgress(init);

    const patch = (key: string, p: Partial<ImportProgress>) =>
      setProgress((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));

    for (let ci = 0; ci < tree.chapters.length; ci++) {
      const ch = tree.chapters[ci];
      let chapterId: string;
      try {
        const { data } = await api.post<{ chapter: { id: string } }>("/teacher/chapters", {
          course_id: courseId,
          title:     ch.title,
          order:     existingChapterCount + ci + 1,
        });
        chapterId = data.chapter.id;
      } catch {
        ch.lessons.forEach((_, li) =>
          patch(`${ci}-${li}`, { status: "error", error: "Tạo chương thất bại" }));
        continue;
      }

      for (let li = 0; li < ch.lessons.length; li++) {
        const l   = ch.lessons[li];
        const key = `${ci}-${li}`;
        patch(key, { status: "uploading" });
        try {
          let video_url: string | undefined;
          let pdf_url:   string | undefined;
          try {
            if (l.video) video_url = await uploadVideo(l.video, (pct) => patch(key, { pct }));
          } catch (e) { throw new Error(`Video: ${errMsg(e)}`); }
          try {
            if (l.pdf) pdf_url = await uploadPdf(l.pdf);
          } catch (e) { throw new Error(`PDF: ${errMsg(e)}`); }

          let data: { lesson: { id: string } };
          try {
            ({ data } = await api.post<{ lesson: { id: string } }>("/teacher/lessons", {
              chapter_id: chapterId,
              title:      l.title,
              order:      li + 1,
              video_url,
              pdf_url,
            }));
          } catch (e) { throw new Error(`Tạo bài: ${errMsg(e)}`); }

          let quiz = l.quiz;
          if (!quiz && l.quizPdf) {
            try { quiz = await extractQuizFromPdf(l.quizPdf, l.title); } catch { quiz = null; }
          }
          if (quiz) {
            try {
              await createQuiz(data.lesson.id, quiz);
            } catch (e) {
              patch(key, { status: "error", error: `Quiz: ${errMsg(e)}` });
              continue;
            }
          }
          patch(key, { status: "done", pct: 100 });
        } catch (e) {
          patch(key, { status: "error", error: e instanceof Error ? e.message : errMsg(e) });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] });
    setRunning(false);
    setDone(true);
  }, [courseId, existingChapterCount, queryClient]);

  return { run, progress, running, done };
}
