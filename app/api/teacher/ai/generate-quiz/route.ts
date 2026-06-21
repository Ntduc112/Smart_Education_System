import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import prisma from "@/prisma/prisma";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BodySchema = z.object({
  lessonId: z.string().uuid(),
  questionCount: z.number().int().min(1).max(10).default(5),
});

const AIQuizSchema = z.object({
  questions: z.array(z.object({
    content: z.string().min(1),
    type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
    points: z.number().int().min(1),
    sample_answer: z.string().optional(),
    source_excerpt: z.string().optional(),
    options: z.array(z.object({
      content: z.string().min(1),
      is_correct: z.boolean(),
    })).optional(),
  }).superRefine((q, ctx) => {
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      const opts = q.options ?? [];
      const correct = opts.filter(o => o.is_correct).length;
      if (opts.length < 2 || correct !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Câu trắc nghiệm phải có ≥2 lựa chọn và đúng 1 đáp án" });
      }
    }
  })).min(1),
});

// Nguồn nội dung dùng để "neo" câu hỏi, gộp từ mọi field có dữ liệu.
const MAX_GROUNDING = 24000;

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lessonId, questionCount } = body;

  // Tra lesson + kiểm tra giáo viên sở hữu khóa học chứa bài này.
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, chapter: { course: { instructor_id: userId } } },
    select: { title: true, content: true, pdf_text: true, video_url: true },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // Lấy transcript video (nếu có) theo videoKey trích từ video_url ("r2:videos/...").
  let transcript: string | null = null;
  if (lesson.video_url) {
    const videoKey = lesson.video_url.replace(/^r2:/, "");
    const t = await prisma.videoTranscript.findUnique({ where: { video_key: videoKey } });
    if (t?.status === "done" && t.text) transcript = t.text;
  }

  // Gộp các nguồn nội dung thực tế của bài học.
  const sources: string[] = [];
  if (lesson.content) sources.push(`[Nội dung bài]\n${lesson.content}`);
  if (lesson.pdf_text) sources.push(`[Tài liệu PDF]\n${lesson.pdf_text}`);
  if (transcript) sources.push(`[Lời giảng trong video]\n${transcript}`);
  const grounding = sources.join("\n\n").slice(0, MAX_GROUNDING);

  // Không có nội dung nào → không tạo câu chung chung, báo lỗi rõ để UI cảnh báo.
  if (!grounding.trim()) {
    return NextResponse.json(
      { error: "no_content", message: "Bài học chưa có nội dung (text/PDF/transcript) để tạo câu hỏi sát bài." },
      { status: 422 }
    );
  }

  const prompt = `Tạo ${questionCount} câu hỏi kiểm tra cho bài học sau, bằng tiếng Việt.

Bài học: ${lesson.title}

=== NỘI DUNG BÀI HỌC (nguồn duy nhất) ===
${grounding}
=== HẾT NỘI DUNG ===

QUY TẮC BẮT BUỘC:
- CHỈ tạo câu hỏi mà đáp án nằm TRONG nội dung trên. TUYỆT ĐỐI không dùng kiến thức ngoài.
- Nếu nội dung không đủ cho ${questionCount} câu, tạo ít hơn — KHÔNG bịa.
- Mỗi câu kèm "source_excerpt": trích nguyên văn câu/cụm trong nội dung mà câu hỏi dựa vào.
- Đa dạng loại: MCQ (4 lựa chọn, đúng 1 đáp án đúng), TRUE_FALSE ("Đúng"/"Sai", 1 đáp án đúng), SHORT_ANSWER (tự luận, có sample_answer).
- Điểm: MCQ = 1, TRUE_FALSE = 1, SHORT_ANSWER = 2.
- Hỏi mức hiểu/vận dụng, không hỏi vặt vãnh ngoài bài.

Trả về JSON đúng schema:
{
  "questions": [
    {
      "content": "nội dung câu hỏi",
      "type": "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER",
      "points": number,
      "sample_answer": "chỉ dùng cho SHORT_ANSWER",
      "source_excerpt": "trích đoạn trong nội dung",
      "options": [{ "content": "...", "is_correct": true/false }]
    }
  ]
}`;

  // Gọi LLM với retry: JSON/schema lỗi thì thử lại, hạ nhiệt độ dần.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: attempt === 0 ? 0.4 : 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty response");

      const parsed = AIQuizSchema.parse(JSON.parse(raw));
      return NextResponse.json({
        questions: parsed.questions,
        sourcesUsed: {
          content: !!lesson.content,
          pdf: !!lesson.pdf_text,
          transcript: !!transcript,
        },
      });
    } catch (err) {
      lastErr = err;
    }
  }

  console.error("[AI Generate Quiz] error:", lastErr);
  return NextResponse.json({ error: "Không thể tạo câu hỏi. Vui lòng thử lại." }, { status: 500 });
}
