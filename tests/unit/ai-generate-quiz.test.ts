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

  it("chịu được field null từ AI và tự dựng options cho câu TRUE_FALSE thiếu", async () => {
    mocks.createCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                content: "Duyệt mảng dùng để làm gì?",
                type: "SHORT_ANSWER",
                points: 2,
                sample_answer: "Tính tổng và tìm phần tử lớn nhất.",
                options: null,
                testCases: null,
                language: null,
              },
              {
                content: "Duyệt mảng có thể dùng để tính tổng, đúng hay sai?",
                type: "TRUE_FALSE",
                points: 1,
                sample_answer: "Đúng",
                options: null,
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
        counts: { mcq: 0, trueFalse: 1, shortAnswer: 1, coding: 0, debugging: 0, codeOutput: 0 },
      }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions.map((question: { type: string }) => question.type)).toEqual(["SHORT_ANSWER", "TRUE_FALSE"]);
    expect(body.questions[1].options).toEqual([
      { content: "Đúng", is_correct: true },
      { content: "Sai", is_correct: false },
    ]);
  });

  it("loại riêng câu sai schema, giữ các câu hợp lệ thay vì trả lỗi cả lô", async () => {
    mocks.createCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                content: "Mảng một chiều dùng để làm gì?",
                type: "MCQ",
                points: 1,
                options: [
                  { content: "Lưu dãy phần tử", is_correct: true },
                  { content: "Chỉ lưu 1 phần tử", is_correct: false },
                ],
              },
              {
                content: "Câu MCQ hỏng vì thiếu options.",
                type: "MCQ",
                points: 1,
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
        counts: { mcq: 2, trueFalse: 0, shortAnswer: 0, coding: 0, debugging: 0, codeOutput: 0 },
      }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0].content).toBe("Mảng một chiều dùng để làm gì?");
    // Lô chưa sạch → được phép thử lại tối đa 3 lần trước khi chấp nhận lô tốt nhất.
    expect(mocks.createCompletion.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("hết hạn mức Groq (429): không retry, trả 429 kèm thời gian thử lại", async () => {
    mocks.createCompletion.mockRejectedValue(
      Object.assign(new Error("429 rate_limit_exceeded"), {
        status: 429,
        headers: new Headers({ "retry-after": "6679" }),
      }),
    );

    const response = await POST(new NextRequest("http://localhost/api/teacher/ai/generate-quiz", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "teacher-1" },
      body: JSON.stringify({
        lessonId: "20000000-0000-4000-8000-000000000001",
        counts: { mcq: 1, trueFalse: 0, shortAnswer: 0, coding: 0, debugging: 0, codeOutput: 0 },
      }),
    }));

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("rate_limited");
    expect(body.message).toContain("112 phút");
    // 429 dừng ngay — retry chỉ đốt thêm quota.
    expect(mocks.createCompletion).toHaveBeenCalledTimes(1);
  });
});
