"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Download, FileText, PlayCircle } from "lucide-react";
import api from "@/lib/axios";
import type { ClassroomLesson } from "../classroom.hook";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? null;
}

function Video({ lesson }: { lesson: ClassroomLesson }) {
  const isR2 = !!lesson.video_url?.startsWith("r2:");
  const youtubeId = lesson.video_url ? extractYouTubeId(lesson.video_url) : null;
  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isR2) return;
    let active = true;

    api.get<{ token: string; workerUrl: string; videoKey: string }>(
      `/student/lessons/${lesson.id}/video-token`,
    ).then(({ data }) => {
      if (active) setSignedSrc(`${data.workerUrl}/${data.videoKey}?token=${data.token}`);
    }).catch(() => {
      if (active) setFailed(true);
    });

    return () => { active = false; };
  }, [isR2, lesson.id]);

  if (!lesson.video_url) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#DCE6F4] bg-[#F4F8FE] text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1b61c9]/10 text-[#1b61c9]">
          <PlayCircle size={24} strokeWidth={1.7} />
        </div>
        <p className="text-sm text-[rgba(4,14,32,0.52)]">Bài học này chưa có video</p>
      </div>
    );
  }

  if (youtubeId) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_12px_36px_rgba(27,60,120,0.18)]">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center">
        <p className="text-sm text-red-600">Không tải được video. Vui lòng thử tải lại trang.</p>
      </div>
    );
  }

  const src = isR2 ? signedSrc : lesson.video_url;
  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#101827]">
        <span className="text-sm text-white/55">Đang tải video...</span>
      </div>
    );
  }

  return (
    <video
      key={src}
      src={src}
      controls
      className="aspect-video w-full rounded-2xl bg-black shadow-[0_12px_36px_rgba(27,60,120,0.18)]"
    />
  );
}

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
      <Video lesson={lesson} />
      {lesson.pdf_url ? <PdfDocument url={lesson.pdf_url} /> : null}
    </>
  );
}
