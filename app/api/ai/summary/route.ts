import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const BodySchema = z.object({
  lessonTitle:   z.string().min(1).max(200),
  lessonContent: z.string().max(8000).nullable().optional(),
  courseTitle:   z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const { lessonTitle, lessonContent, courseTitle } = body;

  const prompt = `Tóm tắt tài liệu bài học sau bằng tiếng Việt dưới dạng 3–6 bullet points, mỗi điểm là một ý chính quan trọng.

Khóa học: ${courseTitle}
Bài học: ${lessonTitle}
${lessonContent ? `\nTài liệu:\n"""\n${lessonContent}\n"""` : "\n(Không có tài liệu — chỉ tóm tắt dựa trên tên bài học)"}

Yêu cầu:
- Chỉ tóm tắt từ tài liệu được cung cấp, không thêm thông tin bên ngoài
- Định dạng: • Ý chính...
- Mỗi bullet ngắn gọn (1–2 câu), tập trung kiến thức cốt lõi`;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model:      "llama-3.3-70b-versatile",
          stream:     true,
          max_tokens: 512,
          messages:   [{ role: "user", content: prompt }],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error("[AI Summary] Groq error:", err);
        controller.enqueue(encoder.encode("_Không thể tạo tóm tắt. Vui lòng thử lại._"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":    "text/plain; charset=utf-8",
      "Cache-Control":   "no-cache, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
