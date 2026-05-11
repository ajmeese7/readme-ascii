# README ASCII
![readme-ascii](https://user-images.githubusercontent.com/17814535/88974985-14ced400-d27f-11ea-83a8-065d86dd8d26.png)

**readme-ascii** turns a line of ASCII text into a crisp PNG banner—perfect for GitHub READMEs where raw ASCII often wraps awkwardly.

---

## Why use this?

| Pain point | What readme-ascii gives you |
|------------|----------------------------|
| Raw ASCII breaks on small screens | Generates a **PNG** that scales smoothly |
| Designing a custom logo takes time | Instant banner: type ➜ generate ➜ download |
| SVGs sometimes get stripped by GitHub | PNG sidesteps sanitization and privacy warnings |

---

## Quick start

1. Open the [hosted demo](https://ajmeese7.github.io/readme-ascii/), or your fork's GitHub Pages URL.
2. Enter your text in the sidebar. The preview updates live as you type.
3. Tweak font, text color, background color, transparency, and shadow.
4. Click **Compare fonts** to see the same text rendered across every available font; click a card to promote it into an inline theater preview and select that font.
5. Click **Download** to save the PNG.

### Local development

Runtime is a pure static site (no build step). The dev toolchain is Node-only:

```bash
npm install
npm start        # serves the site at http://localhost:8123/
```

(`npm start` runs [`serve`](https://www.npmjs.com/package/serve). You can also open `index.html` directly, but some browsers restrict figlet's font fetch under `file://`.)

### Tests

End-to-end tests cover the live preview, compare grid, and theater focus panel. They use Playwright and start their own static server on port `8124`:

```bash
npx playwright install chromium  # one-time browser download
npm test                          # headless
npm run test:headed               # watch in a browser window
```

## Deployment

GitHub Pages serves the repo root directly. No build step, no separate branch, no CI. Enable it once in repo settings:

> Settings ➜ Pages ➜ Build and deployment ➜ Source: **Deploy from a branch** ➜ Branch: `master` / `(root)`

Every push to `master` republishes the site at `https://<user>.github.io/readme-ascii/` within ~30 seconds.

## Analytics

The hosted site reports to a GA4 property owned by [@ajmeese7](https://github.com/ajmeese7). To wire up your own analytics, follow [docs/GA4_SETUP.md](docs/GA4_SETUP.md).
