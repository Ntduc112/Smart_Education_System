import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { MAX_QUIZ_ATTEMPTS } from "@/lib/quiz-policy";
import { isCodeBasedQuestionType, isExecutableQuestionType } from "@/lib/question-types";
import { courseAccessWhere } from "@/lib/course-access";

const OptionSchema = z.object({
    content:    z.string().min(1),
    is_correct: z.boolean(),
});

const TestCaseSchema = z.object({
    input:     z.string().max(10_000),
    expected:  z.string().min(1).max(10_000),
    is_hidden: z.boolean().default(false),
});

const QuestionSchema = z.object({
    content:       z.string().min(1),
    type:          z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING", "DEBUGGING", "CODE_OUTPUT"]),
    points:        z.number().int().min(1).default(1),
    sample_answer: z.string().optional(),
    ai_graded:     z.boolean().optional(),
    language:      z.enum(["python", "javascript", "c", "cpp", "java"]).optional(),
    starter_code:  z.string().max(50_000).optional(),
    solution_code: z.string().max(50_000).optional(),
    options:       z.array(OptionSchema).optional(),
    testCases:     z.array(TestCaseSchema).min(1).max(20).optional(),
}).superRefine((question, ctx) => {
    if (isCodeBasedQuestionType(question.type) && !question.language) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["language"], message: "Câu hỏi code phải có ngôn ngữ" });
    }
    if (isExecutableQuestionType(question.type) && !question.testCases?.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["testCases"], message: "Câu hỏi chạy code phải có test case" });
    }
    if (question.type === "CODE_OUTPUT" && !question.starter_code?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["starter_code"], message: "Cần đoạn code để dự đoán output" });
    }
    if (question.type === "CODE_OUTPUT" && !question.sample_answer?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sample_answer"], message: "Cần output đáp án" });
    }
});

const CreateQuizSchema = z.object({
    lesson_id:  z.string().uuid(),
    title:      z.string().min(1),
    pass_score:   z.number().int().min(1).max(100).default(70),
    require_pass: z.boolean().default(true),
    max_attempts: z.number().int().min(1).max(MAX_QUIZ_ATTEMPTS).nullable().default(null),
    time_limit:   z.number().int().min(1).optional(),
    questions:    z.array(QuestionSchema).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { questions, ...quizData } = CreateQuizSchema.parse(body);

        const lesson = await prisma.lesson.findFirst({
            where: {
                id:      quizData.lesson_id,
                chapter: { course: courseAccessWhere(userId, "QUIZZES") },
            },
        });
        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        const quiz = await prisma.quiz.create({
            data: {
                ...quizData,
                questions: questions
                    ? {
                        create: questions.map((q, i) => ({
                            content:       q.content,
                            type:          q.type,
                            points:        q.points,
                            order:         i + 1,
                            sample_answer: q.sample_answer,
                            // Chỉ SHORT_ANSWER mới có nghĩa chấm AI
                            ai_graded:     q.type === "SHORT_ANSWER" ? (q.ai_graded ?? false) : false,
                            language:      isCodeBasedQuestionType(q.type) ? q.language : null,
                            starter_code:  isCodeBasedQuestionType(q.type) ? q.starter_code : null,
                            solution_code: isExecutableQuestionType(q.type) ? q.solution_code : null,
                            options: q.options
                                ? { create: q.options.map((o, idx) => ({ ...o, order: idx + 1 })) }
                                : undefined,
                            testCases: isExecutableQuestionType(q.type) && q.testCases
                                ? { create: q.testCases.map((testCase, index) => ({ ...testCase, order: index })) }
                                : undefined,
                        })),
                    }
                    : undefined,
            },
            include: questions ? { questions: { include: { options: true, testCases: true } } } : undefined,
        });
        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating quiz:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
