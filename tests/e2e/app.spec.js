// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
    // Ensure a clean form state every run.
    await page.addInitScript(() => {
        try { localStorage.clear(); } catch (e) {}
    });
    await page.goto("/");
});

test("featured preview renders after typing", async ({ page }) => {
    await page.fill("#asciiText", "Hello");
    const result = page.locator("#result");
    await expect(result).toHaveAttribute("src", /^data:image\/png/, { timeout: 10_000 });
    await expect(result).toBeVisible();
    await expect(page.locator("#downloadButton")).toBeEnabled();
    await expect(page.locator("#canvasDownloadButton")).toBeEnabled();
});

test("featured preview label matches the selected font", async ({ page }) => {
    await page.fill("#asciiText", "Hi");
    await expect(page.locator(".featured-label")).toHaveText("Alpha");
});

test.describe("font grid (always on)", () => {
    test("grid renders one card per font with the selected one active", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator("#result").waitFor({ state: "visible" });

        const fontCount = await page.locator("#font option").count();
        expect(fontCount).toBeGreaterThan(1);

        await expect(page.locator("#fontGrid")).toBeVisible();
        const cards = page.locator(".font-card");
        await expect(cards).toHaveCount(fontCount);

        await expect(page.locator(".font-card-preview img")).toHaveCount(fontCount, { timeout: 20_000 });

        const selectedFont = await page.locator("#font").inputValue();
        await expect(page.locator(`.font-card[data-font="${selectedFont}"]`)).toHaveClass(/active/);
    });

    test("clicking a card promotes it to the featured preview", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });

        const targetFont = "Doom";
        await page.locator(`.font-card[data-font="${targetFont}"]`).click();

        await expect(page.locator(".featured-label")).toHaveText(targetFont);
        await expect(page.locator("#font")).toHaveValue(targetFont);
        await expect(page.locator(`.font-card[data-font="${targetFont}"]`)).toHaveClass(/active/);
    });

    test("live-updates cards when styling changes", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator(".font-card-preview img").first().waitFor({ timeout: 20_000 });

        const firstCard = page.locator(`.font-card[data-font="Alpha"] .font-card-preview img`);
        const initialSrc = await firstCard.getAttribute("src");

        await page.locator("#shadow").check();
        await expect.poll(
            async () => firstCard.getAttribute("src"),
            { timeout: 15_000 }
        ).not.toBe(initialSrc);
    });
});

test.describe("slideshow navigation", () => {
    test("arrow keys cycle through fonts when not in a text field", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.locator("#result").waitFor({ state: "visible" });
        // Move focus out of the text input so arrows can navigate fonts.
        await page.locator("body").click();

        const fonts = await page.locator("#font option").evaluateAll(
            (opts) => opts.map((o) => /** @type {HTMLOptionElement} */ (o).value)
        );
        const startFont = await page.locator("#font").inputValue();
        const startIdx = fonts.indexOf(startFont);
        const next = fonts[(startIdx + 1) % fonts.length];

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#font")).toHaveValue(next);
        await expect(page.locator(".featured-label")).toHaveText(next);
    });

    test("prev/next buttons cycle fonts", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.locator("#result").waitFor({ state: "visible" });

        const fonts = await page.locator("#font option").evaluateAll(
            (opts) => opts.map((o) => /** @type {HTMLOptionElement} */ (o).value)
        );
        const startFont = await page.locator("#font").inputValue();
        const startIdx = fonts.indexOf(startFont);

        await page.click("#nextFontBtn");
        await expect(page.locator("#font")).toHaveValue(fonts[(startIdx + 1) % fonts.length]);

        await page.click("#prevFontBtn");
        await page.click("#prevFontBtn");
        // back two from the +1 position lands one behind the start.
        await expect(page.locator("#font")).toHaveValue(fonts[(startIdx - 1 + fonts.length) % fonts.length]);
    });

    test("arrow keys do not navigate while typing in the text field", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator("#result").waitFor({ state: "visible" });
        await page.locator("#asciiText").focus();

        const before = await page.locator("#font").inputValue();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#font")).toHaveValue(before);
    });
});

