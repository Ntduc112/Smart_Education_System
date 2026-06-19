import { describe, it, expect } from "vitest";
import {
  signAccessToken, signRefreshToken,
  verifyAccessToken, verifyRefreshToken,
} from "@/lib/auth/token";

describe("JWT access/refresh token", () => {
  const payload = { userId: "u-123", role: "STUDENT" };

  it("ký và verify access token, giữ nguyên payload", async () => {
    const token = await signAccessToken(payload);
    const decoded = await verifyAccessToken(token);
    expect(decoded?.userId).toBe("u-123");
    expect(decoded?.role).toBe("STUDENT");
  });

  it("ký và verify refresh token", async () => {
    const token = await signRefreshToken(payload);
    const decoded = await verifyRefreshToken(token);
    expect(decoded?.userId).toBe("u-123");
  });

  it("verify trả null với token rác", async () => {
    expect(await verifyAccessToken("not.a.jwt")).toBeNull();
  });

  it("access token KHÔNG verify được bằng secret của refresh (secret tách biệt)", async () => {
    const access = await signAccessToken(payload);
    // access token ký bằng ACCESS_TOKEN_SECRET; verify bằng refresh secret phải thất bại
    expect(await verifyRefreshToken(access)).toBeNull();
  });
});
