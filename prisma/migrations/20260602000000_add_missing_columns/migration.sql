-- Add pdf_text to Lesson
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "pdf_text" TEXT;

-- Add video_time to LessonNote
ALTER TABLE "LessonNote" ADD COLUMN IF NOT EXISTS "video_time" INTEGER;

-- Add watch_percent to LessonProgress
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "watch_percent" INTEGER NOT NULL DEFAULT 0;

-- Create PasswordReset table
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id"         TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "code"       TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used"       BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PasswordReset_email_idx" ON "PasswordReset"("email");
