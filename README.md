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
2. Enter a short project or profile name.
3. (Optional) open the advanced settings to tweak text color, background color, or shadow.
4. Click **Generate Image**, then **Download**.

### Local development

Pure static site, no build step. Either:

```bash
# Open the file directly
xdg-open index.html

# Or serve over HTTP (recommended; some browsers restrict figlet's font fetch under file://)
npx serve .
```

## Deployment

GitHub Pages serves the repo root directly. No build step, no separate branch, no CI. Enable it once in repo settings:

> Settings ➜ Pages ➜ Build and deployment ➜ Source: **Deploy from a branch** ➜ Branch: `master` / `(root)`

Every push to `master` republishes the site at `https://<user>.github.io/readme-ascii/` within ~30 seconds.

## Analytics

The hosted site reports to a GA4 property owned by [@ajmeese7](https://github.com/ajmeese7). To wire up your own analytics, follow [docs/GA4_SETUP.md](docs/GA4_SETUP.md).
