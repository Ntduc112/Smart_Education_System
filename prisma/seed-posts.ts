import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// 5 bài do giáo viên đăng — chủ đề dạy & học
const TEACHER_POSTS = [
  {
    title: "5 thói quen học tập giúp bạn nhớ lâu hơn",
    content:
      "Chào các em, thầy chia sẻ vài thói quen đã giúp nhiều bạn cải thiện điểm số:\n1. Ôn lại bài ngay trong ngày học.\n2. Tự đặt câu hỏi thay vì đọc thụ động.\n3. Học theo khối 25 phút (Pomodoro).\n4. Giải thích lại cho bạn khác.\n5. Ngủ đủ giấc trước khi kiểm tra.\nEm nào áp dụng rồi thì kể thầy nghe nhé!",
  },
  {
    title: "Cách ghi chú hiệu quả bằng sơ đồ tư duy",
    content:
      "Nhiều em ghi chép dài dòng nhưng ôn lại rất khó. Hãy thử sơ đồ tư duy: đặt chủ đề ở giữa, nhánh chính là ý lớn, nhánh phụ là chi tiết. Dùng màu và hình vẽ để não dễ nhớ. Một trang sơ đồ tốt thay được cả chục trang vở.",
  },
  {
    title: "Lộ trình tự học lập trình cho người mới bắt đầu",
    content:
      "Bắt đầu từ tư duy thuật toán, rồi một ngôn ngữ (Python hợp người mới). Mỗi ngày code ít nhất 30 phút, làm dự án nhỏ thay vì chỉ xem video. Quan trọng nhất: gõ lại code, đừng copy. Sai ở đâu sửa ở đó là cách học nhanh nhất.",
  },
  {
    title: "Làm sao để hết sợ môn Toán?",
    content:
      "Sợ Toán thường vì mất gốc, không phải vì kém. Hãy quay lại lấp lỗ hổng từ phần cơ bản, làm thật nhiều bài dễ để lấy tự tin trước khi lên bài khó. Toán là môn luyện tay — làm nhiều sẽ quen.",
  },
  {
    title: "Mẹo ôn thi cuối kỳ không bị quá tải",
    content:
      "Đừng đợi sát ngày mới học. Chia nhỏ nội dung theo tuần, mỗi ngày ôn một phần và làm đề. Trước hôm thi chỉ xem lại lỗi sai cũ, không nhồi kiến thức mới. Giữ sức khỏe quan trọng hơn thức khuya.",
  },
];

// 5 bài do học sinh đăng — hỏi & chia sẻ chuyện học
const STUDENT_POSTS = [
  {
    title: "Mọi người tập trung học bằng cách nào ạ?",
    content:
      "Em hay bị mất tập trung, cứ học 10 phút lại cầm điện thoại. Mọi người có mẹo gì giữ tập trung lâu không ạ? Em đang thi học kỳ tới nơi rồi 😭",
  },
  {
    title: "Chia sẻ: em đã cải thiện điểm Tiếng Anh thế nào",
    content:
      "Hồi đầu năm em mất gốc Tiếng Anh. Em bắt đầu nghe podcast mỗi ngày 15 phút, học 5 từ mới và viết câu với chúng. Sau 3 tháng điểm lên hẳn. Chia sẻ để bạn nào đang nản có thêm động lực nhé!",
  },
  {
    title: "Học nhóm hay học một mình hiệu quả hơn?",
    content:
      "Em thấy học nhóm dễ bị nói chuyện riêng, nhưng học một mình lại hay nản. Các anh chị có kinh nghiệm gì để học nhóm thực sự hiệu quả không ạ?",
  },
  {
    title: "Tài liệu ôn thi đại học môn Lý các bạn dùng gì?",
    content:
      "Em đang tìm tài liệu ôn Vật Lý dễ hiểu, nhiều bài tập có lời giải. Bạn nào đã thi rồi cho em xin gợi ý sách hoặc khóa học với ạ. Cảm ơn mọi người nhiều!",
  },
  {
    title: "Bị áp lực điểm số, mọi người vượt qua sao?",
    content:
      "Dạo này em học nhiều mà điểm vẫn không như mong đợi, thấy hơi nản và áp lực. Mọi người từng trải qua giai đoạn này thì làm sao để giữ tinh thần ạ?",
  },
];

const COMMENTS = [
  "Cảm ơn thầy/bạn, bài này hữu ích quá ạ!",
  "Em cũng đang gặp đúng vấn đề này.",
  "Mình áp dụng Pomodoro thấy tập trung hơn hẳn.",
  "Sơ đồ tư duy đúng là cứu tinh mùa thi 😄",
  "Cho em hỏi nên bắt đầu từ phần nào trước ạ?",
  "Học nhóm với đúng người thì hiệu quả lắm bạn ơi.",
  "Mình từng mất gốc Toán, làm lại từ cơ bản đúng là ổn hơn.",
  "Nghe podcast mỗi ngày đúng là cách hay để học Tiếng Anh.",
  "Bạn ơi cho mình xin tên khóa học với được không?",
  "Đọc xong thấy có thêm động lực, cảm ơn nhiều!",
  "Em hay học khuya, đọc bài này mới biết ngủ đủ quan trọng thế nào.",
  "Tự giải thích lại cho bạn khác đúng là nhớ lâu thật.",
  "Mình cũng hay cầm điện thoại giữa giờ học, phải bỏ thói quen này thôi.",
  "Áp lực điểm số ai cũng từng trải qua, bạn cố lên nhé!",
  "Lộ trình rõ ràng quá, em lưu lại để theo từ từ.",
  "Có ai làm chung nhóm ôn thi không cho mình tham gia với 😅",
  "Mình thấy làm đề nhiều giúp quen dạng bài hẳn.",
  "Cảm ơn thầy, em sẽ thử chia nhỏ nội dung theo tuần.",
  "Đúng rồi, gõ lại code chứ đừng copy mới học được.",
  "Bài viết rất tâm huyết, cảm ơn thầy nhiều ạ!",
  "Mình cũng đang nản môn Lý, để thử cách của bạn xem sao.",
  "Học một mình mà có kế hoạch thì vẫn ổn nha bạn.",
];

async function main() {
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER" }, select: { id: true } });
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });

  if (teachers.length === 0 || students.length === 0) {
    throw new Error(`Cần ít nhất 1 teacher và 1 student. Hiện có teacher=${teachers.length}, student=${students.length}`);
  }

  // Người bình luận: gộp student + teacher để đa dạng.
  const commenters = [...students, ...teachers].map((u) => u.id);

  const plan = [
    ...TEACHER_POSTS.map((p) => ({ ...p, authorPool: teachers })),
    ...STUDENT_POSTS.map((p) => ({ ...p, authorPool: students })),
  ];

  let totalComments = 0;
  for (const item of plan) {
    const post = await prisma.post.create({
      data: {
        author_id: pick(item.authorPool).id,
        title: item.title,
        content: item.content,
        status: "APPROVED",
      },
    });

    const n = randInt(10, 20);
    const comments = Array.from({ length: n }, () => ({
      post_id: post.id,
      user_id: pick(commenters),
      content: pick(COMMENTS),
    }));
    await prisma.postComment.createMany({ data: comments });
    totalComments += n;

    console.log(`✓ Post "${item.title.slice(0, 40)}..." + ${n} comments`);
  }

  console.log(`\nDone: ${plan.length} posts, ${totalComments} comments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
