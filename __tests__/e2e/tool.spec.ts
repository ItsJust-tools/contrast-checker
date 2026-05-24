import { test, expect } from "@playwright/test";

test("page loads and shows contrast checker title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Contrast Checker").first()).toBeVisible();
});
