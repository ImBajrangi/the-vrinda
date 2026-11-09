/**
 * Vrindopnisad 2.0 - Isolated Worker Memory Benchmark
 * Simulates Cloudflare Pages Functions isolate startup, JSON data loading,
 * Map initialization (43,597 padas + 781 chapters + 131 saints + 29 granthas),
 * and measures exact peak heap and headroom against the 128 MB limit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function measureWorkerMemory() {
  const initial = process.memoryUsage().heapUsed;

  const catalogPath = path.resolve(projectRoot, 'public/data/catalog.json');
  const snippetsPath = path.resolve(projectRoot, 'public/data/epics/chapter-snippets.json');
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');

  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf-8'));
  const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
  const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));

  const PADA_MAP = new Map();
  for (const item of cat.items) {
    PADA_MAP.set(item[0], {
      title: item[1],
      author: cat.authors[item[3]] || 'रसिक संत',
      grantha: cat.cols[item[2]] || '',
    });
  }

  const GRANTHAS_MAP = new Map();
  for (const g of granthas) {
    GRANTHAS_MAP.set(g.id, g);
    if (g.slug && g.slug !== g.id) GRANTHAS_MAP.set(g.slug, g);
  }

  const SAINTS_MAP = new Map();
  for (const s of saints) {
    if (s.slug) SAINTS_MAP.set(s.slug, s);
    if (s.nameEng) SAINTS_MAP.set(s.nameEng.toLowerCase().replace(/[^a-z0-9]+/g, '-'), s);
    if (s.name) SAINTS_MAP.set(s.name, s);
  }

  const peak = process.memoryUsage().heapUsed;
  const runtimeHeapMb = ((peak - initial) / 1024 / 1024).toFixed(2);
  const totalHeapMb = (peak / 1024 / 1024).toFixed(2);
  const headroomMb = (128 - parseFloat(totalHeapMb)).toFixed(2);

  return { runtimeHeapMb, totalHeapMb, headroomMb };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = measureWorkerMemory();
  console.log(JSON.stringify(res));
}

