import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data:  { is_read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
