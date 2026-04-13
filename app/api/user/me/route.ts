import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
export async function GET(request: NextRequest) {
    try{
        const userId = request.headers.get("x-user-id");
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({
            where:{id:userId}
        })
        if(!user){
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const { password_hash: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser }, { status: 200 });
    }catch(error){
        console.error("Error fetching user data:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
export async function PUT(request: NextRequest) {
    try{
        const userId = request.headers.get("x-user-id");
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { name, avatar } = body;
        const updatedUser = await prisma.user.update({
            where:{id:userId},
            data:{
                name,
                avatar
            }
        })
        const { password_hash: _, ...safeUser } = updatedUser;
        return NextResponse.json({ user: safeUser }, { status: 200 });
    }catch(error){
        console.error("Error updating user data:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}