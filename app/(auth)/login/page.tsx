"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "./login.hook";
import { loginSchema, LoginInput } from "./login.schema";
import { getApiError } from "@/lib/api/error";
import { motion, type Variants } from "framer-motion";

// ── Palette (cozy-blue) ──────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";
const BTN_SHADOW = "rgba(27,97,201,0.34) 0px 10px 28px";
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// ── Atmosphere (blobs + grain, per DESIGN-cozy-blue) ─────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 520, top: "-12%", left: "-10%", dur: 22 },
    { c: "#A7C8FF", s: 440, top: "45%", right: "-12%", dur: 26 },
    { c: "#CFE0FA", s: 380, bottom: "-14%", left: "20%", dur: 30 },
  ] as const;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.46, filter: "blur(110px)",
            top: "top" in b ? b.top : undefined, left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined, bottom: "bottom" in b ? b.bottom : undefined,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
};

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 text-sm text-[#181d26] bg-white border rounded-xl outline-none transition-all placeholder:text-[rgba(4,14,32,0.32)] ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-[#DCE6F4] focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/15"
  }`;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Chỉ nhận path nội bộ ("/..."), chặn "//host" để tránh open-redirect.
  const rawRedirect = searchParams.get("redirect");
  const redirect = rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : null;
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login(data);
      const role = result.user?.role;
      if (redirect) router.push(redirect);
      else if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "TEACHER") router.push("/teacher/home");
      else router.push("/");
    } catch (err) {
      setError("root", { message: getApiError(err, "Đăng nhập thất bại") });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)" }}
    >
      <Atmosphere />

      {/* Card */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl p-8" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
          {/* Logo */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-8">
            <Logo size={34} />
            <span className="font-display text-lg font-semibold tracking-wide" style={{ color: C.ink }}>Learnust</span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="mb-7">
            <h1 className="font-display text-[26px] font-semibold mb-1.5" style={{ color: C.ink }}>Đăng nhập</h1>
            <p className="text-sm" style={{ color: C.inkSoft }}>
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-[#1b61c9] hover:text-[#254fad] transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </motion.div>

          {/* Error */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              {errors.root.message}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>Email</label>
              <input id="email" type="email" autoComplete="email" placeholder="name@example.com"
                {...register("email")} className={inputCls(!!errors.email)} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </motion.div>

            {/* Password */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>Mật khẩu</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                  placeholder="••••••••" {...register("password")}
                  className={inputCls(!!errors.password) + " pr-12"} />
                <button type="button" aria-label={showPassword ? "Ẩn" : "Hiện"} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: C.inkFaint }}>
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs transition-colors hover:text-[#1b61c9]" style={{ color: C.inkFaint }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button type="submit" disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.01 }} whileTap={{ scale: isPending ? 1 : 0.98 }}
                className="w-full text-white font-medium text-sm py-3 rounded-xl transition-colors hover:bg-[#254fad] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ background: C.blue, boxShadow: BTN_SHADOW }}
              >
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3 my-5">
            <div className="h-px flex-1" style={{ background: C.border }} />
            <span className="text-xs" style={{ color: C.inkFaint }}>hoặc</span>
            <div className="h-px flex-1" style={{ background: C.border }} />
          </motion.div>

          {/* Google */}
          <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible">
            <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-white font-medium text-sm py-3 rounded-xl transition-all hover:bg-[#EAF1FC] hover:border-[#A7C8FF]"
              style={{ color: C.inkSoft, border: `1px solid ${C.border}` }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Tiếp tục với Google
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
