import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ChangePasswordInput } from "./change-password.schema";

async function changePassword(payload: Omit<ChangePasswordInput, "confirmPassword">) {
  const { data } = await api.post("/user/change-password", payload);
  return data;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      changePassword({ currentPassword: input.currentPassword, newPassword: input.newPassword }),
  });
}
