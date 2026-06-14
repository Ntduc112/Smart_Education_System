import { Page, expect } from "@playwright/test";

export const CREDS = {
  ADMIN: { email: "admin@smartedu.vn", password: "Admin@123", home: "/admin/dashboard" },
  TEACHER: { email: "an.nguyen@smartedu.vn", password: "Teacher@123", home: "/teacher/dashboard" },
  STUDENT: { email: "cuong@student.vn", password: "Student@123", home: "/" },
} as const;

export type Role = keyof typeof CREDS;

/** Log in through the real login form; resolves after the post-login redirect. */
export async function login(page: Page, role: Role) {
  const { email, password, home } = CREDS[role];
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(`**${home}`, { timeout: 15_000 });
}

/** Assert a route loaded without crashing (no error overlay/page, has <body> content). */
export async function expectPageOk(page: Page) {
  // nextjs-portal hosts the always-present dev indicator, so don't assert on it.
  // Detect a real failure by its visible text instead.
  await expect(
    page.getByText(
      /Unhandled Runtime Error|Application error|Internal Server Error|This page could not be found|404|500/i
    )
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toBeEmpty();
}
