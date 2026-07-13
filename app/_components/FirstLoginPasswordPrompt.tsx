"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChangePasswordModal } from "@/app/(auth)/changePassword/ChangePasswordModal";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import api from "@/lib/axios";

// Account do giáo viên tạo sẵn (trợ giảng) còn giữ mật khẩu tạm → sau khi vào
// trang đích, nhắc đổi mật khẩu ĐÚNG MỘT LẦN: đổi xong hay bấm Hủy đều tắt cờ
// trong DB, không hỏi lại.
export function FirstLoginPasswordPrompt() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [closed, setClosed] = useState(false);

  if (closed || !me?.must_change_password) return null;

  return (
    <ChangePasswordModal
      requireName={me.name}
      onClose={async () => {
        setClosed(true); // ẩn ngay, không chờ server
        // Đổi mật khẩu thành công cũng đã tắt cờ — gọi thêm lần nữa vô hại.
        await api.post("/user/dismiss-password-prompt").catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }}
    />
  );
}
