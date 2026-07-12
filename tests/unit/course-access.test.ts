import { describe, expect, it, vi } from "vitest";

vi.mock("@/prisma/prisma", () => ({
  default: { course: { findUnique: vi.fn() } },
}));

import prisma from "@/prisma/prisma";
import { courseAccessWhere, getCourseAccess } from "@/lib/course-access";

describe("course access", () => {
  it("requires an active collaborator with the exact lesson permission", () => {
    expect(courseAccessWhere("assistant-1", "LESSONS")).toEqual({
      OR: [
        { instructor_id: "assistant-1" },
        {
          collaborators: {
            some: {
              user_id: "assistant-1",
              status: "ACTIVE",
              can_manage_lessons: true,
            },
          },
        },
      ],
    });
  });

  it("grants every course permission to the owner", async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValueOnce({
      instructor_id: "owner-1",
      collaborators: [],
    } as never);

    await expect(getCourseAccess("owner-1", "course-1")).resolves.toEqual({
      isOwner: true,
      isAssistant: false,
      canManageLessons: true,
      canManageQuizzes: true,
    });
  });

  it("does not leak permissions between assistant capabilities", async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValueOnce({
      instructor_id: "owner-1",
      collaborators: [{
        can_manage_lessons: false,
        can_manage_quizzes: true,
      }],
    } as never);

    await expect(getCourseAccess("assistant-1", "course-1")).resolves.toMatchObject({
      isOwner: false,
      isAssistant: true,
      canManageLessons: false,
      canManageQuizzes: true,
    });
  });
});
