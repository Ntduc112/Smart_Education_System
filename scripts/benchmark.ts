import "dotenv/config";
import prisma from "@/prisma/prisma";

// ── tiện ích đo ──────────────────────────────────────────────────────────────
async function bench(name: string, fn: () => Promise<unknown>, runs = 30, warmup = 3) {
  for (let i = 0; i < warmup; i++) await fn();
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const sum = times.reduce((s, x) => s + x, 0);
  const p = (q: number) => times[Math.min(times.length - 1, Math.floor(q * times.length))];
  return {
    name,
    runs,
    min: +times[0].toFixed(1),
    avg: +(sum / runs).toFixed(1),
    p95: +p(0.95).toFixed(1),
    max: +times[times.length - 1].toFixed(1),
  };
}

async function main() {
  // chọn 1 khóa học có dữ liệu để đo engagement/students
  const course = await prisma.course.findFirst({
    where: { enrollments: { some: {} } },
    orderBy: { enrollments: { _count: "desc" } },
    select: { id: true, instructor_id: true, title: true },
  });

  const results = [];

  // (1) Liệt kê khóa học công khai (browse) — có join category + đếm
  results.push(await bench("Liệt kê khóa học (browse, 12 items)", () =>
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      take: 12,
      orderBy: { created_at: "desc" },
      include: {
        category: { select: { name: true } },
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    })
  ));

  if (course) {
    // (2) Aggregation mức độ tương tác (tính năng engagement) — gom watch_percent theo bài
    results.push(await bench("Phân tích tương tác (engagement aggregation)", async () => {
      const c = await prisma.course.findFirst({
        where: { id: course.id, instructor_id: course.instructor_id },
        select: {
          sections: { select: { lessons: { select: { id: true } } } },
          enrollments: { select: { user_id: true } },
        },
      });
      const lessonIds = c!.sections.flatMap(s => s.lessons.map(l => l.id));
      const userIds = c!.enrollments.map(e => e.user_id);
      await prisma.lessonProgress.findMany({
        where: { user_id: { in: userIds }, lesson_id: { in: lessonIds } },
        select: { lesson_id: true, is_completed: true, watch_percent: true },
      });
    }));

    // chuẩn bị dữ liệu dùng chung cho (3)
    const cc = await prisma.course.findFirst({
      where: { id: course.id },
      select: {
        sections: { select: { lessons: { select: { id: true, quiz: { select: { id: true } } } } } },
        enrollments: { select: { user: { select: { id: true } } } },
      },
    });
    const lessonIds = cc!.sections.flatMap(s => s.lessons.map(l => l.id));
    const quizIds = cc!.sections.flatMap(s => s.lessons.flatMap(l => l.quiz.map(q => q.id)));
    const userIds = cc!.enrollments.map(e => e.user.id);

    // (3a) Cách TỐI ƯU: bulk fetch — 2 truy vấn cho toàn bộ học viên
    results.push(await bench("Tiến độ học viên — BULK (2 query, đang dùng)", async () => {
      await Promise.all([
        prisma.lessonProgress.findMany({ where: { user_id: { in: userIds }, lesson_id: { in: lessonIds } } }),
        prisma.quizAttempt.findMany({ where: { user_id: { in: userIds }, quiz_id: { in: quizIds } } }),
      ]);
    }));

    // (3b) Cách NGÂY THƠ (N+1): truy vấn riêng cho từng học viên
    results.push(await bench(`Tiến độ học viên — N+1 (${userIds.length} học viên x2 query)`, async () => {
      for (const uid of userIds) {
        await prisma.lessonProgress.findMany({ where: { user_id: uid, lesson_id: { in: lessonIds } } });
        await prisma.quizAttempt.findMany({ where: { user_id: uid, quiz_id: { in: quizIds } } });
      }
    }, 10));

    console.log(`\nQuy mô khóa học mẫu: ${userIds.length} học viên, ${lessonIds.length} bài học, ${quizIds.length} quiz.`);
  }

  console.log("\n=== KẾT QUẢ BENCHMARK (ms) ===");
  console.table(results);
  console.log(`Khóa học mẫu: ${course?.title ?? "(không có dữ liệu)"}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
