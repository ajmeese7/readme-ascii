# readme-ascii
![readme-ascii](https://user-images.githubusercontent.com/17814535/88557807-5269fd80-cff0-11ea-9ebd-70c1d67b65af.png)

The goal of this project is to take user's text input and turn it into an image such as the above.

Whenever you're exploring the most successful repositories on GitHub, there is usually
one thing that stands out the most: a logo.

If you go to [Node.js](https://github.com/nodejs/node), right at the top they have
their fancy logo. It's the same with [Wiki.js](https://github.com/Requarks/wiki),
[Rust](https://github.com/rust-lang/rust), [Bootstrap](https://github.com/twbs/bootstrap),
[GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats),
[nodemon](https://github.com/remy/nodemon)... the list goes on.

Unfortunately, not all of us have the spare time to spend on a logo. Enter readme-ascii.

ASCII art is an easy solution to a logo, but unfortunately it tends to not display
well across different screen sizes. That's why I made this project, to turn the 
ASCII text into an image that can resize as expected.

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

### TODOs
After I get the MVP of this working, there are several things I would like to go back and add.
Any help doing so would be appreciated :)

- Include an `Advanced Settings` section that gives users access to more of the
settings on the site that generates the ASCII
- Look into the option to create ASCII versions of images