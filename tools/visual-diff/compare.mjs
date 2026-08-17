import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Padding colour for the region where one capture is taller than the
// other. Both images are padded identically, so padding-against-padding
// is silent and only padding-against-content registers.
//
// It has to be a colour the site can never itself produce: white would
// go undetected against a page whose tail is white, which is the exact
// case where a height mismatch matters most.
const PAD = { r: 255, g: 0, b: 255, a: 255 };

/**
 * Re-lays an RGBA buffer onto a larger canvas, top-left anchored.
 */
function padTo(png, width, height) {
  if (png.width === width && png.height === height) return png.data;

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = PAD.r;
    out[i + 1] = PAD.g;
    out[i + 2] = PAD.b;
    out[i + 3] = PAD.a;
  }

  const copyWidth = Math.min(png.width, width);
  const copyHeight = Math.min(png.height, height);

  for (let y = 0; y < copyHeight; y += 1) {
    const src = y * png.width * 4;
    const dst = y * width * 4;
    png.data.copy(out, dst, src, src + copyWidth * 4);
  }
  return out;
}

/**
 * Attributes a band to whichever candidate section spans its midpoint,
 * so a band of red pixels becomes "section 3, Our Incredible Founder"
 * rather than "y = 3240".
 */
function sectionAt(geometry, y) {
  return geometry.find((s) => y >= s.top && y < s.top + s.height) ?? null;
}

/**
 * Compares two captures, writing a diff PNG and returning per-band stats
 * sorted so the worst offenders come first.
 */
export async function compareCaptures({ reference, candidate, route, breakpoint, config }) {
  const [refPng, candPng] = await Promise.all([
    readFile(reference.file).then((b) => PNG.sync.read(b)),
    readFile(candidate.file).then((b) => PNG.sync.read(b)),
  ]);

  const width = Math.max(refPng.width, candPng.width);
  const height = Math.max(refPng.height, candPng.height);

  const refData = padTo(refPng, width, height);
  const candData = padTo(candPng, width, height);

  const diff = new PNG({ width, height });

  // Diffing band by band gives per-band counts for free: the RGBA buffer
  // is row-major, so a band is a contiguous subarray. One pass, both the
  // composite diff image and the localised stats.
  const bands = [];
  let totalDiff = 0;

  for (let top = 0; top < height; top += config.bandHeight) {
    const bandHeight = Math.min(config.bandHeight, height - top);
    const start = top * width * 4;
    const end = start + bandHeight * width * 4;

    const count = pixelmatch(
      refData.subarray(start, end),
      candData.subarray(start, end),
      diff.data.subarray(start, end),
      width,
      bandHeight,
      { threshold: config.threshold, includeAA: false, alpha: 0.08 },
    );

    totalDiff += count;
    const ratio = count / (width * bandHeight);

    if (ratio >= config.bandNoiseFloor) {
      const section = sectionAt(candidate.geometry, top + bandHeight / 2);
      bands.push({
        top,
        height: bandHeight,
        ratio: Number(ratio.toFixed(4)),
        pixels: count,
        sectionIndex: section?.index ?? null,
        sectionLabel: section?.label ?? '(beyond last section)',
      });
    }
  }

  const dir = path.join(config.outDir, 'shots', route.name, breakpoint.name);
  await mkdir(dir, { recursive: true });
  const diffFile = path.join(dir, 'diff.png');
  await writeFile(diffFile, PNG.sync.write(diff));

  // Roll bands up per section so the worklist is expressed in the same
  // units as pages.json rather than in pixels.
  const bySection = new Map();
  for (const band of bands) {
    const key = band.sectionIndex ?? -1;
    const entry = bySection.get(key) ?? {
      sectionIndex: band.sectionIndex,
      label: band.sectionLabel,
      pixels: 0,
      bandCount: 0,
      worstBandTop: band.top,
      worstBandRatio: 0,
    };
    entry.pixels += band.pixels;
    entry.bandCount += 1;
    if (band.ratio > entry.worstBandRatio) {
      entry.worstBandRatio = band.ratio;
      entry.worstBandTop = band.top;
    }
    bySection.set(key, entry);
  }

  const sections = [...bySection.values()].sort((a, b) => b.pixels - a.pixels);

  return {
    route: route.name,
    title: route.title,
    breakpoint: breakpoint.name,
    width,
    height,
    diffRatio: Number((totalDiff / (width * height)).toFixed(4)),
    diffPixels: totalDiff,
    heightDelta: candidate.documentHeight - reference.documentHeight,
    sectionCountDelta: candidate.geometry.length - reference.geometry.length,
    geometry: alignGeometry(reference.geometry, candidate.geometry, config),
    bands: bands.sort((a, b) => b.ratio - a.ratio),
    sections,
    files: {
      reference: path.relative(config.outDir, reference.file),
      candidate: path.relative(config.outDir, candidate.file),
      diff: path.relative(config.outDir, diffFile),
    },
    consoleErrors: {
      reference: reference.consoleErrors,
      candidate: candidate.consoleErrors,
    },
  };
}

/**
 * Pairs sections by index and reports vertical drift. Cumulative offset
 * error is the tell for padding that is wrong by a small amount in many
 * places — it compounds down the page and is nearly invisible in a
 * single screenshot.
 */
function alignGeometry(refGeometry, candGeometry, config) {
  const rows = [];
  const max = Math.max(refGeometry.length, candGeometry.length);

  for (let i = 0; i < max; i += 1) {
    const ref = refGeometry[i] ?? null;
    const cand = candGeometry[i] ?? null;
    const topDelta = ref && cand ? cand.top - ref.top : null;
    const heightDelta = ref && cand ? cand.height - ref.height : null;

    rows.push({
      index: i,
      referenceLabel: ref?.label ?? '—',
      candidateLabel: cand?.label ?? '—',
      referenceTop: ref?.top ?? null,
      candidateTop: cand?.top ?? null,
      topDelta,
      heightDelta,
      referenceAlign: ref?.textAlign ?? null,
      candidateAlign: cand?.textAlign ?? null,
      alignMismatch: Boolean(ref && cand && ref.textAlign !== cand.textAlign),
      referenceBg: ref?.backgroundColor ?? null,
      candidateBg: cand?.backgroundColor ?? null,
      referencePadding: ref ? `${ref.paddingTop} / ${ref.paddingBottom}` : null,
      candidatePadding: cand ? `${cand.paddingTop} / ${cand.paddingBottom}` : null,
      flagged:
        (topDelta !== null && Math.abs(topDelta) > config.geometryTolerance) ||
        Boolean(ref && cand && ref.textAlign !== cand.textAlign),
    });
  }

  return rows;
}
