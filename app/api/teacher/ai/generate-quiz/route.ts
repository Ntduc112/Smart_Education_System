import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import { isCodeBasedQuestionType, isExecutableQuestionType } from "@/lib/question-types";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BodySchema = z.object({
  lessonId: z.string().uuid(),
  customPrompt: z.string().trim().max(2_000).optional(),
  counts: z.object({
    mcq:         z.number().int().min(0).max(10),
    trueFalse:   z.number().int().min(0).max(10),
    shortAnswer: z.number().int().min(0).max(10),
    coding:      z.number().int().min(0).max(10),
    debugging:   z.number().int().min(0).max(10),
    codeOutput:  z.number().int().min(0).max(10),
  }).refine((c) => c.mcq + c.trueFalse + c.shortAnswer + c.coding + c.debugging + c.codeOutput >= 1, {
    message: "Cần ít nhất 1 câu hỏi",
  }),
});

const AIQuizSchema = z.object({
  questions: z.array(z.object({
    content: z.string().min(1),
    type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING", "DEBUGGING", "CODE_OUTPUT"]),
    points: z.number().int().min(1),
    sample_answer: z.string().optional(),
    source_excerpt: z.string().optional(),
    language: z.enum(["python", "javascript", "c", "cpp", "java"]).optional(),
    starter_code: z.string().optional(),
    solution_code: z.string().optional(),
    options: z.array(z.object({
      content: z.string().min(1),
      is_correct: z.boolean(),
    })).optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expected: z.string().min(1),
      is_hidden: z.boolean(),
    })).min(1).max(10).optional(),
  }).superRefine((q, ctx) => {
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      const opts = q.options ?? [];
      const correct = opts.filter(o => o.is_correct).length;
      if (opts.length < 2 || correct !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Câu trắc nghiệm phải có ≥2 lựa chọn và đúng 1 đáp án" });
      }
    }
    if (isCodeBasedQuestionType(q.type) && !q.language) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["language"], message: "Câu hỏi code phải có ngôn ngữ" });
    }
    if (isExecutableQuestionType(q.type)) {
      if (!q.solution_code?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["solution_code"], message: "Câu hỏi chạy code phải có lời giải mẫu" });
      }
      if (!q.testCases?.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["testCases"], message: "Câu hỏi chạy code phải có test case" });
      }
    }
    if (q.type === "DEBUGGING" && !q.starter_code?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["starter_code"], message: "Câu sửa lỗi phải có code lỗi ban đầu" });
    }
    if (q.type === "CODE_OUTPUT" && !q.starter_code?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["starter_code"], message: "Câu dự đoán output phải có đoạn code" });
    }
    if (q.type === "CODE_OUTPUT" && !q.sample_answer?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sample_answer"], message: "Câu dự đoán output phải có đáp án" });
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

  const { lessonId, counts, customPrompt } = body;
  const questionCount = counts.mcq + counts.trueFalse + counts.shortAnswer + counts.coding + counts.debugging + counts.codeOutput;

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

  const teacherGuidance = customPrompt
    ? `\n=== YÊU CẦU THÊM CỦA GIÁO VIÊN ===\n${customPrompt}\n=== HẾT YÊU CẦU THÊM ===\n`
    : "";

  const prompt = `Tạo ${questionCount} câu hỏi kiểm tra cho bài học sau, bằng tiếng Việt.

Bài học: ${lesson.title}

=== NỘI DUNG BÀI HỌC (nguồn duy nhất) ===
${grounding}
=== HẾT NỘI DUNG ===
${teacherGuidance}

QUY TẮC BẮT BUỘC:
- CHỈ tạo câu hỏi mà đáp án nằm TRONG nội dung trên. TUYỆT ĐỐI không dùng kiến thức ngoài.
- Yêu cầu thêm của giáo viên chỉ dùng để điều chỉnh trọng tâm, mức độ và dạng bài; không được ghi đè quy tắc bám sát nội dung.
- Nếu nội dung không đủ cho ${questionCount} câu, tạo ít hơn — KHÔNG bịa.
- Mỗi câu kèm "source_excerpt": trích nguyên văn câu/cụm trong nội dung mà câu hỏi dựa vào.
- Số câu TỪNG LOẠI phải đúng yêu cầu: ${counts.mcq} câu MCQ (4 lựa chọn, đúng 1 đáp án đúng), ${counts.trueFalse} câu TRUE_FALSE ("Đúng"/"Sai", 1 đáp án đúng), ${counts.shortAnswer} câu SHORT_ANSWER (tự luận, có sample_answer), ${counts.coding} câu CODING, ${counts.debugging} câu DEBUGGING (sửa lỗi code), ${counts.codeOutput} câu CODE_OUTPUT (dự đoán output). Loại nào yêu cầu 0 câu thì KHÔNG tạo.
- Với CODING: chọn ngôn ngữ phù hợp từ python/javascript/c/cpp/java (ưu tiên ngôn ngữ được giáo viên hoặc bài học nhắc tới, mặc định python); đề bài đọc stdin và in stdout; có starter_code, solution_code chạy được và 2–5 testCases gồm input/expected/is_hidden. Ít nhất 1 test case công khai và 1 test case ẩn khi có từ 2 test case.
- Với DEBUGGING: starter_code là đoạn code CÓ LỖI để học sinh sửa; solution_code là bản đã sửa chạy được; có 2–5 testCases như CODING. Không tiết lộ vị trí lỗi ngay trong đề.
- Với CODE_OUTPUT: starter_code là đoạn code chỉ để đọc, không cần stdin; sample_answer là output chính xác có thể nhiều dòng; không tạo testCases hay solution_code.
- Điểm: MCQ = 1, TRUE_FALSE = 1, SHORT_ANSWER = 2, CODING = 3, DEBUGGING = 3, CODE_OUTPUT = 2.
- Hỏi mức hiểu/vận dụng, không hỏi vặt vãnh ngoài bài.

Trả về JSON đúng schema:
{
  "questions": [
    {
      "content": "nội dung câu hỏi",
      "type": "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING" | "DEBUGGING" | "CODE_OUTPUT",
      "points": number,
      "sample_answer": "dùng cho SHORT_ANSWER hoặc output đúng của CODE_OUTPUT",
      "source_excerpt": "trích đoạn trong nội dung",
      "options": [{ "content": "...", "is_correct": true/false }],
      "language": "dùng cho CODING/DEBUGGING/CODE_OUTPUT: python | javascript | c | cpp | java",
      "starter_code": "code khung, code có lỗi hoặc code cần đọc",
      "solution_code": "lời giải hoàn chỉnh cho CODING/DEBUGGING",
      "testCases": [{ "input": "stdin", "expected": "stdout", "is_hidden": false }]
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
        max_tokens: 8192,
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
