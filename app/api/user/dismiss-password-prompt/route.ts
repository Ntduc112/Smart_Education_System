import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// User đóng modal nhắc đổi mật khẩu lần đầu → thôi nhắc vĩnh viễn.
export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { must_change_password: false },
  });
  return NextResponse.json({ ok: true });
}
