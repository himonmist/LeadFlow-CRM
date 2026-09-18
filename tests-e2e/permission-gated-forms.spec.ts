import { test, expect, type Page } from "@playwright/test";

// Regression coverage for a reported bug: a user without edit permission
// (e.g. a Marketing Executive, whose role only has VIEW on training/service)
// saw a fully editable Schedule & Delivery form. Submitting it silently
// failed a server-side permission check and redirected to the dashboard
// with no visible error — from the user's side it just looked like the
// save "didn't work". Fixed by (1) disabling the form and explaining why
// when the viewer lacks edit permission, and (2) showing a banner on the
// dashboard when a permission check actually does reject an action.

// Seeded record ids for the Bright Pharma tenant (see prisma/seed.ts) that
// belong to the same tenant as marketing@brightpharma.com.
const TRAINING_ID = "cmu5t50t1002u7dfxovzn5r3l";
const SERVICE_ID = "cmu5t50tt003c7dfxbko24ma1";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Passw0rd!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app/dashboard");
}

test.describe("view-only rendering for users without edit permission", () => {
  test("training schedule form is disabled and explained for a Marketing Executive", async ({ page }) => {
    await loginAs(page, "marketing@brightpharma.com");
    await page.goto(`/app/training/${TRAINING_ID}`);

    await expect(page.getByText("You have view-only access to training schedules.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Changes" })).toHaveCount(0);
    await expect(page.locator('input[name="trainingDate"]')).toBeDisabled();
  });

  test("service delivery form is disabled and explained for a Marketing Executive", async ({ page }) => {
    await loginAs(page, "marketing@brightpharma.com");
    await page.goto(`/app/services/${SERVICE_ID}`);

    await expect(page.getByText("You have view-only access to service delivery.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Changes" })).toHaveCount(0);
  });

  test("an Admin still sees a normal, editable training schedule form", async ({ page }) => {
    await loginAs(page, "admin@brightpharma.com");
    await page.goto(`/app/training/${TRAINING_ID}`);

    await expect(page.getByText("You have view-only access", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    await expect(page.locator('input[name="trainingDate"]')).toBeEnabled();
  });
});

test.describe("permission-denied feedback", () => {
  test("the dashboard shows a banner after a blocked action redirects with ?denied=1", async ({ page }) => {
    await loginAs(page, "marketing@brightpharma.com");
    await page.goto("/app/dashboard?denied=1");

    await expect(page.getByText("You don’t have permission to do that.")).toBeVisible();
  });

  test("the dashboard shows no banner on a normal visit", async ({ page }) => {
    await loginAs(page, "marketing@brightpharma.com");
    await expect(page.getByText("You don’t have permission to do that.")).toHaveCount(0);
  });
});
