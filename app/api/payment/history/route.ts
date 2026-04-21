import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payments = await prisma.payment.findMany({
            where:   { user_id: userId },
            orderBy: { created_at: "desc" },
            select: {
                id:         true,
                order_code: true,
                amount:     true,
                status:     true,
                created_at: true,
                course: {
                    select: { id: true, title: true, thumbnail: true },
                },
            },
        });

        return NextResponse.json({ payments }, { status: 200 });
    } catch (error) {
        console.error("Error fetching payment history:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
