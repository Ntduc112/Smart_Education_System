import { clearSession} from "@/lib/auth/session";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
    try{
        await clearSession();
        await prisma.refreshToken.deleteMany({
            where: {
                user_id: request.headers.get("x-user-id")!
            }
        })
        return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    } catch(error){
        console.error("Error during logout:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}