import { test, expect, type Page } from "@playwright/test";

const ASSISTANT_EMAIL = "codex-assistant@qa.local";
const ASSISTANT_PASSWORD = "Assistant@123";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test("teacher creates an assistant account and assistant enters the limited workspace", async ({ browser }, testInfo) => {
  test.setTimeout(60_000);
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const assistantContext = await browser.newContext();
  const assistant = await assistantContext.newPage();

  try {
    await login(owner, "codex-owner@qa.local", "Teacher@123");
    await owner.waitForURL("**/teacher/home");
    await owner.goto("/teacher/courses");
    const courseRow = owner.getByRole("row").filter({ hasText: "Khóa học QA trợ giảng" });
    await expect(courseRow).toBeVisible();
    await courseRow.click();
    await expect(owner.getByRole("button", { name: /Trợ giảng/ })).toBeVisible();
    await owner.getByRole("button", { name: /Trợ giảng/ }).click();

    if (await owner.getByText(ASSISTANT_EMAIL).count() === 0) {
      await owner.getByPlaceholder("Nguyễn Văn A").fill("Codex Assistant");
      await owner.getByPlaceholder("trogiang@example.com").fill(ASSISTANT_EMAIL);
      await owner.getByPlaceholder("Tối thiểu 6 ký tự").fill(ASSISTANT_PASSWORD);
      const createResponse = owner.waitForResponse((response) => response.url().includes("/collaborators") && response.request().method() === "POST");
      await owner.getByRole("button", { name: "Thêm trợ giảng" }).click();
      expect((await createResponse).status()).toBe(201);
      await expect(owner.getByText(ASSISTANT_EMAIL)).toBeVisible();
    }
    await owner.screenshot({ path: testInfo.outputPath("teacher-collaborators.png"), fullPage: true });

    await login(assistant, ASSISTANT_EMAIL, ASSISTANT_PASSWORD);
    // Đăng nhập đầu tiên: modal nhắc đổi mật khẩu (đóng được) chặn redirect.
    // Chờ 1 trong 2: modal hiện hoặc đã redirect (lần chạy sau khi đã đổi mật khẩu).
    const changePasswordModal = assistant.getByRole("heading", { name: "Đổi mật khẩu" });
    await Promise.race([
      changePasswordModal.waitFor({ timeout: 15_000 }).catch(() => {}),
      assistant.waitForURL("**/assistant/home", { timeout: 15_000 }).catch(() => {}),
    ]);
    if (await changePasswordModal.count()) {
      await assistant.screenshot({ path: testInfo.outputPath("assistant-first-login.png") });
      await assistant.getByRole("button", { name: "Hủy" }).click();
    }
    await assistant.waitForURL("**/assistant/home");
    const membershipsResponse = await assistantContext.request.get("/api/assistant/courses");
    expect(membershipsResponse.ok()).toBeTruthy();
    const payload = await membershipsResponse.json();
    expect(payload.memberships.length).toBeGreaterThan(0);

    const workspaceLink = assistant.getByRole("link", { name: "Mở không gian làm việc" }).first();
    await expect(workspaceLink).toBeVisible();
    await assistant.screenshot({ path: testInfo.outputPath("assistant-home.png"), fullPage: true });
    await workspaceLink.click();
    await expect(assistant.getByText("Chế độ trợ giảng")).toBeVisible();
    await expect(assistant.getByRole("button", { name: /Trợ giảng/ })).toHaveCount(0);
    await expect(assistant.getByRole("button", { name: "Công bố khóa học" })).toHaveCount(0);
    await assistant.screenshot({ path: testInfo.outputPath("assistant-workspace.png"), fullPage: true });
  } finally {
    const revokeButton = owner.getByRole("button", { name: "Thu hồi quyền" }).first();
    if (!owner.isClosed() && await revokeButton.count()) {
      await revokeButton.click();
      await owner.getByRole("button", { name: "Thu hồi quyền" }).last().click();
    }
    await ownerContext.close();
    await assistantContext.close();
  }
});
