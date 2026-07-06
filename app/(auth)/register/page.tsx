"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "./register.hook";
import { useLogin } from "../login/login.hook";
import { registerSchema, RegisterInput } from "./register.schema";
import { getApiError } from "@/lib/api/error";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const ROLES: { value: "STUDENT" | "TEACHER"; label: string; icon: string; desc: string }[] = [
  { value: "STUDENT", label: "Học viên", icon: "🎓", desc: "Tôi muốn học các khóa học" },
  { value: "TEACHER", label: "Giáo viên", icon: "👨‍🏫", desc: "Tôi muốn tạo và dạy khóa học" },
];

// ── Palette (cozy-blue) ──────────────────────────────────────────────────────
const C = {
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

function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 560, top: "-14%", left: "-12%", dur: 24 },
    { c: "#A7C8FF", s: 460, top: "50%", right: "-12%", dur: 27 },
    { c: "#CFE0FA", s: 380, bottom: "-12%", left: "22%", dur: 30 },
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
    transition: { delay: 0.1 + i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
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
  );

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 text-sm text-[#181d26] bg-white border rounded-xl outline-none transition-all placeholder:text-[rgba(4,14,32,0.32)] ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-[#DCE6F4] focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/15"
  }`;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { mutateAsync: register, isPending } = useRegister();
  const { mutateAsync: login, isPending: loggingIn } = useLogin();

  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await register(data);
      setCreds({ email: data.email, password: data.password });
      setSuccess(true);
    } catch (err) {
      setError("root", { message: getApiError(err, "Đăng ký thất bại") });
    }
  };

  const handleLoginNow = async () => {
    if (!creds) return;
    setLoginError(null);
    try {
      const result = await login(creds);
      const role = result.user?.role;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "TEACHER") router.push("/teacher/home");
      else router.push("/");
    } catch (err) {
      // Auto-login lỗi → để họ tự đăng nhập
      setLoginError(getApiError(err, "Đăng nhập tự động thất bại"));
      router.push("/login");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-12"
      style={{ background: "linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)" }}
    >
      <Atmosphere />

      {/* Card */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl p-8" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
          {/* Logo */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-7">
            <Logo size={34} />
            <span className="font-display text-lg font-semibold tracking-wide" style={{ color: C.ink }}>Learnust</span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="mb-6">
            <h1 className="font-display text-[26px] font-semibold mb-1.5" style={{ color: C.ink }}>Tạo tài khoản</h1>
            <p className="text-sm" style={{ color: C.inkSoft }}>
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-[#1b61c9] hover:text-[#254fad] transition-colors">
                Đăng nhập
              </Link>
            </p>
          </motion.div>

          {/* Role selector */}
          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="mb-5">
            <Controller
              control={control}
              name="role"
              render={({ field: { value, onChange } }) => (
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const active = value === r.value;
                    return (
                      <motion.button
                        key={r.value}
                        type="button"
                        onClick={() => onChange(r.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all"
                        style={active
                          ? { borderColor: C.blue, background: "#EAF1FC", boxShadow: "inset 0 0 0 1px #1b61c9" }
                          : { borderColor: C.border }}
                      >
                        <span className="text-lg">{r.icon}</span>
                        <span className="text-sm font-medium" style={{ color: C.ink }}>{r.label}</span>
                        <span className="text-xs" style={{ color: C.inkFaint }}>{r.desc}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            />
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
            {/* Name */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>
                Họ và tên
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                {...field("name")}
                className={inputCls(!!errors.name)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </motion.div>

            {/* Email */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...field("email")}
                className={inputCls(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </motion.div>

            {/* Password */}
            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  {...field("password")}
                  className={inputCls(!!errors.password) + " pr-12"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: C.inkFaint }}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </motion.div>

            {/* Terms */}
            <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-[#1b61c9]"
              />
              <label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer" style={{ color: C.inkFaint }}>
                Tôi đồng ý với{" "}
                <a href="#" className="text-[#1b61c9] hover:text-[#254fad] transition-colors">Điều khoản dịch vụ</a>
                {" "}và{" "}
                <a href="#" className="text-[#1b61c9] hover:text-[#254fad] transition-colors">Chính sách bảo mật</a>
              </label>
            </motion.div>

            {/* Submit */}
            <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.01 }}
                whileTap={{ scale: isPending ? 1 : 0.98 }}
                className="w-full text-white font-medium text-sm py-3 rounded-xl transition-colors hover:bg-[#254fad] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ background: C.blue, boxShadow: BTN_SHADOW }}
              >
                {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div custom={8} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3 my-5">
            <div className="h-px flex-1" style={{ background: C.border }} />
            <span className="text-xs" style={{ color: C.inkFaint }}>hoặc</span>
            <div className="h-px flex-1" style={{ background: C.border }} />
          </motion.div>

          {/* Google */}
          <motion.div custom={9} variants={fieldVariants} initial="hidden" animate="visible">
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

      {/* Success modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-[#0a1633]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 text-center"
              style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(27,60,120,0.12) 0px 20px 60px" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 240, damping: 16 }}
                className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(14,159,110,0.12)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
              <h2 className="font-display text-xl font-semibold mb-1.5" style={{ color: C.ink }}>Đăng ký thành công!</h2>
              <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
                Tài khoản của bạn đã được tạo. Đăng nhập để bắt đầu học nào.
              </p>
              <motion.button
                type="button"
                onClick={handleLoginNow}
                disabled={loggingIn}
                whileHover={{ scale: loggingIn ? 1 : 1.01 }}
                whileTap={{ scale: loggingIn ? 1 : 0.98 }}
                className="w-full text-white font-medium text-sm py-3 rounded-xl transition-colors hover:bg-[#254fad] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: C.blue, boxShadow: BTN_SHADOW }}
              >
                {loggingIn ? "Đang đăng nhập..." : "Đăng nhập ngay"}
              </motion.button>
              {loginError && (
                <p className="mt-3 text-xs text-red-500">{loginError}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
