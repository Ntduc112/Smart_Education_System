import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// ── Catalog: course cần cho các lộ trình ─────────────────────────────────────
// Mỗi course nếu chưa có (match theo title) sẽ được tạo kèm 5 chương / 5 bài PDF.
type CourseDef = {
  title: string;
  description: string;
  thumbSeed: string;
  price: number;
  level: string;
  category: string;
  chapters: string[];
};

type RoadmapDef = {
  title: string;
  description: string;
  thumbSeed: string;
  courses: CourseDef[]; // theo thứ tự học (order 0,1,2…)
};

const ch5 = (a: string, b: string, c: string, d: string, e: string) => [a, b, c, d, e];

const ROADMAPS: RoadmapDef[] = [
  {
    title: "Lộ trình Lập trình Web Front-end",
    description:
      "Từ con số 0 đến lập trình viên front-end chuyên nghiệp: HTML/CSS, JavaScript hiện đại, TypeScript, React và Next.js — kèm tư duy thiết kế giao diện.",
    thumbSeed: "rm-frontend",
    courses: [
      {
        title: "HTML & CSS từ Zero đến Hero",
        description: "Xây dựng giao diện web responsive với HTML5 và CSS3 — flexbox, grid và animation.",
        thumbSeed: "htmlcss", price: 299000, level: "beginner", category: "Lập trình & Công nghệ",
        chapters: ch5("Cấu trúc HTML5", "CSS cơ bản & selector", "Box model & layout", "Flexbox và Grid", "Responsive & animation"),
      },
      {
        title: "JavaScript nền tảng",
        description: "Nắm vững JavaScript hiện đại (ES6+) — DOM, sự kiện, async/await và fetch API.",
        thumbSeed: "javascript", price: 399000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("Cú pháp & biến", "Hàm và scope", "Thao tác DOM", "Sự kiện & form", "Async & Fetch API"),
      },
      {
        title: "TypeScript thực chiến",
        description: "Viết JavaScript an toàn kiểu với TypeScript — type, interface, generic và tích hợp dự án thực tế.",
        thumbSeed: "typescript", price: 499000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("Vì sao cần TypeScript", "Kiểu cơ bản & union", "Interface & type", "Generic", "Cấu hình tsconfig & dự án"),
      },
      {
        title: "React từ cơ bản đến nâng cao",
        description: "Xây dựng giao diện component với React — hooks, state management và tối ưu hiệu năng.",
        thumbSeed: "react", price: 599000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("JSX & component", "Props & state", "Hooks cơ bản", "useEffect & data fetching", "Context & tối ưu render"),
      },
      {
        title: "Lập trình Web với Next.js",
        description: "Xây dựng ứng dụng web full-stack hiện đại với Next.js, TypeScript và Prisma.",
        thumbSeed: "nextjs", price: 699000, level: "advanced", category: "Lập trình & Công nghệ",
        chapters: ch5("App Router", "Server Components", "Server Actions", "Tích hợp Prisma", "Triển khai production"),
      },
    ],
  },
  {
    title: "Lộ trình Python & Data / AI",
    description:
      "Khởi đầu với Python, rèn nền tảng lập trình rồi tiến tới phân tích dữ liệu, trực quan hoá và machine learning để bước chân vào lĩnh vực AI.",
    thumbSeed: "rm-python-ai",
    courses: [
      {
        title: "Python cho người mới bắt đầu",
        description: "Học lập trình Python từ cơ bản đến thực chiến — cú pháp, hàm, xử lý dữ liệu và automation.",
        thumbSeed: "python", price: 0, level: "beginner", category: "Lập trình & Công nghệ",
        chapters: ch5("Cài đặt & cú pháp", "Biến và kiểu dữ liệu", "Điều kiện & vòng lặp", "Hàm và module", "Làm việc với file"),
      },
      {
        title: "Phân tích dữ liệu với Pandas",
        description: "Làm chủ Pandas & NumPy — đọc, làm sạch, biến đổi và tổng hợp dữ liệu bảng.",
        thumbSeed: "pandas", price: 499000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("NumPy cơ bản", "DataFrame & Series", "Làm sạch dữ liệu", "Group & aggregate", "Merge & pivot"),
      },
      {
        title: "Trực quan hoá dữ liệu với Python",
        description: "Kể chuyện bằng biểu đồ với Matplotlib, Seaborn và Plotly.",
        thumbSeed: "dataviz", price: 499000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("Matplotlib cơ bản", "Biểu đồ thống kê", "Seaborn", "Plotly tương tác", "Dashboard & báo cáo"),
      },
      {
        title: "Machine Learning với TensorFlow",
        description: "Xây dựng mô hình ML và deep learning với TensorFlow và Keras.",
        thumbSeed: "ml", price: 799000, level: "advanced", category: "Lập trình & Công nghệ",
        chapters: ch5("Tổng quan ML", "Hồi quy & phân loại", "Mạng nơ-ron", "Keras API", "Đánh giá & tinh chỉnh"),
      },
      {
        title: "Deep Learning nâng cao",
        description: "CNN, RNN, Transformer và các kỹ thuật deep learning hiện đại cho bài toán thực tế.",
        thumbSeed: "deeplearning", price: 999000, level: "advanced", category: "Lập trình & Công nghệ",
        chapters: ch5("CNN cho ảnh", "RNN & LSTM", "Attention & Transformer", "Transfer learning", "Triển khai mô hình"),
      },
    ],
  },
  {
    title: "Lộ trình Digital Marketing",
    description:
      "Lộ trình bài bản cho người làm marketing: nền tảng, SEO, quảng cáo Google/Facebook, content & email marketing — kèm tiếng Anh để mở rộng cơ hội nghề nghiệp.",
    thumbSeed: "rm-marketing",
    courses: [
      {
        title: "Nhập môn Digital Marketing",
        description: "Tổng quan hệ sinh thái digital marketing, phễu khách hàng và đo lường hiệu quả.",
        thumbSeed: "dm-intro", price: 0, level: "beginner", category: "Kinh doanh & Khởi nghiệp",
        chapters: ch5("Digital marketing là gì", "Hành trình khách hàng", "Kênh & phễu", "KPI & đo lường", "Lập kế hoạch"),
      },
      {
        title: "SEO toàn tập",
        description: "Tối ưu công cụ tìm kiếm từ on-page, off-page đến technical SEO.",
        thumbSeed: "seo", price: 599000, level: "intermediate", category: "Kinh doanh & Khởi nghiệp",
        chapters: ch5("Cách Google xếp hạng", "Nghiên cứu từ khoá", "On-page SEO", "Technical SEO", "Xây dựng backlink"),
      },
      {
        title: "Quảng cáo Google Ads",
        description: "Chạy chiến dịch Google Search, Display và YouTube hiệu quả, tối ưu ngân sách.",
        thumbSeed: "googleads", price: 599000, level: "intermediate", category: "Kinh doanh & Khởi nghiệp",
        chapters: ch5("Cấu trúc tài khoản", "Chiến dịch Search", "Display & YouTube", "Đấu giá & ngân sách", "Tối ưu chuyển đổi"),
      },
      {
        title: "Facebook Ads thực chiến",
        description: "Xây dựng và tối ưu chiến dịch quảng cáo Facebook/Instagram theo mục tiêu.",
        thumbSeed: "facebookads", price: 599000, level: "intermediate", category: "Kinh doanh & Khởi nghiệp",
        chapters: ch5("Trình quản lý quảng cáo", "Target & audience", "Sáng tạo nội dung", "A/B testing", "Scale & retarget"),
      },
      {
        title: "Content & Email Marketing",
        description: "Sản xuất nội dung thu hút và nuôi dưỡng khách hàng bằng email automation.",
        thumbSeed: "content", price: 499000, level: "beginner", category: "Kinh doanh & Khởi nghiệp",
        chapters: ch5("Chiến lược nội dung", "Viết content chuẩn SEO", "Email automation", "Phân khúc danh sách", "Đo lường & tối ưu"),
      },
      {
        title: "Tiếng Anh giao tiếp cơ bản",
        description: "Lộ trình giao tiếp tiếng Anh hằng ngày — phát âm, từ vựng và mẫu câu thông dụng.",
        thumbSeed: "english2", price: 499000, level: "beginner", category: "Ngoại ngữ",
        chapters: ch5("Phát âm chuẩn", "Chào hỏi & giới thiệu", "Giao tiếp hằng ngày", "Tại nơi làm việc", "Du lịch & nhà hàng"),
      },
    ],
  },
  {
    title: "Lộ trình Thiết kế UI/UX",
    description:
      "Trở thành nhà thiết kế sản phẩm số: nguyên lý thị giác, wireframe & prototype với Figma, design system, kèm nền tảng HTML/CSS để phối hợp với lập trình viên.",
    thumbSeed: "rm-uiux",
    courses: [
      {
        title: "Nhập môn Thiết kế UI/UX",
        description: "Phân biệt UI và UX, quy trình thiết kế lấy người dùng làm trung tâm.",
        thumbSeed: "uiux-intro", price: 0, level: "beginner", category: "Thiết kế & Sáng tạo",
        chapters: ch5("UI vs UX", "Quy trình design thinking", "Nghiên cứu người dùng", "Persona & user flow", "Đánh giá khả dụng"),
      },
      {
        title: "Nguyên lý thiết kế thị giác",
        description: "Màu sắc, typography, bố cục và phân cấp thị giác trong thiết kế giao diện.",
        thumbSeed: "visual", price: 399000, level: "beginner", category: "Thiết kế & Sáng tạo",
        chapters: ch5("Lý thuyết màu", "Typography", "Bố cục & lưới", "Phân cấp thị giác", "Khoảng trắng & nhịp điệu"),
      },
      {
        title: "Thiết kế UI/UX với Figma",
        description: "Tư duy thiết kế, wireframe, prototype và design system với Figma.",
        thumbSeed: "figma2", price: 399000, level: "beginner", category: "Thiết kế & Sáng tạo",
        chapters: ch5("Giao diện Figma", "Frame & component", "Color & typography", "Auto layout", "Prototype & handoff"),
      },
      {
        title: "Design System chuyên nghiệp",
        description: "Xây dựng hệ thống thiết kế nhất quán, có thể mở rộng với component và token.",
        thumbSeed: "designsystem", price: 599000, level: "intermediate", category: "Thiết kế & Sáng tạo",
        chapters: ch5("Vì sao cần design system", "Design token", "Component & variant", "Tài liệu hoá", "Bàn giao cho dev"),
      },
      {
        title: "HTML & CSS từ Zero đến Hero",
        description: "Xây dựng giao diện web responsive với HTML5 và CSS3 — flexbox, grid và animation.",
        thumbSeed: "htmlcss", price: 299000, level: "beginner", category: "Lập trình & Công nghệ",
        chapters: ch5("Cấu trúc HTML5", "CSS cơ bản & selector", "Box model & layout", "Flexbox và Grid", "Responsive & animation"),
      },
    ],
  },
  {
    title: "Lộ trình DevOps & Observability",
    description:
      "Vận hành hệ thống hiện đại: nền tảng Linux & Docker, CI/CD, giám sát với Prometheus và quản lý log với Grafana Loki.",
    thumbSeed: "rm-devops",
    courses: [
      {
        title: "Linux & Docker cho DevOps",
        description: "Làm chủ dòng lệnh Linux và đóng gói ứng dụng với Docker.",
        thumbSeed: "linux-docker", price: 499000, level: "beginner", category: "Lập trình & Công nghệ",
        chapters: ch5("Linux cơ bản", "Quản lý tiến trình", "Docker image", "Docker Compose", "Volume & network"),
      },
      {
        title: "CI/CD với GitHub Actions",
        description: "Tự động hoá build, test và deploy bằng pipeline CI/CD.",
        thumbSeed: "cicd", price: 599000, level: "intermediate", category: "Lập trình & Công nghệ",
        chapters: ch5("Khái niệm CI/CD", "Workflow & job", "Build & test", "Deploy tự động", "Secrets & môi trường"),
      },
      {
        title: "Giám sát hệ thống với Prometheus",
        description: "Thu thập metric, viết truy vấn PromQL và cảnh báo với Prometheus.",
        thumbSeed: "prometheus", price: 699000, level: "advanced", category: "Lập trình & Công nghệ",
        chapters: ch5("Kiến trúc Prometheus", "Exporter & metric", "PromQL", "Alerting", "Tối ưu lưu trữ"),
      },
      {
        title: "Quản lý log với Grafana Loki",
        description: "Tập trung, truy vấn và trực quan hoá log hệ thống với Loki & Grafana.",
        thumbSeed: "loki", price: 699000, level: "advanced", category: "Lập trình & Công nghệ",
        chapters: ch5("Kiến trúc Loki", "Promtail & thu thập log", "LogQL", "Dashboard Grafana", "Cảnh báo trên log"),
      },
    ],
  },
];

