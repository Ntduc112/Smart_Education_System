// Logic thuần tính mức độ tương tác theo bài học — tách khỏi route handler để
// kiểm thử đơn vị độc lập (không phụ thuộc DB, HTTP).

export interface LessonInput {
  id: string;
  title: string;
  chapter_title: string;
}

export interface ProgressInput {
  lesson_id: string;
  is_completed: boolean;
  watch_percent: number;
}

export interface LessonEngagement {
  lesson_id: string;
  lesson_title: string;
  chapter_title: string;
  position: number;
  avg_watch_percent: number;
  completion_rate: number;
  students_started: number;
  students_completed: number;
  drop_from_prev: number;
}

export interface EngagementResult {
  lessons: LessonEngagement[];
  worst_lesson_id: string | null;
}

/**
 * Tổng hợp tỷ lệ xem video theo từng bài học.
 * @param lessons       danh sách bài học theo đúng thứ tự
 * @param progresses    bản ghi tiến độ của toàn bộ học viên
 * @param totalEnrolled số học viên đã ghi danh (mẫu số để tính trung bình/tỷ lệ)
 */
export function computeEngagement(
  lessons: LessonInput[],
  progresses: ProgressInput[],
  totalEnrolled: number
): EngagementResult {
  if (lessons.length === 0 || totalEnrolled <= 0) {
    return { lessons: [], worst_lesson_id: null };
  }

  // Gom theo lesson_id
  const byLesson: Record<string, { sumWatch: number; completed: number; started: number }> = {};
  for (const p of progresses) {
    const agg = (byLesson[p.lesson_id] ??= { sumWatch: 0, completed: 0, started: 0 });
    agg.sumWatch += p.watch_percent;
    if (p.is_completed)      agg.completed += 1;
    if (p.watch_percent > 0) agg.started   += 1;
  }

  // Tính chỉ số theo thứ tự bài học; drop_from_prev = mức tụt completion so với bài trước
  let prevCompletion: number | null = null;
  const result = lessons.map((lesson, index) => {
    const agg = byLesson[lesson.id] ?? { sumWatch: 0, completed: 0, started: 0 };
    const avgWatch       = Math.round(agg.sumWatch / totalEnrolled);
    const completionRate = Math.round((agg.completed / totalEnrolled) * 100);
    const dropFromPrev   = prevCompletion === null ? 0 : prevCompletion - completionRate;
    prevCompletion = completionRate;

    return {
      lesson_id:          lesson.id,
      lesson_title:       lesson.title,
      chapter_title:      lesson.chapter_title,
      position:           index + 1,
      avg_watch_percent:  avgWatch,
      completion_rate:    completionRate,
      students_started:   agg.started,
      students_completed: agg.completed,
      drop_from_prev:     dropFromPrev,
    };
  });

  // Bài "mất hứng thú" nhất = avg_watch_percent thấp nhất
  const worst = result.reduce((min, l) => (l.avg_watch_percent < min.avg_watch_percent ? l : min), result[0]);

  return { lessons: result, worst_lesson_id: worst.lesson_id };
}
