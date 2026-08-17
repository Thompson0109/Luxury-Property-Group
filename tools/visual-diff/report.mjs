import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const pct = (n) => `${(n * 100).toFixed(2)}%`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const severity = (ratio) => (ratio >= 0.15 ? 'high' : ratio >= 0.05 ? 'mid' : 'low');

function worklistRows(results) {
  // One row per section per breakpoint, heaviest first. This is the
  // artefact the whole harness exists to produce.
  const rows = [];
  for (const r of results) {
    for (const s of r.sections) {
      rows.push({
        route: r.route,
        breakpoint: r.breakpoint,
        sectionIndex: s.sectionIndex,
        label: s.label,
        pixels: s.pixels,
        ratio: s.worstBandRatio,
        anchor: `${r.route}-${r.breakpoint}`,
        y: s.worstBandTop,
      });
    }
  }
  return rows.sort((a, b) => b.pixels - a.pixels).slice(0, 60);
}

export async function writeReport(results, config) {
  const ordered = [...results].sort((a, b) => b.diffRatio - a.diffRatio);
  const worklist = worklistRows(results);

  const overall = results.length
    ? results.reduce((acc, r) => acc + r.diffRatio, 0) / results.length
    : 0;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visual diff — Elegant Address</title>
<style>
  :root {
    --bg: #14161a; --panel: #1c1f25; --line: #2c313a;
    --ink: #e6e9ee; --muted: #8b94a3;
    --high: #e5484d; --mid: #f5a524; --low: #46a758;
    --mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  header {
    padding: 24px 32px; border-bottom: 1px solid var(--line);
    display: flex; align-items: baseline; gap: 24px; flex-wrap: wrap;
  }
  h1 { font-size: 16px; margin: 0; font-weight: 600; letter-spacing: 0.02em; }
  .meta { color: var(--muted); font-family: var(--mono); font-size: 12px; }
  main { padding: 32px; max-width: 1600px; }
  h2 {
    font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--muted); font-weight: 600; margin: 40px 0 12px;
  }
  h2:first-of-type { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 12px; }
  th {
    text-align: left; color: var(--muted); font-weight: 500;
    padding: 8px 12px; border-bottom: 1px solid var(--line); white-space: nowrap;
  }
  td { padding: 7px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tr:hover td { background: #1a1d23; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .label { font-family: system-ui, sans-serif; max-width: 340px; }
  .bar { height: 3px; border-radius: 2px; background: var(--line); position: relative; min-width: 60px; }
  .bar > i { position: absolute; inset: 0 auto 0 0; border-radius: 2px; display: block; }
  .high > i { background: var(--high); } .mid > i { background: var(--mid); } .low > i { background: var(--low); }
  .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 7px; }
  .dot.high { background: var(--high); } .dot.mid { background: var(--mid); } .dot.low { background: var(--low); }
  details { border: 1px solid var(--line); border-radius: 6px; margin-bottom: 10px; background: var(--panel); }
  summary {
    padding: 12px 16px; cursor: pointer; display: flex; align-items: center;
    gap: 16px; font-family: var(--mono); font-size: 12px; list-style: none;
  }
  summary::-webkit-details-marker { display: none; }
  summary::before { content: '▸'; color: var(--muted); }
  details[open] summary::before { content: '▾'; }
  summary .grow { flex: 1; }
  .body { padding: 0 16px 16px; }
  .viewer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .frame { border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: #0e1013; }
  .frame figcaption {
    padding: 6px 10px; font-family: var(--mono); font-size: 11px;
    color: var(--muted); border-bottom: 1px solid var(--line);
  }
  .frame img { display: block; width: 100%; height: auto; }
  .scroll { max-height: 620px; overflow: auto; }
  .flag { color: var(--high); }
  .ok { color: var(--muted); }
  code { font-family: var(--mono); color: var(--muted); }
  .note { color: var(--muted); font-size: 12px; margin: 0 0 16px; max-width: 70ch; }
</style>
</head>
<body>
<header>
  <h1>Visual diff — Elegant Address</h1>
  <span class="meta">${esc(config.targets.reference.name)} <code>${esc(config.targets.reference.baseUrl)}</code></span>
  <span class="meta">${esc(config.targets.candidate.name)} <code>${esc(config.targets.candidate.baseUrl)}</code></span>
  <span class="meta">mean divergence ${pct(overall)} · ${results.length} captures · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
</header>
<main>

<h2>Worklist — sections by differing pixels</h2>
<p class="note">Ranked by absolute differing pixel count, so a large wrong area outranks a small one.
Section indices map to <code>sections[n]</code> in <code>pages.json</code> for the named route.</p>
<table>
  <thead><tr>
    <th>Route</th><th>Breakpoint</th><th class="num">§</th><th>Heading</th>
    <th class="num">Peak band</th><th class="num">Pixels</th><th class="num">y</th><th style="width:120px"></th>
  </tr></thead>
  <tbody>
  ${worklist.map((w) => {
    const sev = severity(w.ratio);
    return `<tr>
      <td>${esc(w.route)}</td>
      <td class="ok">${esc(w.breakpoint)}</td>
      <td class="num">${w.sectionIndex ?? '—'}</td>
      <td class="label"><span class="dot ${sev}"></span>${esc(w.label)}</td>
      <td class="num">${pct(w.ratio)}</td>
      <td class="num">${w.pixels.toLocaleString()}</td>
      <td class="num ok">${w.y}</td>
      <td><span class="bar ${sev}"><i style="width:${Math.min(100, w.ratio * 100 * 3).toFixed(1)}%"></i></span></td>
    </tr>`;
  }).join('\n')}
  </tbody>
</table>

<h2>Captures</h2>
${ordered.map((r) => {
  const sev = severity(r.diffRatio);
  const flagged = r.geometry.filter((g) => g.flagged);
  return `
<details id="${esc(r.route)}-${esc(r.breakpoint)}">
  <summary>
    <span class="dot ${sev}"></span>
    <strong>${esc(r.route)}</strong>
    <span class="ok">${esc(r.breakpoint)} · ${r.width}px</span>
    <span class="grow"></span>
    <span>${pct(r.diffRatio)} differing</span>
    <span class="ok">Δheight ${r.heightDelta > 0 ? '+' : ''}${r.heightDelta}px</span>
    <span class="${r.sectionCountDelta === 0 ? 'ok' : 'flag'}">Δsections ${r.sectionCountDelta > 0 ? '+' : ''}${r.sectionCountDelta}</span>
  </summary>
  <div class="body">
    <div class="viewer">
      <figure class="frame"><figcaption>${esc(config.targets.reference.name)}</figcaption>
        <div class="scroll"><img loading="lazy" src="${esc(r.files.reference)}" alt=""></div></figure>
      <figure class="frame"><figcaption>${esc(config.targets.candidate.name)}</figcaption>
        <div class="scroll"><img loading="lazy" src="${esc(r.files.candidate)}" alt=""></div></figure>
      <figure class="frame"><figcaption>Diff</figcaption>
        <div class="scroll"><img loading="lazy" src="${esc(r.files.diff)}" alt=""></div></figure>
    </div>

    <h2>Section geometry</h2>
    <p class="note">${flagged.length
      ? `${flagged.length} of ${r.geometry.length} sections flagged. Vertical drift over ${config.geometryTolerance}px, or a text-align mismatch.`
      : 'No geometry flags at this breakpoint.'}</p>
    <table>
      <thead><tr>
        <th class="num">§</th><th>Heading (${esc(config.targets.candidate.name)})</th>
        <th class="num">ref top</th><th class="num">cand top</th><th class="num">Δtop</th><th class="num">Δheight</th>
        <th>align ref → cand</th><th>padding ref → cand</th>
      </tr></thead>
      <tbody>
      ${r.geometry.map((g) => `<tr>
        <td class="num">${g.index}</td>
        <td class="label">${esc(g.candidateLabel)}</td>
        <td class="num ok">${g.referenceTop ?? '—'}</td>
        <td class="num ok">${g.candidateTop ?? '—'}</td>
        <td class="num ${g.topDelta !== null && Math.abs(g.topDelta) > config.geometryTolerance ? 'flag' : 'ok'}">${g.topDelta ?? '—'}</td>
        <td class="num ok">${g.heightDelta ?? '—'}</td>
        <td class="${g.alignMismatch ? 'flag' : 'ok'}">${esc(g.referenceAlign)} → ${esc(g.candidateAlign)}</td>
        <td class="ok">${esc(g.referencePadding)} → ${esc(g.candidatePadding)}</td>
      </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</details>`;
}).join('\n')}

</main>
</body>
</html>`;

  const file = path.join(config.outDir, 'index.html');
  await writeFile(file, html, 'utf8');
  return file;
}
