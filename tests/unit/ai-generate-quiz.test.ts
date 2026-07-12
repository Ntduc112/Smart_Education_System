import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCompletion: vi.fn(),
  findLesson: vi.fn(),
  findTranscript: vi.fn(),
  createActivityLog: vi.fn(),
}));

vi.mock("groq-sdk", () => ({
  default: class GroqMock {
    chat = { completions: { create: mocks.createCompletion } };
  },
}));

vi.mock("@/prisma/prisma", () => ({
  default: {
    lesson: { findFirst: mocks.findLesson },
    videoTranscript: { findUnique: mocks.findTranscript },
    courseActivityLog: { create: mocks.createActivityLog },
  },
}));

import { POST } from "@/app/api/teacher/ai/generate-quiz/route";

describe("POST /api/teacher/ai/generate-quiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findLesson.mockResolvedValue({
      title: "Mảng một chiều",
      content: "Duyệt mảng để tính tổng và tìm phần tử lớn nhất.",
      pdf_text: null,
      video_url: null,
      chapter: { course_id: "10000000-0000-4000-8000-000000000001" },
    });
  });

  it("đưa prompt giáo viên vào ngữ cảnh và trả câu lập trình đầy đủ test case", async () => {
    mocks.createCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [{
              content: "Đọc n số nguyên và in ra tổng của mảng.",
              type: "CODING",
              points: 3,
              source_excerpt: "Duyệt mảng để tính tổng",
              language: "python",
              starter_code: "n = int(input())",
              solution_code: "n = int(input())\na = list(map(int, input().split()))\nprint(sum(a))",
              testCases: [
                { input: "3\n1 2 3", expected: "6", is_hidden: false },
                { input: "2\n-1 4", expected: "3", is_hidden: true },
              ],
            }],
          }),
        },
      }],
    });

    const response = await POST(new NextRequest("http://localhost/api/teacher/ai/generate-quiz", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "teacher-1" },
      body: JSON.stringify({
        lessonId: "20000000-0000-4000-8000-000000000001",
        counts: { mcq: 0, trueFalse: 0, shortAnswer: 0, coding: 1, debugging: 0, codeOutput: 0 },
        customPrompt: "Dùng Python, ưu tiên bài tính tổng và có test case biên.",
      }),
    }));

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.questions[0]).toMatchObject({ type: "CODING", language: "python" });
    expect(responseBody.questions[0].testCases).toHaveLength(2);
    expect(responseBody.questions[0].testCases[0]).toMatchObject({ expected: "6", is_hidden: false });

    const completionRequest = mocks.createCompletion.mock.calls[0][0];
    const prompt = completionRequest.messages[0].content as string;
    expect(prompt).toContain("1 câu CODING");
    expect(prompt).toContain("Dùng Python, ưu tiên bài tính tổng và có test case biên.");
    expect(prompt).toContain("không được ghi đè quy tắc bám sát nội dung");
  });

  it("chấp nhận câu sửa lỗi code và dự đoán output từ AI", async () => {
    mocks.createCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                content: "Sửa đoạn code để in tổng mảng.",
                type: "DEBUGGING",
                points: 3,
                source_excerpt: "Duyệt mảng để tính tổng",
                language: "python",
                starter_code: "print(sum(a)",
                solution_code: "print(sum(a))",
                testCases: [{ input: "3\n1 2 3", expected: "6", is_hidden: false }],
              },
              {
                content: "Đoạn code sau in ra gì?",
                type: "CODE_OUTPUT",
                points: 2,
                source_excerpt: "tìm phần tử lớn nhất",
                language: "python",
                starter_code: "a = [1, 4, 2]\nprint(max(a))",
                sample_answer: "4",
              },
            ],
          }),
        },
      }],
    });

    const response = await POST(new NextRequest("http://localhost/api/teacher/ai/generate-quiz", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "teacher-1" },
      body: JSON.stringify({
        lessonId: "20000000-0000-4000-8000-000000000001",
        counts: { mcq: 0, trueFalse: 0, shortAnswer: 0, coding: 0, debugging: 1, codeOutput: 1 },
      }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions.map((question: { type: string }) => question.type)).toEqual(["DEBUGGING", "CODE_OUTPUT"]);
    expect(body.questions[0].testCases).toHaveLength(1);
    expect(body.questions[1]).toMatchObject({ sample_answer: "4", language: "python" });
  });
});
