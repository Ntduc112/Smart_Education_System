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

const orbs = [
  { w: 650, h: 650, top: "-20%", left: "-15%", color: "rgba(59,130,246,0.10)", blur: 130, duration: 20 },
  { w: 450, h: 450, top: "60%", left: "65%", color: "rgba(139,92,246,0.08)", blur: 110, duration: 25 },
  { w: 300, h: 300, top: "25%", left: "45%", color: "rgba(14,165,233,0.06)", blur: 70, duration: 17 },
];

// Education icons scattered in background
const BG_ICONS = [
  { top: "8%",  left: "6%",  size: 36, rotate: -15, delay: 0,   duration: 6,  icon: "book" },
  { top: "15%", left: "88%", size: 28, rotate: 12,  delay: 1.2, duration: 7,  icon: "graduation" },
  { top: "72%", left: "5%",  size: 32, rotate: 8,   delay: 0.5, duration: 8,  icon: "pencil" },
  { top: "80%", left: "88%", size: 30, rotate: -10, delay: 2,   duration: 6,  icon: "laptop" },
  { top: "45%", left: "3%",  size: 24, rotate: 20,  delay: 1.5, duration: 9,  icon: "star" },
  { top: "38%", left: "91%", size: 26, rotate: -8,  delay: 0.8, duration: 7,  icon: "award" },
  { top: "60%", left: "92%", size: 22, rotate: 15,  delay: 2.5, duration: 8,  icon: "pencil" },
  { top: "90%", left: "45%", size: 26, rotate: -5,  delay: 1,   duration: 6,  icon: "book" },
];

function BgIcon({ type, size }: { type: string; size: number }) {
  const color = "rgba(99,132,246,0.18)";
  const s = size;
  if (type === "book") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
  if (type === "graduation") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
  if (type === "pencil") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
  if (type === "laptop") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
  if (type === "star") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.06, duration: 0.4, ease: "easeOut" },
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
  `w-full px-4 py-3 text-sm text-[#181d26] bg-white border rounded-xl outline-none transition-all placeholder:text-[rgba(4,14,32,0.3)] ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-[#dde3f0] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
      style={{ background: "linear-gradient(135deg, #eef4ff 0%, #f4f7ff 50%, #f0f5ff 100%)" }}
    >
      {/* Ambient orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.w,
            height: orb.h,
            top: orb.top,
            left: orb.left,
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
          }}
          animate={{ scale: [1, 1.07, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Floating education icons */}
      {BG_ICONS.map((ic, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: ic.top, left: ic.left, rotate: ic.rotate }}
          animate={{ y: [0, -10, 0], rotate: [ic.rotate, ic.rotate + 5, ic.rotate] }}
          transition={{ duration: ic.duration, delay: ic.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <BgIcon type={ic.icon} size={ic.size} />
        </motion.div>
      ))}

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,132,246,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="bg-white rounded-3xl p-8 border border-[#e4eaf5]"
          style={{
            boxShadow: "0 4px 6px rgba(59,130,246,0.04), 0 20px 60px rgba(59,130,246,0.08), 0 0 0 1px rgba(99,132,246,0.06)",
          }}
        >
          {/* Logo */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-7">
            <Logo size={34} />
            <span className="text-[#181d26] font-semibold text-lg tracking-wide">Learnust</span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="mb-6">
            <h1 className="text-2xl font-semibold text-[#181d26] mb-1.5">Tạo tài khoản</h1>
            <p className="text-[rgba(4,14,32,0.55)] text-sm">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
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
                  {ROLES.map((r) => (
                    <motion.button
                      key={r.value}
                      type="button"
                      onClick={() => onChange(r.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all ${
                        value === r.value
                          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                          : "border-[#dde3f0] hover:border-blue-200 hover:bg-[#f8faff]"
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-medium text-[#181d26]">{r.label}</span>
                      <span className="text-xs text-[rgba(4,14,32,0.45)]">{r.desc}</span>
                    </motion.button>
                  ))}
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
              <label htmlFor="name" className="block text-sm font-medium text-[rgba(4,14,32,0.7)] mb-1.5">
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
              <label htmlFor="email" className="block text-sm font-medium text-[rgba(4,14,32,0.7)] mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium text-[rgba(4,14,32,0.7)] mb-1.5">
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.3)] hover:text-[rgba(4,14,32,0.65)] transition-colors"
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
                className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-blue-500"
              />
              <label htmlFor="terms" className="text-xs text-[rgba(4,14,32,0.5)] leading-relaxed cursor-pointer">
                Tôi đồng ý với{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">Điều khoản dịch vụ</a>
                {" "}và{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">Chính sách bảo mật</a>
              </label>
            </motion.div>

            {/* Submit */}
            <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.01 }}
                whileTap={{ scale: isPending ? 1 : 0.98 }}
                className="w-full bg-blue-600 text-white font-medium text-sm py-3 rounded-xl transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}
              >
                {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div custom={8} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3 my-5">
            <div className="h-px bg-[#e8edf5] flex-1" />
            <span className="text-xs text-[rgba(4,14,32,0.35)]">hoặc</span>
            <div className="h-px bg-[#e8edf5] flex-1" />
          </motion.div>

          {/* Google */}
          <motion.div custom={9} variants={fieldVariants} initial="hidden" animate="visible">
            <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#dde3f0] text-[rgba(4,14,32,0.75)] font-medium text-sm py-3 rounded-xl hover:bg-[#f8faff] hover:border-blue-200 transition-all"
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
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 text-center border border-[#e4eaf5]"
              style={{ boxShadow: "0 20px 60px rgba(59,130,246,0.18)" }}
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
              <h2 className="text-xl font-semibold text-[#181d26] mb-1.5">Đăng ký thành công!</h2>
              <p className="text-sm text-[rgba(4,14,32,0.55)] mb-6">
                Tài khoản của bạn đã được tạo. Đăng nhập để bắt đầu học nào.
              </p>
              <motion.button
                type="button"
                onClick={handleLoginNow}
                disabled={loggingIn}
                whileHover={{ scale: loggingIn ? 1 : 1.01 }}
                whileTap={{ scale: loggingIn ? 1 : 0.98 }}
                className="w-full bg-blue-600 text-white font-medium text-sm py-3 rounded-xl transition-colors hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}
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