async function getCategory(name: string) {
  const found = await prisma.category.findFirst({ where: { name } });
  if (found) return found;
  return prisma.category.create({ data: { name, description: name } });
}

async function ensureCourse(def: CourseDef, instructorId: string) {
  const existing = await prisma.course.findFirst({
    where: { title: def.title, status: "PUBLISHED" },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const category = await getCategory(def.category);
  const course = await prisma.course.create({
    data: {
      title: def.title,
      description: def.description,
      thumbnail: `https://picsum.photos/seed/${def.thumbSeed}/800/450`,
      price: def.price,
      level: def.level,
      status: "PUBLISHED",
      instructor_id: instructorId,
      category_id: category.id,
    },
  });

  for (let i = 0; i < def.chapters.length; i++) {
    const chapter = await prisma.chapter.create({
      data: { title: def.chapters[i], order: i + 1, course_id: course.id },
    });
    await prisma.lesson.create({
      data: {
        title: `${def.chapters[i]} (tài liệu PDF)`,
        order: 1,
        is_free: i === 0,
        content: `Tài liệu bài học: ${def.chapters[i]}.`,
        pdf_url: PDF_URL,
        pdf_text: `Nội dung PDF cho chương "${def.chapters[i]}" của khoá ${def.title}.`,
        chapter_id: chapter.id,
      },
    });
  }
  return { id: course.id, created: true };
}

async function main() {
  console.log("🌱 Seeding roadmaps + courses (additive)...");

  // cần 1 giảng viên làm instructor cho course mới
  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) {
    console.error("✗ Chưa có user TEACHER nào. Chạy `npm run db:seed` trước.");
    process.exit(1);
  }

  let coursesCreated = 0;
  let coursesReused = 0;
  let roadmapsBuilt = 0;

  for (const rm of ROADMAPS) {
    // resolve/ tạo course cho lộ trình
    const items: { id: string }[] = [];
    for (const cd of rm.courses) {
      const { id, created } = await ensureCourse(cd, teacher.id);
      items.push({ id });
      created ? coursesCreated++ : coursesReused++;
    }

    // idempotent: xoá lộ trình cũ cùng title rồi tạo lại với đủ course
    await prisma.roadmap.deleteMany({ where: { title: rm.title } });
    await prisma.roadmap.create({
      data: {
        title: rm.title,
        description: rm.description,
        thumbnail: `https://picsum.photos/seed/${rm.thumbSeed}/800/450`,
        status: "PUBLISHED",
        items: {
          create: items.map((c, i) => ({
            course_id: c.id,
            order: i,
            status: "APPROVED",
          })),
        },
      },
    });
    console.log(`  ✓ "${rm.title}" — ${items.length} course`);
    roadmapsBuilt++;
  }

  console.log(
    `✅ Hoàn tất! Lộ trình: ${roadmapsBuilt} | Course mới: ${coursesCreated} | Course tái dùng: ${coursesReused}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
