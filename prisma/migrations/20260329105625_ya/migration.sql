/*
  Warnings:

  - You are about to drop the `Courses` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,course_id]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Courses" DROP CONSTRAINT "Courses_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Courses" DROP CONSTRAINT "Courses_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_course_id_fkey";

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "is_free" SET DEFAULT false;

-- AlterTable
ALTER TABLE "LessonProgress" ALTER COLUMN "last_watched_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatar" DROP NOT NULL;

-- DropTable
DROP TABLE "Courses";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "level" TEXT NOT NULL,
    "status" "course_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_user_id_course_id_key" ON "Enrollment"("user_id", "course_id");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
