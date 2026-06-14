import { test, expect } from "@playwright/test";
import { login, expectPageOk } from "./helpers";

test.describe("Student workflow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "STUDENT");
  });

  test("browse marketing courses and open a detail page", async ({ page }) => {
    await page.goto("/courses");
    await expectPageOk(page);
    const card = page.locator('a[href*="/courses/"]').first();
    await expect(card).toBeVisible();
    await card.click();
    // either course detail or learn page (if already enrolled)
    await expect(page).toHaveURL(/\/courses\/[^/]+|\/student\/courses\/[^/]+/);
    await expectPageOk(page);
  });

  test("student dashboard loads", async ({ page }) => {
    await page.goto("/student/dashboard");
    await expectPageOk(page);
  });

  for (const path of ["/student/flashcards", "/student/notes", "/student/wishlist", "/student/certificates", "/student/profile"]) {
    test(`page loads: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectPageOk(page);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
    });
  }
});
