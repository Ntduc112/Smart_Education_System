"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Play, Pencil, Trash2, ChevronDown } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import { ConfirmModal } from "@/app/_components/ConfirmModal";
import { useAllNotes, useUpdateNote, useDeleteNote, AllNote } from "../courses/[courseId]/learn/_components/notes.hook";

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  canvas: "#EFF5FE",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function NoteRow({ note }: { note: AllNote }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);
  const [confirming, setConfirming] = useState(false);
  const updateNote = useUpdateNote(note.lesson.id);
  const deleteNote = useDeleteNote(note.lesson.id);

  const handleSave = () => {
    if (!editText.trim()) return;
    updateNote.mutate(
      { id: note.id, content: editText.trim() },
      { onSuccess: () => setEditing(false) }
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className="border-b py-3 last:border-0"
      style={{ borderColor: "#EAF1FC" }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Play size={11} fill={C.inkFaint} stroke="none" className="shrink-0" />
          <span className="truncate text-xs" style={{ color: C.inkSoft }}>{note.lesson.title}</span>
        </div>
        <span className="shrink-0 text-xs" style={{ color: C.inkFaint }}>
          {note.updated_at !== note.created_at ? `Sửa ${timeAgo(note.updated_at)}` : timeAgo(note.created_at)}
        </span>
      </div>

      {note.video_time != null && (
        <Link
          href={`/student/courses/${note.lesson.chapter.course.id}/learn?lesson=${note.lesson.id}&t=${note.video_time}`}
          className="mb-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors hover:bg-[#1b61c9]/15"
          style={{ background: "rgba(27,97,201,0.08)", color: C.blue }}
        >
          <Play size={9} fill="currentColor" stroke="none" />
          {formatTime(note.video_time)}
        </Link>
      )}

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              autoFocus
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1b61c9]/30"
              style={{ borderColor: C.border, color: C.ink }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!editText.trim() || updateNote.isPending}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#254fad] disabled:opacity-50"
                style={{ background: C.blue }}
              >
                {updateNote.isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(note.content); }}
                className="rounded-lg px-3 py-1.5 text-xs transition-colors"
                style={{ color: C.inkSoft }}
              >
                Hủy
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2"
          >
            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: C.ink }}>{note.content}</p>
            <div className="mt-0.5 flex shrink-0 items-center gap-1">
              <button
                onClick={() => { setEditing(true); setEditText(note.content); }}
                className="rounded-lg p-1.5 transition-colors hover:bg-[#1b61c9]/8 hover:text-[#1b61c9]"
                style={{ color: C.inkFaint }}
                title="Sửa"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500"
                style={{ color: C.inkFaint }}
                title="Xóa"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirming}
        title="Xóa ghi chú?"
        message="Hành động này không thể hoàn tác."
        onConfirm={() => deleteNote.mutate(note.id, { onSuccess: () => setConfirming(false) })}
        onCancel={() => setConfirming(false)}
        isLoading={deleteNote.isPending}
      />
    </motion.div>
  );
}

function CourseGroup({ courseId, courseTitle, thumbnail, notes, index }: {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  notes: AllNote[];
  index: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 0.61, 0.36, 1] as const }}
      whileHover={{ boxShadow: "rgba(27,60,120,0.12) 0px 12px 32px", transition: { duration: 0.2 } }}
      className="overflow-hidden rounded-3xl bg-white"
      style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#EAF1FC]"
      >
        <img src={thumbnail} alt={courseTitle} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold" style={{ color: C.ink }}>{courseTitle}</p>
          <p className="mt-0.5 text-xs" style={{ color: C.inkFaint }}>{notes.length} ghi chú</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/student/courses/${courseId}/learn`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#1b61c9]/8"
            style={{ color: C.blue }}
          >
            Học tiếp
          </Link>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ color: C.inkFaint }}>
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-2">
              {notes.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NotesPage() {
  const { data: notes, isLoading } = useAllNotes();

  const grouped = notes?.reduce<Record<string, { courseTitle: string; thumbnail: string; notes: AllNote[] }>>(
    (acc, note) => {
      const course = note.lesson.chapter.course;
      if (!acc[course.id]) acc[course.id] = { courseTitle: course.title, thumbnail: course.thumbnail, notes: [] };
      acc[course.id].notes.push(note);
      return acc;
    },
    {}
  ) ?? {};

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8"
        >
          <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
            <StickyNote size={13} /> Sổ tay học tập
          </div>
          <h1 className="font-display text-[32px] font-light leading-tight">
            Ghi chú <span className="font-semibold" style={{ color: C.blue }}>của tôi</span>
            {notes && notes.length > 0 && (
              <span className="ml-2 text-lg font-normal" style={{ color: C.inkFaint }}>({notes.length})</span>
            )}
          </h1>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl bg-white p-5" style={{ border: `1px solid ${C.border}` }}>
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-10 w-14 rounded-lg" style={{ background: "#E2ECF9" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded" style={{ background: "#E2ECF9" }} />
                    <div className="h-3 w-20 rounded" style={{ background: "#E2ECF9" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded" style={{ background: "#E2ECF9" }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([courseId, { courseTitle, thumbnail, notes: courseNotes }], i) => (
              <CourseGroup
                key={courseId}
                courseId={courseId}
                courseTitle={courseTitle}
                thumbnail={thumbnail}
                notes={courseNotes}
                index={i}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-20"
            style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] as const }}
              className="grid h-16 w-16 place-items-center rounded-2xl"
              style={{ background: "rgba(27,97,201,0.08)" }}
            >
              <StickyNote size={28} style={{ color: C.blue }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Chưa có ghi chú nào</p>
              <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Bắt đầu ghi chú khi học bài để ôn tập sau!</p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/student/home" className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}>
                Vào học ngay
              </Link>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
