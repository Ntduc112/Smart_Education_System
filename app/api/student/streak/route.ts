import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const progresses = await prisma.lessonProgress.findMany({
      where: { user_id: userId, is_completed: true },
      select: { updated_at: true },
      orderBy: { updated_at: "desc" },
    });

    // Tập hợp các ngày học duy nhất (UTC date string)
    const uniqueDates = [
      ...new Set(
        progresses.map((p) => p.updated_at.toISOString().split("T")[0])
      ),
    ].sort().reverse();

    if (uniqueDates.length === 0) {
      return NextResponse.json({ streak: 0, today_learned: false });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    const todayLearned = uniqueDates[0] === todayStr;
    // Streak bắt đầu từ hôm nay hoặc hôm qua
    const startStr = todayLearned ? todayStr : yesterdayStr;
    if (uniqueDates[0] !== startStr) {
      return NextResponse.json({ streak: 0, today_learned: false });
    }

    let streak = 0;
    let cursor = new Date(startStr + "T00:00:00Z");

    for (const dateStr of uniqueDates) {
      const d = new Date(dateStr + "T00:00:00Z");
      const diff = Math.round(
        (cursor.getTime() - d.getTime()) / 86400000
      );
      if (diff === 0 || diff === 1) {
        streak++;
        cursor = d;
      } else {
        break;
      }
    }

    return NextResponse.json({ streak, today_learned: todayLearned });
  } catch (error) {
    console.error("Streak error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
