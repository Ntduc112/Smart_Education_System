import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BodySchema = z.object({
  questionContent: z.string().min(1).max(2000),
  sampleAnswer: z.string().max(2000).nullable().optional(),
  studentAnswer: z.string().min(1).max(4000),
  maxPoints: z.number().positive(),
});

const GradeSchema = z.object({
  points: z.number(),
  feedback: z.string().min(1),
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

  const { questionContent, sampleAnswer, studentAnswer, maxPoints } = body;

  const prompt = `Bạn là giáo viên chấm bài. Hãy đánh giá câu trả lời tự luận của học sinh và đưa ra điểm số cùng nhận xét.

Câu hỏi: ${questionContent}
${sampleAnswer ? `Đáp án gợi ý: ${sampleAnswer}` : ""}
Điểm tối đa: ${maxPoints}

Bài làm của học sinh:
"""
${studentAnswer}
"""

Yêu cầu:
- Cho điểm từ 0 đến ${maxPoints} (có thể là số thập phân, bước 0.5)
- Nhận xét ngắn gọn bằng tiếng Việt (2–4 câu): ưu điểm, thiếu sót, gợi ý cải thiện
- Chấm công bằng, khuyến khích học sinh

Trả về JSON đúng schema:
{
  "points": number,
  "feedback": "nhận xét bằng tiếng Việt"
}`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = GradeSchema.parse(JSON.parse(raw));

    // Clamp điểm trong khoảng hợp lệ
    const points = Math.min(maxPoints, Math.max(0, parsed.points));
    // Làm tròn 0.5
    const roundedPoints = Math.round(points * 2) / 2;

    return NextResponse.json({ points: roundedPoints, feedback: parsed.feedback });
  } catch (err) {
    console.error("[AI Grade] error:", err);
    return NextResponse.json({ error: "Không thể kết nối AI. Vui lòng thử lại." }, { status: 500 });
  }
}
