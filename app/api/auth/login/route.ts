import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import {z} from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { signAccessToken, signRefreshToken } from "@/lib/auth/token";

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = LoginSchema.parse(body);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
        const accessToken = await signAccessToken({ userId: user.id, role: user.role });
        const refreshToken = await signRefreshToken({ userId: user.id, role: user.role });
        await setSession(accessToken, refreshToken);
        await prisma.refreshToken.create({
            data:{
                user_id: user.id,
                token: refreshToken,
                expires_at: new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN!) * 1000)
            }
        })
        const { password_hash: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}