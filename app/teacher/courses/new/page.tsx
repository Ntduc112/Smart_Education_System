"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/axios";

const schema = z.object({
  title:       z.string().min(1, "Tên khóa học là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  thumbnail:   z.string().url("URL ảnh không hợp lệ"),
  price:       z.coerce.number().min(0, "Giá phải ≥ 0"),
  level:       z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  status:      z.enum(["DRAFT", "PUBLISHED"]),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
});

type FormInput = z.infer<typeof schema>;

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
    formState: { errors },
  } = useForm<FormInput>({
    resolver:      zodResolver(schema),
    defaultValues: { status: "DRAFT", level: "BEGINNER", price: 0 },
  });

  const createCourse = useMutation({
    mutationFn: async (data: FormInput) =>
      (await api.post<{ course: { id: string } }>("/teacher/courses", data)).data.course,
    onSuccess: (course) => router.push(`/teacher/courses/${course.id}/edit`),
  });

  return (
    <div className="px-8 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/teacher/courses"
          className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#181d26]">Tạo khóa học mới</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">
            Điền thông tin cơ bản — thêm nội dung chi tiết ở bước tiếp theo
          </p>
        </div>
      </div>

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
          <Label htmlFor="thumbnail">URL ảnh bìa</Label>
          <input
            id="thumbnail"
            placeholder="https://example.com/thumbnail.jpg"
            {...register("thumbnail")}
            className={inputCls(!!errors.thumbnail)}
          />
          <FieldError message={errors.thumbnail?.message} />
        </div>

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
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/teacher/courses"
            className="px-5 py-2.5 text-sm font-medium text-[rgba(4,14,32,0.7)] border border-[#e0e2e6] rounded-xl hover:bg-[#f8fafc] transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors disabled:opacity-60"
            style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(45,127,249,0.28) 0px 1px 3px" }}
          >
            {createCourse.isPending ? "Đang tạo..." : "Tạo và thêm nội dung →"}
          </button>
        </div>
      </form>
    </div>
  );
}
