import { z } from "zod";

export const editUserSchema = z.object({
  name:  z.string().min(1, "Họ tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  role:  z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
