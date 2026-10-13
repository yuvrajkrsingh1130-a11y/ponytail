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

* **Hero video.** The hero loads the studio's own reel first, a royalty-free
  clip second, and the local poster plate last:
  `https://autospaamerica.com/wp-content/uploads/2023/11/Auto-Spa-America-Hero-Compressed.mp4`
  then `https://videos.pexels.com/video-files/6159208/6159208-hd_1920_1080_30fps.mp4`.
  Browsers walk `<source>` in order and fall through on error, and the poster
  stays underneath, so a blocked or CORS-rejected host degrades to the still
  rather than to a black box. The reel cross-fades in on `playing`.
* **Logo.** `assets/img/logo.png` is the studio wordmark, used in the header
  (44px tall) and the footer (78px). Swap in the real asset at that path —
  same name, same folder, no code changes. The committed file is a typographic
  stand-in (Pacifico script + DejaVu block caps) because the original artwork
  was not available at build time.
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

The two horizontal tracks ("The Drop-Off" and the mobile pricing deck) hide
their native scrollbars and are dragged with the pointer instead — touch
swiping still uses native momentum. Snap is `proximity` so a drag is never
fought by the snap.
