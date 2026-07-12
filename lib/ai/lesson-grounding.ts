import prisma from "@/prisma/prisma";

// Giới hạn ký tự nội dung neo cho AI student-side (summary/chat)
const MAX_GROUNDING = 16000;

export interface LessonGrounding {
    lessonTitle:  string;
    chapterTitle: string;
    courseTitle:  string;
    // Nội dung thật của bài: text + PDF + transcript video, null nếu bài trống
    grounding:    string | null;
}

// Gộp nội dung bài học làm nguồn neo cho AI, kèm xác thực enrollment.
// Trả null nếu bài không tồn tại hoặc học viên chưa enroll khóa chứa bài.
export async function getLessonGrounding(userId: string, lessonId: string): Promise<LessonGrounding | null> {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            title:     true,
            content:   true,
            pdf_text:  true,
            video_url: true,
            chapter:   { select: { title: true, course: { select: { id: true, title: true } } } },
        },
    });
    if (!lesson) return null;

    const enrollment = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: lesson.chapter.course.id } },
    });
    if (!enrollment) return null;

    // Transcript video (Whisper) theo videoKey trích từ video_url ("r2:videos/...")
    let transcript: string | null = null;
    if (lesson.video_url?.startsWith("r2:")) {
        const t = await prisma.videoTranscript.findUnique({
            where: { video_key: lesson.video_url.slice(3) },
        });
        if (t?.status === "done" && t.text) transcript = t.text;
    }

    const sources: string[] = [];
    if (lesson.content)  sources.push(`[Nội dung bài]\n${lesson.content}`);
    if (lesson.pdf_text) sources.push(`[Tài liệu PDF]\n${lesson.pdf_text}`);
    if (transcript)      sources.push(`[Lời giảng trong video]\n${transcript}`);
    const grounding = sources.join("\n\n").slice(0, MAX_GROUNDING);

    return {
        lessonTitle:  lesson.title,
        chapterTitle: lesson.chapter.title,
        courseTitle:  lesson.chapter.course.title,
        grounding:    grounding.trim() ? grounding : null,
    };
}
