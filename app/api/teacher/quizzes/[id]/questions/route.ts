import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { isCodeBasedQuestionType, isExecutableQuestionType } from "@/lib/question-types";
import { courseAccessWhere } from "@/lib/course-access";
import { logCourseActivity } from "@/lib/activity-log";

const OptionSchema = z.object({
    content:    z.string().min(1).max(2_000),
    is_correct: z.boolean(),
    order:      z.number().int().min(1),
});

const TestCaseInputSchema = z.object({
    input:     z.string().max(10_000),
    expected:  z.string().min(1).max(10_000),
    is_hidden: z.boolean().optional().default(false),
    order:     z.number().int().min(0),
});

const CreateQuestionSchema = z.object({
    content:       z.string().min(1).max(10_000),
    type:          z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING", "DEBUGGING", "CODE_OUTPUT"]),
    points:        z.number().int().min(1).default(1),
    order:         z.number().int().min(1),
    sample_answer: z.string().max(10_000).optional(),
    ai_graded:     z.boolean().optional(),
    options:       z.array(OptionSchema).optional(),
    // Code-question fields
    language:      z.enum(["python", "javascript", "c", "cpp", "java"]).optional(),
    starter_code:  z.string().max(50_000).optional(),
    solution_code: z.string().max(50_000).optional(),
    testCases:     z.array(TestCaseInputSchema).max(20).optional(),
}).superRefine((question, ctx) => {
    if (isCodeBasedQuestionType(question.type) && !question.language) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["language"],
            message: "Câu hỏi code phải chọn ngôn ngữ",
        });
    }
    if (isExecutableQuestionType(question.type) && !question.testCases?.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["testCases"],
            message: "Câu hỏi chạy code cần ít nhất một test case",
        });
    }
    if (question.type === "CODE_OUTPUT" && !question.starter_code?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["starter_code"], message: "Cần đoạn code để học sinh dự đoán output" });
    }
    if (question.type === "CODE_OUTPUT" && !question.sample_answer?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sample_answer"], message: "Cần output đáp án" });
    }
});

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
            where: {
                id,
                deleted_at: null,
                lesson: { chapter: { course: courseAccessWhere(userId, "QUIZZES") } },
            },
            include: { lesson: { select: { chapter: { select: { course_id: true } } } } },
        });
        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const body = await request.json();
        const { options, testCases, ...questionData } = CreateQuestionSchema.parse(body);

        const question = await prisma.question.create({
            data: {
                content: questionData.content,
                type: questionData.type,
                points: questionData.points,
                order: questionData.order,
                sample_answer: questionData.type === "SHORT_ANSWER" || questionData.type === "CODE_OUTPUT"
                    ? questionData.sample_answer
                    : null,
                // Chỉ SHORT_ANSWER mới có nghĩa chấm AI
                ai_graded: questionData.type === "SHORT_ANSWER" ? (questionData.ai_graded ?? false) : false,
                language: isCodeBasedQuestionType(questionData.type) ? questionData.language : null,
                starter_code: isCodeBasedQuestionType(questionData.type) ? questionData.starter_code : null,
                solution_code: isExecutableQuestionType(questionData.type) ? questionData.solution_code : null,
                quiz_id: id,
                options: options ? { create: options } : undefined,
                testCases: isExecutableQuestionType(questionData.type) && testCases ? { create: testCases } : undefined,
            },
            include: { options: true, testCases: true },
        });

        await logCourseActivity({ courseId: quiz.lesson.chapter.course_id, actorId: userId, action: "CREATE_QUESTION", entityType: "QUESTION", entityId: question.id, entityTitle: quiz.title });
        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
