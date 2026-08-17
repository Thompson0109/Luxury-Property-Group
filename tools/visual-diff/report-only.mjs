import { readFile } from 'node:fs/promises';
import path from 'node:path';
import config from './config.mjs';
import { writeReport } from './report.mjs';

const data = JSON.parse(await readFile(path.join(config.outDir, 'results.json'), 'utf8'));
console.log(`Rebuilt from ${data.results.length} captures taken ${data.generatedAt}`);
console.log(await writeReport(data.results, config));