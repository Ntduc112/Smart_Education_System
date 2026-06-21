"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronRight, Plus, Trash2, BookOpen,
  Video, FileText, ClipboardList, FolderUp, GripVertical,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BuilderChapter, BuilderLesson,
  useCreateChapter, useDeleteChapter, useCreateLesson, useDeleteLesson, useReorder,
} from "../edit.hook";

export type Selection =
  | { type: "info" }
  | { type: "chapter"; id: string }
  | { type: "lesson"; id: string };

// ── Sortable lesson row ───────────────────────────────────────────────────────

function SortableLesson({
  lesson, chapterId, selected, isDropTarget, onSelect, onDelete,
}: {
  lesson:    BuilderLesson;
  chapterId: string;
  selected:  boolean;
  isDropTarget: boolean;
  onSelect:  () => void;
  onDelete:  () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id, data: { type: "lesson", chapterId } });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      onClick={onSelect}
      className={`group flex items-center gap-1.5 pl-5 pr-3 py-2 cursor-grab active:cursor-grabbing rounded-lg mx-1 transition-colors touch-none ${
        isDragging ? "outline-2 outline-dashed outline-[#1b61c9] bg-[#1b61c9]/5 text-[#1b61c9]" :
        isDropTarget ? "bg-[#1b61c9]/8 text-[#1b61c9] ring-1 ring-[#1b61c9]/30" :
        selected ? "bg-[#1b61c9]/8 text-[#1b61c9]" : "text-[rgba(4,14,32,0.65)] hover:bg-[#f8fafc]"
      }`}
    >
      <GripVertical size={12} className="shrink-0 text-[rgba(4,14,32,0.25)] opacity-0 group-hover:opacity-100 transition-opacity" />
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

// ── Sortable chapter (with nested lessons) ────────────────────────────────────

function SortableChapter({
  chapter, expanded, onToggle, selection, setSelection,
  isDropTarget, overLessonId,
  onDeleteChapter, onDeleteLesson,
  addLessonChapterId, setAddLessonChapterId,
  newLessonTitle, setNewLessonTitle, onAddLesson,
}: {
  chapter:    BuilderChapter;
  expanded:   boolean;
  onToggle:   () => void;
  selection:  Selection;
  setSelection: (s: Selection) => void;
  isDropTarget: boolean;
  overLessonId: string | null;
  onDeleteChapter: (id: string, title: string) => void;
  onDeleteLesson:  (chapterId: string, lessonId: string, title: string) => void;
  addLessonChapterId: string | null;
  setAddLessonChapterId: (id: string | null) => void;
  newLessonTitle: string;
  setNewLessonTitle: (s: string) => void;
  onAddLesson: (chapterId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id, data: { type: "chapter", chapterId: chapter.id } });

  const isSel = selection.type === "chapter" && selection.id === chapter.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className={`mb-1 rounded-xl transition-colors ${
        isDragging ? "outline-2 outline-dashed outline-[#1b61c9] bg-[#1b61c9]/5" :
        isDropTarget ? "ring-2 ring-[#1b61c9]/50 bg-[#1b61c9]/[0.04]" : ""
      }`}
    >
      {/* Chapter row */}
      <div
        {...attributes}
        {...listeners}
        className={`group flex items-center gap-1.5 px-2 py-2 cursor-grab active:cursor-grabbing rounded-lg mx-1 transition-colors touch-none ${
          isSel ? "bg-[#1b61c9]/8 text-[#1b61c9]" : "text-[rgba(4,14,32,0.7)] hover:bg-[#f8fafc]"
        }`}
      >
        <GripVertical size={13} className="shrink-0 text-[rgba(4,14,32,0.25)] opacity-0 group-hover:opacity-100 transition-opacity" />
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="shrink-0">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span
          className="text-sm font-medium flex-1 truncate"
          onClick={() => setSelection({ type: "chapter", id: chapter.id })}
        >
          {chapter.title}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteChapter(chapter.id, chapter.title); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="mt-0.5">
          <SortableContext
            items={chapter.lessons.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapter.lessons.map((lesson) => (
              <SortableLesson
                key={lesson.id}
                lesson={lesson}
                chapterId={chapter.id}
                selected={selection.type === "lesson" && selection.id === lesson.id}
                isDropTarget={overLessonId === lesson.id}
                onSelect={() => setSelection({ type: "lesson", id: lesson.id })}
                onDelete={() => onDeleteLesson(chapter.id, lesson.id, lesson.title)}
              />
            ))}
          </SortableContext>

          {/* Vùng thả khi kéo vào chương rỗng / cuối danh sách */}
          {isDropTarget && chapter.lessons.length === 0 && (
            <div className="mx-1 my-1 py-3 text-center text-[11px] text-[#1b61c9] border-2 border-dashed border-[#1b61c9]/50 rounded-lg">
              Thả vào chương này
            </div>
          )}

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
                  if (e.key === "Enter") onAddLesson(chapter.id);
                  if (e.key === "Escape") { setAddLessonChapterId(null); setNewLessonTitle(""); }
                }}
              />
              <button onClick={() => onAddLesson(chapter.id)} className="text-xs text-[#1b61c9] font-medium">
                Thêm
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAddLessonChapterId(chapter.id); setNewLessonTitle(""); }}
              className="flex items-center gap-1.5 pl-8 pr-3 py-2 mx-1 w-full text-left text-xs text-[rgba(4,14,32,0.4)] hover:text-[#1b61c9] transition-colors rounded-lg hover:bg-[#f8fafc]"
            >
              <Plus size={11} /> Thêm bài học
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chapter tree (drag-drop container) ────────────────────────────────────────

