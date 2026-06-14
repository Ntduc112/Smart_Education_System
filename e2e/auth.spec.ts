import { test, expect } from "@playwright/test";
import { login, CREDS, expectPageOk } from "./helpers";

test.describe("Auth workflow", () => {
  test("login redirects each role to its dashboard", async ({ page }) => {
    for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
      await login(page, role);
      await expect(page).toHaveURL(new RegExp(CREDS[role].home.replace(/\//g, "\\/") + "$"));
      // auth cookie set
      const cookies = await page.context().cookies();
      expect(cookies.some((c) => c.name === "access_token")).toBeTruthy();
      await page.context().clearCookies();
    }
  });

  test("login with wrong password shows error, no redirect", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", CREDS.STUDENT.email);
    await page.fill("#password", "wrong-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("text=/thất bại|không đúng|sai|invalid/i")).toBeVisible();
  });

  test("register form shows client validation error", async ({ page }) => {
    await page.goto("/register");
    await expectPageOk(page);
    await expect(page.locator("#name")).toBeVisible();
    // Valid email format (passes native type=email check) + too-short password -> zod error.
    await page.fill("#name", "Test User");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "123");
    await page.check("#terms"); // native-required, else submit is blocked before zod runs
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    await expect(page.locator("text=/Mật khẩu tối thiểu 6 ký tự/")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("protected route redirects anonymous to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/teacher/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
