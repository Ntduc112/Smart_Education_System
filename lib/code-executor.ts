/**
 * Code Executor Service — gọi OneCompiler từ server (Vercel Function).
 *
 * API key chỉ được đọc ở server. Cùng một đoạn code có thể chạy với nhiều
 * stdin trong một request để giảm latency và số lần gọi API khi chấm test case.
 */

const ONECOMPILER_API_URL =
    process.env.ONECOMPILER_API_URL || "https://api.onecompiler.com/v1/run";

const DEFAULT_TIMEOUT_MS = 20_000;

const LANGUAGE_MAP = {
    python:     { language: "python", filename: "main.py" },
    javascript: { language: "nodejs", filename: "main.js" },
    c:          { language: "c",      filename: "main.c" },
    cpp:        { language: "cpp",    filename: "main.cpp" },
    java:       { language: "java",   filename: "Main.java" },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_MAP;
export const SUPPORTED_LANGUAGES: string[] = Object.keys(LANGUAGE_MAP);

export type CodeExecutorErrorCode =
    | "NOT_CONFIGURED"
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_TIMEOUT"
    | "INVALID_RESPONSE";

export class CodeExecutorError extends Error {
    constructor(
        public readonly code: CodeExecutorErrorCode,
        message: string,
        public readonly status?: number,
    ) {
        super(message);
        this.name = "CodeExecutorError";
    }
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
    compilationTime: number | null;
    executionTime: number | null;
    memoryUsed: number | null;
}

export interface RunCodeParams {
    code: string;
    language: string;
    stdin?: string;
    timeoutMs?: number;
}

export interface RunCodeBatchParams {
    code: string;
    language: string;
    inputs: string[];
    timeoutMs?: number;
}

interface OneCompilerResult {
    stdout?: unknown;
    output?: unknown;
    stderr?: unknown;
    exception?: unknown;
    error?: unknown;
    status?: unknown;
    compilationTime?: unknown;
    executionTime?: unknown;
    memoryUsed?: unknown;
}

function getRuntime(language: string) {
    return LANGUAGE_MAP[language as SupportedLanguage];
}

function toText(value: unknown): string {
    return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown): number | null {
    if (value == null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseExecution(result: OneCompilerResult): ExecutionResult {
    const providerStatus = toText(result.status).toLowerCase();
    const providerError = toText(result.error);
    const exception = toText(result.exception);
    const failureText = [providerError, exception].filter(Boolean).join("\n");
    const timedOut = /\bE001\b|timed?\s*out|timeout/i.test(failureText);

    // `status` của OneCompiler mô tả API call, không phải đáp án đúng/sai.
    // Quota/key/provider errors phải nổi lên thành lỗi hạ tầng, không được chấm 0.
    if (providerStatus === "failed" || (providerError && !timedOut)) {
        throw new CodeExecutorError(
            "PROVIDER_UNAVAILABLE",
            providerError || "OneCompiler rejected the execution request",
        );
    }

    const stderr = [toText(result.stderr), exception]
        .filter(Boolean)
        .join("\n")
        .trim();

    return {
        stdout: toText(result.stdout ?? result.output),
        stderr,
        exitCode: timedOut || exception ? 1 : 0,
        timedOut,
        compilationTime: toNumber(result.compilationTime),
        executionTime: toNumber(result.executionTime),
        memoryUsed: toNumber(result.memoryUsed),
    };
}

async function callOneCompiler({
    code,
    language,
    stdin,
    timeoutMs,
}: {
    code: string;
    language: string;
    stdin: string | string[];
    timeoutMs: number;
}): Promise<OneCompilerResult | OneCompilerResult[]> {
    const runtime = getRuntime(language);
    if (!runtime) {
        return {
            status: "success",
            exception: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
        };
    }

    const apiKey = process.env.ONECOMPILER_API_KEY;
    if (!apiKey) {
        throw new CodeExecutorError(
            "NOT_CONFIGURED",
            "ONECOMPILER_API_KEY is not configured",
        );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(ONECOMPILER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey,
            },
            signal: controller.signal,
            cache: "no-store",
            body: JSON.stringify({
                language: runtime.language,
                stdin,
                files: [{ name: runtime.filename, content: code }],
            }),
        });

        if (!response.ok) {
            const text = (await response.text()).slice(0, 500);
            throw new CodeExecutorError(
                "PROVIDER_UNAVAILABLE",
                `OneCompiler HTTP ${response.status}: ${text}`,
                response.status,
            );
        }

        return await response.json() as OneCompilerResult | OneCompilerResult[];
    } catch (error) {
        if (error instanceof CodeExecutorError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
            throw new CodeExecutorError(
                "PROVIDER_TIMEOUT",
                "OneCompiler request timed out",
            );
        }
        throw new CodeExecutorError(
            "PROVIDER_UNAVAILABLE",
            `OneCompiler request failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    } finally {
        clearTimeout(timer);
    }
}

/** Chạy code với một stdin. */
export async function executeCode({
    code,
    language,
    stdin = "",
    timeoutMs = DEFAULT_TIMEOUT_MS,
}: RunCodeParams): Promise<ExecutionResult> {
    const response = await callOneCompiler({ code, language, stdin, timeoutMs });
    const item = Array.isArray(response) ? response[0] : response;
    if (!item) {
        throw new CodeExecutorError("INVALID_RESPONSE", "OneCompiler returned no result");
    }
    return parseExecution(item);
}

/** Chạy cùng một đoạn code với nhiều stdin bằng batch API. */
export async function executeCodeBatch({
    code,
    language,
    inputs,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}: RunCodeBatchParams): Promise<ExecutionResult[]> {
    if (inputs.length === 0) return [];

    const response = await callOneCompiler({ code, language, stdin: inputs, timeoutMs });
    const items = Array.isArray(response) ? response : [response];
    if (items.length !== inputs.length) {
        throw new CodeExecutorError(
            "INVALID_RESPONSE",
            `OneCompiler returned ${items.length}/${inputs.length} batch results`,
        );
    }
    return items.map(parseExecution);
}

export interface TestCaseResult {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    stderr: string;
    timedOut: boolean;
}

/** Chạy và so sánh nhiều test case trong đúng một request OneCompiler. */
export async function runTestCases(
    code: string,
    language: string,
    testCases: { input: string; expected: string }[],
): Promise<TestCaseResult[]> {
    const executions = await executeCodeBatch({
        code,
        language,
        inputs: testCases.map((testCase) => testCase.input),
    });

    return testCases.map((testCase, index) => {
        const execution = executions[index];
        const actual = execution.stdout.trim();
        const expected = testCase.expected.trim();

        return {
            input: testCase.input,
            expected,
            actual,
            passed: execution.exitCode === 0 && !execution.timedOut && actual === expected,
            stderr: execution.stderr,
            timedOut: execution.timedOut,
        };
    });
}
