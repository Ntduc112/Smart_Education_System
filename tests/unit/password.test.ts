import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("băm mật khẩu ra chuỗi khác bản gốc", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verify đúng với mật khẩu khớp", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("verify sai với mật khẩu không khớp", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("hai lần băm cùng mật khẩu cho hash khác nhau (salt ngẫu nhiên)", async () => {
    const h1 = await hashPassword("samePass");
    const h2 = await hashPassword("samePass");
    expect(h1).not.toBe(h2);
    expect(await verifyPassword("samePass", h1)).toBe(true);
    expect(await verifyPassword("samePass", h2)).toBe(true);
  });
});
