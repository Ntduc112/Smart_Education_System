import { NextRequest,NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {z} from "zod";
const CourseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    thumbnail: z.string().url("Thumbnail must be a valid URL"),
    status: z.enum(["DRAFT", "PUBLISHED"], { message: "Status must be either DRAFT or PUBLISHED" }),
    price: z.number().min(0, "Price must be a non-negative number"),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], { message: "Level must be one of BEGINNER, INTERMEDIATE, ADVANCED" }),
    category_id: z.string().uuid("Category ID must be a valid UUID"),
});
export async function GET(request: NextRequest,{ params }: { params: { id: string } }) {
    try{
        const userId = request.headers.get("x-user-id");
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const course = await prisma.course.findFirst({
            where: { id: params.id, instructor_id: userId },
        });
        if(!course){
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        return NextResponse.json({ course }, { status: 200 });
    }catch(error){
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
export async function PUT(request: NextRequest,{ params }: { params: { id: string } }) {
    try{
        const userId = request.headers.get("x-user-id");
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { title, description, thumbnail, price, level, category_id, status } = CourseSchema.parse(body);
        const existingCourse = await prisma.course.findFirst({
            where: { id: params.id, instructor_id: userId },
        });
        if(!existingCourse){
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const course = await prisma.course.update({
            where:{ id: params.id, instructor_id: userId },
            data:{
                title,
                description,
                thumbnail,
                price,
                level,
                category_id,
                status
            }
        });
        return NextResponse.json({ course }, { status: 200 });
    }catch(error){
        if(error instanceof z.ZodError){
            return NextResponse.json({ errors: error.message }, { status: 400 });
        }
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
export async function DELETE(request: NextRequest,{ params }: { params: { id: string } }) {
    try{
        const userId = request.headers.get("x-user-id");
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await prisma.course.deleteMany({
            where:{ id: params.id, instructor_id: userId }
        })
        return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
    }catch(error){
        console.error("Error deleting course:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }   
}