import type { Page } from "@playwright/test";

/** Logs in as the seeded Bright Pharma admin (see prisma/seed.ts). Requires
 * the local dev database to have been seeded with `npm run db:seed`. */
export async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@brightpharma.com");
  await page.fill('input[name="password"]', "Passw0rd!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app/dashboard");
}
