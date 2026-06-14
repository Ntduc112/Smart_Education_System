import { test, expect } from "@playwright/test";
import { login, expectPageOk } from "./helpers";

test.describe("Teacher workflow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "TEACHER");
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/teacher/dashboard");
    await expectPageOk(page);
  });

  test("courses list shows at least one course and opens it", async ({ page }) => {
    await page.goto("/teacher/courses");
    await expectPageOk(page);
    // A course card/link points at /teacher/courses/<id>
    const courseLink = page.locator('a[href*="/teacher/courses/"]').first();
    await expect(courseLink).toBeVisible();
    await courseLink.click();
    await expect(page).toHaveURL(/\/teacher\/courses\/[^/]+/);
    await expectPageOk(page);
  });

  test("new-course form is reachable", async ({ page }) => {
    await page.goto("/teacher/courses/new");
    await expectPageOk(page);
    // a title/name input should exist
    await expect(page.locator('input, textarea').first()).toBeVisible();
  });

  test("analytics page loads", async ({ page }) => {
    await page.goto("/teacher/analytics");
    await expectPageOk(page);
  });

  test("student cannot reach teacher dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await login(page, "STUDENT");
    await page.goto("/teacher/dashboard");
    await expect(page).not.toHaveURL(/\/teacher\/dashboard$/);
  });
});
