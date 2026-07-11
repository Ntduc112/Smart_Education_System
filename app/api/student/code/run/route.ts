import { NextRequest, NextResponse } from "next/server";
import {
    CodeExecutorError,
    executeCode,
    executeCodeBatch,
    SUPPORTED_LANGUAGES,
} from "@/lib/code-executor";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const RunCodeSchema = z.object({
    code:     z.string().min(1).max(50_000),
    language: z.string().refine((v) => SUPPORTED_LANGUAGES.includes(v), {
        message: `Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
    }),
    input:    z.string().max(10_000).optional().default(""),
    inputs:   z.array(z.string().max(10_000)).min(1).max(20).optional(),
});

// Rate limit đơn giản: in-memory, tối đa 20 lần / phút / user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { code, language, input, inputs } = RunCodeSchema.parse(body);

        if (inputs) {
            const results = await executeCodeBatch({ code, language, inputs });
            return NextResponse.json({ results });
        }

        const result = await executeCode({ code, language, stdin: input });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof CodeExecutorError) {
            console.error(`[Code Executor] ${error.code}:`, error.message);
            const status = error.code === "PROVIDER_TIMEOUT" ? 504 : 503;
            return NextResponse.json(
                { error: "Dịch vụ chạy code tạm thời chưa sẵn sàng. Vui lòng thử lại." },
                { status },
            );
        }
        console.error("Error running code:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
