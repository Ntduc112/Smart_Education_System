import { PrismaClient } from "@/generated/prisma";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

    const Registerschema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        role: z.enum(["student", "teacher"], "Role must be either student or teacher")
    });
async function POST(request: NextRequest) {
    try {
        const body = request.json();
        const { name, email, password, role } = Registerschema.parse(body);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role
            }
        });
        return NextResponse.json({ user }, { status: 201 });
    }
}