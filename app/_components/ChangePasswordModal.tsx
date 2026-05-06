"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useChangePassword } from "./change-password.hook";
import { changePasswordSchema, ChangePasswordInput } from "./change-password.schema";
import { getApiError } from "@/lib/api/error";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [success, setSuccess]           = useState(false);

  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePassword(data);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError("root", { message: getApiError(err, "Đổi mật khẩu thất bại") });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl p-6"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.12) 0px 8px 32px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1b61c9]/10 flex items-center justify-center">
              <Lock size={15} className="text-[#1b61c9]" />
            </div>
            <h2 className="text-base font-semibold text-[#181d26]">Đổi mật khẩu</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[rgba(4,14,32,0.35)] hover:text-[#181d26] hover:bg-[#f0f2f5] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <p className="text-sm font-medium text-[#181d26]">Đổi mật khẩu thành công!</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {errors.root.message}
              </div>
            )}

            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("currentPassword")}
                  className={`w-full px-4 py-2.5 pr-10 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] ${errors.currentPassword ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26] transition-colors">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("newPassword")}
                  className={`w-full px-4 py-2.5 pr-10 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] ${errors.newPassword ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26] transition-colors">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`w-full px-4 py-2.5 pr-10 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] ${errors.confirmPassword ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26] transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-[rgba(4,14,32,0.55)] bg-[#f0f2f5] rounded-xl hover:bg-[#e5e7eb] transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-[#1b61c9] rounded-xl hover:bg-[#254fad] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
              >
                {isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
