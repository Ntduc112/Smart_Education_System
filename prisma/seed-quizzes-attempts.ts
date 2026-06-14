import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, question_type } from "./generated/prisma";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ----------------------------------------------------------------------------
// Phase A — generate a quiz (5 questions) for every lesson missing one.
// ----------------------------------------------------------------------------

const AIQuizSchema = z.object({
  questions: z
    .array(
      z.object({
        content: z.string().min(1),
        type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
        points: z.number().int().min(1),
        sample_answer: z.string().optional(),
        options: z
          .array(z.object({ content: z.string().min(1), is_correct: z.boolean() }))
          .optional(),
      }),
    )
    .min(1),
});

type GenQuestion = z.infer<typeof AIQuizSchema>["questions"][number];

function fallbackQuestions(title: string): GenQuestion[] {
  return [
    {
      content: `Bài học "${title}" tập trung vào nội dung chính nào?`,
      type: "MCQ",
      points: 1,
      options: [
        { content: "Đúng trọng tâm của bài học", is_correct: true },
        { content: "Một chủ đề không liên quan", is_correct: false },
        { content: "Kiến thức của bài khác", is_correct: false },
        { content: "Không có nội dung nào", is_correct: false },
      ],
    },
    {
      content: `Bạn cần nắm vững kiến thức trong "${title}" trước khi sang bài tiếp theo.`,
      type: "TRUE_FALSE",
      points: 1,
      options: [
        { content: "Đúng", is_correct: true },
        { content: "Sai", is_correct: false },
      ],
    },
    {
      content: `Nội dung của bài "${title}" là tùy chọn, không cần học.`,
      type: "TRUE_FALSE",
      points: 1,
      options: [
        { content: "Đúng", is_correct: false },
        { content: "Sai", is_correct: true },
      ],
    },
    {
      content: `Hãy tóm tắt ngắn gọn điều bạn học được từ bài "${title}".`,
      type: "SHORT_ANSWER",
      points: 2,
      sample_answer: `Tóm tắt các ý chính đã trình bày trong bài "${title}".`,
    },
  ];
}

