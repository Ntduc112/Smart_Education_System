import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findCourse: vi.fn(),
  courseAccessWhere: vi.fn(),
  getCourseAccess: vi.fn(),
}));

vi.mock("@/prisma/prisma", () => ({
  default: {
    course: { findFirst: mocks.findCourse },
  },
}));

vi.mock("@/lib/course-access", () => ({
  courseAccessWhere: mocks.courseAccessWhere,
  getCourseAccess: mocks.getCourseAccess,
}));

import { GET } from "@/app/api/teacher/courses/[id]/classroom/route";

const courseId = "10000000-0000-4000-8000-000000000001";

describe("GET /api/teacher/courses/[id]/classroom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.courseAccessWhere.mockReturnValue({ OR: [{ instructor_id: "assistant-1" }] });
    mocks.getCourseAccess.mockResolvedValue({
      isOwner: false,
      isAssistant: true,
      canManageLessons: true,
      canManageQuizzes: false,
      instructorId: "teacher-1",
    });
    mocks.findCourse.mockResolvedValue({
      id: courseId,
      title: "Khóa học thử nghiệm",
      status: "PUBLISHED",
      instructor: { id: "teacher-1", name: "Giảng viên", avatar: null },
      sections: [{
        id: "chapter-1",
        title: "Chương 1",
        order: 1,
        lessons: [{
          id: "lesson-1",
          title: "Bài 1",
          order: 1,
          content: null,
          video_url: "r2:videos/lesson.mp4",
          pdf_url: null,
          pdf_text: null,
          is_free: false,
          quiz: [],
          questions: [{ _count: { replies: 0 } }],
        }],
      }],
    });
  });

  it("cho trợ giảng active mở classroom và trả đúng viewer", async () => {
    const response = await GET(new NextRequest(
      `http://localhost/api/teacher/courses/${courseId}/classroom`,
      { headers: { "x-user-id": "assistant-1" } },
    ), { params: Promise.resolve({ id: courseId }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.course).toMatchObject({
      viewer_id: "assistant-1",
      access: { isAssistant: true, canManageLessons: true },
    });
    expect(body.course.sections[0].lessons[0]).toMatchObject({
      question_count: 1,
      unanswered_count: 1,
    });
    expect(mocks.courseAccessWhere).toHaveBeenCalledWith("assistant-1");
  });
});
