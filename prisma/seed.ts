import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const hash = (pw: string) => bcrypt.hash(pw, 10);

async function main() {
  console.log("🌱 Seeding...");

  // ── Cleanup (order matters for FK constraints) ──────────────────────────
  await prisma.attemptAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ───────────────────────────────────────────────────────────────
  const [adminPw, teacherPw, studentPw] = await Promise.all([
    hash("Admin@123"),
    hash("Teacher@123"),
    hash("Student@123"),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Admin System",
      email: "admin@smartedu.vn",
      password_hash: adminPw,
      role: "ADMIN",
    },
  });

  const [teacher1, teacher2] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Nguyễn Văn An",
        email: "an.nguyen@smartedu.vn",
        password_hash: teacherPw,
        role: "TEACHER",
        avatar: "https://i.pravatar.cc/150?u=teacher1",
      },
    }),
    prisma.user.create({
      data: {
        name: "Trần Thị Bình",
        email: "binh.tran@smartedu.vn",
        password_hash: teacherPw,
        role: "TEACHER",
        avatar: "https://i.pravatar.cc/150?u=teacher2",
      },
    }),
  ]);

  const studentEmails = [
    { name: "Lê Văn Cường", email: "cuong@student.vn" },
    { name: "Phạm Thị Dung", email: "dung@student.vn" },
    { name: "Hoàng Minh Đức", email: "duc@student.vn" },
    { name: "Vũ Thị Hoa", email: "hoa@student.vn" },
    { name: "Đặng Quốc Huy", email: "huy@student.vn" },
  ];

  const students = await Promise.all(
    studentEmails.map((s) =>
      prisma.user.create({
        data: {
          ...s,
          password_hash: studentPw,
          role: "STUDENT",
          avatar: `https://i.pravatar.cc/150?u=${s.email}`,
        },
      })
    )
  );

  console.log(`✓ Users: 1 admin, 2 teachers, ${students.length} students`);

  // ── Categories ──────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Lập trình & Công nghệ", description: "Các khoá học về lập trình, web, mobile và AI" },
    }),
    prisma.category.create({
      data: { name: "Thiết kế & Sáng tạo", description: "UI/UX, đồ hoạ, video và thiết kế sản phẩm" },
    }),
    prisma.category.create({
      data: { name: "Kinh doanh & Khởi nghiệp", description: "Marketing, quản trị và tư duy khởi nghiệp" },
    }),
    prisma.category.create({
      data: { name: "Ngoại ngữ", description: "Tiếng Anh, Nhật, Hàn và các ngôn ngữ khác" },
    }),
  ]);

  console.log(`✓ Categories: ${categories.length}`);

  // ── Courses ─────────────────────────────────────────────────────────────
  const courseDefs = [
    {
      title: "Lập trình Web với Next.js",
      description: "Xây dựng ứng dụng web full-stack hiện đại với Next.js 15, TypeScript và Prisma.",
      thumbnail: "https://picsum.photos/seed/nextjs/800/450",
      price: 499000,
      level: "intermediate",
      status: "PUBLISHED" as const,
      instructor: teacher1,
      category: categories[0],
    },
    {
      title: "Python cho người mới bắt đầu",
      description: "Học lập trình Python từ cơ bản đến thực chiến — phân tích dữ liệu, automation.",
      thumbnail: "https://picsum.photos/seed/python/800/450",
      price: 0,
      level: "beginner",
      status: "PUBLISHED" as const,
      instructor: teacher1,
      category: categories[0],
    },
    {
      title: "Machine Learning với TensorFlow",
      description: "Xây dựng mô hình ML và deep learning với TensorFlow 2.x và Keras.",
      thumbnail: "https://picsum.photos/seed/ml/800/450",
      price: 799000,
      level: "advanced",
      status: "PUBLISHED" as const,
      instructor: teacher1,
      category: categories[0],
    },
    {
      title: "Thiết kế UI/UX với Figma",
      description: "Tư duy thiết kế, wireframe, prototype và design system với Figma.",
      thumbnail: "https://picsum.photos/seed/figma/800/450",
      price: 399000,
      level: "beginner",
      status: "PUBLISHED" as const,
      instructor: teacher2,
      category: categories[1],
    },
    {
      title: "Marketing Digital toàn diện",
      description: "SEO, Google Ads, Facebook Ads và Content Marketing cho doanh nghiệp vừa và nhỏ.",
      thumbnail: "https://picsum.photos/seed/marketing/800/450",
      price: 599000,
      level: "intermediate",
      status: "PUBLISHED" as const,
      instructor: teacher2,
      category: categories[2],
    },
    {
      title: "IELTS từ 0 lên 6.5",
      description: "Lộ trình học IELTS có hệ thống, luyện 4 kỹ năng và chiến thuật làm bài.",
      thumbnail: "https://picsum.photos/seed/ielts/800/450",
      price: 699000,
      level: "intermediate",
      status: "DRAFT" as const,
      instructor: teacher2,
      category: categories[3],
    },
  ];

  const courses = await Promise.all(
    courseDefs.map((c) =>
      prisma.course.create({
        data: {
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail,
          price: c.price,
          level: c.level,
          status: c.status,
          instructor_id: c.instructor.id,
          category_id: c.category.id,
        },
      })
    )
  );

  console.log(`✓ Courses: ${courses.length}`);

  // ── Chapters & Lessons ──────────────────────────────────────────────────
  const chapterDefs = [
    {
      course: courses[0], // Next.js
      chapters: [
        {
          title: "Giới thiệu & Cài đặt môi trường",
          lessons: [
            { title: "Next.js là gì?", is_free: true, content: "Tổng quan về Next.js và lý do sử dụng." },
            { title: "Cài đặt Node.js và tạo project", is_free: true, video_url: "https://example.com/video/1" },
            { title: "Cấu trúc thư mục", is_free: false, video_url: "https://example.com/video/2" },
          ],
        },
        {
          title: "App Router & Pages",
          lessons: [
            { title: "App Router vs Pages Router", is_free: false, video_url: "https://example.com/video/3" },
            { title: "Dynamic Routes", is_free: false, video_url: "https://example.com/video/4" },
            { title: "Layout và Template", is_free: false, video_url: "https://example.com/video/5" },
          ],
        },
        {
          title: "Data Fetching & Server Actions",
          lessons: [
            { title: "Server Components vs Client Components", is_free: false, video_url: "https://example.com/video/6" },
            { title: "Server Actions", is_free: false, video_url: "https://example.com/video/7" },
            { title: "Tích hợp Prisma ORM", is_free: false, video_url: "https://example.com/video/8" },
          ],
        },
      ],
    },
    {
      course: courses[1], // Python
      chapters: [
        {
          title: "Python cơ bản",
          lessons: [
            { title: "Cài đặt Python và VS Code", is_free: true, video_url: "https://example.com/video/10" },
            { title: "Biến, kiểu dữ liệu và toán tử", is_free: true, video_url: "https://example.com/video/11" },
            { title: "Câu lệnh điều kiện và vòng lặp", is_free: false, video_url: "https://example.com/video/12" },
          ],
        },
        {
          title: "Hàm và Module",
          lessons: [
            { title: "Định nghĩa và gọi hàm", is_free: false, video_url: "https://example.com/video/13" },
            { title: "Import module", is_free: false, video_url: "https://example.com/video/14" },
          ],
        },
        {
          title: "Thực chiến với Python",
          lessons: [
            { title: "Đọc/ghi file CSV", is_free: false, video_url: "https://example.com/video/15" },
            { title: "Web scraping với BeautifulSoup", is_free: false, video_url: "https://example.com/video/16" },
          ],
        },
      ],
    },
    {
      course: courses[3], // Figma
      chapters: [
        {
          title: "Làm quen với Figma",
          lessons: [
            { title: "Giao diện Figma", is_free: true, video_url: "https://example.com/video/20" },
            { title: "Frame, Group và Component", is_free: false, video_url: "https://example.com/video/21" },
          ],
        },
        {
          title: "Xây dựng Design System",
          lessons: [
            { title: "Color & Typography Styles", is_free: false, video_url: "https://example.com/video/22" },
            { title: "Component và Variants", is_free: false, video_url: "https://example.com/video/23" },
            { title: "Auto Layout", is_free: false, video_url: "https://example.com/video/24" },
          ],
        },
      ],
    },
  ];

  const allLessons: { lesson: { id: string }; courseIdx: number; chapterIdx: number }[] = [];

  for (const cd of chapterDefs) {
    const courseIdx = courses.indexOf(cd.course);
    for (let ci = 0; ci < cd.chapters.length; ci++) {
      const ch = cd.chapters[ci];
      const chapter = await prisma.chapter.create({
        data: { title: ch.title, order: ci + 1, course_id: cd.course.id },
      });
      for (let li = 0; li < ch.lessons.length; li++) {
        const l = ch.lessons[li];
        const lesson = await prisma.lesson.create({
          data: {
            title: l.title,
            order: li + 1,
            is_free: l.is_free,
            content: (l as any).content ?? null,
            video_url: (l as any).video_url ?? null,
            chapter_id: chapter.id,
          },
        });
        allLessons.push({ lesson, courseIdx, chapterIdx: ci });
      }
    }
  }

  console.log(`✓ Chapters & Lessons created`);

  // ── Quiz (bài 3 của course Next.js — "Cấu trúc thư mục") ────────────────
  const targetLesson = allLessons.find((l) => l.courseIdx === 0 && l.chapterIdx === 0)?.lesson;

  if (targetLesson) {
    const quiz = await prisma.quiz.create({
      data: {
        title: "Kiểm tra kiến thức: Next.js cơ bản",
        lesson_id: targetLesson.id,
        pass_score: 70,
        time_limit: 10,
      },
    });

    const q1 = await prisma.question.create({
      data: {
        quiz_id: quiz.id,
        content: "Next.js là framework của ngôn ngữ/thư viện nào?",
        type: "MCQ",
        points: 2,
        order: 1,
      },
    });
    await prisma.option.createMany({
      data: [
        { question_id: q1.id, content: "Vue.js", is_correct: false, order: 1 },
        { question_id: q1.id, content: "React", is_correct: true, order: 2 },
        { question_id: q1.id, content: "Angular", is_correct: false, order: 3 },
        { question_id: q1.id, content: "Svelte", is_correct: false, order: 4 },
      ],
    });

    const q2 = await prisma.question.create({
      data: {
        quiz_id: quiz.id,
        content: "Next.js hỗ trợ Server-Side Rendering (SSR)?",
        type: "TRUE_FALSE",
        points: 1,
        order: 2,
      },
    });
    await prisma.option.createMany({
      data: [
        { question_id: q2.id, content: "Đúng", is_correct: true, order: 1 },
        { question_id: q2.id, content: "Sai", is_correct: false, order: 2 },
      ],
    });

    const q3 = await prisma.question.create({
      data: {
        quiz_id: quiz.id,
        content: "Thư mục nào chứa các route trong Next.js App Router?",
        type: "MCQ",
        points: 2,
        order: 3,
      },
    });
    await prisma.option.createMany({
      data: [
        { question_id: q3.id, content: "pages/", is_correct: false, order: 1 },
        { question_id: q3.id, content: "src/", is_correct: false, order: 2 },
        { question_id: q3.id, content: "app/", is_correct: true, order: 3 },
        { question_id: q3.id, content: "routes/", is_correct: false, order: 4 },
      ],
    });

    console.log(`✓ Quiz created with 3 questions`);

    // Quiz attempt cho student[0]
    const attempt = await prisma.quizAttempt.create({
      data: {
        user_id: students[0].id,
        quiz_id: quiz.id,
        score: 80,
        is_passed: true,
      },
    });
    await prisma.attemptAnswer.createMany({
      data: [
        { attempt_id: attempt.id, question_id: q1.id, answer: "React", is_correct: true, points_earned: 2 },
        { attempt_id: attempt.id, question_id: q2.id, answer: "Đúng", is_correct: true, points_earned: 1 },
        { attempt_id: attempt.id, question_id: q3.id, answer: "pages/", is_correct: false, points_earned: 0 },
      ],
    });
  }

  // ── Enrollments & Payments ───────────────────────────────────────────────
  // students[0,1,2] enroll vào Next.js (paid)
  // students[0,3,4] enroll vào Python (free)
  // students[1,2]   enroll vào Figma (paid)

  const enrollmentData: { student_idx: number; course_idx: number; paid: boolean; order_code: number }[] = [
    { student_idx: 0, course_idx: 0, paid: true,  order_code: 100001 },
    { student_idx: 1, course_idx: 0, paid: true,  order_code: 100002 },
    { student_idx: 2, course_idx: 0, paid: false, order_code: 100003 }, // pending
    { student_idx: 0, course_idx: 1, paid: true,  order_code: 100004 }, // free course — paid $0
    { student_idx: 3, course_idx: 1, paid: true,  order_code: 100005 },
    { student_idx: 4, course_idx: 1, paid: true,  order_code: 100006 },
    { student_idx: 1, course_idx: 3, paid: true,  order_code: 100007 },
    { student_idx: 2, course_idx: 3, paid: true,  order_code: 100008 },
  ];

  for (const e of enrollmentData) {
    const course = courses[e.course_idx];
    const student = students[e.student_idx];

    await prisma.payment.create({
      data: {
        user_id: student.id,
        course_id: course.id,
        amount: course.price,
        status: e.paid ? "PAID" : "PENDING",
        order_code: e.order_code,
      },
    });

    if (e.paid) {
      await prisma.enrollment.create({
        data: { user_id: student.id, course_id: course.id },
      });
    }
  }

  console.log(`✓ Enrollments & Payments created`);

  // ── Lesson Progress (students[0] đã học 3 bài đầu Next.js) ──────────────
  const nextjsLessons = allLessons.filter((l) => l.courseIdx === 0).slice(0, 3);
  for (const { lesson } of nextjsLessons) {
    await prisma.lessonProgress.create({
      data: {
        user_id: students[0].id,
        lesson_id: lesson.id,
        is_completed: true,
        last_watched_at: new Date(),
      },
    });
  }

  console.log(`✓ Lesson progress created`);
  console.log("✅ Seed hoàn tất!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
