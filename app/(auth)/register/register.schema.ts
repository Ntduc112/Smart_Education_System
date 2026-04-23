import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Họ tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["STUDENT", "TEACHER"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatar: string | null;
  created_at: string;
  updated_at: string;
}
