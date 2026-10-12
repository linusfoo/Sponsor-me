# Sponsor my race kit

A static website where brands rotate a 3D model of my race kit, pick a glowing ad spot on the trisuit, cycling kit, running kit, helmet, race belt or bike, choose one race or the full season, and go through a demo checkout.

No build step and no backend: just HTML, CSS and JavaScript. The 3D view uses [three.js](https://threejs.org) (bundled in `vendor/three`, MIT licence).

## Make it yours

Everything you'd normally change lives in **`config.js`**:

- `athlete`: your name, intro, bio, facts and photo path (put images in an `images/` folder)
- `season`, `currencySymbol` (S$), `email`, `socials`
- `races`: the races a sponsor can pick for a single-race deal
- `spots`: the price of every spot (`race` and `season`)

### Mark a spot as sold

Add a `sold` object to the spot:

```js
"tri-back": { race: 200, season: 1400,
              sold: { sponsor: "Acme Energy", url: "https://acme.com", logo: "images/acme.png" } },
```

The spot then shows the logo (or the sponsor's name if `logo` is empty) on the 3D kit and on the sponsors wall.

### Change spot positions or add new ones

Spot placement is in `kit.js`. The mannequin is life-size in metres (feet at `y = 0`, facing `+z`), and each spot is projected onto a body part along a ray (`from` and `dir`), with `w` × `h` as the patch size in metres. If you add a spot there, give it a price in `config.js` too. The 3D models themselves are built in code in `stage.js`.

## About the demo checkout

Checkout takes no payment and sends nothing. "Purchased" spots and uploaded logos are saved only in the visitor's own browser, so each visitor sees just their own demo orders. The **Clear demo orders** link in the footer resets them.

## Run locally

The site uses JavaScript modules, so open it through a local server rather than double-clicking `index.html`:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `master` (or `main`) and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## After editing

Browsers cache the site's files for a few minutes. When you change `config.js` (or any other file), bump the `?v=` number on the `<script>` and `<link>` tags in `index.html` (and the `stage.js` import at the top of `app.js`) so visitors get the new version straight away.
