import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CodeExecutorError,
  executeCode,
  runTestCases,
} from "@/lib/code-executor";

const originalApiKey = process.env.ONECOMPILER_API_KEY;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OneCompiler code executor", () => {
  beforeEach(() => {
    process.env.ONECOMPILER_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey == null) delete process.env.ONECOMPILER_API_KEY;
    else process.env.ONECOMPILER_API_KEY = originalApiKey;
  });

  it("map đúng ngôn ngữ, file và API key khi chạy một input", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      status: "success",
      stdout: "hello\n",
      stderr: null,
      exception: null,
      compilationTime: 0,
      executionTime: 12,
      memoryUsed: 2048,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await executeCode({
      code: "console.log('hello')",
      language: "javascript",
      stdin: "",
    });

    expect(result).toMatchObject({
      stdout: "hello\n",
      exitCode: 0,
      timedOut: false,
      executionTime: 12,
      memoryUsed: 2048,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ "X-API-Key": "test-key" });
    expect(JSON.parse(String(init.body))).toEqual({
      language: "nodejs",
      stdin: "",
      files: [{ name: "main.js", content: "console.log('hello')" }],
    });
  });

  it("chạy nhiều test case bằng một batch request và không pass runtime error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([
      { status: "success", stdout: "4\n", exception: null },
      { status: "success", stdout: "10\n", exception: "Runtime error" },
    ]));
    vi.stubGlobal("fetch", fetchMock);

    const results = await runTestCases("print(input())", "python", [
      { input: "2", expected: "4" },
      { input: "5", expected: "10" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.passed)).toEqual([true, false]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).stdin).toEqual(["2", "5"]);
  });

  it("phân biệt timeout của code với lỗi hạ tầng", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      status: "success",
      error: "E001: operation timed out",
      stdout: "",
    })));

    const result = await executeCode({ code: "while True: pass", language: "python" });
    expect(result).toMatchObject({ timedOut: true, exitCode: 1 });
  });

  it("không chấm 0 khi provider hết quota hoặc lỗi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      status: "failed",
      error: "E002: API quota exceeded",
    })));

    await expect(executeCode({ code: "print(1)", language: "python" }))
      .rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" } satisfies Partial<CodeExecutorError>);
  });

  it("báo cấu hình thiếu khi chưa có API key", async () => {
    delete process.env.ONECOMPILER_API_KEY;

    await expect(executeCode({ code: "print(1)", language: "python" }))
      .rejects.toMatchObject({ code: "NOT_CONFIGURED" } satisfies Partial<CodeExecutorError>);
  });
});
