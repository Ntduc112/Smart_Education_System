import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const certs = await prisma.certificate.findMany({
            where: { user_id: userId },
            include: {
                course: {
                    select: {
                        title: true,
                        thumbnail: true,
                        instructor: { select: { name: true } },
                    },
                },
            },
            orderBy: { issued_at: "desc" },
        });

        return NextResponse.json({ certificates: certs }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
