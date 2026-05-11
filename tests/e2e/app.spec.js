// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
    // Ensure a clean form state every run.
    await page.addInitScript(() => {
        try { localStorage.clear(); } catch (e) {}
    });
    await page.goto("/");
});

test("single preview renders after typing", async ({ page }) => {
    await page.fill("#asciiText", "Hello");
    const result = page.locator("#result");
    await expect(result).toHaveAttribute("src", /^data:image\/png/, { timeout: 10_000 });
    await expect(result).toBeVisible();
    await expect(page.locator("#downloadButton")).toBeEnabled();
});

test.describe("compare grid", () => {
    test("opens, renders cards for every font option, then closes", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator("#result").waitFor({ state: "visible" });

        const fontCount = await page.locator("#font option").count();
        expect(fontCount).toBeGreaterThan(1);

        await page.click("#compareButton");
        await expect(page.locator("#compareButton")).toHaveText("Close compare");
        await expect(page.locator("#fontGrid")).toBeVisible();

        const cards = page.locator(".font-card");
        await expect(cards).toHaveCount(fontCount);

        // Wait for every preview image to actually render.
        await expect(page.locator(".font-card-preview img")).toHaveCount(fontCount, { timeout: 20_000 });

        // The currently-selected font has the active ring.
        const selectedFont = await page.locator("#font").inputValue();
        await expect(page.locator(`.font-card[data-font="${selectedFont}"]`)).toHaveClass(/active/);

        // Close via the same toggle button.
        await page.click("#compareButton");
        await expect(page.locator("#fontGrid")).toBeHidden();
        await expect(page.locator("#result")).toBeVisible();
    });

    test("live-updates cards when styling changes", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });

        const firstCard = page.locator(`.font-card[data-font="Alpha"] .font-card-preview img`);
        const initialSrc = await firstCard.getAttribute("src");

        // Toggle shadow and ensure the rendered PNG changes.
        await page.locator("#shadow").check();
        await expect.poll(
            async () => firstCard.getAttribute("src"),
            { timeout: 15_000 }
        ).not.toBe(initialSrc);
    });
});

test.describe("font focus overlay (theater mode)", () => {
    test("clicking a card opens focus, selects font, keeps compare open", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });

        // Click a non-default card.
        const targetFont = "Doom";
        await page.locator(`.font-card[data-font="${targetFont}"]`).click();

        // Focus overlay visible, label shows the font name.
        const overlay = page.locator("#fontFocus");
        await expect(overlay).toBeVisible();
        await expect(overlay.locator(".font-focus-label")).toHaveText(targetFont);
        await expect(overlay.locator(".font-focus-image img")).toBeVisible();

        // Font dropdown updated.
        await expect(page.locator("#font")).toHaveValue(targetFont);

        // Active card ring moved to the clicked card.
        await expect(page.locator(`.font-card[data-font="${targetFont}"]`)).toHaveClass(/active/);

        // Compare grid is still open (button still says Close compare, grid still visible).
        await expect(page.locator("#compareButton")).toHaveText("Close compare");
        await expect(page.locator("#fontGrid")).toBeVisible();
    });

    test("ESC closes focus, leaves compare open", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });
        await page.locator(`.font-card[data-font="Big"]`).click();
        await expect(page.locator("#fontFocus")).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(page.locator("#fontFocus")).toBeHidden();
        await expect(page.locator("#fontGrid")).toBeVisible();
    });

    test("close button dismisses focus, grid remains", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });
        await page.locator(`.font-card[data-font="Big"]`).click();
        const panel = page.locator("#fontFocus");
        await expect(panel).toBeVisible();

        await panel.locator(".font-focus-close").click();
        await expect(panel).toBeHidden();
        await expect(page.locator("#fontGrid")).toBeVisible();
    });

    test("focus panel is inline inside the canvas, not a fullscreen overlay", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });
        await page.locator(`.font-card[data-font="Big"]`).click();
        await expect(page.locator(".canvas > #fontFocus")).toBeVisible();
        // The sidebar must remain interactive (i.e. not covered by the focus panel).
        await expect(page.locator("#compareButton")).toBeVisible();
        await page.click("#compareButton"); // sidebar reachable while focus open
        await expect(page.locator("#fontFocus")).toBeHidden();
        await expect(page.locator("#fontGrid")).toBeHidden();
    });

    test("dropdown change while focused updates the overlay label", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.click("#compareButton");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });
        await page.locator(`.font-card[data-font="Big"]`).click();
        await expect(page.locator("#fontFocus .font-focus-label")).toHaveText("Big");

        await page.selectOption("#font", "Slant");
        await expect(page.locator("#fontFocus .font-focus-label")).toHaveText("Slant");
    });
});
