import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
- Chấm công bằng, khuyến khích học sinh`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: { type: Type.NUMBER, description: "Điểm số từ 0 đến maxPoints" },
            feedback: { type: Type.STRING, description: "Nhận xét bằng tiếng Việt" },
          },
          required: ["points", "feedback"],
        },
        maxOutputTokens: 512,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as { points: number; feedback: string };

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
