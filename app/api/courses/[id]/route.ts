import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const course = await prisma.course.findFirst({
            where: { id: params.id, status: "PUBLISHED" },
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
        };

        return NextResponse.json({ course: maskedCourse }, { status: 200 });
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
