"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChangePasswordModal } from "@/app/(auth)/changePassword/ChangePasswordModal";
import { useMe } from "@/app/student/dashboard/dashboard.hook";

const DISMISS_KEY = "first-login-password-prompt-dismissed";

// Account do giáo viên tạo sẵn (trợ giảng) còn giữ mật khẩu tạm → sau khi vào
// trang đích, nhắc đổi mật khẩu. Đóng modal thì thôi nhắc trong phiên này.
export function FirstLoginPasswordPrompt() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1",
  );

  if (!me?.must_change_password || dismissed) return null;

  return (
    <ChangePasswordModal
      onClose={() => {
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
        // Đổi thành công thì flag trong DB đã tắt — refetch để khỏi nhắc lại phiên sau.
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }}
    />
  );
}
