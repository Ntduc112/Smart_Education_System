import { z } from "zod";

export const editUserSchema = z.object({
  name:     z.string().min(1, "Họ tên không được để trống"),
  email:    z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .optional()
    .or(z.literal("")),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
