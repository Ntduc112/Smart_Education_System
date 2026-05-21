import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  lessonTitle:   z.string().min(1).max(200),
  lessonContent: z.string().max(5000).nullable().optional(),
  courseTitle:   z.string().min(1).max(200),
  chapterTitle:  z.string().min(1).max(200),
  messages:      z.array(MessageSchema).min(1).max(20),
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

  const { lessonTitle, lessonContent, courseTitle, chapterTitle, messages } = body;

  const hasContent = !!lessonContent?.trim();

  const systemPrompt = `Bạn là trợ lý học tập AI của SmartEdu.

Học sinh đang học bài: "${lessonTitle}"
Thuộc chương: "${chapterTitle}" — Khóa học: "${courseTitle}"
${hasContent ? `\nTài liệu bài học:\n"""\n${lessonContent}\n"""` : "\n(Bài học này chưa có tài liệu đính kèm.)"}

QUY TẮC BẮT BUỘC:
1. Chỉ trả lời các câu hỏi liên quan đến nội dung bài học "${lessonTitle}" và tài liệu được cung cấp ở trên.
2. Nếu câu hỏi KHÔNG liên quan đến bài học này, từ chối lịch sự và nhắc học sinh hỏi về bài học.
3. Nếu câu hỏi liên quan nhưng tài liệu không đủ thông tin, nói rõ điều đó và giải thích dựa trên những gì có trong tài liệu.
4. KHÔNG dùng kiến thức bên ngoài tài liệu để trả lời — chỉ dựa vào tài liệu bài học.
5. Trả lời rõ ràng, ngắn gọn, có ví dụ từ tài liệu khi cần.

Trả lời bằng tiếng Việt.`;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model:    "llama-3.3-70b-versatile",
          stream:   true,
          max_tokens: 1024,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error("[AI Chat] Groq error:", err);
        controller.enqueue(
          encoder.encode("\n\n_Đã xảy ra lỗi kết nối. Vui lòng thử lại._")
        );
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
