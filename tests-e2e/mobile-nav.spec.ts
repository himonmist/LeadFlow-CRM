import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Regression coverage for a reported bug: on a phone-width viewport the
// sidebar was simply `hidden` below the `lg` breakpoint with no fallback,
// so there was no way to reach Leads, Opportunities, Pipeline, etc. at all.

test.describe("mobile navigation drawer", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("sidebar is hidden until the menu button opens it, and closes on navigation", async ({ page }) => {
    await login(page);

    await expect(page.getByTestId("sidebar")).toBeHidden();
    await expect(page.getByRole("link", { name: "Leads" })).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByTestId("sidebar")).toBeVisible();
    const leadsLink = page.getByRole("link", { name: "Leads" });
    await expect(leadsLink).toBeVisible();

    await leadsLink.click();
    await page.waitForURL("**/app/leads");
    await expect(page.getByTestId("sidebar")).toBeHidden();
  });

  test("tapping the backdrop closes the drawer without navigating", async ({ page }) => {
    await login(page);

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByTestId("sidebar")).toBeVisible();

    await page.getByTestId("sidebar-backdrop").click({ position: { x: 350, y: 50 } });
    await expect(page.getByTestId("sidebar")).toBeHidden();
    await expect(page).toHaveURL(/\/app\/dashboard$/);
  });
});

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("sidebar is visible by default and the mobile menu button is hidden", async ({ page }) => {
    await login(page);

    await expect(page.getByTestId("sidebar")).toBeVisible();
    await expect(page.getByRole("link", { name: "Leads" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  });
});
