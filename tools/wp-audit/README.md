# WordPress component audit

The React port is measured against the *running* WordPress install, not
against an export. Once a Salient page renders, all seven styling layers
(theme options, compiled CSS, plugin CSS, and the geometry Salient writes
from JavaScript after paint) have collapsed into a single set of resolved
values — reading the live DOM is the only way to see what the site
actually does.

`audit.js` is that reader. Paste it into DevTools on
`http://luxury-property-group.local/<page>/`:

```js
__AUDIT()                    // per-row structural + typographic dump
__show()                     // same, but replaces <body> so it copies whole
__g('bottom-meta', 30)       // grep the CSSOM for matching rules
```

`__AUDIT()` walks the top-level `.wpb_row` bands and records, for each:
the ground (`.row-bg` colour/image and `.row-bg-overlay` strength —
Salient puts these on a child, never on the row itself), resolved
padding, column spans, and every block inside with its computed type
ramp. Carousels are reported with their full `data-*-columns` / spacing /
autoplay configuration, which is the only place that information exists.

`__g()` exists because the rules that matter — the portfolio hover, the
split-heading reveal, the named depth shadows — are buried in 4,000+
rules across 14 stylesheets, and are far easier to grep from the CSSOM
than to find by hand in a 170KB minified `salient-dynamic-styles.css`.

Two practical notes:

* Tool output truncates around 1KB, which is why `__show()` writes the
  report into `<body>` — a full-page text read returns all of it.
* The audit destroys the page when it does that. Re-navigate before the
  next run.

## Findings

Recorded in the project docs (`claude/salient-*.md`), not here. This
directory is the instrument, not the readings.