test.describe("font combobox", () => {
    test("filters options by typed query", async ({ page }) => {
        await page.locator("#fontInput").click();
        await page.locator("#fontInput").fill("doom");

        const items = page.locator("#fontList .combobox-item");
        await expect(items).toHaveCount(1);
        await expect(items.first()).toHaveText("Doom");
    });

    test("selecting an item commits the font and closes the list", async ({ page }) => {
        await page.fill("#asciiText", "Hi");
        await page.locator("#fontInput").click();
        await page.locator("#fontInput").fill("slant");
        await page.locator("#fontList .combobox-item", { hasText: "Slant" }).click();

        await expect(page.locator("#fontList")).toBeHidden();
        await expect(page.locator("#font")).toHaveValue("Slant");
        await expect(page.locator("#fontInput")).toHaveValue("Slant");
        await expect(page.locator(".featured-label")).toHaveText("Slant");
    });

    test("Escape closes the list without committing", async ({ page }) => {
        await page.locator("#fontInput").click();
        await page.locator("#fontInput").fill("zzz");
        await page.keyboard.press("Escape");

        await expect(page.locator("#fontList")).toBeHidden();
        await expect(page.locator("#fontInput")).toHaveValue("Alpha");
    });
});

test.describe("shadow controls", () => {
    test("controls are hidden until shadow is enabled", async ({ page }) => {
        await expect(page.locator("#shadowOptions")).toBeHidden();
        await page.locator("#shadow").check();
        await expect(page.locator("#shadowOptions")).toBeVisible();
    });

    test("reset button restores default shadow values", async ({ page }) => {
        await page.locator("#shadow").check();
        await page.locator("#shadow-color").evaluate((el) => {
            /** @type {HTMLInputElement} */ (el).value = "#ff00ff";
            el.dispatchEvent(new Event("input", { bubbles: true }));
        });
        await page.locator("#shadow-blur").fill("35");
        await page.locator("#shadow-offset-x").fill("20");
        await page.locator("#shadow-offset-y").fill("-15");

        await expect(page.locator("#shadow-blur-value")).toHaveText("35");

        await page.click("#shadowReset");

        await expect(page.locator("#shadow-color")).toHaveValue("#000000");
        await expect(page.locator("#shadow-blur")).toHaveValue("10");
        await expect(page.locator("#shadow-offset-x")).toHaveValue("-5");
        await expect(page.locator("#shadow-offset-y")).toHaveValue("5");
        await expect(page.locator("#shadow-blur-value")).toHaveText("10");
        await expect(page.locator("#shadow-offset-x-value")).toHaveText("-5");
        await expect(page.locator("#shadow-offset-y-value")).toHaveText("5");
    });

    test("changing blur re-renders the featured preview", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator("#shadow").check();
        await page.locator("#result").waitFor({ state: "visible" });
        const before = await page.locator("#result").getAttribute("src");

        await page.locator("#shadow-blur").fill("25");
        await expect.poll(
            async () => page.locator("#result").getAttribute("src"),
            { timeout: 15_000 }
        ).not.toBe(before);
        await expect(page.locator("#shadow-blur-value")).toHaveText("25");
    });
});

test.describe("sidebar collapse", () => {
    test("chevron collapses and re-expands the sidebar", async ({ page }) => {
        const app = page.locator("#app");
        await expect(app).not.toHaveClass(/sidebar-collapsed/);

        await page.click("#sidebarToggle");
        await expect(app).toHaveClass(/sidebar-collapsed/);
        await expect(page.locator("#userInput")).toBeHidden();

        await page.click("#sidebarToggle");
        await expect(app).not.toHaveClass(/sidebar-collapsed/);
        await expect(page.locator("#userInput")).toBeVisible();
    });

    test("collapsed state is written to localStorage", async ({ page }) => {
        await page.click("#sidebarToggle");
        await expect(page.locator("#app")).toHaveClass(/sidebar-collapsed/);

        const stored = await page.evaluate(() => localStorage.getItem("sidebar-collapsed"));
        expect(stored).toBe("1");
    });
});

test.describe("canvas save button", () => {
    test("download link points at the same PNG as the sidebar download", async ({ page }) => {
        await page.fill("#asciiText", "Hello");
        await page.locator("#result").waitFor({ state: "visible" });

        const sidebarHref = await page.locator("#download").getAttribute("href");
        const canvasHref = await page.locator("#canvasDownload").getAttribute("href");
        expect(sidebarHref).toBeTruthy();
        expect(canvasHref).toBe(sidebarHref);
        await expect(page.locator("#canvasDownloadButton")).toBeEnabled();
    });
});
