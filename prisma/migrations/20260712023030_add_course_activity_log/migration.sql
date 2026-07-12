-- CreateTable
CREATE TABLE "CourseActivityLog" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "entity_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseActivityLog_course_id_created_at_idx" ON "CourseActivityLog"("course_id", "created_at");

-- CreateIndex
CREATE INDEX "CourseActivityLog_course_id_actor_id_created_at_idx" ON "CourseActivityLog"("course_id", "actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "CourseActivityLog" ADD CONSTRAINT "CourseActivityLog_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseActivityLog" ADD CONSTRAINT "CourseActivityLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
