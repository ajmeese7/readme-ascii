# readme-ascii
![readme-ascii](https://user-images.githubusercontent.com/17814535/88974985-14ced400-d27f-11ea-83a8-065d86dd8d26.png)

![Hits](https://hitcounter.pythonanywhere.com/count/tag.svg?url=https%3A%2F%2Fgithub.com%2Fajmeese7%2Freadme-ascii)

Whenever you're exploring the most successful repositories on GitHub, there is usually
one thing that stands out the most: **a logo**.

If you go to [Node.js](https://github.com/nodejs/node), right at the top they have
their fancy logo. It's the same with [Wiki.js](https://github.com/Requarks/wiki),
[Rust](https://github.com/rust-lang/rust), [Bootstrap](https://github.com/twbs/bootstrap),
[GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats),
[nodemon](https://github.com/remy/nodemon)... the list goes on.

Unfortunately, not all of us have the spare time to spend on a logo. Enter **readme-ascii**.

ASCII art is an easy solution to a logo, but it tends to not display well across different 
screen sizes. That's why I made this project, to turn the ASCII text into an image that 
can resize as expected.

The biggest caveat with this project so far is that it doesn't look great on longer strings.
So for now just try to stick with concise names, and I'll see what I can whip up in the future. 
Check out the one on my [profile](https://github.com/ajmeese7)!

## Usage
Using this project couldn't be simpler.

1. Go to the site
2. Enter your text
3. Click "Generate Image"
4. Wait as your image is created
5. Download the image
6. Success!

## Development
If you want to work on this project locally, run the following commands:

1. `npm install` - required initially to download the npm dependencies
2. `npm run devstart` - runs environment with nodemon, so the server is automatically restarted on changes
3. Visit `localhost:5000` to interact with it

### TODOs
After I get the MVP of this working, there are several things I would like to go back and add.
Any help doing so would be appreciated :)

- Add more to `Advanced Settings` section
- Look into the option to create ASCII versions of images
- Make button be clicked on enter press
- Stop it from not showing the error png on the second failure
- Make the site look better on mobile
