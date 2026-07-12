// ⚠️ INTEGRATION TEST — chạm cơ sở dữ liệu thật.
// Test tự tạo và xóa dữ liệu của mình (email prefix __test__), dọn trong afterAll.
// Nên chạy với DATABASE_URL trỏ tới DB phát triển/kiểm thử, KHÔNG phải production.
// Chạy: npm run test:integration
//
// Kiểm chứng đường tiền: webhook PayOS → verify chữ ký → fulfill (PAID + enrollment).
// PayOS SDK được mock (verify chữ ký cần checksum key thật); DB và logic fulfill chạy thật.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/prisma/prisma";

// Stub verify chữ ký: signature "valid" → trả data như SDK, còn lại → throw.
vi.mock("@/lib/payment/payos", () => ({
  verifyWebhook: vi.fn(async (body: { signature?: string; data?: unknown }) => {
    if (body?.signature !== "valid") throw new Error("Invalid signature");
    return body.data;
  }),
  isPaymentSuccess: (d: { code: string }) => d.code === "00",
}));

import { POST } from "@/app/api/payment/webhook/route";

const RUN_ID = Date.now();
const EMAIL_BUYER = `__test__buyer_${RUN_ID}@example.com`;
const EMAIL_CANCELLER = `__test__canceller_${RUN_ID}@example.com`;
const EMAIL_TEACHER = `__test__teacher_${RUN_ID}@example.com`;
// order_code là Int (32-bit) — Date.now() (ms) tràn, dùng giây
const OC_BASE = Math.floor(Date.now() / 1000);
const OC_SIG_FAIL = OC_BASE + 1;
const OC_SUCCESS = OC_BASE + 2;
const OC_CANCEL = OC_BASE + 3;
const OC_UNKNOWN = OC_BASE + 4; // không tạo payment cho mã này

let buyerId: string;
let cancellerId: string;
let teacherId: string;
let categoryId: string;
let courseId: string;

function webhookRequest(payload: unknown) {
  return new NextRequest("http://localhost/api/payment/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
  });
}

function payload(orderCode: number, opts?: { code?: string; signature?: string }) {
  return {
    signature: opts?.signature ?? "valid",
    data: { orderCode, code: opts?.code ?? "00" },
  };
}

describe("Webhook thanh toán PayOS (integration, có DB)", () => {
  beforeAll(async () => {
    const [buyer, canceller, teacher] = await Promise.all([
      prisma.user.create({
        data: { name: "Test Buyer", email: EMAIL_BUYER, password_hash: "x", role: "STUDENT" },
      }),
      prisma.user.create({
        data: { name: "Test Canceller", email: EMAIL_CANCELLER, password_hash: "x", role: "STUDENT" },
      }),
      prisma.user.create({
        data: { name: "Test Teacher", email: EMAIL_TEACHER, password_hash: "x", role: "TEACHER" },
      }),
    ]);
    buyerId = buyer.id;
    cancellerId = canceller.id;
    teacherId = teacher.id;

    const category = await prisma.category.create({
      data: { name: `__test__cat_${RUN_ID}`, description: "test" },
    });
    categoryId = category.id;

    const course = await prisma.course.create({
      data: {
        title: `__test__course_${RUN_ID}`,
        description: "test",
        thumbnail: "test.png",
        price: 100_000,
        level: "BEGINNER",
        status: "PUBLISHED",
        instructor_id: teacherId,
        category_id: categoryId,
      },
    });
    courseId = course.id;

    await prisma.payment.createMany({
      data: [
        { user_id: buyerId, course_id: courseId, amount: 100_000, order_code: OC_SIG_FAIL },
        { user_id: buyerId, course_id: courseId, amount: 100_000, order_code: OC_SUCCESS },
        { user_id: cancellerId, course_id: courseId, amount: 100_000, order_code: OC_CANCEL },
      ],
    });
  });

  afterAll(async () => {
    // Chờ notification fire-and-forget của fulfillPayment ghi xong rồi mới dọn
    await new Promise((r) => setTimeout(r, 300));
    const userIds = [buyerId, cancellerId, teacherId];
    await prisma.enrollment.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.course.deleteMany({ where: { id: courseId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    // Notification cascade theo user
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("chữ ký sai → code 97, payment giữ nguyên PENDING", async () => {
    const res = await POST(webhookRequest(payload(OC_SIG_FAIL, { signature: "tampered" })));
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe("97");

    const payment = await prisma.payment.findUnique({ where: { order_code: OC_SIG_FAIL } });
    expect(payment!.status).toBe("PENDING");
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: buyerId, course_id: courseId } },
    });
    expect(enrollment).toBeNull();
  });

  it("webhook thành công → payment PAID + tạo enrollment", async () => {
    const res = await POST(webhookRequest(payload(OC_SUCCESS)));
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe("00");

    const payment = await prisma.payment.findUnique({ where: { order_code: OC_SUCCESS } });
    expect(payment!.status).toBe("PAID");
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: buyerId, course_id: courseId } },
    });
    expect(enrollment).not.toBeNull();
  });

  it("replay cùng webhook → idempotent, không nhân đôi enrollment", async () => {
    const res = await POST(webhookRequest(payload(OC_SUCCESS)));
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe("00");

    const payment = await prisma.payment.findUnique({ where: { order_code: OC_SUCCESS } });
    expect(payment!.status).toBe("PAID");
    const count = await prisma.enrollment.count({
      where: { user_id: buyerId, course_id: courseId },
    });
    expect(count).toBe(1);
  });

  it("webhook cancel đến sau khi đã PAID → giữ PAID (không ghi đè)", async () => {
    const res = await POST(webhookRequest(payload(OC_SUCCESS, { code: "01" })));
    expect(res.status).toBe(200);

    const payment = await prisma.payment.findUnique({ where: { order_code: OC_SUCCESS } });
    expect(payment!.status).toBe("PAID");
  });

  it("webhook thất bại → payment CANCELLED, không tạo enrollment", async () => {
    const res = await POST(webhookRequest(payload(OC_CANCEL, { code: "01" })));
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe("00");

    const payment = await prisma.payment.findUnique({ where: { order_code: OC_CANCEL } });
    expect(payment!.status).toBe("CANCELLED");
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: cancellerId, course_id: courseId } },
    });
    expect(enrollment).toBeNull();
  });

  it("orderCode không tồn tại → vẫn trả 200 để PayOS không retry", async () => {
    const res = await POST(webhookRequest(payload(OC_UNKNOWN)));
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe("00");
  });
});
