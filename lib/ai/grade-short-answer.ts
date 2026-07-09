import Groq from "groq-sdk";
import { z } from "zod";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GradeSchema = z.object({
  points: z.number(),
  feedback: z.string().min(1),
});

export interface GradeInput {
  questionContent: string;
  sampleAnswer?: string | null;
  studentAnswer: string;
  maxPoints: number;
}

export interface GradeResult {
  points: number;
  feedback: string;
}

/**
 * Chấm câu tự luận bằng Groq LLM. Điểm được clamp [0, maxPoints], làm tròn 0.5.
 * Throw khi AI trả lỗi/JSON sai — caller tự quyết fallback (vd: rơi về chấm tay).
 */
export async function gradeShortAnswer({
  questionContent, sampleAnswer, studentAnswer, maxPoints,
}: GradeInput): Promise<GradeResult> {
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

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 512,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response");

  const parsed = GradeSchema.parse(JSON.parse(raw));
  const points = Math.min(maxPoints, Math.max(0, parsed.points));
  return { points: Math.round(points * 2) / 2, feedback: parsed.feedback };
}
