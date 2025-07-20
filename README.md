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

1. **Open the generator** (host your fork or use the public demo).
2. Enter a short project or profile name.
3. Click **Generate Image**.
4. Download the PNG and embed it in your README:

### Local development

```bash
# clone repo, install dependencies, start dev server
git clone https://github.com/ajmeese7/readme-ascii.git
cd readme-ascii
npm install          # one-time dependency install
npm run devstart     # nodemon on http://localhost:5000
```

### Troubleshooting

If you encounter issues with Puppeteer, such as missing shared libraries, you may need to install the required dependencies for Chromium on Linux. Use the following command to install all necessary libraries:

```bash
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils
```

If `libasound2` gives you problems, replace it with `libasound2t64` in the command above. For more details, refer to Puppeteer's [troubleshooting guide](https://pptr.dev/troubleshooting).

-----

### TODOs
After I get the MVP of this working, there are several things I would like to go back and add.
Any help doing so would be appreciated :)

- Add more to `Advanced Settings` section
- Look into the option to create ASCII versions of images
- Make button be clicked on enter press
- Stop it from not showing the error png on the second failure
- Make the site look better on mobile
