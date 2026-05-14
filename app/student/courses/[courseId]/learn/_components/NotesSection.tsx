"use client";

import { useState } from "react";
import { useNotes, useAddNote, useUpdateNote, useDeleteNote, LessonNote } from "./notes.hook";

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

function NoteCard({
  note,
  lessonId,
}: {
  note: LessonNote;
  lessonId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);
  const [confirming, setConfirming] = useState(false);
  const updateNote = useUpdateNote(lessonId);
  const deleteNote = useDeleteNote(lessonId);

  const handleSave = () => {
    if (!editText.trim()) return;
    updateNote.mutate(
      { id: note.id, content: editText.trim() },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteNote.mutate(note.id, { onSuccess: () => setConfirming(false) });
  };

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white p-4">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!editText.trim() || updateNote.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50"
            >
              {updateNote.isPending ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(note.content); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#181d26] leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[rgba(4,14,32,0.35)]">
              {note.updated_at !== note.created_at ? `Sửa ${timeAgo(note.updated_at)}` : timeAgo(note.created_at)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditing(true); setEditText(note.content); }}
                className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[#1b61c9] hover:bg-[#1b61c9]/8 transition-colors"
                title="Sửa ghi chú"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              {confirming ? (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs text-[rgba(4,14,32,0.55)]">Xóa?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteNote.isPending}
                    className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-2 py-1 rounded text-xs text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Xóa ghi chú"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function NotesSection({ lessonId }: { lessonId: string }) {
  const { data: notes, isLoading } = useNotes(lessonId);
  const addNote = useAddNote(lessonId);
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    addNote.mutate(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#e0e2e6]">
      <div className="flex items-center gap-2 mb-4">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h2 className="text-base font-semibold text-[#181d26]">
          Ghi chú của tôi
          {notes && notes.length > 0 && (
            <span className="ml-1 text-[rgba(4,14,32,0.45)] font-normal">({notes.length})</span>
          )}
        </h2>
      </div>

      {/* Add note form */}
      <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm ghi chú cho bài học này..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[#e0e2e6] text-sm text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!text.trim() || addNote.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "rgba(45,127,249,0.28) 0px 1px 4px" }}
          >
            {addNote.isPending ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            Thêm ghi chú
          </button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} lessonId={lessonId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[rgba(4,14,32,0.35)] text-center py-4">
          Chưa có ghi chú nào cho bài học này.
        </p>
      )}
    </div>
  );
}
