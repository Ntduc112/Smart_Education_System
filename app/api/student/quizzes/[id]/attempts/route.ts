import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { gradeShortAnswer } from "@/lib/ai/grade-short-answer";
import { CodeExecutorError, runTestCases, SUPPORTED_LANGUAGES } from "@/lib/code-executor";
import { didAttemptPass, getQuizAttemptState } from "@/lib/quiz-policy";
import { buildQuizAttemptResultLink } from "@/lib/quiz-attempt-link";
import type { AttemptAnswer, QuizAttempt } from "@/prisma/generated/prisma";
import { isExecutableQuestionType, normalizeProgramOutput } from "@/lib/question-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SubmitAttemptSchema = z.object({
    answers: z.array(z.object({
        question_id: z.string().uuid(),
        answer:      z.string().min(1).max(50_000),
    })).min(1).max(100),
});

class AttemptLimitError extends Error {}
class AttemptConflictError extends Error {}

function isSerializationConflict(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quiz = await prisma.quiz.findFirst({
            where:   { id, deleted_at: null },
            include: {
                lesson:    { include: { chapter: { select: { course_id: true } } } },
                questions: { include: { options: true, testCases: { orderBy: { order: "asc" } } } },
            },
        });
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id:   userId,
                    course_id: quiz.lesson.chapter.course_id,
                },
            },
        });
        if (!enrollment) {
            return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
        }

        // Guard sớm để không gọi AI/OneCompiler khi chắc chắn đã hết lượt.
        // Transaction phía dưới sẽ kiểm tra lại để chống hai request đồng thời.
        const [existingAttempts, approvedExtraAttempts] = await Promise.all([
            prisma.quizAttempt.findMany({
                where: { quiz_id: id, user_id: userId },
                select: { score: true, is_passed: true },
            }),
            prisma.quizAttemptRequest.count({
                where: { quiz_id: id, user_id: userId, status: "APPROVED" },
            }),
        ]);
        if (!getQuizAttemptState(quiz, existingAttempts, approvedExtraAttempts).canAttempt) {
            return NextResponse.json({ error: "Đã hết số lần làm" }, { status: 403 });
        }

        const body = await request.json();
        const { answers } = SubmitAttemptSchema.parse(body);

        const answerMap = new Map(answers.map((answer) => [answer.question_id, answer.answer]));
        const hasDuplicateAnswers = answerMap.size !== answers.length;
        const hasExactQuestionSet =
            answers.length === quiz.questions.length &&
            quiz.questions.every((question) => answerMap.has(question.id));
        if (hasDuplicateAnswers || !hasExactQuestionSet) {
            return NextResponse.json(
                { error: "Cần trả lời đầy đủ mỗi câu hỏi đúng một lần" },
                { status: 400 },
            );
        }

        const invalidCodingQuestion = quiz.questions.find((question) =>
            isExecutableQuestionType(question.type) &&
            (!question.language ||
                !SUPPORTED_LANGUAGES.includes(question.language) ||
                question.testCases.length === 0),
        );
        const invalidCodeOutputQuestion = quiz.questions.find((question) =>
            question.type === "CODE_OUTPUT" &&
            (!question.language || !question.starter_code?.trim() || !question.sample_answer?.trim()),
        );
        if (invalidCodingQuestion || invalidCodeOutputQuestion) {
            return NextResponse.json(
                { error: "Câu hỏi code chưa được cấu hình đầy đủ" },
                { status: 422 },
            );
        }

        const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0);

        type GradedAnswer = {
            question_id:   string;
            answer:        string;
            is_correct:    boolean | null;
            points_earned: number | null;
            ai_feedback?:  string;
            code_output?:  string;
        };

        const gradedAnswers = await Promise.all(
            quiz.questions.map(async (question): Promise<GradedAnswer> => {
                const question_id = question.id;
                const answer = answerMap.get(question_id)!;

                // ── CODING / DEBUGGING: chạy code học sinh qua test cases ──
                if (isExecutableQuestionType(question.type)) {
                    const results = await runTestCases(
                        answer,
                        question.language!,
                        question.testCases.map((testCase) => ({
                            input: testCase.input,
                            expected: testCase.expected,
                        })),
                    );
                    const passCount = results.filter((result) => result.passed).length;
                    const totalCases = results.length;
                    const ratio = passCount / totalCases;
                    const pts = Math.round(question.points * ratio * 100) / 100;

                    // Không trả input/expected/actual của hidden tests về phía học viên.
                    const output = results.map((result, index) => {
                        const testCase = question.testCases[index];
                        const status = result.passed ? "✅ PASS" : "❌ FAIL";
                        if (testCase.is_hidden) {
                            return `Test ẩn ${index + 1}: ${status}${result.timedOut ? " (timeout)" : ""}`;
                        }
                        const detail = !result.passed
                            ? ` (expected: ${result.expected}, got: ${result.actual})`
                            : "";
                        const stderr = result.stderr
                            ? ` [stderr: ${result.stderr.slice(0, 500)}]`
                            : "";
                        return `Test ${index + 1}: ${status}${detail}${stderr}`;
                    }).join("\n").slice(0, 10_000);

                    return {
                        question_id, answer,
                        is_correct:    passCount === totalCases,
                        points_earned: pts,
                        code_output:   output,
                        ai_feedback:   `${question.type === "DEBUGGING" ? "Sửa đúng" : "Đạt"} ${passCount}/${totalCases} test case`,
                    };
                }

                // ── CODE_OUTPUT: so sánh output học sinh dự đoán ──
                if (question.type === "CODE_OUTPUT") {
                    const normalizedAnswer = normalizeProgramOutput(answer);
                    const normalizedExpected = normalizeProgramOutput(question.sample_answer!);
                    const isCorrect = normalizedAnswer === normalizedExpected;
                    return {
                        question_id,
                        answer,
                        is_correct: isCorrect,
                        points_earned: isCorrect ? question.points : 0,
                    };
                }

                // ── SHORT_ANSWER ──
                if (question.type === "SHORT_ANSWER") {
                    if (question.ai_graded) {
                        // AI chấm ngay lúc nộp; lỗi AI → rơi về hàng chờ chấm tay.
                        try {
                            const { points, feedback } = await gradeShortAnswer({
                                questionContent: question.content,
                                sampleAnswer:    question.sample_answer,
                                studentAnswer:   answer,
                                maxPoints:       question.points,
                            });
                            return {
                                question_id, answer,
                                is_correct:    points >= question.points / 2,
                                points_earned: points,
                                ai_feedback:   feedback,
                            };
                        } catch (err) {
                            console.error(`[attempt] AI grade failed for question ${question_id}:`, err);
                        }
                    }
                    return { question_id, answer, is_correct: null, points_earned: null };
                }

                // ── MCQ / TRUE_FALSE ──
                const correctOption = question.options.find((o) => o.is_correct);
                const isCorrect     = correctOption?.content.toLowerCase() === answer.toLowerCase();
                const pts           = isCorrect ? question.points : 0;

                return { question_id, answer, is_correct: isCorrect, points_earned: pts };
            })
        );

        // Còn câu chưa có điểm (chờ chấm tay) → chưa chốt tổng điểm.
        const hasPending = gradedAnswers.some((a) => a.points_earned === null);
        const earnedPoints = gradedAnswers.reduce(
            (sum, answer) => sum + (answer.points_earned ?? 0),
            0,
        );
        const score      = totalPoints > 0 && !hasPending
            ? Math.round((earnedPoints / totalPoints) * 100)
            : null;
        const isPassed = didAttemptPass(quiz, score);
        const quizMessage = score === null
            ? "Bài quiz của bạn đang chờ chấm điểm"
            : !quiz.require_pass
                ? `Bạn đã hoàn thành quiz với ${score}/100`
                : `Bạn đạt ${score}/100 — ${isPassed ? "Đạt" : "Chưa đạt"}`;

        // Không giữ transaction trong lúc chấm AI/chạy OneCompiler. Chỉ khóa đoạn
        // kiểm tra lại quota + ghi attempt, retry khi PostgreSQL phát hiện race.
        let saved: {
            attempt: QuizAttempt & { answers: AttemptAnswer[] };
            attemptState: ReturnType<typeof getQuizAttemptState>;
        } | null = null;

        for (let retry = 0; retry < 3 && !saved; retry++) {
            try {
                saved = await prisma.$transaction(async (tx) => {
                    const [currentAttempts, currentExtraAttempts] = await Promise.all([
                        tx.quizAttempt.findMany({
                            where: { quiz_id: id, user_id: userId },
                            select: { score: true, is_passed: true },
                        }),
                        tx.quizAttemptRequest.count({
                            where: { quiz_id: id, user_id: userId, status: "APPROVED" },
                        }),
                    ]);
                    if (!getQuizAttemptState(quiz, currentAttempts, currentExtraAttempts).canAttempt) {
                        throw new AttemptLimitError("Đã hết số lần làm");
                    }

                    const attempt = await tx.quizAttempt.create({
                        data: {
                            user_id: userId,
                            quiz_id: id,
                            score,
                            is_passed: isPassed,
                            answers: { create: gradedAnswers },
                        },
                        include: { answers: true },
                    });
                    await tx.notification.create({
                        data: {
                            user_id: userId,
                            type: "QUIZ_RESULT",
                            title: "Kết quả quiz",
                            message: quizMessage,
                            link: buildQuizAttemptResultLink(
                                quiz.lesson.chapter.course_id,
                                quiz.id,
                                attempt.id,
                            ),
                        },
                    });
                    const attemptState = getQuizAttemptState(quiz, [
                        ...currentAttempts,
                        { score: attempt.score, is_passed: attempt.is_passed },
                    ], currentExtraAttempts);
                    return { attempt, attemptState };
                }, { isolationLevel: "Serializable" });
            } catch (error) {
                if (error instanceof AttemptLimitError) throw error;
                if (!isSerializationConflict(error)) throw error;
                if (retry === 2) throw new AttemptConflictError("Không thể giữ lượt làm do xung đột");
            }
        }

        if (!saved) throw new AttemptConflictError("Không thể lưu lượt làm");
        const { attempt, attemptState } = saved;

        return NextResponse.json(
            { attempt, attemptState, attemptRequest: null },
            { status: 201 },
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        if (error instanceof AttemptLimitError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (error instanceof AttemptConflictError) {
            return NextResponse.json(
                { error: "Có lượt làm khác vừa được ghi nhận. Vui lòng tải lại và thử lại." },
                { status: 409 },
            );
        }
        if (error instanceof CodeExecutorError) {
            console.error(`[Quiz Attempt] ${error.code}:`, error.message);
            const status = error.code === "PROVIDER_TIMEOUT" ? 504 : 503;
            return NextResponse.json(
                { error: "Dịch vụ chấm code tạm thời chưa sẵn sàng. Bài chưa bị tính lượt." },
                { status },
            );
        }
        console.error("Error submitting attempt:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [quiz, attempts, attemptRequests] = await Promise.all([
            prisma.quiz.findFirst({
                where: { id, deleted_at: null },
                select: { require_pass: true, pass_score: true, max_attempts: true },
            }),
            prisma.quizAttempt.findMany({
                where:   { quiz_id: id, user_id: userId },
                orderBy: { submitted_at: "desc" },
                include: { answers: true },
            }),
            prisma.quizAttemptRequest.findMany({
                where: {
                    quiz_id: id,
                    user_id: userId,
                    status: { in: ["PENDING", "APPROVED"] },
                },
                select: { id: true, status: true, requested_at: true },
                orderBy: { requested_at: "desc" },
            }),
        ]);
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const approvedExtraAttempts = attemptRequests.filter((item) => item.status === "APPROVED").length;
        const pendingRequest = attemptRequests.find((item) => item.status === "PENDING") ?? null;
        const attemptState = getQuizAttemptState(quiz, attempts, approvedExtraAttempts);
        return NextResponse.json(
            { attempts, attemptState, attemptRequest: pendingRequest },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error fetching attempts:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
