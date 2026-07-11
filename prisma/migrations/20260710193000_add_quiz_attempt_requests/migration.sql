-- CreateEnum
CREATE TYPE "attempt_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "QuizAttemptRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "status" "attempt_request_status" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,

    CONSTRAINT "QuizAttemptRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizAttemptRequest_quiz_id_status_idx"
ON "QuizAttemptRequest"("quiz_id", "status");

-- CreateIndex
CREATE INDEX "QuizAttemptRequest_user_id_quiz_id_status_idx"
ON "QuizAttemptRequest"("user_id", "quiz_id", "status");

-- Chỉ một yêu cầu đang chờ cho mỗi học viên × quiz; vẫn giữ được toàn bộ lịch sử đã duyệt.
CREATE UNIQUE INDEX "QuizAttemptRequest_one_pending_per_student_quiz"
ON "QuizAttemptRequest"("user_id", "quiz_id")
WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "QuizAttemptRequest"
ADD CONSTRAINT "QuizAttemptRequest_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptRequest"
ADD CONSTRAINT "QuizAttemptRequest_quiz_id_fkey"
FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptRequest"
ADD CONSTRAINT "QuizAttemptRequest_resolved_by_fkey"
FOREIGN KEY ("resolved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
