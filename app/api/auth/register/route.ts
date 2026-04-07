import { PrismaClient } from "@/prisma/generated/prisma";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient();

const Registerschema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password_hash: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["STUDENT", "TEACHER"], { message: "Role must be either STUDENT or TEACHER" })
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password_hash, role } = Registerschema.parse(body);
        const hashedPassword = await hashPassword(password_hash);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role
            }
        });
        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
