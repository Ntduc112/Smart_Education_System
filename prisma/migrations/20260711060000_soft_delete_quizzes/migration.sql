-- Keep quiz attempts and submitted answers for historical reporting while
-- removing a quiz from all active course/student flows.
ALTER TABLE "Quiz" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

-- Active quiz lookups are always scoped by lesson and deleted_at IS NULL.
CREATE INDEX "Quiz_active_lesson_id_idx"
ON "Quiz"("lesson_id")
WHERE "deleted_at" IS NULL;
