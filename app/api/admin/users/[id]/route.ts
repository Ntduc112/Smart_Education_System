import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";

const UpdateUserSchema = z.object({
    role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where:  { id: params.id },
            select: {
                id:         true,
                name:       true,
                email:      true,
                role:       true,
                avatar:     true,
                created_at: true,
                _count:     { select: { enrollments: true, courses: true, payments: true } },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { role } = UpdateUserSchema.parse(body);

        const user = await prisma.user.findUnique({ where: { id: params.id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where:  { id: params.id },
            data:   { role },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json({ user: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating user (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
