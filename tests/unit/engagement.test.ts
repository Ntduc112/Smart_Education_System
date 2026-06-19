import { describe, it, expect } from "vitest";
import { computeEngagement, LessonInput, ProgressInput } from "@/lib/analytics/engagement";

const lessons: LessonInput[] = [
  { id: "L1", title: "Bài 1", chapter_title: "Chương 1" },
  { id: "L2", title: "Bài 2", chapter_title: "Chương 1" },
  { id: "L3", title: "Bài 3", chapter_title: "Chương 1" },
];

describe("computeEngagement", () => {
  it("trả rỗng khi không có bài học hoặc không có học viên", () => {
    expect(computeEngagement([], [], 5).lessons).toEqual([]);
    expect(computeEngagement(lessons, [], 0).worst_lesson_id).toBeNull();
  });

  it("tính trung bình watch_percent và tỷ lệ hoàn thành theo số học viên ghi danh", () => {
    // 2 học viên ghi danh; L1 xem đầy đủ, L3 gần như bỏ
    const progresses: ProgressInput[] = [
      { lesson_id: "L1", is_completed: true,  watch_percent: 100 },
      { lesson_id: "L1", is_completed: true,  watch_percent: 80 },
      { lesson_id: "L2", is_completed: true,  watch_percent: 90 },
      { lesson_id: "L2", is_completed: false, watch_percent: 50 },
      { lesson_id: "L3", is_completed: false, watch_percent: 10 },
    ];
    const { lessons: out } = computeEngagement(lessons, progresses, 2);

    expect(out[0]).toMatchObject({ avg_watch_percent: 90, completion_rate: 100, students_completed: 2 });
    expect(out[1]).toMatchObject({ avg_watch_percent: 70, completion_rate: 50 });
    expect(out[2]).toMatchObject({ avg_watch_percent: 5,  completion_rate: 0 });
  });

  it("xác định đúng bài 'mất hứng thú nhất' (watch thấp nhất)", () => {
    const progresses: ProgressInput[] = [
      { lesson_id: "L1", is_completed: true,  watch_percent: 100 },
      { lesson_id: "L2", is_completed: false, watch_percent: 30 },
      { lesson_id: "L3", is_completed: false, watch_percent: 60 },
    ];
    const { worst_lesson_id } = computeEngagement(lessons, progresses, 1);
    expect(worst_lesson_id).toBe("L2");
  });

  it("tính drop_from_prev = mức tụt completion so với bài trước", () => {
    const progresses: ProgressInput[] = [
      { lesson_id: "L1", is_completed: true,  watch_percent: 100 }, // completion 100
      { lesson_id: "L2", is_completed: false, watch_percent: 40 },  // completion 0 -> drop 100
    ];
    const { lessons: out } = computeEngagement(lessons.slice(0, 2), progresses, 1);
    expect(out[0].drop_from_prev).toBe(0);   // bài đầu không có "trước"
    expect(out[1].drop_from_prev).toBe(100); // tụt từ 100% xuống 0%
  });

  it("bài không có bản ghi tiến độ -> mọi chỉ số bằng 0", () => {
    const { lessons: out } = computeEngagement(lessons, [], 3);
    expect(out.every(l => l.avg_watch_percent === 0 && l.completion_rate === 0)).toBe(true);
  });
});
