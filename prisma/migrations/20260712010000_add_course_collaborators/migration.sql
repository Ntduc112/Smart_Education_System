ALTER TYPE "userRole" ADD VALUE 'TEACHING_ASSISTANT';

CREATE TYPE "collaborator_status" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

CREATE TABLE "CourseCollaborator" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "status" "collaborator_status" NOT NULL DEFAULT 'PENDING',
    "can_manage_lessons" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_quizzes" BOOLEAN NOT NULL DEFAULT false,
    "can_answer_qa" BOOLEAN NOT NULL DEFAULT false,
    "can_grade" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "CourseCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseCollaborator_course_id_user_id_key" ON "CourseCollaborator"("course_id", "user_id");
CREATE INDEX "CourseCollaborator_user_id_status_idx" ON "CourseCollaborator"("user_id", "status");
CREATE INDEX "CourseCollaborator_course_id_status_idx" ON "CourseCollaborator"("course_id", "status");

ALTER TABLE "CourseCollaborator" ADD CONSTRAINT "CourseCollaborator_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCollaborator" ADD CONSTRAINT "CourseCollaborator_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCollaborator" ADD CONSTRAINT "CourseCollaborator_invited_by_fkey"
    FOREIGN KEY ("invited_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
