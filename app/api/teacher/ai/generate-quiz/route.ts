import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BodySchema = z.object({
  lessonTitle: z.string().min(1).max(200),
  lessonContent: z.string().max(8000).nullable().optional(),
  questionCount: z.number().int().min(1).max(10).default(5),
});

const AIQuizSchema = z.object({
  questions: z.array(z.object({
    content: z.string().min(1),
    type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
    points: z.number().int().min(1),
    sample_answer: z.string().optional(),
    options: z.array(z.object({
      content: z.string().min(1),
      is_correct: z.boolean(),
    })).optional(),
  })).min(1),
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
- Câu hỏi kiểm tra hiểu bài, không chỉ ghi nhớ máy móc

Trả về JSON theo đúng schema:
{
  "questions": [
    {
      "content": "nội dung câu hỏi",
      "type": "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER",
      "points": number,
      "sample_answer": "chỉ dùng cho SHORT_ANSWER",
      "options": [{ "content": "...", "is_correct": true/false }]
    }
  ]
}`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = AIQuizSchema.parse(JSON.parse(raw));

    return NextResponse.json({ questions: parsed.questions });
  } catch (err) {
    console.error("[AI Generate Quiz] error:", err);
    return NextResponse.json({ error: "Không thể tạo câu hỏi. Vui lòng thử lại." }, { status: 500 });
  }
}
