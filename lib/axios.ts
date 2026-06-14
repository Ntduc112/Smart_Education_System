import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Auto-refresh access token khi gặp 401 ───────────────────────────────────
// 1 lần refresh dùng chung cho nhiều request 401 đồng thời (gộp vào 1 promise).
let refreshing: Promise<void> | null = null;

async function refreshToken() {
  // dùng axios gốc (không qua instance `api`) để khỏi lọt vào interceptor → lặp
  await axios.post("/api/auth/refresh");
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = original?.url ?? "";

    // chỉ xử lý 401, không retry lần 2, và không refresh cho chính endpoint auth
    const isAuthEndpoint = url.includes("/auth/refresh") || url.includes("/auth/login");
    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshing = refreshing ?? refreshToken().finally(() => { refreshing = null; });
      await refreshing;
      return api(original); // retry request gốc với access token mới
    } catch (refreshErr) {
      // refresh token cũng hết hạn / bị thu hồi → buộc đăng nhập lại
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    }
  }
);

export default api;
