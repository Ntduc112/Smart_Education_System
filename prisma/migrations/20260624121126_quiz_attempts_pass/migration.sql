-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "max_attempts" INTEGER,
ADD COLUMN     "require_pass" BOOLEAN NOT NULL DEFAULT false;
