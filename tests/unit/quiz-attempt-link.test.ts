import { describe, expect, it } from "vitest";
import { buildQuizAttemptResultLink } from "@/lib/quiz-attempt-link";

describe("quiz attempt result link", () => {
  it("trỏ notification tới đúng course, quiz và attempt", () => {
    expect(buildQuizAttemptResultLink("course-1", "quiz-1", "attempt-1")).toBe(
      "/student/courses/course-1/learn?quiz=quiz-1&attempt=attempt-1",
    );
  });
});
