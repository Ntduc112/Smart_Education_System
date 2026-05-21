import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const BodySchema = z.object({
  lessonTitle: z.string().min(1).max(200),
  lessonContent: z.string().max(8000).nullable().optional(),
  questionCount: z.number().int().min(1).max(10).default(5),
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

  const { lessonTitle, lessonContent, questionCount } = body;

  const prompt = `Tạo ${questionCount} câu hỏi kiểm tra kiến thức cho bài học sau bằng tiếng Việt.

Bài học: ${lessonTitle}
${lessonContent ? `\nNội dung:\n${lessonContent}` : ""}

Yêu cầu:
- Đa dạng loại câu hỏi: MCQ (nhiều lựa chọn), TRUE_FALSE (đúng/sai), SHORT_ANSWER (tự luận)
- Câu hỏi MCQ có đúng 4 lựa chọn, chỉ 1 đáp án đúng
- Câu hỏi TRUE_FALSE có đúng 2 lựa chọn: "Đúng" và "Sai"
- Câu hỏi SHORT_ANSWER có sample_answer là gợi ý đáp án ngắn
- Điểm mỗi câu: MCQ = 1, TRUE_FALSE = 1, SHORT_ANSWER = 2
- Câu hỏi kiểm tra hiểu bài, không chỉ ghi nhớ máy móc`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  content:       { type: Type.STRING },
                  type:          { type: Type.STRING, enum: ["MCQ", "TRUE_FALSE", "SHORT_ANSWER"] },
                  points:        { type: Type.NUMBER },
                  sample_answer: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        content:    { type: Type.STRING },
                        is_correct: { type: Type.BOOLEAN },
                      },
                      required: ["content", "is_correct"],
                    },
                  },
                },
                required: ["content", "type", "points"],
              },
            },
          },
          required: ["questions"],
        },
        maxOutputTokens: 2048,
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as {
      questions: {
        content: string;
        type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
        points: number;
        sample_answer?: string;
        options?: { content: string; is_correct: boolean }[];
      }[];
    };

    return NextResponse.json({ questions: parsed.questions });
  } catch (err) {
    console.error("[AI Generate Quiz] error:", err);
    return NextResponse.json({ error: "Không thể tạo câu hỏi. Vui lòng thử lại." }, { status: 500 });
  }
}
