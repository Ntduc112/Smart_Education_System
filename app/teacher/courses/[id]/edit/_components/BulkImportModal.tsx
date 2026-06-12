"use client";

import { useRef, useState } from "react";
import {
  X, FolderUp, Video, FileText, ClipboardList, AlertTriangle, CheckCircle2, Loader2, ChevronRight, Download,
} from "lucide-react";
import {
  parseFolder, useBulkImport, ParsedTree, ImportProgress,
} from "../bulk-import.hook";

interface BulkImportModalProps {
  courseId:             string;
  existingChapterCount: number;
  onClose:              () => void;
}

export function BulkImportModal({ courseId, existingChapterCount, onClose }: BulkImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tree, setTree] = useState<ParsedTree | null>(null);
  const { run, progress, running, done } = useBulkImport(courseId, existingChapterCount);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) setTree(await parseFolder(files));
    e.target.value = "";
  };

  const canImport = tree && tree.errors.length === 0 && tree.chapters.length > 0;
  const started   = running || done;

  const progByKey = (ci: number, li: number): ImportProgress | undefined =>
    progress.find((p) => p.key === `${ci}-${li}`);

  const okCount = progress.filter((p) => p.status === "done").length;
  const errCount = progress.filter((p) => p.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: 560, maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1b61c9]/10 flex items-center justify-center">
              <FolderUp size={15} className="text-[#1b61c9]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181d26]">Import hàng loạt từ folder</p>
              <p className="text-xs text-[rgba(4,14,32,0.45)]">Tạo chương &amp; bài học từ cấu trúc thư mục</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="p-1.5 rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[rgba(4,14,32,0.65)] hover:bg-[#f0f2f5] transition-colors disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!started && (
            <>
              {/* Convention hint */}
              <div className="text-xs text-[rgba(4,14,32,0.55)] bg-[#f8fafc] border border-[#f0f2f5] rounded-xl px-4 py-3 leading-relaxed">
                Cấu trúc folder yêu cầu — tên chương &amp; bài <b>bắt buộc</b> bắt đầu bằng số thứ tự:
                <pre className="mt-2 text-[11px] text-[rgba(4,14,32,0.7)] whitespace-pre-wrap">
{`Khóa học/
  1. Chương mở đầu/
    1. Giới thiệu/   →  video.mp4, slide.pdf
    2. Cài đặt/
  2. Nâng cao/
    1. ...`}
                </pre>
              </div>

              {/* Download template */}
              <a
                href="/templates/khoa-hoc-mau.zip"
                download
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] hover:bg-[#f8fafc] hover:text-[#1b61c9] transition-colors"
              >
                <Download size={15} /> Tải folder mẫu (.zip)
              </a>

              {/* Picker */}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple
                // @ts-expect-error non-standard directory-upload attributes
                webkitdirectory=""
                directory=""
                onChange={handlePick}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#cdd5e0] text-sm font-medium text-[#1b61c9] hover:bg-[#1b61c9]/5 hover:border-[#1b61c9] transition-colors"
              >
                <FolderUp size={16} /> {tree ? "Chọn folder khác" : "Chọn folder khóa học"}
              </button>

              {/* Errors */}
              {tree && tree.errors.length > 0 && (
                <div className="space-y-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Không thể import — sửa các lỗi sau:
                  </p>
                  {tree.errors.map((e, i) => <p key={i} className="pl-5">• {e}</p>)}
                </div>
              )}

              {/* Warnings */}
              {tree && tree.warnings.length > 0 && (
                <div className="space-y-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  {tree.warnings.map((w, i) => <p key={i}>• {w}</p>)}
                </div>
              )}

              {/* Preview tree */}
              {tree && tree.chapters.length > 0 && (
                <div className="border border-[#e0e2e6] rounded-xl divide-y divide-[#f0f2f5]">
                  {tree.chapters.map((ch, ci) => (
                    <div key={ci} className="px-4 py-2.5">
                      <p className="text-sm font-medium text-[#181d26] flex items-center gap-1.5">
                        <ChevronRight size={13} className="text-[rgba(4,14,32,0.4)]" />
                        {ch.title}
                        <span className="text-[10px] text-[rgba(4,14,32,0.4)]">({ch.lessons.length} bài)</span>
                      </p>
                      <div className="mt-1 pl-5 space-y-1">
                        {ch.lessons.map((l, li) => (
                          <div key={li} className="flex items-center gap-2 text-xs text-[rgba(4,14,32,0.6)]">
                            <span className="flex-1 truncate">{l.title}</span>
                            {l.video && <Video size={11} className="text-[#1b61c9]" />}
                            {l.pdf && <FileText size={11} className="text-emerald-600" />}
                            {l.quiz && (
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <ClipboardList size={11} />
                                <span className="text-[10px]">{l.quiz.questions.length}</span>
                              </span>
                            )}
                            {!l.quiz && l.quizPdf && (
                              <span className="flex items-center gap-0.5 text-amber-600" title="Quiz sẽ được AI trích từ PDF khi import">
                                <ClipboardList size={11} />
                                <span className="text-[9px]">AI</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Progress */}
          {started && tree && (
            <div className="border border-[#e0e2e6] rounded-xl divide-y divide-[#f0f2f5]">
              {tree.chapters.map((ch, ci) => (
                <div key={ci} className="px-4 py-2.5">
                  <p className="text-sm font-medium text-[#181d26]">{ch.title}</p>
                  <div className="mt-1 pl-3 space-y-1.5">
                    {ch.lessons.map((l, li) => {
                      const p = progByKey(ci, li);
                      return (
                        <div key={li} className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex-1 truncate text-[rgba(4,14,32,0.6)]">{l.title}</span>
                            {p?.status === "done"      && <CheckCircle2 size={13} className="text-emerald-600" />}
                            {p?.status === "error"     && <AlertTriangle size={13} className="text-red-500" />}
                            {p?.status === "uploading" && (
                              <span className="flex items-center gap-1 text-[#1b61c9]">
                                <Loader2 size={12} className="animate-spin" />
                                {l.video ? `${p.pct}%` : "..."}
                              </span>
                            )}
                            {p?.status === "pending"   && <span className="text-[rgba(4,14,32,0.3)]">chờ</span>}
                          </div>
                          {p?.status === "error" && p.error && (
                            <p className="text-[10px] text-red-500 pl-1">{p.error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#f0f2f5] shrink-0">
          <p className="text-xs text-[rgba(4,14,32,0.45)]">
            {done
              ? `Hoàn tất: ${okCount} bài thành công${errCount ? `, ${errCount} lỗi` : ""}.`
              : tree && !started
                ? `${tree.chapters.length} chương, ${tree.chapters.reduce((n, c) => n + c.lessons.length, 0)} bài`
                : ""}
          </p>
          {done ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#1750a8] transition-colors"
            >
              Đóng
            </button>
          ) : (
            <button
              onClick={() => tree && run(tree)}
              disabled={!canImport || running}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#1750a8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {running && <Loader2 size={14} className="animate-spin" />}
              {running ? "Đang import..." : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
