import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── helpers ────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10);
const rand = (n: number) => Math.floor(Math.random() * n); // 0..n-1
const pick = <T>(arr: T[]) => arr[rand(arr.length)];
const shuffle = <T>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Phan", "Võ"];
const DEM = ["Văn", "Thị", "Minh", "Quốc", "Hữu", "Thành", "Ngọc", "Gia", "Đức", "Hải"];
const TEN = ["An", "Bình", "Cường", "Dung", "Đức", "Hoa", "Huy", "Khánh", "Lan", "Linh", "Mai", "Nam", "Phúc", "Quân", "Sơn", "Trang", "Tú", "Vy", "Yến", "Long", "Hằng", "Tuấn", "Thảo", "Hùng", "Nhung"];
const fullName = () => `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;

// ── course catalog: 6 courses, mỗi course 5 chương (1 bài PDF / chương) ──────
type CourseDef = {
  title: string;
  description: string;
  thumbSeed: string;
  price: number;
  level: string;
  categoryName: string;
  chapters: string[]; // 5 titles
};

const COURSES: CourseDef[] = [
  {
    title: "Python cho người mới bắt đầu",
    description: "Học lập trình Python từ cơ bản đến thực chiến — cú pháp, hàm, xử lý dữ liệu và automation.",
    thumbSeed: "python",
    price: 0,
    level: "beginner",
    categoryName: "Lập trình & Công nghệ",
    chapters: ["Cài đặt & cú pháp cơ bản", "Biến và kiểu dữ liệu", "Câu lệnh điều kiện & vòng lặp", "Hàm và module", "Làm việc với file"],
  },
  {
    title: "HTML & CSS từ Zero đến Hero",
    description: "Xây dựng giao diện web responsive với HTML5 và CSS3 — flexbox, grid và animation.",
    thumbSeed: "htmlcss",
    price: 299000,
    level: "beginner",
    categoryName: "Lập trình & Công nghệ",
    chapters: ["Cấu trúc HTML5", "CSS cơ bản & selector", "Box model & layout", "Flexbox và Grid", "Responsive & animation"],
  },
  {
    title: "JavaScript nền tảng",
    description: "Nắm vững JavaScript hiện đại (ES6+) — DOM, sự kiện, async/await và fetch API.",
    thumbSeed: "javascript",
    price: 399000,
    level: "intermediate",
    categoryName: "Lập trình & Công nghệ",
    chapters: ["Cú pháp & biến", "Hàm và scope", "Thao tác DOM", "Sự kiện & form", "Async & Fetch API"],
  },
  {
    title: "Thiết kế UI/UX với Figma",
    description: "Tư duy thiết kế, wireframe, prototype và design system với Figma.",
    thumbSeed: "figma2",
    price: 399000,
    level: "beginner",
    categoryName: "Thiết kế & Sáng tạo",
    chapters: ["Giao diện Figma", "Frame & component", "Color & typography", "Auto layout", "Prototype & handoff"],
  },
  {
    title: "Digital Marketing thực chiến",
    description: "SEO, Google Ads, Facebook Ads và Content Marketing cho doanh nghiệp vừa và nhỏ.",
    thumbSeed: "marketing2",
    price: 599000,
    level: "intermediate",
    categoryName: "Kinh doanh & Khởi nghiệp",
    chapters: ["Tổng quan Digital Marketing", "SEO cơ bản", "Google Ads", "Facebook Ads", "Content & email marketing"],
  },
  {
    title: "Tiếng Anh giao tiếp cơ bản",
    description: "Lộ trình giao tiếp tiếng Anh hằng ngày — phát âm, từ vựng và mẫu câu thông dụng.",
    thumbSeed: "english2",
    price: 499000,
    level: "beginner",
    categoryName: "Ngoại ngữ",
    chapters: ["Phát âm chuẩn", "Chào hỏi & giới thiệu", "Giao tiếp hằng ngày", "Tại nơi làm việc", "Du lịch & nhà hàng"],
  },
];

async function getCategory(name: string, description: string) {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.category.create({ data: { name, description } });
}

async function main() {
  console.log("🌱 Bulk seeding (additive — không xoá data cũ)...");

  // guard chống chạy lại nhiều lần
  const marker = await prisma.user.findUnique({ where: { email: "stu001@student.vn" } });
  if (marker) {
    console.error("✗ Phát hiện stu001@student.vn — bulk seed đã chạy rồi. Thoát để tránh trùng lặp.");
    process.exit(1);
  }

  const [teacherPw, studentPw] = await Promise.all([hash("Teacher@123"), hash("Student@123")]);

  // ── 8 teachers ─────────────────────────────────────────────────────────
  const teachers = await Promise.all(
    Array.from({ length: 8 }, (_, i) => {
      const num = String(i + 1).padStart(2, "0");
      const email = `gv${num}@smartedu.vn`;
      return prisma.user.create({
        data: {
          name: fullName(),
          email,
          password_hash: teacherPw,
          role: "TEACHER",
          avatar: `https://i.pravatar.cc/150?u=${email}`,
        },
      });
    })
  );
  console.log(`✓ Teachers: ${teachers.length}`);

  // ── 100 students ─────────────────────────────────────────────────────────
  const students = await Promise.all(
    Array.from({ length: 100 }, (_, i) => {
      const num = String(i + 1).padStart(3, "0");
      const email = `stu${num}@student.vn`;
      return prisma.user.create({
        data: {
          name: fullName(),
          email,
          password_hash: studentPw,
          role: "STUDENT",
          avatar: `https://i.pravatar.cc/150?u=${email}`,
        },
      });
    })
  );
  console.log(`✓ Students: ${students.length}`);

  // ── Categories (tái dùng nếu đã có) ───────────────────────────────────────
  const catDesc: Record<string, string> = {
    "Lập trình & Công nghệ": "Các khoá học về lập trình, web, mobile và AI",
    "Thiết kế & Sáng tạo": "UI/UX, đồ hoạ, video và thiết kế sản phẩm",
    "Kinh doanh & Khởi nghiệp": "Marketing, quản trị và tư duy khởi nghiệp",
    "Ngoại ngữ": "Tiếng Anh, Nhật, Hàn và các ngôn ngữ khác",
  };
  const catCache: Record<string, { id: string }> = {};
  for (const name of Object.keys(catDesc)) {
    catCache[name] = await getCategory(name, catDesc[name]);
  }
  console.log(`✓ Categories: ${Object.keys(catCache).length} (sẵn sàng)`);

  // ── Courses + chapters + lessons ──────────────────────────────────────────
  // mỗi course: 5 chương, mỗi chương 1 bài PDF (video chưa có)
  const courses: { id: string; price: any; lessonIds: string[] }[] = [];

  for (let ci = 0; ci < COURSES.length; ci++) {
    const cd = COURSES[ci];
    const instructor = teachers[ci % teachers.length];
    const course = await prisma.course.create({
      data: {
        title: cd.title,
        description: cd.description,
        thumbnail: `https://picsum.photos/seed/${cd.thumbSeed}/800/450`,
        price: cd.price,
        level: cd.level,
        status: "PUBLISHED",
        instructor_id: instructor.id,
        category_id: catCache[cd.categoryName].id,
      },
    });

    const lessonIds: string[] = [];
    for (let chi = 0; chi < cd.chapters.length; chi++) {
      const chapter = await prisma.chapter.create({
        data: { title: cd.chapters[chi], order: chi + 1, course_id: course.id },
      });
      const lesson = await prisma.lesson.create({
        data: {
          title: `${cd.chapters[chi]} (tài liệu PDF)`,
          order: 1,
          is_free: chi === 0, // bài đầu học thử miễn phí
          content: `Tài liệu bài học: ${cd.chapters[chi]}.`,
          pdf_url: PDF_URL,
          pdf_text: `Nội dung PDF cho chương "${cd.chapters[chi]}" của khoá ${cd.title}.`,
          chapter_id: chapter.id,
        },
      });
      lessonIds.push(lesson.id);
    }
    courses.push({ id: course.id, price: course.price, lessonIds });
  }
  console.log(`✓ Courses: ${courses.length} (mỗi course 5 chương / 5 bài PDF)`);

  // ── Enrollments + payments + progress + certificates ──────────────────────
  // order_code phải duy nhất — bắt đầu trên giá trị max hiện có
  const maxPay = await prisma.payment.aggregate({ _max: { order_code: true } });
  let orderCode = (maxPay._max.order_code ?? 100000) + 1;
  let certCounter = 1;

  const stats = { notStarted: 0, inProgress: 0, completed: 0, enrollments: 0 };

  for (const student of students) {
    // mỗi học sinh ghi danh ngẫu nhiên 1–3 khoá
    const n = 1 + rand(3);
    const chosen = shuffle(courses).slice(0, n);

    for (const course of chosen) {
      await prisma.enrollment.create({
        data: { user_id: student.id, course_id: course.id },
      });
      await prisma.payment.create({
        data: {
          user_id: student.id,
          course_id: course.id,
          amount: course.price,
          status: "PAID",
          order_code: orderCode++,
        },
      });
      stats.enrollments++;

      // chọn trạng thái học: chưa học / học giở / học hết
      const roll = rand(100);
      const total = course.lessonIds.length;

      if (roll < 30) {
        // chưa học — chỉ ghi danh
        stats.notStarted++;
      } else if (roll < 75) {
        // học giở — hoàn thành 1..(total-1) bài, bài kế tiếp đang xem dở
        const done = 1 + rand(total - 1);
        for (let i = 0; i < done; i++) {
          await prisma.lessonProgress.create({
            data: {
              user_id: student.id,
              lesson_id: course.lessonIds[i],
              is_completed: true,
              watch_percent: 100,
              last_watched_at: new Date(),
            },
          });
        }
        // bài đang học dở
        await prisma.lessonProgress.create({
          data: {
            user_id: student.id,
            lesson_id: course.lessonIds[done],
            is_completed: false,
            watch_percent: 10 + rand(80),
            last_watched_at: new Date(),
          },
        });
        stats.inProgress++;
      } else {
        // học hết — hoàn thành tất cả + cấp chứng chỉ
        for (const lessonId of course.lessonIds) {
          await prisma.lessonProgress.create({
            data: {
              user_id: student.id,
              lesson_id: lessonId,
              is_completed: true,
              watch_percent: 100,
              last_watched_at: new Date(),
            },
          });
        }
        await prisma.certificate.create({
          data: {
            user_id: student.id,
            course_id: course.id,
            certificate_no: `CERT-${String(certCounter++).padStart(5, "0")}`,
          },
        });
        stats.completed++;
      }
    }
  }

  console.log(`✓ Enrollments: ${stats.enrollments}`);
  console.log(`  • chưa học:  ${stats.notStarted}`);
  console.log(`  • học giở:   ${stats.inProgress}`);
  console.log(`  • học hết:   ${stats.completed}`);
  console.log("✅ Bulk seed hoàn tất!");
  console.log("   Teacher login: gv01@smartedu.vn .. gv08@smartedu.vn  /  Teacher@123");
  console.log("   Student login: stu001@student.vn .. stu100@student.vn /  Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
