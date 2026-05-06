import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const cert = await prisma.certificate.findUnique({
            where: { id, user_id: userId },
            include: {
                course: { select: { title: true, instructor: { select: { name: true } } } },
                user: { select: { name: true } },
            },
        });

        if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ certificate: cert }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
