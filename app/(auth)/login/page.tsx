"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "./login.hook";
import { loginSchema, LoginInput } from "./login.schema";
import { getApiError } from "@/lib/api/error";

export default function LoginPage() {
  const router = useRouter();
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
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "TEACHER") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
    } catch (err) {
      setError("root", { message: getApiError(err, "Đăng nhập thất bại") });
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — branding ── */}
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
            Chào mừng trở lại,
            <br />
            <span className="font-bold">học viên!</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed tracking-[0.18px]">
            Tiếp tục hành trình học tập của bạn. Hàng ngàn bài học đang chờ.
          </p>
        </div>

        <div className="relative flex gap-4">
          {[
            { number: "500+", label: "Khóa học" },
            { number: "10K+", label: "Học viên" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white/10 rounded-2xl px-5 py-4 border border-white/20">
              <div className="text-2xl font-semibold text-white">{s.number}</div>
              <div className="text-sm text-white/70 tracking-[0.07px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26]">SmartEdu</span>
          </Link>

          <h1 className="text-3xl font-light text-[#181d26] mb-2">Đăng nhập</h1>
          <p className="text-[rgba(4,14,32,0.69)] text-base tracking-[0.18px] mb-8">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors">
              Đăng ký ngay
            </Link>
          </p>

          {errors.root && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.root.message}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register("email")}
                className={`w-full px-4 py-3 text-base text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] tracking-[0.08px] ${errors.email ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full px-4 py-3 pr-12 text-base text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] tracking-[0.08px] ${errors.password ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26] transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              <div className="flex justify-end mt-1.5">
                <Link href="#" className="text-sm text-[#1b61c9] hover:text-[#254fad] tracking-[0.07px] transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#1b61c9] text-white font-medium text-base py-3 rounded-xl tracking-[0.08px] hover:bg-[#254fad] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 0px 2px, rgba(45,127,249,0.28) 0px 1px 3px, rgba(0,0,0,0.06) 0px 0px 0px 0.5px inset" }}
            >
              {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-[#e0e2e6] flex-1" />
            <span className="text-sm text-[rgba(4,14,32,0.35)] tracking-[0.07px]">hoặc</span>
            <div className="h-px bg-[#e0e2e6] flex-1" />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#e0e2e6] text-[#181d26] font-medium text-base py-3 rounded-xl hover:border-[#1b61c9]/40 hover:bg-[#f8fafc] transition-all tracking-[0.08px]"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Tiếp tục với Google
          </button>
        </div>
      </div>
    </div>
  );
}
