import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  quiz: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/prisma/prisma", () => ({ default: prismaMock }));

import { DELETE } from "@/app/api/teacher/quizzes/[id]/route";

describe("DELETE /api/teacher/quizzes/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("xóa mềm quiz để giữ nguyên attempts và answers", async () => {
    prismaMock.quiz.findFirst.mockResolvedValue({ id: "quiz-1", questions: [] });
    prismaMock.quiz.update.mockResolvedValue({ id: "quiz-1" });

    const response = await DELETE(
      new NextRequest("http://localhost/api/teacher/quizzes/quiz-1", {
        method: "DELETE",
        headers: { "x-user-id": "teacher-1" },
      }),
      { params: Promise.resolve({ id: "quiz-1" }) },
    );

    expect(response.status).toBe(200);
    expect(prismaMock.quiz.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "quiz-1", deleted_at: null }),
    }));
    expect(prismaMock.quiz.update).toHaveBeenCalledWith({
      where: { id: "quiz-1" },
      data: { deleted_at: expect.any(Date) },
    });
    expect(prismaMock.quiz.delete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      message: "Quiz deleted; student attempts preserved",
    });
  });
});
