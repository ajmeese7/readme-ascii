const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000 // Heroku or local
var app = express();

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('index'))
  .get('/index', (req, res) => res.render('index'))
  .use((req, res, next) => {
      // CORS headers
      res.append('Access-Control-Allow-Origin', ['*']);
      res.append('Access-Control-Allow-Methods', 'GET');
      res.append('Access-Control-Allow-Headers', 'Content-Type');
      next();
  })
  .get('/generate', function (req, res) {
      var text_param = req.query.text;
      var ascii_url = "http://patorjk.com/software/taag/#p=display&f=Alpha&t=" + encodeURIComponent(text_param);

      (async () => {
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
        const page = await browser.newPage()

        // TODO: Either have the res updated before or with a then, so I don't get a loading loop
        await page.goto(ascii_url)
          .catch(err => {
            console.error(err);

            var obj = { err : err };
            res.writeHead(404, {"Content-Type": "application/json"}); // Error code
            res.write(JSON.stringify(obj));
            res.end();
          });
        
        // Get the ASCII from the page
        const ascii = await page.$eval('#taag_output_text', el => el.textContent);

        // Navigate to the ASCII tools site
        await page.goto("https://onlineasciitools.com/convert-ascii-to-image")
        await page.select('[data-index="typeface"]', "monospace")
        await page.$eval('[data-index="background-color"]', el => el.value = "rgba(255, 255, 255, 0)");
        await page.$eval('[data-index="text-color"]', el => el.value = "rgb(0, 0, 0)");
        await page.$eval('[data-index="font-size"]', el => el.value = "12px");

        // https://github.com/puppeteer/puppeteer/issues/3347#issuecomment-427234299
        const boldCheckbox = '[data-index="bold"]';
        await page.evaluate((boldCheckbox) => document.querySelector(boldCheckbox).click(), boldCheckbox);
        
        // Places ASCII from other website into the textarea
        await page.$eval('.data-wrapper textarea', (el, input) => el.value = input, ascii);
        await page.type('.data-wrapper textarea', " "); // To make sure input is recognized

        // Generate base64 image URL
        const dataUri = '[data-url="convert-image-to-data-uri"]';
        await page.click('.output [data-toggle="toggle-chain"]');
        await page.waitForSelector(dataUri);
        await page.waitFor(1250); // TODO: Find a better way!
        await page.click(dataUri);
        
        // https://stackoverflow.com/a/61077067/6456163
        const base64_url = await page.evaluate(async _ => {
          // https://stackoverflow.com/a/48602881
          while (!document.querySelectorAll(".widget-copy")[3]) {
            await new Promise(r => setTimeout(r, 100));
          }

          // Press the copy button, which selects the text
          let copy = document.getElementsByClassName("widget-copy")[3];
          copy.click();

          // Get and return the selected text (the base64 URL)
          let selection = window.getSelection().toString();
          return selection;
        });

        // Display URL and stop writing to page
        res.write(base64_url);
        res.end();

        await browser.close()
      })()
  })
  .get('*', (req, res) => res.render('error')) // TODO: Make
  .listen(PORT, () => console.log(`Listening on ${ PORT }`)) // localhost:5000