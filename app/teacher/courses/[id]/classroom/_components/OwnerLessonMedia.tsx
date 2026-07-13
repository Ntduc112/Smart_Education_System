"use client";

import { useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { LessonVideoPlayer } from "../../_components/LessonVideoPlayer";
import type { ClassroomLesson } from "../classroom.hook";

function PdfDocument({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#DCE6F4] bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
            <FileText size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#181d26]">Tài liệu bài học</span>
            <span className="block text-xs text-[rgba(4,14,32,0.46)]">{open ? "Thu gọn tài liệu" : "Mở tài liệu ngay trên trang"}</span>
          </span>
          <ChevronDown size={16} className={`ml-auto shrink-0 text-[rgba(4,14,32,0.4)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#1b61c9] hover:bg-[#1b61c9]/8"
        >
          <Download size={14} />
          Tải xuống
        </a>
      </div>
      {open ? (
        <iframe
          src={url}
          title="Tài liệu PDF"
          className="h-[70vh] min-h-[520px] w-full border-t border-[#DCE6F4] bg-[#F4F8FE]"
        />
      ) : null}
    </div>
  );
}

export function OwnerLessonMedia({ lesson }: { lesson: ClassroomLesson }) {
  return (
    <>
      <LessonVideoPlayer lessonId={lesson.id} title={lesson.title} videoUrl={lesson.video_url} />
      {lesson.pdf_url ? <PdfDocument url={lesson.pdf_url} /> : null}
    </>
  );
}
