import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "TEACHING_ASSISTANT" | "ADMIN";
  must_change_password: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}
