"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotes, useAddNote, useUpdateNote, useDeleteNote, LessonNote } from "./notes.hook";

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

function NoteItem({
  note,
  lessonId,
  seekTo,
}: {
  note: LessonNote;
  lessonId: string;
  seekTo?: (s: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);
  const [confirming, setConfirming] = useState(false);
  const updateNote = useUpdateNote(lessonId);
  const deleteNote = useDeleteNote(lessonId);

  const handleSave = () => {
    if (!editText.trim()) return;
    updateNote.mutate({ id: note.id, content: editText.trim() }, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="px-3 py-3 border-b border-[#f0f2f5] last:border-0 group">
      {note.video_time != null && (
        <button
          onClick={() => seekTo?.(note.video_time!)}
          disabled={!seekTo}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1b61c9]/8 text-[#1b61c9] text-[11px] font-medium mb-1.5 hover:bg-[#1b61c9]/15 transition-colors disabled:cursor-default"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {formatTime(note.video_time)}
        </button>
      )}

      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
              if (e.key === "Escape") { setEditing(false); setEditText(note.content); }
            }}
            className="w-full px-2.5 py-2 rounded-lg border border-[#e0e2e6] text-xs text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none"
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={!editText.trim() || updateNote.isPending}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50"
            >
              {updateNote.isPending ? "..." : "Lưu"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(note.content); }}
              className="px-2.5 py-1 rounded-lg text-xs text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#181d26] leading-relaxed whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[rgba(4,14,32,0.35)]">
              {note.updated_at !== note.created_at ? `Sửa ${timeAgo(note.updated_at)}` : timeAgo(note.created_at)}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditing(true); setEditText(note.content); }}
                className="p-1 rounded text-[rgba(4,14,32,0.35)] hover:text-[#1b61c9] hover:bg-[#1b61c9]/8 transition-colors"
                title="Sửa"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              {confirming ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteNote.mutate(note.id, { onSuccess: () => setConfirming(false) })}
                    disabled={deleteNote.isPending}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-[rgba(4,14,32,0.55)]"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="p-1 rounded text-[rgba(4,14,32,0.35)] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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

export function NotesSection({
  lessonId,
  getVideoTime,
  seekTo,
}: {
  lessonId: string;
  getVideoTime?: () => number | null;
  seekTo?: (seconds: number) => void;
}) {
  const { data: notes, isLoading } = useNotes(lessonId);
  const addNote = useAddNote(lessonId);
  const [open, setOpen] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [newText, setNewText] = useState("");
  const [capturedTime, setCapturedTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sortedNotes = [...(notes ?? [])].sort((a, b) => {
    if (a.video_time != null && b.video_time != null) return a.video_time - b.video_time;
    if (a.video_time != null) return -1;
    if (b.video_time != null) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleStartAdd = () => {
    const time = getVideoTime?.() ?? null;
    setCapturedTime(time);
    setNewText("");
    setAddingNote(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSaveNew = () => {
    if (!newText.trim() || addNote.isPending) return;
    addNote.mutate(
      { content: newText.trim(), video_time: capturedTime },
      {
        onSuccess: () => {
          setAddingNote(false);
          setNewText("");
          setCapturedTime(null);
        },
      }
    );
  };

  const handleCancelAdd = () => {
    setAddingNote(false);
    setNewText("");
    setCapturedTime(null);
  };

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white overflow-hidden flex flex-col h-full">
      {/* Header — dropdown toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left shrink-0"
      >
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="text-sm font-semibold text-[#181d26]">Ghi chú</span>
          {notes && notes.length > 0 && (
            <span className="text-[11px] bg-[#1b61c9]/10 text-[#1b61c9] rounded-full px-2 py-0.5 font-semibold">
              {notes.length}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[rgba(4,14,32,0.35)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0 border-t border-[#e0e2e6]"
          >
            <div className="flex-1 flex flex-col min-h-0">
              {/* Add note button / inline form */}
              <AnimatePresence mode="wait">
                {addingNote ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 border-b border-[#e0e2e6] bg-[#f8fafc]"
                  >
                    {capturedTime != null && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1b61c9]/8 text-[#1b61c9] text-[11px] font-medium mb-2">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {formatTime(capturedTime)}
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveNew();
                        if (e.key === "Escape") handleCancelAdd();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#e0e2e6] text-xs text-[#181d26] placeholder:text-[rgba(4,14,32,0.35)] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/30 resize-none bg-white"
                    />
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={handleSaveNew}
                        disabled={!newText.trim() || addNote.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50"
                        style={{ boxShadow: "rgba(45,127,249,0.28) 0px 1px 4px" }}
                      >
                        {addNote.isPending ? (
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                          </svg>
                        ) : null}
                        Lưu
                      </button>
                      <button
                        onClick={handleCancelAdd}
                        className="px-3 py-1.5 rounded-lg text-xs text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
                      >
                        Hủy
                      </button>
                      <span className="text-[10px] text-[rgba(4,14,32,0.3)] ml-auto hidden sm:inline">Ctrl+Enter</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-2.5 border-b border-[#f0f2f5]"
                  >
                    <button
                      onClick={handleStartAdd}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#1b61c9] border border-dashed border-[#1b61c9]/30 hover:border-[#1b61c9]/60 hover:bg-[#1b61c9]/5 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Thêm ghi chú
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes list */}
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-4 h-4 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sortedNotes.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {sortedNotes.map((note) => (
                    <NoteItem key={note.id} note={note} lessonId={lessonId} seekTo={seekTo} />
                  ))}
                </div>
              ) : !addingNote ? (
                <p className="text-xs text-[rgba(4,14,32,0.35)] text-center py-6 px-3">
                  Chưa có ghi chú nào.<br />
                  <span className="text-[#1b61c9]">Thêm ghi chú</span> để ôn tập sau!
                </p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
