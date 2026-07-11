-- AlterEnum
ALTER TYPE "question_type" ADD VALUE 'CODING';

-- AlterTable
ALTER TABLE "AttemptAnswer" ADD COLUMN     "code_output" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "language" TEXT,
ADD COLUMN     "solution_code" TEXT,
ADD COLUMN     "starter_code" TEXT;

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
