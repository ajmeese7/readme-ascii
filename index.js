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
      let text_param = req.query.text;
      let textColor = req.query.textColor;
      let backgroundColor = req.query.backgroundColor;
      let shadow = req.query.shadow;
      let ascii_url = "http://patorjk.com/software/taag/#p=display&f=Alpha&t=" + encodeURIComponent(text_param);
      
      if (!text_param) return res.render('error');

      (async () => {
        let browser;
        try {
          browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: "new" // Use new headless mode for modern browsers
          });
          const page = await browser.newPage();
          
          // Set a longer timeout for navigation
          page.setDefaultNavigationTimeout(60000);

          console.log("Navigating to ASCII generator...");
          await page.goto(ascii_url);
          
          // Wait for the output element to be available
          await page.waitForSelector('#taag_output_text');
          
          // Get the ASCII from the page
          const ascii = await page.$eval('#taag_output_text', el => el.textContent);

          if (!ascii) {
            await browser.close();
            return res.status(500).send("Failed to generate ASCII text");
          }

          console.log("Generating image from ASCII...");
          
          // Check if background should be transparent
          const isTransparent = backgroundColor === 'rgba(255, 255, 255, 0)' || 
                               backgroundColor === 'transparent' ||
                               backgroundColor.endsWith(', 0)') || 
                               backgroundColor.endsWith(',0)');
          
          // Create an HTML page with the ASCII art styled according to parameters
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background-color: ${isTransparent ? 'transparent' : backgroundColor || 'white'};
                }
                pre {
                  font-family: monospace;
                  color: ${textColor || 'black'};
                  font-weight: bold;
                  font-size: 12px;
                  line-height: 12px;
                  ${shadow === "true" ? `text-shadow: -1ex 0.2pc 6px ${textColor || 'black'};` : ''}
                  white-space: pre;
                }
              </style>
            </head>
            <body>
              <pre>${ascii}</pre>
            </body>
            </html>
          `;

          // Set the HTML content
          await page.setContent(html);
          
          // Take a screenshot as base64
          const screenshot = await page.screenshot({
            encoding: 'base64',
            omitBackground: isTransparent,
            fullPage: true,
            type: 'png'
          });
          
          // Create data URL from screenshot
          const base64_url = `data:image/png;base64,${screenshot}`;

          // Set content type to JSON and send the data URL
          res.setHeader('Content-Type', 'text/plain');
          res.write(base64_url);
          res.end();
        } catch (error) {
          console.error("Unexpected error:", error);
          if (!res.headersSent) {
            res.status(500).send("An unexpected error occurred while generating the image");
          }
        } finally {
          if (browser) {
            await browser.close();
          }
        }
      })();
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`)) // localhost:5000