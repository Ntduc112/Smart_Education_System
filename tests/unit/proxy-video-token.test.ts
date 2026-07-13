import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { signAccessToken } from "@/lib/auth/token";
import { proxy } from "@/proxy";

async function teacherRequest(pathname: string) {
  const token = await signAccessToken({ userId: "teacher-1", role: "TEACHER" });
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { cookie: `access_token=${token}` },
  });
}

describe("proxy video-token access", () => {
  it("cho teacher đi qua route video-token dùng chung", async () => {
    const response = await proxy(await teacherRequest(
      "/api/lessons/20000000-0000-4000-8000-000000000001/video-token",
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("vẫn chặn teacher khỏi namespace student", async () => {
    const response = await proxy(await teacherRequest(
      "/api/student/lessons/20000000-0000-4000-8000-000000000001/video-token",
    ));

    expect(response.status).toBe(403);
  });
});
