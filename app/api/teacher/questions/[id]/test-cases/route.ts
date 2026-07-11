import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { isExecutableQuestionType } from "@/lib/question-types";

const TestCaseSchema = z.object({
    input:     z.string().max(10_000),
    expected:  z.string().min(1).max(10_000),
    is_hidden: z.boolean().optional().default(false),
    order:     z.number().int().min(0),
});

const UpdateTestCaseSchema = z.object({
    id:        z.string().uuid(),
    input:     z.string().max(10_000),
    expected:  z.string().min(1).max(10_000),
    is_hidden: z.boolean().optional().default(false),
    order:     z.number().int().min(0),
});

const BulkUpsertSchema = z.object({
    testCases: z.array(z.union([TestCaseSchema, UpdateTestCaseSchema])).min(1).max(20),
});

// GET — Lấy test cases của câu hỏi
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

        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                quiz: { include: { lesson: { include: { chapter: { select: { course_id: true, course: { select: { instructor_id: true } } } } } } } },
                testCases: { orderBy: { order: "asc" } },
            },
        });

        if (!question || question.quiz.deleted_at) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        if (!isExecutableQuestionType(question.type)) {
            return NextResponse.json({ error: "Question is not a coding question" }, { status: 400 });
        }

        // Chỉ instructor của khóa học mới xem được
        if (question.quiz.lesson.chapter.course.instructor_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ testCases: question.testCases });
    } catch (error) {
        console.error("Error fetching test cases:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

// PUT — Bulk upsert test cases (xóa cái cũ, tạo mới)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                quiz: { include: { lesson: { include: { chapter: { select: { course_id: true, course: { select: { instructor_id: true } } } } } } } },
            },
        });

        if (!question || question.quiz.deleted_at) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        if (!isExecutableQuestionType(question.type)) {
            return NextResponse.json({ error: "Question is not a coding question" }, { status: 400 });
        }

        if (question.quiz.lesson.chapter.course.instructor_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { testCases } = BulkUpsertSchema.parse(body);

        // Xóa hết test cases cũ, tạo mới
        await prisma.$transaction([
            prisma.testCase.deleteMany({ where: { question_id: id } }),
            ...testCases.map((tc, index) =>
                prisma.testCase.create({
                    data: {
                        question_id: id,
                        input:       tc.input,
                        expected:    tc.expected,
                        is_hidden:   tc.is_hidden,
                        order:       tc.order ?? index,
                    },
                })
            ),
        ]);

        const updated = await prisma.testCase.findMany({
            where: { question_id: id },
            orderBy: { order: "asc" },
        });

        return NextResponse.json({ testCases: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error upserting test cases:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
