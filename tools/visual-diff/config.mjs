import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pages = require('../../src/data/content/pages.json');

// ─────────────────────────────────────────────────────────────────────
//  Routes are derived from pages.json so the harness can never drift
//  out of sync with the content model. `wpSlug` gives the WordPress
//  URL, `path` gives the React router path.
// ─────────────────────────────────────────────────────────────────────
const routes = pages.map((p) => ({
  name: p.wpSlug || 'home',
  title: p.title,
  candidatePath: p.path,
  referencePath: !p.wpSlug || p.wpSlug === 'home' ? '/' : `/${p.wpSlug}/`,
}));

export default {
  targets: {
    reference: {
      key: 'reference',
      name: 'WordPress',
      baseUrl: process.env.WP_URL ?? 'http://luxury-property-group.local',
      // Top-level WPBakery rows. Nested rows are filtered out at capture time.
      sectionSelector: '.wpb_row',
    },
    candidate: {
      key: 'candidate',
      name: 'React',
      baseUrl: process.env.REACT_URL ?? 'http://localhost:4173/',
      sectionSelector: '.section',
    },
  },

  routes,

  // The four tiers _variable.scss actually emits. Widths sit just inside
  // each boundary so a tier is never sampled at its own breakpoint edge.
  breakpoints: [
    { name: 'desktop', width: 1905 },
    { name: 'small-desktop', width: 1280 },
    { name: 'tablet', width: 960 },
    { name: 'phone', width: 480 },
  ],

  // pixelmatch per-pixel colour tolerance. 0 is exact; 0.1–0.2 tolerates
  // JPEG ringing and font antialiasing without hiding real layout drift.
  threshold: 0.15,

  // Height of each horizontal band used to localise differences.
  bandHeight: 120,

  // Bands quieter than this are treated as clean and dropped from the
  // worklist, so the report only surfaces things worth looking at.
  bandNoiseFloor: 0.02,

  // Vertical offset drift (px) above which a section is flagged as
  // structurally misplaced rather than merely mis-styled.
  geometryTolerance: 24,

  outDir: fileURLToPath(new URL('./output/', import.meta.url)),

  // Milliseconds to settle after the scroll pass, per page.
  settleMs: 600,
};
