/**
 * migrate-assets.mjs
 *
 * One-shot migration: pulls the ORIGINAL media out of a WordPress
 * wp-content/uploads tree and lays it down in src/assets under
 * human-readable names.
 *
 * WordPress stores every image many times over (-300x200, -1024x683,
 * -scaled, plus .webp/.avif mirrors in uploads-webpc). We only want the
 * single source-of-truth original; Vite + sharp handle sizing from there.
 *
 * Usage:
 *   node scripts/migrate-assets.mjs <path-to-wp-uploads>
 *
 * Example:
 *   node scripts/migrate-assets.mjs "C:/Users/sueth/Local Sites/luxury-property-group/app/public/wp-content/uploads"
 */

import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(__dirname, '../src/assets')

const uploadsRoot = process.argv[2]
if (!uploadsRoot) {
  console.error('Usage: node scripts/migrate-assets.mjs <path-to-wp-content/uploads>')
  process.exit(1)
}

/**
 * source path (relative to uploads root)  ->  destination (relative to src/assets)
 *
 * Names were derived by eye from the actual media. Anything still called
 * `property-01`-style is a portfolio shot whose real caption lives in the
 * WordPress database — rename once the DB export lands.
 */
const MAP = {
  // ── Brand ────────────────────────────────────────────────────────────
  '2023/07/Elegant-Address-Web-Logo.png':          'logos/logo-elegant-address.png',
  '2023/07/Elegant-Address-Web-Logo-R.png':        'logos/logo-elegant-address-r.png',
  '2023/07/Elegant-Address-Web-Logo-White.png':    'logos/logo-elegant-address-white.png',
  '2023/07/Elegant-Address-Web-Logo-White-R.png':  'logos/logo-elegant-address-white-r.png',
  '2023/07/EA-Favicon.jpg':                        'logos/favicon-source.jpg',

  // ── Destinations ─────────────────────────────────────────────────────
  '2023/07/Barbados-1.jpg':          'images/destinations/barbados.jpg',
  '2023/07/Barbados-1-1.jpg':        'images/destinations/barbados-alt-1.jpg',
  '2023/07/Barbados-1-2.jpg':        'images/destinations/barbados-alt-2.jpg',
  '2023/07/South-of-France-1.jpg':   'images/destinations/south-of-france.jpg',
  '2023/07/South-of-France-1-1.jpg': 'images/destinations/south-of-france-alt-1.jpg',
  '2023/07/South-of-France-1-2.jpg': 'images/destinations/south-of-france-alt-2.jpg',

  // ── Backgrounds ──────────────────────────────────────────────────────
  '2023/07/PH-BG-1.jpg':        'images/backgrounds/penthouse-pool.jpg',
  '2023/09/Barbados-BG.png':    'images/backgrounds/barbados.png',
  '2023/09/Barbados-1-BG.jpg':  'images/backgrounds/barbados-alt.jpg',

  // ── Lifestyle / concierge ────────────────────────────────────────────
  '2023/07/Yacht-2.jpg':      'images/lifestyle/yacht.jpg',
  '2023/07/yacht.jpg':        'images/lifestyle/yacht-alt.jpg',
  '2023/07/Private-Jet.jpg':  'images/lifestyle/private-jet.jpg',
  '2023/07/Rolls-Royce.jpg':  'images/lifestyle/rolls-royce.jpg',
  '2023/07/Cocktail.jpg':     'images/lifestyle/cocktail.jpg',
  '2023/07/Dining.jpg':       'images/lifestyle/dining.jpg',
  '2023/07/Shopping.jpg':     'images/lifestyle/shopping.jpg',

  // ── About / awards ───────────────────────────────────────────────────
  '2023/07/About-Image-1.jpg': 'images/about/team.jpg',
  '2023/07/image.jpeg':        'images/awards/queens-award-presentation.jpeg',
  '2023/07/image.png':         'images/awards/award-badges.png',

  // ── Property portfolio ───────────────────────────────────────────────
  '2023/07/image-1.jpeg':  'images/properties/property-01-infinity-pool.jpeg',
  '2023/07/image-2.jpeg':  'images/properties/property-02-estate-lawn.jpeg',
  '2023/07/image-3.jpeg':  'images/properties/property-03-courtyard-pool.jpeg',
  '2023/07/image-4.jpeg':  'images/properties/property-04-formal-gardens.jpeg',
  '2023/07/image-5.jpeg':  'images/properties/property-05-terraced-gardens.jpeg',
  '2023/07/image-6.jpeg':  'images/properties/property-06-glass-orangery.jpeg',
  '2023/07/image-7.jpeg':  'images/properties/property-07-cloister.jpeg',
  '2023/07/image-8.jpeg':  'images/properties/property-08-dining-room.jpeg',
  '2023/07/image-9.jpeg':  'images/properties/property-09-loggia.jpeg',
  '2023/07/image-10.jpeg': 'images/properties/property-10-frescoed-suite.jpeg',
  '2023/07/image-11.jpeg': 'images/properties/property-11-bedroom.jpeg',
  '2023/07/image-12.jpeg': 'images/properties/property-12-villa-pool.jpeg',
  '2023/07/image-3.png':   'images/properties/property-13-poolside.png',

  // ── Editorial / blog (2018–2019) ─────────────────────────────────────
  '2018/03/image.png':      'images/destinations/cannes-old-town.png',
  '2018/04/image-1.jpeg':   'images/destinations/carlton-cannes.jpeg',
  '2018/04/image-2.jpeg':   'images/destinations/sunset-terrace.jpeg',
  '2018/04/image.jpeg':     'images/lifestyle/supercar.jpeg',
  '2019/11/image-1.jpeg':   'images/destinations/monaco-facade.jpeg',
  '2019/11/image-2.jpeg':   'images/destinations/cannes-harbour.jpeg',
  '2019/11/image.jpeg':     'images/destinations/cassis-coast.jpeg',
}

let copied = 0
const missing = []

for (const [from, to] of Object.entries(MAP)) {
  const src = join(uploadsRoot, from)
  const dest = join(ASSETS, to)

  if (!existsSync(src)) {
    missing.push(from)
    continue
  }

  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  copied++
}

console.log(`\n  Copied ${copied}/${Object.keys(MAP).length} assets into src/assets`)

if (missing.length) {
  console.warn(`\n  Not found in uploads (${missing.length}):`)
  for (const m of missing) console.warn(`    - ${m}`)
}

console.log('')
