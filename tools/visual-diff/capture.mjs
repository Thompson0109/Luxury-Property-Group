import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────────────
//  Stabilisation
//
//  Two sites are only comparable once everything non-deterministic is
//  pinned down. Three classes of noise matter here:
//
//   1. Motion. Salient reveals rows on scroll by toggling classes, so
//      simply zeroing durations would freeze half the page at opacity 0.
//      Durations are zeroed *and* the reveal end-state is forced.
//   2. Video. The YouTube backgrounds will never agree frame-for-frame,
//      so every video and iframe is hidden on both sides. What remains
//      is the row background underneath — which is what you want to
//      compare anyway.
//   3. Carets and focus rings, which blink.
// ─────────────────────────────────────────────────────────────────────
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }

  /* Force scroll-gated reveals into their end state. */
  .wpb_animate_when_almost_visible,
  .animated-in,
  .nectar-waypoint-el,
  [data-animation],
  [class*="reveal"],
  [class*="fade-in"] {
    opacity: 1 !important;
    transform: none !important;
    visibility: visible !important;
  }

  /* Media that cannot be made deterministic. */
  video, iframe,
  .nectar-video-wrap,
  .nectar-parallax-scene,
  [class*="video-bg"] {
    visibility: hidden !important;
  }

  *:focus, *:focus-visible { outline: none !important; }
`;

/**
 * Walks the page top to bottom to trigger lazy loading and any
 * scroll-gated behaviour, then returns to the top.
 */
async function scrollThrough(page, step = 600) {
  await page.evaluate(async (stepPx) => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    const max = () => document.documentElement.scrollHeight;
    while (y < max()) {
      window.scrollTo(0, y);
      await wait(60);
      y += stepPx;
    }
    window.scrollTo(0, max());
    await wait(200);
    window.scrollTo(0, 0);
    await wait(120);
  }, step);
}

/**
 * Reads section geometry off the rendered page. Nested rows are dropped
 * so WPBakery inner rows do not inflate the count against React's flat
 * `.section` list.
 */
async function readGeometry(page, selector) {
  return page.evaluate((sel) => {
    const all = Array.from(document.querySelectorAll(sel));
    const topLevel = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));

    return topLevel.map((el, index) => {
      const rect = el.getBoundingClientRect();
      const heading = el.querySelector('h1, h2, h3, h4');
      const label = (heading?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const styles = getComputedStyle(el);

      return {
        index,
        label: label || '(no heading)',
        top: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height),
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        textAlign: styles.textAlign,
        backgroundColor: styles.backgroundColor,
      };
    });
  }, selector);
}

/**
 * Captures one target at one route and one breakpoint.
 * Returns the screenshot path plus the section geometry.
 */
export async function captureOne(browser, { target, route, breakpoint, config }) {
  const url = target.baseUrl.replace(/\/$/, '') +
    (target.key === 'reference' ? route.referencePath : route.candidatePath);

  const context = await browser.newContext({
    viewport: { width: breakpoint.width, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    // A stable UA keeps any server-side device sniffing from diverging.
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  } catch {
    // networkidle can never settle on pages with polling or ad scripts.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  }

  await page.addStyleTag({ content: FREEZE_CSS });
  await scrollThrough(page);

  // Re-inject: the scroll pass may have caused scripts to add nodes or
  // inline styles that the first injection could not have reached.
  await page.addStyleTag({ content: FREEZE_CSS });

  await page.evaluate(() => document.fonts?.ready);
  await page.evaluate(async () => {
    const imgs = Array.from(document.images).filter((i) => !i.complete);
    await Promise.all(
      imgs.map((i) => new Promise((res) => {
        i.addEventListener('load', res, { once: true });
        i.addEventListener('error', res, { once: true });
      })),
    );
  });
  await page.waitForTimeout(config.settleMs);

  const geometry = await readGeometry(page, target.sectionSelector);

  const dir = path.join(config.outDir, 'shots', route.name, breakpoint.name);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${target.key}.png`);

  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });

  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  await context.close();

  return { file, geometry, url, documentHeight, consoleErrors };
}
