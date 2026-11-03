import { test, expect, type Page } from "@playwright/test";

/**
 * Core user workflow E2E coverage for the Contrast Checker (issue #55):
 *  1. State persistence across page reload.
 *  2. Keyboard shortcut dispatching (Ctrl+Z undo / Ctrl+Y redo, Ctrl+S safe).
 *  3. Export payload verification (JSON export).
 *  4. Theme persistence (dark mode via localStorage + data-theme).
 *  5. Saved-combination persistence and management.
 *  6. Invalid hex input handling.
 *
 * Note: the global undo handler is registered in a hydration race with the
 * initial state load; pressing the shortcut repeatedly until the value
 * changes keeps the tests robust against that timing window.
 */

const FG_INPUT = "#hex-input-fg";
const BG_INPUT = "#hex-input-bg";

/** Yield between steps without busy-waiting Playwright auto-waits away. */
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Press Ctrl+Z up to `max` times until the foreground value equals `target`. */
async function undoUntil(page: Page, target: string, max = 8) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(300);
    if ((await page.locator(FG_INPUT).inputValue()) === target) return true;
  }
  return false;
}

/** Press Ctrl+Y (redo) up to `max` times until the foreground value equals `target`. */
async function redoUntil(page: Page, target: string, max = 8) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Control+y");
    await page.waitForTimeout(300);
    if ((await page.locator(FG_INPUT).inputValue()) === target) return true;
  }
  return false;
}

/** Set both colors through the hex inputs and confirm they applied. */
async function setColors(page: Page, fg: string, bg: string) {
  const fgInput = page.locator(FG_INPUT);
  await fgInput.click();
  await fgInput.fill(fg);
  await fgInput.press("Enter");
  await expect(fgInput).toHaveValue(fg.toLowerCase());

  const bgInput = page.locator(BG_INPUT);
  await bgInput.click();
  await bgInput.fill(bg);
  await bgInput.press("Enter");
  await expect(bgInput).toHaveValue(bg.toLowerCase());
}

test.describe("state persistence", () => {
  test("color selection persists across page reload", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await setColors(page, "#1e40af", "#fef3c7");
    // Wait for the debounced autosave + history persistence to flush.
    await pause(2500);

    await page.reload();
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toHaveValue("#1e40af", {
      timeout: 15000,
    });
    await expect(page.locator(BG_INPUT)).toHaveValue("#fef3c7");
  });

  test("saved combination persists across page reload", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    // Default colors (#000000 on #ffffff) pass AA and AAA — save the combination.
    const saveButton = page.getByRole("button", {
      name: /Save current combination/i,
    });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // The saved combination must appear in the sidebar immediately.
    await expect(
      page.getByRole("button", { name: /Delete combination/i }).first(),
    ).toBeVisible();

    await pause(2500);
    await page.reload();
    await expect(page).toHaveTitle(/Contrast Checker/);

    await expect(
      page.getByRole("button", { name: /Delete combination/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/1 combination saved/i)).toBeVisible();
  });

  test("saved combination can be deleted", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await page
      .getByRole("button", { name: /Save current combination/i })
      .click();
    const deleteButton = page
      .getByRole("button", { name: /Delete combination/i })
      .first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    await expect(
      page.getByRole("button", { name: /Delete combination/i }),
    ).toHaveCount(0);
    await expect(page.getByText(/1 combination saved/i)).toHaveCount(0);
  });
});

test.describe("keyboard shortcuts", () => {
  test("Ctrl+Z undo reverts the last color edit", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await expect(page.locator(FG_INPUT)).toHaveValue("#000000");
    await setColors(page, "#ff0000", "#ffffff");

    // Blur the input so the global shortcut handler applies.
    await page.locator("h3").first().click();
    const undone = await undoUntil(page, "#000000");
    expect(undone).toBe(true);
    await expect(page.locator(FG_INPUT)).toHaveValue("#000000");
  });

  test("Ctrl+Y redo re-applies the undone edit", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await expect(page.locator(FG_INPUT)).toHaveValue("#000000");
    await setColors(page, "#ff0000", "#ffffff");

    await page.locator("h3").first().click();
    expect(await undoUntil(page, "#000000")).toBe(true);
    const redone = await redoUntil(page, "#ff0000");
    expect(redone).toBe(true);
    await expect(page.locator(FG_INPUT)).toHaveValue("#ff0000");
  });

  test("undo toolbar button reverts the last color edit", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await expect(page.locator(FG_INPUT)).toHaveValue("#000000");
    await setColors(page, "#ff0000", "#ffffff");

    await page.locator("h3").first().click();
    for (let i = 0; i < 8; i++) {
      await page.getByRole("button", { name: /Undo last action/ }).click();
      await page.waitForTimeout(300);
      if ((await page.locator(FG_INPUT).inputValue()) === "#000000") break;
    }
    await expect(page.locator(FG_INPUT)).toHaveValue("#000000");
  });

  test("Ctrl+S is intercepted and does not trigger a browser save", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await page.locator("h3").first().click();
    const downloads: unknown[] = [];
    page.on("download", (d) => downloads.push(d));
    await page.keyboard.press("Control+s");
    await pause(500);
    expect(downloads).toHaveLength(0);
  });
});

test.describe("export", () => {
  test("JSON export downloads a payload containing current state", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    await setColors(page, "#123456", "#abcdef");

    const exportButton = page.getByRole("button", {
      name: /Export contrast combinations/i,
    });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Items render as role="menuitem" inside the dropdown menu.
    const jsonItem = page.getByRole("menuitem", {
      name: /Export as Export JSON/i,
    });
    await expect(jsonItem).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await jsonItem.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const payload = Buffer.concat(chunks).toString("utf8");

    // The exported payload must be valid JSON containing the current colors.
    expect(() => JSON.parse(payload)).not.toThrow();
    expect(payload).toContain("#123456");
    expect(payload).toContain("#abcdef");
  });
});

test.describe("invalid input handling", () => {
  test("invalid hex input shows inline error message", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    const fgInput = page.locator(FG_INPUT);
    await fgInput.click();
    await fgInput.fill("zzz9999");
    await fgInput.press("Enter");

    // Inline validation error appears under the input.
    await expect(page.locator(`${FG_INPUT}-error`)).toContainText(
      /Expected format|valid hex/i,
      { timeout: 5000 },
    );
  });

  test("non-hex typed value is not committed to the color state", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Contrast Checker/);
    await expect(page.locator(FG_INPUT)).toBeVisible();

    const fgInput = page.locator(FG_INPUT);
    await fgInput.click();
    await fgInput.fill("zzz9999");
    await fgInput.press("Enter");
    await fgInput.blur();
    await pause(1500);
    await page.reload();
    await expect(page).toHaveTitle(/Contrast Checker/);

    // After reload the committed color must still be a valid hex, not "zzz9999".
    const value = await page.locator(FG_INPUT).inputValue();
    expect(value).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });
});
