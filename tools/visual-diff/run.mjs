import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import config from './config.mjs';
import { captureOne } from './capture.mjs';
import { preflight } from './preflight.mjs';
import { compareCaptures } from './compare.mjs';
import { writeReport } from './report.mjs';

function parseArgs(argv) {
  const args = {};
  for (const item of argv.slice(2)) {
    const [key, value] = item.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

const args = parseArgs(process.argv);

const routes = args.routes
  ? config.routes.filter((r) => String(args.routes).split(',').includes(r.name))
  : config.routes;

const breakpoints = args.bp
  ? config.breakpoints.filter((b) => String(args.bp).split(',').includes(b.name))
  : config.breakpoints;

if (!routes.length) {
  console.error(`No routes matched. Available: ${config.routes.map((r) => r.name).join(', ')}`);
  process.exit(1);
}

const pct = (n) => `${(n * 100).toFixed(2)}%`;

async function main() {
  await mkdir(config.outDir, { recursive: true });

  // Confirm the candidate is up and is serving current code before
  // spending four minutes measuring it.
  let serving;
  try {
    serving = await preflight(config);
  } catch (error) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }

  // One browser for the whole run, but not a single point of failure: a
  // renderer crash on one capture used to take the other 31 with it,
  // since every subsequent newContext() throws on a dead browser. A run
  // that loses one page should still return 31 usable measurements.
  let browser = await chromium.launch();

  async function withLiveBrowser(work) {
    try {
      return await work(browser);
    } catch (error) {
      if (browser.isConnected()) throw error;

      console.log('        browser died — relaunching and retrying once');
      try { await browser.close(); } catch { /* already gone */ }
      browser = await chromium.launch();
      return work(browser);
    }
  }

  const results = [];
  const failures = [];
  const total = routes.length * breakpoints.length;
  let done = 0;

  console.log(
    `Comparing ${config.targets.candidate.baseUrl}  — ${serving}\n` +
    `     against ${config.targets.reference.baseUrl}\n` +
    `${routes.length} routes × ${breakpoints.length} breakpoints = ${total} captures\n`,
  );

  for (const route of routes) {
    for (const breakpoint of breakpoints) {
      const tag = `${route.name} @ ${breakpoint.name}`.padEnd(34);
      done += 1;
      try {
        // Sequential rather than parallel: concurrent contexts at
        // different viewport widths make lazy-loading timing erratic,
        // and this is fast enough at 32 captures.
        const reference = await withLiveBrowser((b) => captureOne(b, {
          target: config.targets.reference, route, breakpoint, config,
        }));
        const candidate = await withLiveBrowser((b) => captureOne(b, {
          target: config.targets.candidate, route, breakpoint, config,
        }));

        const result = await compareCaptures({ reference, candidate, route, breakpoint, config });
        results.push(result);

        const worst = result.sections[0];
        console.log(
          `[${String(done).padStart(2)}/${total}] ${tag} ${pct(result.diffRatio).padStart(7)} ` +
          `Δh ${String(result.heightDelta).padStart(6)}px` +
          (worst ? `  worst: §${worst.sectionIndex ?? '?'} ${worst.label}` : ''),
        );
      } catch (error) {
        failures.push({ route: route.name, breakpoint: breakpoint.name, message: error.message });
        console.log(`[${String(done).padStart(2)}/${total}] ${tag} FAILED — ${error.message}`);
      }
    }
  }

  if (browser.isConnected()) await browser.close();

  await writeFile(
    path.join(config.outDir, 'results.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), config: {
      reference: config.targets.reference.baseUrl,
      candidate: config.targets.candidate.baseUrl,
      threshold: config.threshold,
      bandHeight: config.bandHeight,
    }, results, failures }, null, 2),
    'utf8',
  );

  const reportFile = await writeReport(results, config);

  const mean = results.length
    ? results.reduce((a, r) => a + r.diffRatio, 0) / results.length
    : 0;

  if (!results.length) {
    console.log(`\nNo captures succeeded — every one of the ${failures.length} failed.`);
    console.log(`See results.json for the messages; a mean over zero captures is not a number.`);
  } else {
    console.log(`\nMean divergence ${pct(mean)} across ${results.length} captures.`);
  }
  if (failures.length) console.log(`${failures.length} capture(s) failed — see results.json.`);
  console.log(`Report:  ${reportFile}`);
  console.log(`Data:    ${path.join(config.outDir, 'results.json')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
