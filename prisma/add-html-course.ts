import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find "Lập trình & Công nghệ" category
  const category = await prisma.category.findFirst({
    where: { name: { contains: "Lập trình" } },
  });
  if (!category) throw new Error("Category 'Lập trình & Công nghệ' not found. Run seed first.");

  // Find first TEACHER
  const instructor = await prisma.user.findFirst({
    where: { role: "TEACHER" },
  });
  if (!instructor) throw new Error("No teacher found. Run seed first.");

  // Check if course already exists
  const existing = await prisma.course.findFirst({ where: { title: "HTML cho người mới bắt đầu" } });
  if (existing) {
    console.log("⚠️  Course already exists, skipping.");
    return;
  }

  // Create course
  const course = await prisma.course.create({
    data: {
      title: "HTML cho người mới bắt đầu",
      description:
        "Học HTML từ cơ bản — ngôn ngữ đánh dấu nền tảng của mọi trang web. Khóa học bao gồm cú pháp, cấu trúc tài liệu, các thẻ thông dụng và cách xây dựng trang web tĩnh đầu tiên của bạn.",
      thumbnail: "https://picsum.photos/seed/html/800/450",
      price: 0,
      level: "beginner",
      status: "PUBLISHED",
      instructor_id: instructor.id,
      category_id: category.id,
    },
  });
  console.log(`✓ Course created: ${course.title}`);

  const chapters = [
    {
      title: "Intro",
      order: 1,
      lessons: [
        {
          title: "Giới thiệu HTML",
          order: 1,
          is_free: true,
          video_url: "https://www.youtube.com/embed/it1rTvBcfRg",
        },
      ],
    },
    {
      title: "Editor",
      order: 2,
      lessons: [
        {
          title: "Thiết lập Editor",
          order: 1,
          is_free: true,
          video_url: "https://www.youtube.com/embed/bBP0ckEln4Y",
        },
      ],
    },
  ];

  for (const chDef of chapters) {
    const chapter = await prisma.chapter.create({
      data: {
        title: chDef.title,
        order: chDef.order,
        course_id: course.id,
      },
    });
    for (const lDef of chDef.lessons) {
      await prisma.lesson.create({
        data: {
          title: lDef.title,
          order: lDef.order,
          is_free: lDef.is_free,
          video_url: lDef.video_url,
          chapter_id: chapter.id,
        },
      });
    }
    console.log(`  ✓ Chapter: ${chapter.title} (${chDef.lessons.length} lesson)`);
  }

  console.log("✅ HTML course added successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
