# Visual diff harness

Screenshots the live WordPress site and the React rebuild at four breakpoints,
pixel-diffs them, and produces a worklist of sections ranked by how wrong they are.

## Setup

```bash
npm install -D playwright pixelmatch pngjs
npx playwright install chromium
```

Add to `package.json`:

```json
"diff": "node tools/visual-diff/run.mjs"
```

## Running

The React site has to be serving. Build first rather than using the dev server —
Vite's HMR client injects an overlay and can shift layout by a pixel or two:

```bash
npm run build && npm run preview     # terminal 1
npm run diff                          # terminal 2
```

Then open `tools/visual-diff/output/index.html`.

Flags:

```bash
npm run diff -- --routes=about,contact      # subset of pages
npm run diff -- --bp=desktop                # single breakpoint
npm run diff -- --routes=about --bp=phone   # both
```

URLs are overridable without editing config:

```bash
WP_URL=http://luxury-property-group.local REACT_URL=http://localhost:4173 npm run diff
```

Pointing `WP_URL` at your local WordPress instance is usually better than the
staging host — no network latency, no CDN image variance, and the two sites are
served from the same machine so font rasterisation matches.

## What the report gives you

**Worklist** — every section, at every breakpoint, ranked by absolute differing
pixel count. Ranking by count rather than percentage means a large wrong area
outranks a small one, which is the right priority order when you are trying to
close the gap fastest. Section indices map directly to `sections[n]` in
`pages.json` for that route, so a row in the worklist is an edit target.

**Section geometry table** — reference and candidate `top` offsets side by side,
with the delta. This is the diagnostic the screenshots cannot give you: padding
that is slightly wrong in many places compounds down the page, and a growing
`Δtop` column identifies the section where the drift starts. Also surfaces
`text-align` mismatches directly, which is the single most common cause of
divergence in this rebuild.

**Δsections** — a non-zero count means the two DOMs disagree about how many
top-level rows exist. That is a structural problem, not a styling one, and no
amount of CSS will close it.

## How pages are stabilised

Both sites are frozen identically before capture:

- Animation and transition durations zeroed. Salient gates row reveals behind a
  JS class toggle, so durations are zeroed *and* the reveal end-state is forced —
  otherwise half the reference page captures at `opacity: 0`.
- The page is scrolled top to bottom to trigger lazy loading, then returned to
  the top. The freeze CSS is re-injected afterwards, because the scroll pass can
  cause scripts to insert nodes the first injection never saw.
- Every `<video>` and `<iframe>` is hidden. The YouTube backgrounds will never
  agree frame-for-frame, and what is left is the row background underneath —
  which is what you actually want to compare.
- `document.fonts.ready` is awaited, then all pending images, then a settle delay.

## Reading the numbers

`threshold` in `config.mjs` is the per-pixel colour tolerance. At `0.15` font
antialiasing and JPEG ringing are ignored while real layout drift still shows.
Lower it to `0.05` once you are chasing the last few percent; raise it to `0.25`
if photographic content is drowning out layout signal.

Anything under about 2% divergence on a photo-heavy page is usually image
compression rather than a real difference — open the diff PNG and check whether
the red is concentrated at edges (real) or scattered across an image (noise).

## Known limits

`100vw` includes the scrollbar width. Both sites are captured in the same
headless Chromium at the same viewport, so this cancels out here — but it will
*not* cancel out when you compare the report against what you see in your own
browser. Since `_variable.scss` builds its entire padding scale on `vw`, expect a
few pixels of disagreement between the harness and your eyes.
