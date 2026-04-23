import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { LoginInput, AuthUser } from "./login.schema";

async function login(payload: LoginInput): Promise<{ user: AuthUser }> {
  const { data } = await api.post<{ user: AuthUser }>("/auth/login", payload);
  return data;
}

export function useLogin() {
  return useMutation({ mutationFn: login });
}
