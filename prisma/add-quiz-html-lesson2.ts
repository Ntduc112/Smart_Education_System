import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Tìm khóa học HTML
  const course = await prisma.course.findFirst({
    where: { title: { contains: "HTML" } },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) throw new Error("Không tìm thấy khóa học HTML. Hãy chạy add-html-course.ts trước.");

  // Lấy tất cả lessons theo thứ tự chương → bài
  const allLessons = course.sections.flatMap((s) => s.lessons);
  console.log("Danh sách lessons:");
  allLessons.forEach((l, i) => console.log(`  ${i + 1}. ${l.title} (id: ${l.id})`));

  const lesson2 = allLessons[1]; // lesson thứ 2 (index 1)
  if (!lesson2) throw new Error("Không tìm thấy lesson 2.");
  console.log(`\n✓ Target lesson: "${lesson2.title}" (${lesson2.id})`);

  // Kiểm tra quiz đã tồn tại chưa
  const existing = await prisma.quiz.findFirst({ where: { lesson_id: lesson2.id } });
  if (existing) {
    console.log("⚠️  Quiz đã tồn tại, skipping.");
    return;
  }

  // Tạo quiz
  const quiz = await prisma.quiz.create({
    data: {
      lesson_id: lesson2.id,
      title: "Kiểm tra: Thiết lập môi trường HTML",
      pass_score: 70,
      time_limit: 10, // 10 phút
    },
  });
  console.log(`✓ Quiz created: ${quiz.title}`);

  // Câu 1 — MCQ
  const q1 = await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      content: "Phần mở rộng (extension) nào dưới đây thường được cài thêm trong VS Code để hỗ trợ viết HTML hiệu quả hơn?",
      type: "MCQ",
      points: 2,
      order: 1,
    },
  });
  await prisma.option.createMany({
    data: [
      { question_id: q1.id, content: "Prettier",        is_correct: false, order: 1 },
      { question_id: q1.id, content: "Live Server",     is_correct: true,  order: 2 },
      { question_id: q1.id, content: "GitLens",         is_correct: false, order: 3 },
      { question_id: q1.id, content: "Docker",          is_correct: false, order: 4 },
    ],
  });
  console.log("  ✓ Câu 1 (MCQ)");

  // Câu 2 — TRUE_FALSE
  const q2 = await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      content: "VS Code là trình soạn thảo code phổ biến nhất để viết HTML và được cung cấp miễn phí bởi Microsoft.",
      type: "TRUE_FALSE",
      points: 1,
      order: 2,
    },
  });
  await prisma.option.createMany({
    data: [
      { question_id: q2.id, content: "True",  is_correct: true,  order: 1 },
      { question_id: q2.id, content: "False", is_correct: false, order: 2 },
    ],
  });
  console.log("  ✓ Câu 2 (TRUE_FALSE)");

  // Câu 3 — MCQ
  const q3 = await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      content: "Để mở nhanh một file trong VS Code, bạn dùng tổ hợp phím nào?",
      type: "MCQ",
      points: 2,
      order: 3,
    },
  });
  await prisma.option.createMany({
    data: [
      { question_id: q3.id, content: "Ctrl + N",        is_correct: false, order: 1 },
      { question_id: q3.id, content: "Ctrl + P",        is_correct: true,  order: 2 },
      { question_id: q3.id, content: "Ctrl + Shift + F",is_correct: false, order: 3 },
      { question_id: q3.id, content: "Alt + Tab",       is_correct: false, order: 4 },
    ],
  });
  console.log("  ✓ Câu 3 (MCQ)");

  // Câu 4 — TRUE_FALSE
  const q4 = await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      content: "Notepad (mặc định của Windows) là công cụ tốt nhất để viết HTML chuyên nghiệp.",
      type: "TRUE_FALSE",
      points: 1,
      order: 4,
    },
  });
  await prisma.option.createMany({
    data: [
      { question_id: q4.id, content: "True",  is_correct: false, order: 1 },
      { question_id: q4.id, content: "False", is_correct: true,  order: 2 },
    ],
  });
  console.log("  ✓ Câu 4 (TRUE_FALSE)");

  // Câu 5 — SHORT_ANSWER
  await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      content: "Theo bạn, tại sao nên dùng code editor chuyên dụng (như VS Code) thay vì Notepad khi viết HTML?",
      type: "SHORT_ANSWER",
      points: 3,
      order: 5,
      sample_answer: "Code editor chuyên dụng hỗ trợ syntax highlighting, auto-completion, extension, giúp phát hiện lỗi nhanh hơn và tăng năng suất.",
    },
  });
  console.log("  ✓ Câu 5 (SHORT_ANSWER)");

  console.log("\n✅ Quiz và 5 câu hỏi đã được tạo thành công!");
  console.log(`   Pass score: ${quiz.pass_score}% | Time limit: ${quiz.time_limit} phút`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
