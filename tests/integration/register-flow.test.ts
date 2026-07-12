// ⚠️ INTEGRATION TEST — chạm cơ sở dữ liệu thật.
// Test tự tạo và xóa dữ liệu của mình (email prefix __test__), dọn trong afterAll.
// Chạy: npm run test:integration
//
// Kiểm chứng luồng đăng ký 2 bước: gửi OTP → verify → mới tạo user.
// Resend được mock (không gửi email thật); mã OTP bắt từ mock để verify.
import { describe, it, expect, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/prisma/prisma";

// Bắt mã OTP gửi qua email thay vì gửi thật
let lastOtpCode: string | null = null;
vi.mock("@/lib/email/resend", () => ({
  sendRegisterOtpEmail: vi.fn(async (_email: string, code: string) => {
    lastOtpCode = code;
  }),
}));

import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as verifyPOST } from "@/app/api/auth/register/verify/route";

const EMAIL = `__test__register_${Date.now()}@example.com`;
const PAYLOAD = { name: "Test Register", email: EMAIL, password: "MyPassw0rd!", role: "STUDENT" };

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("Luồng đăng ký có xác thực email (integration, có DB)", () => {
  afterAll(async () => {
    await prisma.emailVerification.deleteMany({ where: { email: EMAIL } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.$disconnect();
  });

  it("bước 1: gửi OTP, KHÔNG tạo user", async () => {
    const res = await registerPOST(jsonRequest("/api/auth/register", PAYLOAD));
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(user).toBeNull();

    const record = await prisma.emailVerification.findFirst({ where: { email: EMAIL, used: false } });
    expect(record).not.toBeNull();
    expect(lastOtpCode).toMatch(/^\d{6}$/);
    // Mã lưu dạng hash, không lưu bản gốc
    expect(record!.code_hash).not.toBe(lastOtpCode);
  });

  it("verify sai mã → 400, tăng attempts, không tạo user", async () => {
    const wrongCode = lastOtpCode === "000000" ? "111111" : "000000";
    const res = await verifyPOST(jsonRequest("/api/auth/register/verify", { ...PAYLOAD, code: wrongCode }));
    expect(res.status).toBe(400);

    const record = await prisma.emailVerification.findFirst({ where: { email: EMAIL, used: false } });
    expect(record!.attempts).toBe(1);
    expect(await prisma.user.findUnique({ where: { email: EMAIL } })).toBeNull();
  });

  it("verify đúng mã → tạo user, không trả password_hash", async () => {
    const res = await verifyPOST(jsonRequest("/api/auth/register/verify", { ...PAYLOAD, code: lastOtpCode }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.email).toBe(EMAIL);
    expect(data.user.password_hash).toBeUndefined();

    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("STUDENT");
  });

  it("replay cùng mã sau khi đã dùng → 400, không tạo thêm gì", async () => {
    const res = await verifyPOST(jsonRequest("/api/auth/register/verify", { ...PAYLOAD, code: lastOtpCode }));
    expect(res.status).toBe(400);
  });

  it("đăng ký lại email đã tồn tại → 409", async () => {
    const res = await registerPOST(jsonRequest("/api/auth/register", PAYLOAD));
    expect(res.status).toBe(409);
  });
});
