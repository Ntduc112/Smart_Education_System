import type { Prisma } from "@/prisma/generated/prisma";
import prisma from "@/prisma/prisma";

export type CoursePermission = "LESSONS" | "QUIZZES";

export function courseAccessWhere(
  userId: string,
  permission?: CoursePermission,
): Prisma.CourseWhereInput {
  const collaborator: Prisma.CourseCollaboratorWhereInput = {
    user_id: userId,
    status: "ACTIVE",
  };
  if (permission === "LESSONS") collaborator.can_manage_lessons = true;
  if (permission === "QUIZZES") collaborator.can_manage_quizzes = true;

  return {
    OR: [
      { instructor_id: userId },
      { collaborators: { some: collaborator } },
    ],
  };
}

export async function getCourseAccess(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      instructor_id: true,
      collaborators: {
        where: { user_id: userId, status: "ACTIVE" },
        select: {
          can_manage_lessons: true,
          can_manage_quizzes: true,
        },
        take: 1,
      },
    },
  });
  if (!course) return null;

  const isOwner = course.instructor_id === userId;
  const membership = course.collaborators[0];
  if (!isOwner && !membership) return null;

  return {
    isOwner,
    isAssistant: !isOwner && Boolean(membership),
    canManageLessons: isOwner || Boolean(membership?.can_manage_lessons),
    canManageQuizzes: isOwner || Boolean(membership?.can_manage_quizzes),
  };
}
