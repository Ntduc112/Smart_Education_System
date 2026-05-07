import { NextRequest,NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {z} from "zod";
const CategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string()
});
export async function GET(_request: NextRequest) {
    try{

        const categories = await prisma.category.findMany({
            include: { _count: { select: { courses: true } } },
            orderBy: { name: "asc" }
        });
        return NextResponse.json({ categories }, { status: 200 });
    }catch(error){
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    try{
        const body = await request.json();
        const {name,description} = CategorySchema.parse(body);
        const category = await prisma.category.create({
            data:{
                name,
                description
            },
            include: { _count: { select: { courses: true } } }
        })
        return NextResponse.json({ category }, { status: 201 });
    }catch(error){
        if(error instanceof z.ZodError){
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
        }
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}