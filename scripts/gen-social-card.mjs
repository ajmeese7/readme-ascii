// Regenerates social-card.png, the og:image / twitter:image asset.
// Renders a fixed 1200x630 card (the de facto social-sharing size) with a dark
// gradient and a terminal-green figlet banner so it reads well on any platform.
// Run: node scripts/gen-social-card.mjs
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "social-card.png");

const TEXT = "readme-ascii";
const FONT = "ANSI Shadow";
const TAGLINE = "ASCII art banner generator for your README";
const WIDTH = 1200;
const HEIGHT = 630;

const browser = await chromium.launch();
try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await page.goto("about:blank");
    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/figlet@1/lib/figlet.js" });
    // figlet.js declares `const figlet` under "use strict", so it's a global lexical
    // binding (visible as a bare name), not a property of window.
    await page.waitForFunction(() => typeof figlet !== "undefined");

    const dataUrl = await page.evaluate(async ({ text, font, tagline, width, height }) => {
        figlet.defaults({ fontPath: "https://cdn.jsdelivr.net/npm/figlet@1/fonts" });
        const ascii = await new Promise((resolve, reject) => {
            figlet.text(text, { font }, (err, out) => (err || !out ? reject(err || new Error("empty")) : resolve(out)));
        });

        // Keep leading spaces (they hold the art's alignment); trim trailing only.
        const lines = ascii.split("\n").map((l) => l.replace(/\s+$/, ""));
        while (lines.length && lines[0].trim() === "") lines.shift();
        while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, "#0d1117");
        bg.addColorStop(1, "#161b22");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        ctx.textBaseline = "top";

        const margin = 90;
        const taglineBand = 80;
        const base = 100;
        ctx.font = `bold ${base}px monospace`;
        const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const blockH = lines.length * base; // app uses lineHeight == fontSize for figlet art
        const scale = Math.min((width - margin * 2) / maxLineW, (height - margin * 2 - taglineBand) / blockH);

        const fs = base * scale;
        ctx.font = `bold ${fs}px monospace`;
        const lineHeight = fs;
        const totalH = lines.length * lineHeight;
        const scaledMaxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const startX = (width - scaledMaxW) / 2;
        const startY = (height - taglineBand - totalH) / 2;

        ctx.shadowColor = "rgba(63, 185, 80, 0.45)";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "#3fb950";
        lines.forEach((line, i) => ctx.fillText(line, startX, startY + i * lineHeight));

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#8b949e";
        ctx.font = "500 30px system-ui, sans-serif";
        const tw = ctx.measureText(tagline).width;
        ctx.fillText(tagline, (width - tw) / 2, startY + totalH + 28);

        return canvas.toDataURL("image/png");
    }, { text: TEXT, font: FONT, tagline: TAGLINE, width: WIDTH, height: HEIGHT });

    writeFileSync(OUT, Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64"));
    console.log(`wrote ${OUT} (${WIDTH}x${HEIGHT})`);
} finally {
    await browser.close();
}
