# Auto Spa America — landing page

Editorial landing page for the Auto Spa America detailing studio
(2223 N Westshore Blvd, Ste 181, Tampa FL). Static site: no build step, no
framework, no runtime CDN calls.

```
npm run site          # http://localhost:4173
node site/serve.js 8080   # any other port
```

`python3 -m http.server` is deliberately not used: on some systems it answers
`.css` and `.js` with `text/html`, which browsers refuse to apply.

## Layout

| Path | |
|---|---|
| `index.html` | all seven sections, markup is the source of truth |
| `css/base.css` | tokens, self-hosted fonts, reset, primitives |
| `css/sections.css` | section composition + responsive rules |
| `js/data.js` | pure helpers (price formatting, deck fan math) — DOM-free, unit tested |
| `js/main.js` | Lenis, header, reveal, deck, toggle |
| `assets/vendor/lenis.min.js` | Lenis 1.3.26, vendored so no CDN is needed |
| `assets/fonts/` | Bodoni Moda + Inter (fontsource, latin subset, woff2) |
| `assets/img/` | generated editorial plates |

`tests/site.test.js` statically checks the things that silently break a static
site: dead anchors, missing assets, missing `alt` text, and the deck's fan math.

## Swapping in real media

* **Hero video.** The hero is a `<video>` whose `poster` is
  `assets/img/hero-plate.jpg`, so it is cinematic with no video at all. To play
  a showreel, drop it at `site/assets/img/hero-reel.mp4` and uncomment the
  `<source>` line in `index.html`.
* **Photography.** Replace the files in `assets/img/` keeping the same names.
  The plates are currently generated imagery standing in for the studio's own
  portfolio.
* **Copy.** Prices, hours, phone and address are placeholders modelled on the
  studio's public listing — verify before publishing. Prices live on each card
  as `data-sedan` / `data-suv` attributes.

## Motion

Lenis smooth scroll is global and drives every scroll-linked effect from one
`requestAnimationFrame` loop (header state, the pricing fan, the process
progress rule). Anchor navigation is routed through `lenis.scrollTo`, so the
inertia carries into section jumps. Under `prefers-reduced-motion: reduce`
Lenis is not started and the deck renders in its fully fanned state.
