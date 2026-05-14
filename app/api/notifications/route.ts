import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notifications = await prisma.notification.findMany({
      where:   { user_id: userId },
      orderBy: [{ is_read: "asc" }, { created_at: "desc" }],
      take:    20,
      select:  { id: true, type: true, title: true, message: true, link: true, is_read: true, created_at: true },
    });

    const unread_count = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({ notifications, unread_count });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
