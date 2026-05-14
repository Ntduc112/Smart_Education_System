import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const courses = await prisma.course.findMany({
      where:   { instructor_id: id },
      orderBy: { created_at: "desc" },
      select: {
        id:         true,
        title:      true,
        thumbnail:  true,
        status:     true,
        price:      true,
        created_at: true,
        _count:     { select: { enrollments: true } },
      },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
