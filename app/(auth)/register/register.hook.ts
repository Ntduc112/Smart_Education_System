import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { RegisterInput, AuthUser } from "./register.schema";

async function register(payload: RegisterInput): Promise<{ user: AuthUser }> {
  const { data } = await api.post<{ user: AuthUser }>("/auth/register", payload);
  return data;
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}
