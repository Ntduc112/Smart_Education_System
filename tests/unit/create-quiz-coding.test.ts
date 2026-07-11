import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  lesson: { findFirst: vi.fn() },
  quiz: { create: vi.fn() },
}));

vi.mock("@/prisma/prisma", () => ({ default: prismaMock }));

import { POST } from "@/app/api/teacher/quizzes/route";

describe("POST /api/teacher/quizzes với câu lập trình", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
    prismaMock.quiz.create.mockResolvedValue({ id: "quiz-1" });
  });

  it("lưu language, code và test cases cùng quiz do AI tạo", async () => {
    const response = await POST(new NextRequest("http://localhost/api/teacher/quizzes", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "teacher-1" },
      body: JSON.stringify({
        lesson_id: "20000000-0000-4000-8000-000000000001",
        title: "Quiz mảng",
        pass_score: 70,
        require_pass: true,
        max_attempts: null,
        questions: [{
          content: "Tính tổng mảng",
          type: "CODING",
          points: 3,
          language: "python",
          starter_code: "# Nhập dữ liệu",
          solution_code: "print(sum(map(int, input().split())))",
          testCases: [
            { input: "1 2 3", expected: "6", is_hidden: false },
            { input: "-1 2", expected: "1", is_hidden: true },
          ],
        }],
      }),
    }));

    expect(response.status).toBe(201);
    expect(prismaMock.quiz.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        questions: {
          create: [expect.objectContaining({
            type: "CODING",
            language: "python",
            solution_code: "print(sum(map(int, input().split())))",
            testCases: {
              create: [
                { input: "1 2 3", expected: "6", is_hidden: false, order: 0 },
                { input: "-1 2", expected: "1", is_hidden: true, order: 1 },
              ],
            },
          })],
        },
      }),
    }));
  });

  it("lưu đúng dữ liệu sửa lỗi code và dự đoán output", async () => {
    const response = await POST(new NextRequest("http://localhost/api/teacher/quizzes", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "teacher-1" },
      body: JSON.stringify({
        lesson_id: "20000000-0000-4000-8000-000000000001",
        title: "Quiz đọc và sửa code",
        questions: [
          {
            content: "Sửa lỗi cú pháp",
            type: "DEBUGGING",
            points: 3,
            language: "python",
            starter_code: "print('hello'",
            solution_code: "print('hello')",
            testCases: [{ input: "", expected: "hello", is_hidden: false }],
          },
          {
            content: "Code in ra gì?",
            type: "CODE_OUTPUT",
            points: 2,
            language: "python",
            starter_code: "print(2 + 3)",
            sample_answer: "5",
          },
        ],
      }),
    }));

    expect(response.status).toBe(201);
    const createQuestions = prismaMock.quiz.create.mock.calls[0][0].data.questions.create;
    expect(createQuestions[0]).toMatchObject({
      type: "DEBUGGING",
      starter_code: "print('hello'",
      testCases: { create: [{ input: "", expected: "hello", is_hidden: false, order: 0 }] },
    });
    expect(createQuestions[1]).toMatchObject({
      type: "CODE_OUTPUT",
      starter_code: "print(2 + 3)",
      sample_answer: "5",
      testCases: undefined,
    });
  });
});
