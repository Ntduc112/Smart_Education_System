import { test, expect } from "@playwright/test";
import { login, expectPageOk } from "./helpers";

test.describe("Admin workflow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "ADMIN");
  });

  for (const path of ["/admin/dashboard", "/admin/users", "/admin/students", "/admin/teachers", "/admin/categories", "/admin/statistics"]) {
    test(`admin page loads: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectPageOk(page);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
    });
  }

  test("non-admin blocked from admin dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await login(page, "STUDENT");
    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin\/dashboard$/);
  });
});

test.describe("Payment result pages", () => {
  test("success page renders", async ({ page }) => {
    await page.goto("/payment/success");
    await expectPageOk(page);
  });
  test("cancel page renders", async ({ page }) => {
    await page.goto("/payment/cancel");
    await expectPageOk(page);
  });
});
