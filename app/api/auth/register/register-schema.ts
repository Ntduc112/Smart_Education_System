import { z } from "zod";

// Schema payload đăng ký — dùng chung cho bước gửi OTP và bước verify tạo user
export const Registerschema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["STUDENT", "TEACHER"], { message: "Role must be either STUDENT or TEACHER" })
});
