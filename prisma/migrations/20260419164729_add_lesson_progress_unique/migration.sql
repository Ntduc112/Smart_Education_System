/*
  Warnings:

  - A unique constraint covering the columns `[user_id,lesson_id]` on the table `LessonProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_user_id_lesson_id_key" ON "LessonProgress"("user_id", "lesson_id");
