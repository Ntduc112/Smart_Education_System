import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = request.headers.get("x-user-id");

        const course = await prisma.course.findFirst({
            where: { id, status: "PUBLISHED" },
            include: {
                category:   { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true, avatar: true } },
                sections: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                order: true,
                                is_free: true,
                                // video_url và pdf_url sẽ được mask bên dưới
                                video_url: true,
                                pdf_url: true,
                            },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const isEnrolled = userId
            ? !!(await prisma.enrollment.findUnique({
                  where: { user_id_course_id: { user_id: userId, course_id: id } },
              }))
            : false;

        // Mask video_url và pdf_url với lesson không free
        const maskedCourse = {
            ...course,
            sections: course.sections.map((section) => ({
                ...section,
                lessons: section.lessons.map((lesson) => ({
                    ...lesson,
                    video_url: lesson.is_free ? lesson.video_url : null,
                    pdf_url:   lesson.is_free ? lesson.pdf_url   : null,
                })),
            })),
            is_enrolled: isEnrolled,
            is_free:     Number(course.price) === 0,
        };

        return NextResponse.json({ course: maskedCourse }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
