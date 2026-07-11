-- Attempt counts, latest attempt and best-score views all filter by user + quiz.
CREATE INDEX "QuizAttempt_user_id_quiz_id_submitted_at_idx"
ON "QuizAttempt"("user_id", "quiz_id", "submitted_at");
