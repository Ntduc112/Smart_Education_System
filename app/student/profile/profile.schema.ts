import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Họ tên không được để trống"),
  avatar: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
