"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ImageIcon, ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import api from "@/lib/axios";

const schema = z.object({
  title:       z.string().min(1, "Tên khóa học là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  thumbnail:   z.string().min(1, "Vui lòng tải lên ảnh bìa"),
  price:       z.coerce.number().min(0, "Giá phải ≥ 0"),
  level:       z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  status:      z.enum(["DRAFT", "PUBLISHED"]),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
});

// z.coerce infers input as unknown in Zod v4; define output type explicitly
type FormInput = {
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "DRAFT" | "PUBLISHED";
  category_id: string;
};

interface Category { id: string; name: string }

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#181d26] mb-1.5 tracking-[0.08px]">
      {children}
    </label>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-2.5 text-sm text-[#181d26] bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1b61c9]/15 transition-all placeholder:text-[rgba(4,14,32,0.35)] ${
    hasError ? "border-red-400 focus:border-red-400" : "border-[#e0e2e6] focus:border-[#1b61c9]"
  }`;

export default function NewCoursePage() {
  const router = useRouter();

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn:  async () => (await api.get("/admin/categories")).data,
  });
  const categories = categoriesData?.categories ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver:      zodResolver(schema) as unknown as Resolver<FormInput>,
    defaultValues: { status: "DRAFT", level: "BEGINNER", price: 0, thumbnail: "" },
  });

  const thumbnailUrl = watch("thumbnail") ?? "";
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const [thumbProgress, setThumbProgress] = useState(0);

  const uploadThumbnail = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>(
        "/teacher/upload-image", formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setThumbProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      return data.url;
    },
    onSuccess: (url) => {
      setValue("thumbnail", url, { shouldValidate: true });
      setThumbProgress(0);
    },
    onError: () => setThumbProgress(0),
  });

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setThumbProgress(0);
    uploadThumbnail.mutate(file);
  };

  const createCourse = useMutation({
    mutationFn: async (data: FormInput) =>
      (await api.post<{ course: { id: string } }>("/teacher/courses", data)).data.course,
    onSuccess: (course) => router.push(`/teacher/courses/${course.id}/edit`),
  });

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb items={[
          { label: "Khóa học", href: "/teacher/courses" },
          { label: "Tạo khóa học mới" },
        ]} />
        <h1 className="text-2xl font-semibold text-[#181d26]">Tạo khóa học mới</h1>
        <p className="text-sm text-[rgba(4,14,32,0.5)] mt-1">
          Điền thông tin cơ bản — thêm nội dung chi tiết ở bước tiếp theo
        </p>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl border border-[#e0e2e6] p-7"
        style={{ boxShadow: "rgba(15,48,106,0.06) 0px 0px 0px 1px, rgba(15,48,106,0.04) 0px 8px 24px" }}
      >
        {createCourse.isError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            Tạo khóa học thất bại. Vui lòng thử lại.
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createCourse.mutate(d))} className="space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="title">Tên khóa học</Label>
            <input
              id="title"
              placeholder="Ví dụ: Lập trình Web với React từ A-Z"
              {...register("title")}
              className={inputCls(!!errors.title)}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              rows={4}
              placeholder="Khóa học này sẽ giúp học viên..."
              {...register("description")}
              className={`${inputCls(!!errors.description)} resize-none`}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Thumbnail */}
          <div>
            <Label htmlFor="thumbnail">Ảnh bìa</Label>
            <input type="hidden" {...register("thumbnail")} />
            <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            {uploadThumbnail.isPending ? (
              <div className="px-4 py-4 border border-[#e0e2e6] rounded-xl bg-[#f8fafc] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[rgba(4,14,32,0.55)]">
                  <span>Đang tải ảnh lên...</span>
                  <span className="font-medium text-[#1b61c9]">{thumbProgress}%</span>
                </div>
                <div className="h-1.5 bg-[#e0e2e6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1b61c9] rounded-full transition-all duration-300" style={{ width: `${thumbProgress}%` }} />
                </div>
              </div>
            ) : thumbnailUrl ? (
              <div className="space-y-2">
                <img src={thumbnailUrl} alt="thumbnail preview" className="w-full h-44 object-cover rounded-xl border border-[#e0e2e6]" />
                <button
                  type="button"
                  onClick={() => thumbnailRef.current?.click()}
                  className="w-full py-1.5 text-xs font-medium border border-[#e0e2e6] rounded-lg text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
                >
                  Thay thế ảnh
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-8 border border-dashed border-[#c0c8d5] rounded-xl text-[rgba(4,14,32,0.55)] hover:border-[#1b61c9] hover:text-[#1b61c9] hover:bg-[#1b61c9]/4 transition-colors"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#f0f4fb] flex items-center justify-center">
                  <ImageIcon size={20} className="text-[#1b61c9]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Nhấn để tải lên ảnh bìa</p>
                  <p className="text-xs text-[rgba(4,14,32,0.4)] mt-0.5">JPG · PNG · WebP · GIF — tối đa 10MB</p>
                </div>
              </button>
            )}
            <FieldError message={errors.thumbnail?.message} />
          </div>

          <div className="border-t border-[#f0f2f5]" />

          {/* Category + Level row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Danh mục</Label>
              <select
                id="category_id"
                {...register("category_id")}
                className={inputCls(!!errors.category_id)}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <FieldError message={errors.category_id?.message} />
            </div>

            <div>
              <Label htmlFor="level">Cấp độ</Label>
              <select id="level" {...register("level")} className={inputCls(!!errors.level)}>
                <option value="BEGINNER">Cơ bản</option>
                <option value="INTERMEDIATE">Trung cấp</option>
                <option value="ADVANCED">Nâng cao</option>
              </select>
              <FieldError message={errors.level?.message} />
            </div>
          </div>

          {/* Price + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Giá (VND)</Label>
              <input
                id="price"
                type="number"
                min={0}
                step={1000}
                placeholder="0 = Miễn phí"
                {...register("price")}
                className={inputCls(!!errors.price)}
              />
              <FieldError message={errors.price?.message} />
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <select id="status" {...register("status")} className={inputCls(!!errors.status)}>
                <option value="DRAFT">Nháp (chưa công bố)</option>
                <option value="PUBLISHED">Công bố ngay</option>
              </select>
              <FieldError message={errors.status?.message} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-[#f0f2f5]">
            <Link
              href="/teacher/courses"
              className="px-5 py-2.5 text-sm font-medium text-[rgba(4,14,32,0.6)] hover:text-[#181d26] transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={createCourse.isPending}
              className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
              style={{ boxShadow: "rgba(27,97,201,0.3) 0px 4px 12px" }}
            >
              {createCourse.isPending ? "Đang tạo..." : "Tạo và thêm nội dung →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
