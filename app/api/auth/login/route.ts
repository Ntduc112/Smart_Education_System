import {PrismaClient} from "@/prisma/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import {z} from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { signAccessToken, signRefreshToken } from "@/lib/auth/token";
const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});
const prisma = new PrismaClient();
export async function POST(request: NextRequest) {
    try{
        const body = await request.json();
        const { email, password } = LoginSchema.parse(body);
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });
        if(!user){
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
        const isValidPassword = user ? await verifyPassword(password, user.password_hash) : false;
        if (!user || !isValidPassword) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }
        await setSession(await signAccessToken({ userId: user.id, role: user.role }), await signRefreshToken({ userId: user.id, role: user.role }));
        return NextResponse.json({ user }, { status: 200 });

    } catch(error){
        if(error instanceof z.ZodError){
            return NextResponse.json({errors:error.message});
        }
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}