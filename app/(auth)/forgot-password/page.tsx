"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/app/_components/Logo";
import api from "@/lib/axios";
import { getApiError } from "@/lib/api/error";
import { ArrowLeft, CheckCircle, Loader2, Mail, Lock, KeyRound } from "lucide-react";

// ── Schemas ────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});
type EmailInput = z.infer<typeof emailSchema>;

const newPasswordSchema = z
  .object({
    newPassword:     z.string().min(6, "Tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path:    ["confirmPassword"],
  });
type NewPasswordInput = z.infer<typeof newPasswordSchema>;

// ── Step 1 — Enter email ───────────────────────────────────────────────────

function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async ({ email }: EmailInput) => {
    setServerError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      onNext(email);
    } catch (err) {
      setServerError(getApiError(err, "Đã có lỗi xảy ra"));
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1b61c9]/10 mb-2">
        <Mail size={22} className="text-[#1b61c9]" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-tight mb-1">Quên mật khẩu?</h1>
        <p className="text-sm text-[rgba(4,14,32,.55)] leading-relaxed">
          Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã xác thực 6 số.
        </p>
      </div>

      {serverError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#181d26] mb-1.5">Email</label>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@example.com"
          {...register("email")}
          className={`w-full px-4 py-3 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,.35)] ${errors.email ? "border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#1b61c9] text-white font-medium text-sm py-3 rounded-xl hover:bg-[#254fad] transition-all disabled:opacity-60"
        style={{ boxShadow: "rgba(45,127,249,.28) 0px 1px 3px, rgba(0,0,0,.32) 0px 0px 1px" }}
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? "Đang gửi..." : "Gửi mã xác thực"}
      </button>
    </form>
  );
}

// ── Step 2 — Enter OTP ────────────────────────────────────────────────────

function StepOtp({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (resetToken: string) => void;
  onBack: () => void;
}) {
  const [digits,      setDigits]      = useState<string[]>(Array(6).fill(""));
  const [error,       setError]       = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [resendCool,  setResendCool]  = useState(false);
  const inputRefs     = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...digits];
    next[i] = v.slice(-1);
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(Boolean)) submitCode(next.join(""));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("").map((_, i) => text[i] ?? "");
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) submitCode(text);
  };

  const submitCode = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, code });
      onNext(res.data.resetToken);
    } catch (err) {
      setError(getApiError(err, "Mã không hợp lệ hoặc đã hết hạn"));
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCool) return;
    setError(null);
    setResendCool(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {}
    setTimeout(() => setResendCool(false), 60_000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1b61c9]/10 mb-2">
        <KeyRound size={22} className="text-[#1b61c9]" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-tight mb-1">Nhập mã xác thực</h1>
        <p className="text-sm text-[rgba(4,14,32,.55)] leading-relaxed">
          Chúng tôi đã gửi mã 6 số đến{" "}
          <span className="font-medium text-[#181d26]">{email}</span>
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-between" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className={`w-12 h-14 text-center text-xl font-bold border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all
              ${error ? "border-red-300" : d ? "border-[#1b61c9] bg-[#f0f4fb]" : "border-[#e0e2e6] focus:border-[#1b61c9]"}
              disabled:opacity-50`}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-[rgba(4,14,32,.45)]">
          <Loader2 size={14} className="animate-spin" />
          Đang xác thực...
        </div>
      )}

      <p className="text-sm text-[rgba(4,14,32,.45)] text-center">
        Không nhận được mã?{" "}
        <button
          type="button"
          onClick={resendCode}
          disabled={resendCool}
          className="text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resendCool ? "Đã gửi (60s)" : "Gửi lại"}
        </button>
      </p>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[rgba(4,14,32,.45)] hover:text-[#181d26] transition-colors"
      >
        <ArrowLeft size={14} />
        Thay đổi email
      </button>
    </div>
  );
}

// ── Step 3 — New password ─────────────────────────────────────────────────

function StepNewPassword({
  resetToken,
  onSuccess,
}: {
  resetToken: string;
  onSuccess: () => void;
}) {
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
  });

  const onSubmit = async (data: NewPasswordInput) => {
    setServerError(null);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword: data.newPassword });
      onSuccess();
    } catch (err) {
      setServerError(getApiError(err, "Đã có lỗi xảy ra"));
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1b61c9]/10 mb-2">
        <Lock size={22} className="text-[#1b61c9]" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] tracking-tight mb-1">Mật khẩu mới</h1>
        <p className="text-sm text-[rgba(4,14,32,.55)]">Đặt mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      {serverError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {serverError}
        </div>
      )}

      <PasswordField
        label="Mật khẩu mới"
        show={showNew}
        toggle={() => setShowNew((v) => !v)}
        error={errors.newPassword?.message}
        registration={register("newPassword")}
        autoFocus
      />
      <PasswordField
        label="Xác nhận mật khẩu"
        show={showConfirm}
        toggle={() => setShowConfirm((v) => !v)}
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-[#1b61c9] text-white font-medium text-sm py-3 rounded-xl hover:bg-[#254fad] transition-all disabled:opacity-60"
        style={{ boxShadow: "rgba(45,127,249,.28) 0px 1px 3px, rgba(0,0,0,.32) 0px 0px 1px" }}
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}

function PasswordField({
  label, show, toggle, error, registration, autoFocus,
}: {
  label: string;
  show: boolean;
  toggle: () => void;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<NewPasswordInput>>["register"]>;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#181d26] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoFocus={autoFocus}
          placeholder="••••••••"
          {...registration}
          className={`w-full px-4 py-3 pr-11 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,.35)] ${error ? "border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,.35)] hover:text-[#181d26] transition-colors"
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Step 4 — Done ─────────────────────────────────────────────────────────

function StepDone() {
  return (
    <div className="text-center space-y-5">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto">
        <CheckCircle size={32} className="text-green-500" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#181d26] mb-2">Thành công!</h1>
        <p className="text-sm text-[rgba(4,14,32,.55)]">
          Mật khẩu của bạn đã được đặt lại.<br />Hãy đăng nhập với mật khẩu mới.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex items-center justify-center w-full bg-[#1b61c9] text-white font-medium text-sm py-3 rounded-xl hover:bg-[#254fad] transition-all"
        style={{ boxShadow: "rgba(45,127,249,.28) 0px 1px 3px, rgba(0,0,0,.32) 0px 0px 1px" }}
      >
        Đăng nhập ngay
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step,       setStep]       = useState<Step>("email");
  const [email,      setEmail]      = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-[#1b61c9] flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-8 w-72 h-72 bg-white rounded-full" style={{ filter: "blur(80px)", opacity: 0.08 }} />
          <div className="absolute bottom-24 right-8 w-52 h-52 bg-white rounded-full" style={{ filter: "blur(60px)", opacity: 0.08 }} />
        </div>
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="text-white font-semibold text-lg tracking-[0.08px]">SmartEdu</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-light text-white leading-snug mb-4">
            Quên mật khẩu?<br />
            <span className="font-bold">Không sao cả!</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Chỉ cần vài bước đơn giản, bạn sẽ lấy lại được tài khoản ngay.
          </p>
        </div>
        <div className="relative flex flex-col gap-3">
          {[
            { num: "1", label: "Nhập email đăng ký" },
            { num: "2", label: "Xác thực mã 6 số" },
            { num: "3", label: "Đặt mật khẩu mới" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {s.num}
              </div>
              <span className="text-white/80 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26]">SmartEdu</span>
          </Link>

          {step === "email"    && <StepEmail onNext={(e) => { setEmail(e); setStep("otp"); }} />}
          {step === "otp"      && <StepOtp email={email} onNext={(t) => { setResetToken(t); setStep("password"); }} onBack={() => setStep("email")} />}
          {step === "password" && <StepNewPassword resetToken={resetToken} onSuccess={() => setStep("done")} />}
          {step === "done"     && <StepDone />}

          {step !== "done" && (
            <div className="mt-6">
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-[rgba(4,14,32,.45)] hover:text-[#181d26] transition-colors">
                <ArrowLeft size={14} />
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
