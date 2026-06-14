import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";

const UpdateUserSchema = z.object({
    name:      z.string().min(1).optional(),
    email:     z.string().email().optional(),
    password:  z.string().min(6).optional(),
    is_active: z.boolean().optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const user = await prisma.user.findUnique({
            where:  { id },
            select: {
                id:         true,
                name:       true,
                email:      true,
                role:       true,
                avatar:     true,
                is_active:  true,
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
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { name, email, password, is_active } = UpdateUserSchema.parse(body);

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where:  { id },
            data:   {
                ...(name && { name }),
                ...(email && { email }),
                ...(password && { password_hash: await hashPassword(password) }),
                ...(is_active !== undefined && { is_active }),
            },
            select: { id: true, name: true, email: true, role: true, is_active: true },
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

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: "User deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user (admin):", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
