export function buildQuizAttemptResultLink(
  courseId: string,
  quizId: string,
  attemptId: string,
): string {
  const params = new URLSearchParams({ quiz: quizId, attempt: attemptId });
  return `/student/courses/${encodeURIComponent(courseId)}/learn?${params.toString()}`;
}
