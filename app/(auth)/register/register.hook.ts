import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { RegisterInput, AuthUser } from "./register.schema";

// Bước 1: gửi OTP về email (user chưa được tạo)
async function register(payload: RegisterInput): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/register", payload);
  return data;
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

// Bước 2: xác thực OTP → tạo user
async function verifyRegister(payload: RegisterInput & { code: string }): Promise<{ user: AuthUser }> {
  const { data } = await api.post<{ user: AuthUser }>("/auth/register/verify", payload);
  return data;
}

export function useVerifyRegister() {
  return useMutation({ mutationFn: verifyRegister });
}
