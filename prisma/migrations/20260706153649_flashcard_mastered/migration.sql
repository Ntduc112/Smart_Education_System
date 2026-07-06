-- CreateTable
CREATE TABLE "FlashcardMastered" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashcardMastered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlashcardMastered_user_id_idx" ON "FlashcardMastered"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardMastered_user_id_question_id_key" ON "FlashcardMastered"("user_id", "question_id");
