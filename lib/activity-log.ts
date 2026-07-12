import prisma from "@/prisma/prisma";

export type ActivityAction =
  | "CREATE_CHAPTER" | "UPDATE_CHAPTER" | "DELETE_CHAPTER"
  | "CREATE_LESSON" | "UPDATE_LESSON" | "DELETE_LESSON"
  | "CREATE_QUIZ" | "UPDATE_QUIZ" | "DELETE_QUIZ" | "AI_GENERATE_QUIZ"
  | "CREATE_QUESTION" | "UPDATE_QUESTION" | "DELETE_QUESTION" | "UPDATE_TEST_CASES"
  | "GRADE_ESSAY";

export type ActivityEntityType = "CHAPTER" | "LESSON" | "QUIZ" | "QUESTION";

// Ghi nhật ký không được phép làm hỏng thao tác chính → nuốt lỗi, chỉ log console.
export async function logCourseActivity(input: {
  courseId: string;
  actorId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  entityTitle?: string;
}) {
  try {
    await prisma.courseActivityLog.create({
      data: {
        course_id: input.courseId,
        actor_id: input.actorId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        entity_title: input.entityTitle,
      },
    });
  } catch (error) {
    console.error("Error writing course activity log:", error);
  }
}
