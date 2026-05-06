"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useUpdateProfile } from "./profile.hook";
import { profileSchema, ProfileInput } from "./profile.schema";
import { getApiError } from "@/lib/api/error";

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const { mutateAsync, isPending } = useUpdateProfile();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  const onSubmit = async (data: ProfileInput) => {
    try {
      await mutateAsync({ name: data.name, avatar: data.avatar || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("root", { message: getApiError(err, "Cập nhật thất bại") });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[rgba(4,14,32,0.55)] hover:text-[#1b61c9] transition-colors mb-6"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Quay lại
        </Link>

        <div className="bg-white rounded-2xl border border-[#e0e2e6] p-8">
          <div className="mb-7">
            <h1 className="text-xl font-semibold text-[#181d26]">Hồ sơ cá nhân</h1>
            <p className="text-sm text-[rgba(4,14,32,0.45)] mt-1">Cập nhật thông tin của bạn</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#1b61c9]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex justify-center mb-2">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={me?.name ?? "Avatar"}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#e0e2e6]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1b61c9]/15 flex items-center justify-center border-2 border-[#e0e2e6]">
                    <span className="text-2xl font-semibold text-[#1b61c9]">
                      {me?.name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#181d26]">Họ tên</label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Nhập họ tên của bạn"
                  className="w-full border border-[#e0e2e6] rounded-xl px-4 py-3 text-sm text-[#181d26] placeholder-[rgba(4,14,32,0.35)] focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/15 focus:border-[#1b61c9] transition"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#181d26]">Avatar URL</label>
                <input
                  {...register("avatar")}
                  type="text"
                  placeholder="https://... (dán URL ảnh vào đây)"
                  className="w-full border border-[#e0e2e6] rounded-xl px-4 py-3 text-sm text-[#181d26] placeholder-[rgba(4,14,32,0.35)] focus:outline-none focus:ring-2 focus:ring-[#1b61c9]/15 focus:border-[#1b61c9] transition"
                />
                {errors.avatar && (
                  <p className="text-xs text-red-500">{errors.avatar.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#181d26]">Email</label>
                <input
                  type="email"
                  value={me?.email ?? ""}
                  disabled
                  className="w-full border border-[#e0e2e6] rounded-xl px-4 py-3 text-sm text-[rgba(4,14,32,0.45)] bg-[#f8fafc] cursor-not-allowed"
                />
                <p className="text-xs text-[rgba(4,14,32,0.35)]">Email không thể thay đổi</p>
              </div>

              {errors.root && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                  {errors.root.message}
                </p>
              )}

              {saved && (
                <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3 font-medium">
                  Đã lưu!
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-[#1b61c9] hover:bg-[#1550aa] text-white rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
