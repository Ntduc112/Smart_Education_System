export const MAX_QUIZ_ATTEMPTS = 50;

export interface QuizPolicy {
  require_pass: boolean;
  pass_score: number;
  max_attempts: number | null;
}

export interface AttemptForPolicy {
  score: number | null;
  is_passed?: boolean | null;
}

export interface QuizAttemptState {
  used: number;
  maxAllowed: number | null;
  extraAttempts: number;
  remaining: number | null;
  exhausted: boolean;
  canAttempt: boolean;
  hasPassed: boolean;
  satisfied: boolean;
  bestScore: number | null;
}

/**
 * `is_passed` biểu diễn việc attempt đã thỏa chính sách hoàn thành của quiz.
 * Quiz không yêu cầu điểm được hoàn thành sau khi một bài nộp đã được ghi nhận.
 */
export function didAttemptPass(
  policy: Pick<QuizPolicy, "require_pass" | "pass_score">,
  score: number | null,
): boolean | null {
  if (score === null) return policy.require_pass ? null : true;
  return !policy.require_pass || score >= policy.pass_score;
}

/** Tính một lần ở backend rồi trả về FE để tránh lệch logic giữa các màn hình. */
export function getQuizAttemptState(
  policy: QuizPolicy,
  attempts: AttemptForPolicy[],
  extraAttempts = 0,
): QuizAttemptState {
  const used = attempts.length;
  const normalizedExtraAttempts = Math.max(0, Math.floor(extraAttempts));
  let bestScore: number | null = null;

  for (const attempt of attempts) {
    if (attempt.score !== null && (bestScore === null || attempt.score > bestScore)) {
      bestScore = attempt.score;
    }
  }

  const hasPassed = policy.require_pass
    ? attempts.some((attempt) =>
        attempt.is_passed === true ||
        (attempt.score !== null && attempt.score >= policy.pass_score),
      )
    : used > 0;
  const maxAllowed = policy.max_attempts === null
    ? null
    : policy.max_attempts + normalizedExtraAttempts;
  const remaining = maxAllowed === null
    ? null
    : Math.max(0, maxAllowed - used);
  const exhausted = remaining === 0;

  return {
    used,
    maxAllowed,
    extraAttempts: normalizedExtraAttempts,
    remaining,
    exhausted,
    canAttempt: !exhausted,
    hasPassed,
    satisfied: used > 0 && hasPassed,
    bestScore,
  };
}
