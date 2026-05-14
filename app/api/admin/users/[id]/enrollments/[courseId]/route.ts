import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const { id, courseId } = await params;
  try {
    await prisma.enrollment.deleteMany({
      where: { user_id: id, course_id: courseId },
    });
    return NextResponse.json({ message: "Enrollment removed" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
