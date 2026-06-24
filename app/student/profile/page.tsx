"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Calendar, CheckCircle2, User, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { BackButton } from "@/app/student/_components/BackButton";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useUpdateProfile, useUploadAvatar } from "./profile.hook";
import { profileSchema, ProfileInput } from "./profile.schema";
import { getApiError } from "@/lib/api/error";

// ── Palette (cozy-blue) ──────────────────────────────────────────────────────
const C = {
  canvas: "#EFF5FE",
  card: "#FFFFFF",
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  emerald: "#0E9F6E",
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Học viên",
  TEACHER: "Giảng viên",
  ADMIN: "Quản trị viên",
};

// ── Motion ───────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 0.61, 0.36, 1] as const },
  }),
};

// ── Decorative floating blobs ─────────────────────────────────────────────────
function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ] as const;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28,
            filter: "blur(90px)",
            top: "top" in b ? b.top : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

function formatJoined(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const { mutateAsync, isPending } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (me) {
      reset({ name: me.name, avatar: me.avatar ?? "" });
    }
  }, [me, reset]);

  const avatarValue = watch("avatar");
  const displayAvatar = avatarValue || me?.avatar;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file
    if (!file) return;
    setUploadError(null);
    try {
      const url = await uploadAvatar(file);
      setValue("avatar", url, { shouldDirty: true });
    } catch (err) {
      setUploadError(getApiError(err, "Tải ảnh thất bại"));
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    try {
      await mutateAsync({ name: data.name, avatar: data.avatar || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("root", { message: getApiError(err, "Cập nhật thất bại") });
    }
  };

  const inputCls =
    "w-full rounded-xl px-4 py-3 text-sm text-[#181d26] placeholder-[rgba(4,14,32,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/15 focus:border-[#1b61c9]";

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <BackButton />

        {/* hidden file input (dùng chung cho avatar hero + nút trong form) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onPickFile}
        />

        {/* ── Hero card ── */}
        <motion.section
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl p-7 text-white sm:p-8"
          style={{
            background: "linear-gradient(150deg,#3D8BEF 0%,#1b61c9 55%,#1a4fa0 100%)",
            boxShadow: "rgba(27,97,201,0.34) 0px 14px 36px",
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-14 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="group/avatar relative shrink-0 rounded-full focus:outline-none focus:ring-4 focus:ring-white/30"
              title="Đổi ảnh đại diện"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={me?.name ?? "Avatar"}
                  className="h-24 w-24 rounded-full border-4 border-white/30 object-cover shadow-lg"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white/30 bg-white/15 shadow-lg">
                  <span className="font-display text-3xl font-bold">{me?.name?.charAt(0) ?? "?"}</span>
                </div>
              )}
              {/* lớp phủ khi hover */}
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <Camera size={22} />
              </span>
              {/* badge camera góc dưới */}
              <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#1b61c9] shadow">
                <Camera size={13} />
              </span>
              {/* spinner khi upload */}
              {isUploading && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50">
                  <Loader2 size={24} className="animate-spin" />
                </span>
              )}
            </motion.button>

            <div className="min-w-0">
              {isLoading ? (
                <div className="h-8 w-44 animate-pulse rounded-lg bg-white/20" />
              ) : (
                <h1 className="font-display text-[28px] font-semibold leading-tight">{me?.name}</h1>
              )}
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/95">
                <User size={12} /> {ROLE_LABEL[me?.role ?? ""] ?? me?.role ?? "Người dùng"}
              </span>

              <div className="mt-3 flex flex-col items-center gap-x-4 gap-y-1 text-[13px] text-white/85 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} /> {me?.email}
                </span>
                {me?.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} /> Tham gia {formatJoined(me.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Edit form card ── */}
        <motion.section
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-6 rounded-3xl bg-white p-7 sm:p-8"
          style={{ border: `1px solid ${C.border}`, boxShadow: "rgba(27,60,120,0.05) 0px 8px 24px" }}
        >
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold">Chỉnh sửa hồ sơ</h2>
            <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Cập nhật thông tin hiển thị của bạn</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#1b61c9]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.ink }}>
                  <User size={14} style={{ color: C.blue }} /> Họ tên
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Nhập họ tên của bạn"
                  className={inputCls}
                  style={{ border: `1px solid ${C.border}` }}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.ink }}>
                  <Camera size={14} style={{ color: C.blue }} /> Ảnh đại diện
                </label>
                <div className="flex items-center gap-4 rounded-xl p-3" style={{ border: `1px solid ${C.border}`, background: "#F6F9FE" }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" style={{ border: `1px solid ${C.border}` }} />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-lg font-semibold" style={{ background: "#EAF1FC", color: C.blue }}>
                      {me?.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium transition-colors hover:border-[#1b61c9]/40 disabled:opacity-60"
                      style={{ border: `1px solid ${C.border}`, color: C.blue }}
                    >
                      {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                      {isUploading ? "Đang tải..." : "Tải ảnh lên"}
                    </motion.button>
                    <p className="mt-1.5 text-xs" style={{ color: C.inkFaint }}>JPG, PNG, WebP, GIF · tối đa 5MB</p>
                  </div>
                </div>
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                {errors.avatar && <p className="text-xs text-red-500">{errors.avatar.message}</p>}
                <input type="hidden" {...register("avatar")} />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.ink }}>
                  <Mail size={14} style={{ color: C.blue }} /> Email
                </label>
                <input
                  type="email"
                  value={me?.email ?? ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl px-4 py-3 text-sm"
                  style={{ border: `1px solid ${C.border}`, background: "#EAF1FC", color: C.inkSoft }}
                />
                <p className="text-xs" style={{ color: C.inkFaint }}>Email không thể thay đổi</p>
              </div>

              <AnimatePresence>
                {errors.root && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500"
                  >
                    {errors.root.message}
                  </motion.p>
                )}
                {saved && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ background: "rgba(14,159,110,0.10)", color: C.emerald }}
                  >
                    <CheckCircle2 size={16} /> Đã lưu thay đổi!
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.02 }}
                whileTap={{ scale: isPending ? 1 : 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </motion.button>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  );
}
