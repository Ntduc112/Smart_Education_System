"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import api from "@/lib/axios";

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?[^#]*?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? null;
}

export function LessonVideoPlayer({
  lessonId,
  title,
  videoUrl,
}: {
  lessonId: string;
  title: string;
  videoUrl: string | null;
}) {
  const isR2 = !!videoUrl?.startsWith("r2:");
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const [loadState, setLoadState] = useState<{
    videoUrl: string | null;
    signedSrc: string | null;
    failed: boolean;
  }>({ videoUrl, signedSrc: null, failed: false });

  useEffect(() => {
    if (!isR2) return;

    let active = true;

    api.get<{ token: string; workerUrl: string; videoKey: string }>(
      `/lessons/${lessonId}/video-token`,
    ).then(({ data }) => {
      if (active) {
        setLoadState({
          videoUrl,
          signedSrc: `${data.workerUrl}/${data.videoKey}?token=${data.token}`,
          failed: false,
        });
      }
    }).catch(() => {
      if (active) setLoadState({ videoUrl, signedSrc: null, failed: true });
    });

    return () => { active = false; };
  }, [isR2, lessonId, videoUrl]);

  const currentLoad = loadState.videoUrl === videoUrl
    ? loadState
    : { videoUrl, signedSrc: null, failed: false };

  if (!videoUrl) {
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
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (currentLoad.failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center">
        <p className="text-sm text-red-600">Không tải được video. Vui lòng thử tải lại trang.</p>
      </div>
    );
  }

  const src = isR2 ? currentLoad.signedSrc : videoUrl;
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
      preload="metadata"
      className="aspect-video w-full rounded-2xl bg-black shadow-[0_12px_36px_rgba(27,60,120,0.18)]"
    />
  );
}
