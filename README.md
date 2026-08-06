# Elegant Address — React port

A React 19 rebuild of the Elegant Address Luxury Property Group WordPress
site (Salient 15.0.9 + WPBakery), following the same conventions as the
SouthEat project: Vite, react-router, SCSS with an `@` alias and
auto-injected `_variable` / `_base`, `component-styles/` + `page-styles/`,
BEM-ish class names, default-exported function components.

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production build to dist/
npm run lint
```

## How the port works

WordPress kept nothing useful on disk — every page, menu, form and theme
option lived in the database. So the port is a **build-time extraction**
rather than a hand transcription, which means it can be re-run against a
fresh dump when content changes.

```
local.sql ──┬─ scripts/extract.py ──────► src/data/content/pages.json
            └─ scripts/extract_posts.py ► src/data/content/posts.json
                                          src/data/content/missing-media.json

wp-content/uploads ── scripts/migrate-assets.mjs ──► src/assets/
```

| Script | What it does |
| --- | --- |
| `scripts/dbread.py` | Minimal MySQL dump reader — parses extended `INSERT` statements into rows. |
| `scripts/vcparse.py` | Turns WPBakery shortcode soup into a tree, keeping only attributes that carry content or real design intent. |
| `scripts/extract.py` | Flattens each page's `vc_row` bands into a normalised section model. |
| `scripts/extract_posts.py` | Pulls the classic-editor blog posts, rewrites image and link URLs, drops images missing from the export. |
| `scripts/migrate-assets.mjs` | Copies the *original* media out of `wp-content/uploads` (skipping WordPress's resized copies) under readable names. |

Re-run them like this:

```bash
node scripts/migrate-assets.mjs "/path/to/wp-content/uploads"
python3 scripts/extract.py       /path/to/local.sql
python3 scripts/extract_posts.py /path/to/local.sql
```

The two JSON files under `src/data/content/` are **generated — don't
hand-edit them**. Everything else in `src/data/` is hand-written.

## Content model

Pages are a stack of full-bleed bands, mirroring how the site was built:

```jsonc
{
  "slug": "barbados",
  "sections": [{
    "background": { "color": "#5185a1", "image": "…", "video": "IxF55qB4CuQ", "overlay": "…" },
    "groups": [ [ /* left column blocks */ ], [ /* right column blocks */ ] ],
    "blocks": [ /* the same blocks, flattened */ ]
  }]
}
```

`groups` preserves the column split so `Section` can alternate which side
the media sits on; `blocks` is the flattened convenience view. Block
types are `heading | text | button | gallery | image | cards | form` —
all seven are handled by `src/components/Section.jsx`.

Because JSON can't hold an ES import, asset references are stored as
paths (`images/destinations/barbados.jpg`) and resolved at runtime by
`src/lib/assets.js`, which uses `import.meta.glob` so Vite still hashes
and tree-shakes them.

## Design tokens

Every value in `src/styles/_variable.scss` is lifted from the Salient /
Redux theme options export, with the source key named in a comment. The
important ones:

- Accent `#5185a1` (sampled from the logo artwork; matches `accent-color`)
- Body **Open Sans** 500, 17px/25px
- **h1 is a small tracked uppercase label** (Open Sans 500, 22px, 2px
  tracking) while **h2 is the big serif** (Merriweather 400, 45px) — a
  Salient convention that's easy to get backwards
- Navigation Merriweather 400, 16px
- Footer `#313233`, copyright bar `#1f1f1f`
- Buttons 4px radius (`button-styling: slightly_rounded_shadow`)

Salient stores responsive type as a percentage of the desktop size, so
the `scale()` helper reproduces the tablet/phone steps exactly.

## Routing

Permalinks were `/%postname%/`, so slugs stay flat and unchanged to
preserve inbound links. Two redirects are declared in
`src/data/navigation.js`:

- `/france` → `/south-of-france` — the menu pointed at `/france` but every
  in-page button pointed at `/south-of-france`, which was broken live
- `/home` → `/`

## Known gaps

These are properties of the export, not of the port:

1. **Nine pages are published but empty.** `saint-jean-cap-ferrat`,
   `cap-dantibes`, `cannes`, `villefranche-and-villages`, `saint-tropez`,
   `mougins-and-villages`, `terms-and-conditions`, `blog`, `404-page` all
   have zero-byte `post_content`. The six region pages are the targets of
   the grid on the South of France page — whose links are `#` live, so
   they were never wired up. They render as titled stubs
   (`src/data/stubs.js`) rather than 404s.
2. **184 blog images are missing.** The posts date from 2017–19 and their
   media isn't in `wp-content/uploads` or the Duplicator archive. The
   `<img>` tags are removed rather than left broken; the full list is in
   `src/data/content/missing-media.json`. Drop the originals into uploads
   and re-run `migrate-assets.mjs` + `extract_posts.py` to restore them.
3. **Three portfolio items** (`villa-ginger-lily`,
   `cannes-cn-642-11-bedroom-villa`,
   `saint-jean-cap-ferrat-6-bedroom-villa`) use the Salient portfolio CPT
   and aren't ported yet.
4. **Forms don't submit anywhere.** Field names in `src/data/forms.js`
   match the Contact Form 7 definitions exactly, so existing mail
   templates and CRM mappings still line up, but a handler needs wiring.
5. **Hero videos** are YouTube IDs (`N8qlzl-KrNo`, `IxF55qB4CuQ`) played
   via embed, as they were on the live site. Self-hosting them would be
   faster.

## Departures from SouthEat

Two, both deliberate:

- **A layout route** (`components/Layout.jsx`) instead of mounting
  `<Navbar />` inside each page. SouthEat has four pages; this site has a
  header and footer on every route including dynamic ones, and keeping
  the header mounted avoids resetting its scroll state on navigation.
- **A `src/data/` folder.** It's the seam where WordPress content lands,
  so re-importing is a data change rather than a rewrite.