export function ChapterTree({
  courseId, sections, selection, setSelection, onOpenImport,
}: {
  courseId:     string;
  sections:     BuilderChapter[];
  selection:    Selection;
  setSelection: (s: Selection) => void;
  onOpenImport: () => void;
}) {
  const createChapter = useCreateChapter(courseId);
  const deleteChapter = useDeleteChapter(courseId);
  const createLesson  = useCreateLesson(courseId);
  const deleteLesson  = useDeleteLesson(courseId);
  const reorder       = useReorder(courseId);

  // Bản sao cục bộ để mở khoảng trống (gap) live khi kéo, kể cả kéo qua chương khác.
  // Đồng bộ lại từ server mỗi khi không kéo.
  const [localSections, setLocalSections] = useState(sections);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(sections.map((c) => c.id)));
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addLessonChapterId, setAddLessonChapterId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overChapterId, setOverChapterId] = useState<string | null>(null);
  const [overLessonId, setOverLessonId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "chapter" | "lesson"; chapterId: string; lessonId?: string; title: string } | null
  >(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Khi không kéo, lấy lại thứ tự chuẩn từ server.
  useEffect(() => {
    if (!activeId) setLocalSections(sections);
  }, [sections, activeId]);

  const clearOver = () => { setActiveId(null); setOverChapterId(null); setOverLessonId(null); };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "lesson") {
      setOverChapterId(null);
      setOverLessonId(null);
      return;
    }
    const o = over.data.current;
    let targetChapterId: string;
    let overLid: string | null = null;
    if (o?.type === "lesson") {
      targetChapterId = o.chapterId;
      overLid = String(over.id);
    } else if (o?.type === "chapter") {
      targetChapterId = o.chapterId;
    } else {
      return;
    }
    setOverChapterId(targetChapterId);
    setOverLessonId(overLid);

    // Kéo qua chương khác: di chuyển bài vào chương đích ngay trong state
    // để chương đích mở khoảng trống. Cùng chương thì dnd-kit tự đẩy.
    setLocalSections((prev) => {
      const fromCh = prev.find((c) => c.lessons.some((l) => l.id === active.id));
      if (!fromCh || fromCh.id === targetChapterId) return prev;
      const moving = fromCh.lessons.find((l) => l.id === active.id);
      if (!moving) return prev;
      return prev.map((c) => {
        if (c.id === fromCh.id) return { ...c, lessons: c.lessons.filter((l) => l.id !== active.id) };
        if (c.id === targetChapterId) {
          const idx = overLid ? c.lessons.findIndex((l) => l.id === overLid) : c.lessons.length;
          const arr = [...c.lessons];
          arr.splice(idx < 0 ? c.lessons.length : idx, 0, moving);
          return { ...c, lessons: arr };
        }
        return c;
      });
    });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    createChapter.mutate({ title: newChapterTitle.trim(), order: sections.length + 1 });
    setNewChapterTitle("");
    setShowNewChapter(false);
  };

  const handleAddLesson = (chapterId: string) => {
    if (!newLessonTitle.trim()) return;
    const chapter = sections.find((c) => c.id === chapterId);
    createLesson.mutate(
      { chapter_id: chapterId, title: newLessonTitle.trim(), order: (chapter?.lessons.length ?? 0) + 1 },
      {
        onSuccess: (lesson) => {
          setSelection({ type: "lesson", id: lesson.id });
          setAddLessonChapterId(null);
          setNewLessonTitle("");
        },
      }
    );
  };

  const requestDeleteChapter = (id: string, title: string) =>
    setConfirmDelete({ kind: "chapter", chapterId: id, title });

  const requestDeleteLesson = (chapterId: string, lessonId: string, title: string) =>
    setConfirmDelete({ kind: "lesson", chapterId, lessonId, title });

  const performDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "chapter") {
      deleteChapter.mutate(confirmDelete.chapterId);
      if (selection.type === "chapter" && selection.id === confirmDelete.chapterId) setSelection({ type: "info" });
    } else if (confirmDelete.lessonId) {
      deleteLesson.mutate(confirmDelete.lessonId);
      if (selection.type === "lesson" && selection.id === confirmDelete.lessonId)
        setSelection({ type: "chapter", id: confirmDelete.chapterId });
    }
    setConfirmDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    clearOver();
    if (!over) { setLocalSections(sections); return; }

    const aType = active.data.current?.type;
    const oData = over.data.current;

    // Kéo chương: arrayMove trên localSections theo vị trí over.
    if (aType === "chapter") {
      const overChapterId = oData?.type === "chapter" ? String(over.id) : oData?.chapterId;
      const oldIdx = localSections.findIndex((c) => c.id === active.id);
      const newIdx = localSections.findIndex((c) => c.id === overChapterId);
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) { setLocalSections(sections); return; }
      const next = arrayMove(localSections, oldIdx, newIdx);
      setLocalSections(next);
      reorder.apply(next);
      return;
    }

    // Kéo bài: localSections đã được onDragOver đưa sang chương đích.
    // Chỉ cần chốt vị trí trong chương hiện tại của bài theo over.
    if (aType === "lesson") {
      const activeCh = localSections.find((c) => c.lessons.some((l) => l.id === active.id));
      if (!activeCh) { setLocalSections(sections); return; }
      const oldIdx = activeCh.lessons.findIndex((l) => l.id === active.id);
      let newIdx: number;
      if (oData?.type === "lesson") {
        newIdx = activeCh.lessons.findIndex((l) => l.id === over.id);
        if (newIdx < 0) newIdx = activeCh.lessons.length - 1;
      } else {
        newIdx = activeCh.lessons.length - 1;
      }
      const newLessons = arrayMove(activeCh.lessons, oldIdx, newIdx);
      const next = localSections.map((c) => (c.id === activeCh.id ? { ...c, lessons: newLessons } : c));
      setLocalSections(next);
      reorder.apply(next);
    }
  };

  const activeLesson = localSections.flatMap((c) => c.lessons).find((l) => l.id === activeId);
  const activeChapter = localSections.find((c) => c.id === activeId);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden py-3">
      {/* Import từ folder */}
      <div className="px-2 mb-2 pb-2 border-b border-[#f0f2f5]">
        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[rgba(4,14,32,0.5)] hover:text-[#1b61c9] hover:bg-[#f8fafc] rounded-xl transition-colors"
        >
          <FolderUp size={13} /> Import từ folder
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={clearOver}
      >
        <SortableContext items={localSections.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {localSections.map((chapter) => (
            <SortableChapter
              key={chapter.id}
              chapter={chapter}
              expanded={expanded.has(chapter.id)}
              onToggle={() => toggleExpand(chapter.id)}
              selection={selection}
              setSelection={setSelection}
              isDropTarget={overChapterId === chapter.id}
              overLessonId={overLessonId}
              onDeleteChapter={requestDeleteChapter}
              onDeleteLesson={requestDeleteLesson}
              addLessonChapterId={addLessonChapterId}
              setAddLessonChapterId={setAddLessonChapterId}
              newLessonTitle={newLessonTitle}
              setNewLessonTitle={setNewLessonTitle}
              onAddLesson={handleAddLesson}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeLesson ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#1b61c9] text-xs text-[#181d26] shadow-lg">
              <BookOpen size={12} /> <span className="truncate max-w-[180px]">{activeLesson.title}</span>
            </div>
          ) : activeChapter ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#1b61c9] text-sm font-medium text-[#181d26] shadow-lg">
              <span className="truncate max-w-[200px]">{activeChapter.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
                if (e.key === "Escape") { setShowNewChapter(false); setNewChapterTitle(""); }
              }}
            />
            <button onClick={handleAddChapter} className="text-xs text-[#1b61c9] font-medium whitespace-nowrap">
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

      {/* Modal xác nhận xóa */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-96"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#181d26] mb-2">
              {confirmDelete.kind === "chapter" ? "Xóa chương?" : "Xóa bài học?"}
            </h3>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">
              {confirmDelete.kind === "chapter"
                ? <>Toàn bộ bài học trong chương <span className="font-medium text-[#181d26]">“{confirmDelete.title}”</span> sẽ bị xóa. Hành động này không thể hoàn tác.</>
                : <>Bài học <span className="font-medium text-[#181d26]">“{confirmDelete.title}”</span> sẽ bị xóa. Hành động này không thể hoàn tác.</>}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={performDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
