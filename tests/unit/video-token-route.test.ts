import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findLesson: vi.fn(),
  signVideoToken: vi.fn(),
}));

vi.mock("@/prisma/prisma", () => ({
  default: {
    lesson: { findUnique: mocks.findLesson },
  },
}));

vi.mock("@/lib/auth/video-token", () => ({
  signVideoToken: mocks.signVideoToken,
}));

import { GET } from "@/app/api/lessons/[id]/video-token/route";

const lessonId = "20000000-0000-4000-8000-000000000001";

function request(userId?: string) {
  return new NextRequest(`http://localhost/api/lessons/${lessonId}/video-token`, {
    headers: userId ? { "x-user-id": userId } : undefined,
  });
}

describe("GET /api/lessons/[id]/video-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signVideoToken.mockResolvedValue("signed-video-token");
    mocks.findLesson.mockResolvedValue({
      video_url: "r2:videos/lesson.mp4",
      is_free: false,
      chapter: {
        course: {
          instructor_id: "teacher-1",
          enrollments: [],
          collaborators: [],
        },
      },
    });
  });

  it("cấp token cho giảng viên sở hữu khóa học", async () => {
    const response = await GET(request("teacher-1"), {
      params: Promise.resolve({ id: lessonId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      token: "signed-video-token",
      videoKey: "videos/lesson.mp4",
    });
    expect(mocks.signVideoToken).toHaveBeenCalledWith({
      lessonId,
      userId: "teacher-1",
      videoKey: "videos/lesson.mp4",
    });
  });

  it("từ chối người không sở hữu và chưa ghi danh", async () => {
    const response = await GET(request("other-user"), {
      params: Promise.resolve({ id: lessonId }),
    });

    expect(response.status).toBe(403);
    expect(mocks.signVideoToken).not.toHaveBeenCalled();
  });

  it("cấp token cho trợ giảng đang hoạt động", async () => {
    mocks.findLesson.mockResolvedValue({
      video_url: "r2:videos/lesson.mp4",
      is_free: false,
      chapter: {
        course: {
          instructor_id: "teacher-1",
          enrollments: [],
          collaborators: [{ user_id: "assistant-1" }],
        },
      },
    });

    const response = await GET(request("assistant-1"), {
      params: Promise.resolve({ id: lessonId }),
    });

    expect(response.status).toBe(200);
    expect(mocks.signVideoToken).toHaveBeenCalledWith({
      lessonId,
      userId: "assistant-1",
      videoKey: "videos/lesson.mp4",
    });
  });

  it("yêu cầu đăng nhập", async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ id: lessonId }),
    });

    expect(response.status).toBe(401);
    expect(mocks.findLesson).not.toHaveBeenCalled();
  });
});
