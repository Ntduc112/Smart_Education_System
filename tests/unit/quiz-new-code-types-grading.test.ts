import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findQuiz: vi.fn(),
  findEnrollment: vi.fn(),
  findAttempts: vi.fn(),
  countRequests: vi.fn(),
  createAttempt: vi.fn(),
  createNotification: vi.fn(),
  runTestCases: vi.fn(),
}));

vi.mock("@/lib/code-executor", () => ({
  CodeExecutorError: class CodeExecutorError extends Error {
    code = "PROVIDER_ERROR";
  },
  SUPPORTED_LANGUAGES: ["python"],
  runTestCases: mocks.runTestCases,
}));

vi.mock("@/lib/ai/grade-short-answer", () => ({ gradeShortAnswer: vi.fn() }));

vi.mock("@/prisma/prisma", () => ({
  default: {
    quiz: { findFirst: mocks.findQuiz },
    enrollment: { findUnique: mocks.findEnrollment },
    quizAttempt: { findMany: mocks.findAttempts },
    quizAttemptRequest: { count: mocks.countRequests },
    $transaction: async (callback: (tx: unknown) => unknown) => callback({
      quizAttempt: {
        findMany: mocks.findAttempts,
        create: mocks.createAttempt,
      },
      quizAttemptRequest: { count: mocks.countRequests },
      notification: { create: mocks.createNotification },
    }),
  },
}));

import { POST } from "@/app/api/student/quizzes/[id]/attempts/route";

describe("quiz grading cho hai dạng code mới", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAttempts.mockResolvedValue([]);
    mocks.countRequests.mockResolvedValue(0);
    mocks.findEnrollment.mockResolvedValue({ id: "enrollment-1" });
    mocks.createNotification.mockResolvedValue({ id: "notification-1" });
    mocks.runTestCases.mockResolvedValue([{
      passed: true,
      timedOut: false,
      expected: "6",
      actual: "6",
      stderr: "",
    }]);
    mocks.createAttempt.mockImplementation(async ({ data }: { data: {
      score: number | null;
      is_passed: boolean | null;
      answers: { create: unknown[] };
    } }) => ({
      id: "attempt-1",
      user_id: "student-1",
      quiz_id: "quiz-1",
      score: data.score,
      is_passed: data.is_passed,
      submitted_at: new Date(),
      answers: data.answers.create,
    }));
    mocks.findQuiz.mockResolvedValue({
      id: "quiz-1",
      title: "Quiz code",
      pass_score: 70,
      require_pass: true,
      max_attempts: null,
      lesson: { chapter: { course_id: "course-1" } },
      questions: [
        {
          id: "40000000-0000-4000-8000-000000000001",
          type: "DEBUGGING",
          content: "Sửa code",
          points: 3,
          language: "python",
          starter_code: "print(6",
          sample_answer: null,
          ai_graded: false,
          options: [],
          testCases: [{ input: "", expected: "6", is_hidden: false }],
        },
        {
          id: "40000000-0000-4000-8000-000000000002",
          type: "CODE_OUTPUT",
          content: "Code in gì?",
          points: 2,
          language: "python",
          starter_code: "print(3)",
          sample_answer: "3\n",
          ai_graded: false,
          options: [],
          testCases: [],
        },
      ],
    });
  });

  it("chạy test cho DEBUGGING và so sánh output đã chuẩn hóa cho CODE_OUTPUT", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/student/quizzes/quiz-1/attempts", {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": "student-1" },
        body: JSON.stringify({
          answers: [
            { question_id: "40000000-0000-4000-8000-000000000001", answer: "print(6)" },
            { question_id: "40000000-0000-4000-8000-000000000002", answer: "3  \r\n" },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "quiz-1" }) },
    );

    expect(response.status).toBe(201);
    expect(mocks.runTestCases).toHaveBeenCalledWith("print(6)", "python", [{ input: "", expected: "6" }]);

    const attempt = mocks.createAttempt.mock.calls[0][0].data;
    expect(attempt.score).toBe(100);
    expect(attempt.answers.create).toEqual([
      expect.objectContaining({ question_id: "40000000-0000-4000-8000-000000000001", is_correct: true, points_earned: 3 }),
      expect.objectContaining({ question_id: "40000000-0000-4000-8000-000000000002", is_correct: true, points_earned: 2 }),
    ]);
  });
});
