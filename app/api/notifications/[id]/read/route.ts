import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.notification.updateMany({
      where: { id, user_id: userId },
      data:  { is_read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
