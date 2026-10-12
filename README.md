# Sponsor my race kit

A static website where brands can pick an advertising spot on my trisuit, cycling kit, running kit or accessories, choose one race or the full season, and go through a demo checkout.

No build step and no backend: just HTML, CSS and JavaScript.

## Make it yours

Everything you'd normally change lives in **`config.js`**:

- `athlete`: your name, intro, bio, facts and photo path (put images in an `images/` folder)
- `season`, `currency`, `email`, `socials`
- `races`: the races a sponsor can pick for a single-race deal
- `spots`: the price of every spot (`race` and `season`)

### Mark a spot as sold

Add a `sold` object to the spot:

```js
"tri-back": { race: 200, season: 1400,
              sold: { sponsor: "Acme Energy", url: "https://acme.com", logo: "images/acme.png" } },
```

The spot then shows the logo (or the sponsor's name if `logo` is empty) on the drawing and on the sponsors wall.

### Change spot positions or add new ones

The garment drawings and spot rectangles are in `kit.js`. Every drawing uses a 400 × 500 canvas, and a spot's `r` is `[x, y, width, height]`. If you add a spot there, give it a price in `config.js` too.

## About the demo checkout

Checkout takes no payment and sends nothing. "Purchased" spots and uploaded logos are saved only in the visitor's own browser, so each visitor sees just their own demo orders. The **Clear demo orders** link in the footer resets them.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `master` (or `main`) and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.
