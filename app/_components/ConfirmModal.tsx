"use client";

import { Loader2 } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  isLoading = false,
  danger = true,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  danger?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-96 mx-4"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-[#181d26] mb-2">{title}</h3>
        {message && <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">{message}</p>}
        <div className={`flex gap-3 justify-end ${message ? "" : "mt-6"}`}>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-[#1b61c9] hover:bg-[#254fad]"
            }`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
