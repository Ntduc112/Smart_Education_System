"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { UserMenu } from "@/app/_components/UserMenu";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useAllNotes, useUpdateNote, useDeleteNote, AllNote } from "../courses/[courseId]/learn/_components/notes.hook";

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
    <div className="py-3 border-b border-[#f0f2f5] last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(4,14,32,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-xs text-[rgba(4,14,32,0.55)] truncate">{note.lesson.title}</span>
        </div>
        <span className="text-xs text-[rgba(4,14,32,0.35)] shrink-0">
          {note.updated_at !== note.created_at ? `Sửa ${timeAgo(note.updated_at)}` : timeAgo(note.created_at)}
        </span>
      </div>

      {editing ? (
        <div className="space-y-2 mt-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!editText.trim() || updateNote.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50"
            >
              {updateNote.isPending ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(note.content); }}
              className="px-3 py-1.5 rounded-lg text-xs text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <p className="text-sm text-[#181d26] leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <button
              onClick={() => { setEditing(true); setEditText(note.content); }}
              className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[#1b61c9] hover:bg-[#1b61c9]/8 transition-colors"
              title="Sửa"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {confirming ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteNote.mutate(note.id, { onSuccess: () => setConfirming(false) })}
                  disabled={deleteNote.isPending}
                  className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-2 py-1 rounded text-xs text-[rgba(4,14,32,0.55)] hover:text-[#181d26]"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Xóa"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseGroup({ courseId, courseTitle, thumbnail, notes }: {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  notes: AllNote[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-[#e0e2e6] overflow-hidden"
      style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#f8fafc] transition-colors text-left"
      >
        <img src={thumbnail} alt={courseTitle} className="w-14 h-10 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#181d26] truncate">{courseTitle}</p>
          <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">{notes.length} ghi chú</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/student/courses/${courseId}/learn`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#1b61c9] font-medium hover:text-[#254fad] px-2.5 py-1 rounded-lg hover:bg-[#1b61c9]/8 transition-colors"
          >
            Học tiếp
          </Link>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[rgba(4,14,32,0.35)] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-2">
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const { data: user } = useMe();
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
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e0e2e6] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-semibold text-[#181d26] tracking-[0.08px]">SmartEdu</span>
            </Link>
            <div className="w-px h-5 bg-[#e0e2e6] hidden sm:block" />
            <Link href="/student/dashboard" className="text-sm text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors hidden sm:block">
              Dashboard
            </Link>
          </div>
          <UserMenu user={user ?? null} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h1 className="text-2xl font-semibold text-[#181d26]">
            Ghi chú của tôi
            {notes && notes.length > 0 && (
              <span className="ml-2 text-base font-normal text-[rgba(4,14,32,0.45)]">({notes.length})</span>
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e0e2e6] p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-10 bg-gray-100 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([courseId, { courseTitle, thumbnail, notes: courseNotes }]) => (
              <CourseGroup
                key={courseId}
                courseId={courseId}
                courseTitle={courseTitle}
                thumbnail={thumbnail}
                notes={courseNotes}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 gap-4 bg-white rounded-2xl border border-[#e0e2e6]">
            <div className="w-16 h-16 rounded-2xl bg-[#1b61c9]/8 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#181d26] font-medium mb-1">Chưa có ghi chú nào</p>
              <p className="text-sm text-[rgba(4,14,32,0.55)]">Bắt đầu ghi chú khi học bài để ôn tập sau!</p>
            </div>
            <Link
              href="/student/dashboard"
              className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors"
              style={{ boxShadow: "rgba(45,127,249,0.28) 0px 1px 4px" }}
            >
              Vào học ngay
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
