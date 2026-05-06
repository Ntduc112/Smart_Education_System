import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password_hash: newHash } });

    return NextResponse.json({ message: "Đổi mật khẩu thành công" }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
