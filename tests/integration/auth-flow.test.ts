// ⚠️ INTEGRATION TEST — chạm cơ sở dữ liệu thật.
// Test tự tạo và xóa dữ liệu của mình (email prefix __test__), dọn trong afterAll.
// Nên chạy với DATABASE_URL trỏ tới DB phát triển/kiểm thử, KHÔNG phải production.
// Chạy: npm run test:integration
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import prisma from "@/prisma/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signRefreshToken, verifyRefreshToken } from "@/lib/auth/token";

const TEST_EMAIL = `__test__${Date.now()}@example.com`;
let userId: string;

describe("Luồng xác thực (integration, có DB)", () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: TEST_EMAIL,
        password_hash: await hashPassword("MyPassw0rd!"),
        role: "STUDENT",
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    // Mỗi test bắt đầu với bảng refresh token sạch (tránh trùng token cùng giây)
    await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
  });

  afterAll(async () => {
    // Dọn sạch dữ liệu test
    await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  it("mật khẩu được lưu dưới dạng băm, không phải bản gốc", async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(user).not.toBeNull();
    expect(user!.password_hash).not.toBe("MyPassw0rd!");
    expect(await verifyPassword("MyPassw0rd!", user!.password_hash)).toBe(true);
  });

  it("lưu và đọc lại refresh token gắn với user", async () => {
    const token = await signRefreshToken({ userId, role: "STUDENT" });
    await prisma.refreshToken.create({
      data: { token, user_id: userId, expires_at: new Date(Date.now() + 60_000) },
    });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    expect(stored).not.toBeNull();
    expect(stored!.user_id).toBe(userId);

    const decoded = await verifyRefreshToken(stored!.token);
    expect(decoded?.userId).toBe(userId);
  });

  it("reuse-detection: token đã xóa khỏi DB thì không còn tra cứu được", async () => {
    const token = await signRefreshToken({ userId, role: "STUDENT" });
    await prisma.refreshToken.create({
      data: { token, user_id: userId, expires_at: new Date(Date.now() + 60_000) },
    });
    // Mô phỏng rotation: xóa token cũ
    await prisma.refreshToken.delete({ where: { token } });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    expect(stored).toBeNull(); // không có trong DB -> bị coi là thu hồi / đánh cắp
  });
});
