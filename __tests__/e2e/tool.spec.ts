import { test, expect } from "@playwright/test";

test("page loads and shows title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});