async function generateQuestions(title: string, content: string | null): Promise<GenQuestion[]> {
  const prompt = `Tạo 5 câu hỏi kiểm tra kiến thức cho bài học sau bằng tiếng Việt.

Bài học: ${title}
${content ? `\nNội dung:\n${content.slice(0, 6000)}` : ""}

Yêu cầu:
- Đa dạng loại câu hỏi: MCQ (nhiều lựa chọn), TRUE_FALSE (đúng/sai), SHORT_ANSWER (tự luận)
- Câu hỏi MCQ có đúng 4 lựa chọn, chỉ 1 đáp án đúng
- Câu hỏi TRUE_FALSE có đúng 2 lựa chọn: "Đúng" và "Sai"
- Câu hỏi SHORT_ANSWER có sample_answer là gợi ý đáp án ngắn
- Điểm mỗi câu: MCQ = 1, TRUE_FALSE = 1, SHORT_ANSWER = 2
- Câu hỏi kiểm tra hiểu bài, không chỉ ghi nhớ máy móc

Trả về JSON theo đúng schema:
{ "questions": [ { "content": "...", "type": "MCQ"|"TRUE_FALSE"|"SHORT_ANSWER", "points": number, "sample_answer": "...", "options": [{ "content": "...", "is_correct": true/false }] } ] }`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2048,
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("empty");
      return AIQuizSchema.parse(JSON.parse(raw)).questions;
    } catch (e) {
      if (attempt === 1) {
        console.warn(`    ⚠️  AI failed for "${title}", dùng fallback. (${(e as Error).message})`);
        return fallbackQuestions(title);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return fallbackQuestions(title);
}

async function createQuizForLesson(lesson: { id: string; title: string; content: string | null }) {
  const questions = await generateQuestions(lesson.title, lesson.content);
  const quiz = await prisma.quiz.create({
    data: {
      lesson_id: lesson.id,
      title: `Kiểm tra: ${lesson.title}`,
      pass_score: 70,
      time_limit: 10,
    },
  });
  let order = 1;
  for (const q of questions) {
    const isTF = q.type === "TRUE_FALSE";
    const created = await prisma.question.create({
      data: {
        quiz_id: quiz.id,
        content: q.content,
        type: q.type as question_type,
        points: q.points,
        order: order++,
        sample_answer: q.type === "SHORT_ANSWER" ? q.sample_answer ?? null : null,
      },
    });
    if (q.type !== "SHORT_ANSWER") {
      let opts = q.options ?? [];
      if (isTF && opts.length !== 2) {
        opts = [
          { content: "Đúng", is_correct: true },
          { content: "Sai", is_correct: false },
        ];
      }
      if (!opts.some((o) => o.is_correct) && opts.length) opts[0].is_correct = true;
      await prisma.option.createMany({
        data: opts.map((o, i) => ({
          question_id: created.id,
          content: o.content,
          is_correct: o.is_correct,
          order: i + 1,
        })),
      });
    }
  }
  return quiz.id;
}

// simple concurrency-limited map
async function pMap<T, R>(items: T[], limit: number, fn: (it: T, i: number) => Promise<R>) {
  const ret: R[] = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      ret[cur] = await fn(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return ret;
}

async function phaseQuizzes() {
  const lessons = await prisma.lesson.findMany({
    where: { quiz: { none: {} } },
    select: { id: true, title: true, content: true },
    orderBy: { order: "asc" },
  });
  console.log(`\n=== Phase A: ${lessons.length} lesson thiếu quiz ===`);
  let done = 0;
  await pMap(lessons, 4, async (l) => {
    await createQuizForLesson(l);
    done++;
    console.log(`  [${done}/${lessons.length}] ✓ ${l.title}`);
  });
  console.log(`✅ Tạo xong quiz cho ${lessons.length} lesson.`);
}

// ----------------------------------------------------------------------------
// Phase B — create quiz attempts for enrolled students.
// ----------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function phaseAttempts() {
  console.log(`\n=== Phase B: tạo bài làm quiz cho học sinh ===`);
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: { include: { options: true }, orderBy: { order: "asc" } },
      lesson: { select: { chapter: { select: { course_id: true } } } },
    },
  });

  let attemptCount = 0;
  let answerCount = 0;

  for (const quiz of quizzes) {
    const courseId = quiz.lesson?.chapter?.course_id;
    if (!courseId || quiz.questions.length === 0) continue;

    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: courseId, user: { role: "STUDENT" } },
      select: { user_id: true },
    });
    if (enrollments.length === 0) continue;

    for (const { user_id } of enrollments) {
      const existing = await prisma.quizAttempt.findFirst({
        where: { quiz_id: quiz.id, user_id },
        select: { id: true },
      });
      if (existing) continue;

      // per-attempt skill: probability a given question is answered correctly
      const skill = 0.45 + Math.random() * 0.5; // 0.45 - 0.95

      const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);
      let earned = 0;
      const answerData: {
        question_id: string;
        answer: string;
        is_correct: boolean;
        points_earned: number;
      }[] = [];

      for (const q of quiz.questions) {
        const correctThis = Math.random() < skill;
        if (q.type === "SHORT_ANSWER") {
          const ans = correctThis
            ? q.sample_answer ?? "Câu trả lời đúng trọng tâm bài học."
            : "Em chưa chắc chắn về câu trả lời này.";
          const pts = correctThis ? q.points : Math.random() < 0.4 ? q.points / 2 : 0;
          earned += pts;
          answerData.push({
            question_id: q.id,
            answer: ans,
            is_correct: correctThis,
            points_earned: pts,
          });
        } else {
          const correctOpt = q.options.find((o) => o.is_correct);
          const wrongOpts = q.options.filter((o) => !o.is_correct);
          const chosen = correctThis || wrongOpts.length === 0 ? correctOpt : pick(wrongOpts);
          const isCorrect = !!chosen?.is_correct;
          const pts = isCorrect ? q.points : 0;
          earned += pts;
          answerData.push({
            question_id: q.id,
            answer: chosen?.content ?? "",
            is_correct: isCorrect,
            points_earned: pts,
          });
        }
      }

      const score = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
      const attempt = await prisma.quizAttempt.create({
        data: {
          user_id,
          quiz_id: quiz.id,
          score,
          is_passed: score >= quiz.pass_score,
        },
      });
      await prisma.attemptAnswer.createMany({
        data: answerData.map((a) => ({ ...a, attempt_id: attempt.id })),
      });
      attemptCount++;
      answerCount += answerData.length;
    }
  }
  console.log(`✅ Tạo ${attemptCount} bài làm, ${answerCount} câu trả lời.`);
}

async function main() {
  const arg = process.argv[2] ?? "all";
  if (arg === "quizzes" || arg === "all") await phaseQuizzes();
  if (arg === "attempts" || arg === "all") await phaseAttempts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
