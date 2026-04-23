"use client";

import Link from "next/link";
import { Logo } from "@/app/_components/Logo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "./register.hook";
import { registerSchema, RegisterInput } from "./register.schema";
import { getApiError } from "@/lib/api/error";

const ROLES: { value: "STUDENT" | "TEACHER"; label: string; icon: string; desc: string }[] = [
  { value: "STUDENT", label: "Học viên", icon: "🎓", desc: "Tôi muốn học các khóa học" },
  { value: "TEACHER", label: "Giáo viên", icon: "👨‍🏫", desc: "Tôi muốn tạo và dạy khóa học" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: register, isPending } = useRegister();

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
      router.push("/login");
    } catch (err) {
      setError("root", { message: getApiError(err, "Đăng ký thất bại") });
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-[#181d26] flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 left-8 w-80 h-80 bg-[#1b61c9] rounded-full" style={{ filter: "blur(100px)", opacity: 0.15 }} />
          <div className="absolute bottom-20 right-4 w-60 h-60 bg-[#1b61c9] rounded-full" style={{ filter: "blur(80px)", opacity: 0.1 }} />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="text-white font-semibold text-lg tracking-[0.08px]">SmartEdu</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-light text-white leading-snug mb-4">
            Bắt đầu hành trình
            <br />
            <span className="font-bold text-[#1b61c9]">học tập thông minh</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed tracking-[0.18px]">
            Tạo tài khoản miễn phí và trải nghiệm nền tảng giáo dục được hỗ trợ bởi AI.
          </p>
        </div>

        <div className="relative space-y-3">
          {["Học cùng AI Tutor cá nhân hóa 24/7", "Truy cập 500+ khóa học chất lượng cao", "Nhận chứng chỉ hoàn thành được công nhận"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#1b61c9]/20 rounded-full flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm text-white/60 tracking-[0.07px]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-24 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo size={32} />
            <span className="font-semibold text-[#181d26]">SmartEdu</span>
          </Link>

          <h1 className="text-3xl font-light text-[#181d26] mb-2">Tạo tài khoản</h1>
          <p className="text-[rgba(4,14,32,0.69)] text-base tracking-[0.18px] mb-8">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-[#1b61c9] font-medium hover:text-[#254fad] transition-colors">
              Đăng nhập
            </Link>
          </p>

          {/* Role selector */}
          <Controller
            control={control}
            name="role"
            render={({ field: { value, onChange } }) => (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChange(r.value)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all ${
                      value === r.value
                        ? "border-[#1b61c9] bg-[#1b61c9]/5 ring-2 ring-[#1b61c9]/15"
                        : "border-[#e0e2e6] hover:border-[#1b61c9]/40 hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-sm font-medium text-[#181d26] tracking-[0.08px]">{r.label}</span>
                    <span className="text-xs text-[rgba(4,14,32,0.50)] tracking-[0.07px]">{r.desc}</span>
                  </button>
                ))}
              </div>
            )}
          />

          {errors.root && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.root.message}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
                Họ và tên
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                {...field("name")}
                className={`w-full px-4 py-3 text-base text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] tracking-[0.08px] ${errors.name ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

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
                {...field("email")}
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
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  {...field("password")}
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
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 w-4 h-4 accent-[#1b61c9] rounded cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-[rgba(4,14,32,0.69)] leading-relaxed tracking-[0.07px] cursor-pointer">
                Tôi đồng ý với{" "}
                <a href="#" className="text-[#1b61c9] hover:text-[#254fad] transition-colors">Điều khoản dịch vụ</a>
                {" "}và{" "}
                <a href="#" className="text-[#1b61c9] hover:text-[#254fad] transition-colors">Chính sách bảo mật</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#1b61c9] text-white font-medium text-base py-3 rounded-xl tracking-[0.08px] hover:bg-[#254fad] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 0px 2px, rgba(45,127,249,0.28) 0px 1px 3px, rgba(0,0,0,0.06) 0px 0px 0px 0.5px inset" }}
            >
              {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
