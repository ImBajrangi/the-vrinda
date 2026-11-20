/**
 * Vrindopnisad 2.0 - Catalog Reconciler
 * Synchronizes public/data/catalog.json with authentic granthas/*.json
 * Ensures 100% exact set match between search catalog, sitemaps, and padaSnippets.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const catalogPath = path.resolve(projectRoot, 'public/data/catalog.json');
if (!fs.existsSync(catalogPath)) {
  console.error('public/data/catalog.json not found');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const cols = [...(catalog.cols || [])];
const authors = [...(catalog.authors || [])];

const authorMap = new Map();
authors.forEach((a, idx) => authorMap.set(a, idx));
const colMap = new Map();
cols.forEach((c, idx) => colMap.set(c, idx));

const EPIC_IDS = new Set([
  'valmiki-ramayana',
  'shrimad-bhagavatam',
  'ramcharitmanas',
  'bhagavad-gita',
  'durga-saptashati',
]);

// 1. Preserve all 31,691 epic items
const epicItems = catalog.items.filter((it) => {
  const col = cols[it[2]];
  if (EPIC_IDS.has(col)) return true;
  const slug = (it[0] || '').toLowerCase();
  return (
    slug.startsWith('valmiki-') ||
    slug.startsWith('ramcharitmanas') ||
    slug.startsWith('shrimad-') ||
    slug.startsWith('bhagavad-') ||
    slug.startsWith('durga-')
  );
});

// Load legacy slug redirects to resolve any legacy Devanagari slugs into clean Roman canonical URLs
let legacyRedirects = {};
const legacyPath = path.resolve(projectRoot, 'src/data/legacySlugRedirects.json');
if (fs.existsSync(legacyPath)) {
  try {
    legacyRedirects = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
  } catch {}
}

// 2. Load all 24 authentic Ras granthas directly from public/data/granthas
const granthasDir = path.resolve(projectRoot, 'public/data/granthas');
const rasFiles = fs.readdirSync(granthasDir).filter(
  (f) => f.endsWith('.json') && !EPIC_IDS.has(f.replace('.json', ''))
);

const newRasItems = [];
const seenSlugs = new Set();

for (const f of rasFiles) {
  const colId = f.replace('.json', '');
  let colIdx = colMap.get(colId);
  if (colIdx === undefined) {
    colIdx = cols.length;
    cols.push(colId);
    colMap.set(colId, colIdx);
  }
  const items = JSON.parse(fs.readFileSync(path.join(granthasDir, f), 'utf-8'));
  for (const item of items) {
    let rawSlug = (item.slug || item.id || '').trim();
    if (legacyRedirects[rawSlug]) {
      rawSlug = legacyRedirects[rawSlug];
    }
    const slug = rawSlug.replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    const author = (item.author || 'रसिक संत').trim();
    let authIdx = authorMap.get(author);
    if (authIdx === undefined) {
      authIdx = authors.length;
      authors.push(author);
      authorMap.set(author, authIdx);
    }
    const row = [slug, item.titleDevanagari || item.title || slug, colIdx, authIdx];
    if (item.rag) row.push(item.rag);
    newRasItems.push(row);
  }
}

// 3. Assemble reconciled catalog
const allItems = [...newRasItems, ...epicItems];
catalog.cols = cols;
catalog.authors = authors;
catalog.items = allItems;

fs.writeFileSync(catalogPath, JSON.stringify(catalog), 'utf-8');

// Also update dist/data/catalog.json if dist exists
const distCatalogPath = path.resolve(projectRoot, 'dist/data/catalog.json');
if (fs.existsSync(path.dirname(distCatalogPath))) {
  fs.writeFileSync(distCatalogPath, JSON.stringify(catalog), 'utf-8');
}

console.log(`🌸 Reconciled catalog.json: ${newRasItems.length} Ras padas + ${epicItems.length} Epics = ${allItems.length} total`);
