import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BodySchema = z.object({
  pdfText: z.string().min(1).max(12000),
});

/**
 * POST /api/teacher/ai/extract-quiz
 *
 * Trích câu hỏi + đáp án CÓ SẴN trong text của file đề (PDF do giáo viên soạn).
 * Khác generate-quiz: KHÔNG bịa câu mới, chỉ cấu trúc hóa nguyên văn.
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = `Dưới đây là nội dung text của một đề kiểm tra do giáo viên soạn. Hãy TRÍCH XUẤT nguyên văn các câu hỏi và đáp án có sẵn, KHÔNG tự bịa thêm câu hỏi mới.

Quy tắc:
- Giữ nguyên văn câu hỏi và các lựa chọn đúng như trong đề.
- Xác định đáp án đúng dựa trên dấu hiệu trong đề (in đậm, dấu *, "Đáp án: B", phần đáp án ở cuối...). Nếu không tìm được đáp án đúng của một câu MCQ/TRUE_FALSE, bỏ qua câu đó.
- Phân loại type: MCQ (nhiều lựa chọn), TRUE_FALSE (Đúng/Sai), SHORT_ANSWER (tự luận, không có lựa chọn).
- Điểm: MCQ = 1, TRUE_FALSE = 1, SHORT_ANSWER = 2.
- SHORT_ANSWER: nếu đề có đáp án mẫu, đưa vào sample_answer.

Nội dung đề:
${body.pdfText}

Trả về JSON đúng schema:
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
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content;
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

    return NextResponse.json({ questions: parsed.questions ?? [] });
  } catch (err) {
    console.error("[AI Extract Quiz] error:", err);
    return NextResponse.json({ error: "Không thể trích xuất câu hỏi từ đề." }, { status: 500 });
  }
}
