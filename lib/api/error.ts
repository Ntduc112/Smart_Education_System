import { isAxiosError } from "axios";

export function getApiError(err: unknown, fallback = "Đã xảy ra lỗi"): string {
  if (isAxiosError(err)) {
    return err.response?.data?.error ?? err.response?.data?.errors ?? fallback;
  }
  return "Lỗi kết nối, vui lòng thử lại";
}
