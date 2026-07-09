import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gradeShortAnswer } from "@/lib/ai/grade-short-answer";

const BodySchema = z.object({
  questionContent: z.string().min(1).max(2000),
  sampleAnswer: z.string().max(2000).nullable().optional(),
  studentAnswer: z.string().min(1).max(4000),
  maxPoints: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { points, feedback } = await gradeShortAnswer(body);
    return NextResponse.json({ points, feedback });
  } catch (err) {
    console.error("[AI Grade] error:", err);
    return NextResponse.json({ error: "Không thể kết nối AI. Vui lòng thử lại." }, { status: 500 });
  }
}
