# Setting up Google Analytics 4

The site ships with a GA4 placeholder ID (`G-XXXXXXXXXX`) so analytics traffic doesn't get sent to a stranger's account. To turn on analytics, you need to create a GA4 property, copy its measurement ID, and paste it into `index.html`.

## 1. Sign in to Google Analytics

Go to [analytics.google.com](https://analytics.google.com) and sign in with the Google account you want to own the analytics data.

If you've never used Analytics before, click **Start measuring** and follow the account setup prompts (account name can be anything, "readme-ascii" works fine).

## 2. Create a GA4 property

In the bottom-left, click the **Admin** gear icon. Then:

1. In the **Account** column, pick the account you want this property under (or create a new one).
2. In the **Property** column, click **Create** ➜ **Property**.
3. Give it a name (`readme-ascii`), set the timezone and currency, and click **Next**.
4. Fill in the business details (industry, size). Click **Next**.
5. Pick whatever business objectives match. Click **Create**.

## 3. Add a Web data stream

After the property is created, you'll be prompted to set up a data stream:

1. Pick **Web**.
2. Enter the website URL (`https://ajmeese7.github.io/readme-ascii/` or your fork's URL).
3. Stream name: `readme-ascii`.
4. Click **Create stream**.

You'll land on a page showing the **Measurement ID** in the top-right. It looks like `G-XXXXXXXXXX` (10 alphanumeric characters after the `G-` prefix). Copy it.

If you ever need to find it again: **Admin** ➜ **Data Streams** ➜ click your stream ➜ Measurement ID is at the top-right.

## 4. Paste the ID into `index.html`

Open `index.html` and find the GA4 block near the top of `<head>`:

```html
<!-- Google Analytics 4. Replace G-XXXXXXXXXX with your measurement ID. See docs/GA4_SETUP.md. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");
</script>
```

Replace **both** occurrences of `G-XXXXXXXXXX` with your real measurement ID, then commit and push. The deploy workflow will publish the change to `gh-pages`.

## 5. Verify it's working

1. Open the live site in a browser.
2. In Analytics, go to **Reports** ➜ **Realtime**.
3. You should see your own session show up within ~30 seconds. If nothing shows, double-check the ID, hard-refresh the page, and make sure no extension (uBlock, Privacy Badger) is blocking `googletagmanager.com`.

## Notes

- GA4 replaces the deprecated Universal Analytics (UA-* IDs). The old `UA-175570657-1` tag the project used to ship is dead and stopped collecting data on July 1, 2024.
- Forks should generate their own measurement ID; don't ship someone else's.
