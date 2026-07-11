import { describe, expect, it } from "vitest";
import { didAttemptPass, getQuizAttemptState } from "@/lib/quiz-policy";

describe("quiz policy", () => {
  it("coi một bài nộp là hoàn thành khi quiz không yêu cầu điểm", () => {
    const policy = { require_pass: false, pass_score: 70, max_attempts: null };

    expect(didAttemptPass(policy, 20)).toBe(true);
    expect(getQuizAttemptState(policy, [{ score: 20 }])).toEqual({
      used: 1,
      maxAllowed: null,
      extraAttempts: 0,
      remaining: null,
      exhausted: false,
      canAttempt: true,
      hasPassed: true,
      satisfied: true,
      bestScore: 20,
    });
  });

  it("chỉ thỏa quiz bắt buộc điểm khi có ít nhất một attempt đạt ngưỡng", () => {
    const policy = { require_pass: true, pass_score: 70, max_attempts: 3 };
    const state = getQuizAttemptState(policy, [
      { score: 45, is_passed: false },
      { score: 75, is_passed: true },
    ]);

    expect(state).toMatchObject({
      used: 2,
      remaining: 1,
      exhausted: false,
      hasPassed: true,
      satisfied: true,
      bestScore: 75,
    });
  });

  it("không tự cho qua khi đã hết lượt nhưng chưa đạt", () => {
    const state = getQuizAttemptState(
      { require_pass: true, pass_score: 70, max_attempts: 2 },
      [{ score: 30 }, { score: 60 }],
    );

    expect(state).toMatchObject({
      used: 2,
      remaining: 0,
      exhausted: true,
      canAttempt: false,
      hasPassed: false,
      satisfied: false,
      bestScore: 60,
    });
  });

  it("attempt đang chờ chấm chưa đạt quiz bắt buộc điểm", () => {
    expect(didAttemptPass({ require_pass: true, pass_score: 70 }, null)).toBeNull();
  });

  it("cộng lượt giáo viên cấp vào giới hạn hiệu dụng", () => {
    const state = getQuizAttemptState(
      { require_pass: true, pass_score: 70, max_attempts: 2 },
      [{ score: 30 }, { score: 40 }],
      1,
    );

    expect(state).toMatchObject({
      used: 2,
      maxAllowed: 3,
      extraAttempts: 1,
      remaining: 1,
      exhausted: false,
      canAttempt: true,
    });
  });
});
