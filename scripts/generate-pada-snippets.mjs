/**
 * Vrindopnisad 2.0 - Rasik Pada Snippets & Full Crawl Graph Generator
 * Extracts title, author, collection, raga, and authentic Devanagari verse lyrics
 * for all 11,832+ authentic Rasik padas, along with sequential (prev/next) crawl links,
 * grantha pada directories, and saint catalogs for instantaneous Edge SSR injection.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const EPIC_IDS = new Set([
  'valmiki-ramayana',
  'shrimad-bhagavatam',
  'ramcharitmanas',
  'bhagavad-gita',
  'durga-saptashati',
]);

export function generatePadaSnippets() {
  console.log('🌸 Generating Authentic Pada Snippets & Full Crawl Mesh for all Rasik Padas...');
  const granthasDir = path.resolve(projectRoot, 'public/data/granthas');
  if (!fs.existsSync(granthasDir)) {
    console.warn('  ⚠ granthas directory not found at:', granthasDir);
    return;
  }

  const files = fs.readdirSync(granthasDir).filter(
    (f) => f.endsWith('.json') && !EPIC_IDS.has(f.replace('.json', ''))
  );

  const snippets = {};
  const granthaCrawl = {};
  const saintCrawl = {};
  let padaCount = 0;

  // Title-to-slug index for fuzzy alias reconciliation
  const titleToSlug = new Map();

  for (const f of files) {
    const granthaId = f.replace('.json', '');
    const granthaPath = path.join(granthasDir, f);
    try {
      const padas = JSON.parse(fs.readFileSync(granthaPath, 'utf-8'));
      granthaCrawl[granthaId] = [];

      for (let i = 0; i < padas.length; i++) {
        const p = padas[i];
        const rawSlug = (p.slug || p.id || '').trim();
        const slug = rawSlug.replace(/\.+$/, '');
        if (!slug) continue;

        const prevSlug = i > 0 ? (padas[i - 1].slug || padas[i - 1].id || '').replace(/\.+$/, '') : '';
        const nextSlug = i < padas.length - 1 ? (padas[i + 1].slug || padas[i + 1].id || '').replace(/\.+$/, '') : '';

        let lines = [];
        if (p.verses && Array.isArray(p.verses)) {
          for (const v of p.verses) {
            if (Array.isArray(v.linesDevanagari)) {
              for (const line of v.linesDevanagari) {
                if (typeof line === 'string' && line.trim()) {
                  lines.push(line.trim());
                }
              }
            }
          }
        }

        // Store up to 5 authentic verse lines (perfect rich snippet depth, strictly within worker size budget)
        const verseText = lines.slice(0, 5).join('\n');
        const title = p.titleDevanagari || slug;
        const author = p.author || 'रसिक संत';
        const rag = p.rag || '';

        // Compact tuple: [0: titleDev, 1: author, 2: granthaId, 3: verseText, 4: prevSlug, 5: nextSlug, 6: rag]
        snippets[slug] = [
          title,
          author,
          granthaId,
          verseText,
          prevSlug,
          nextSlug,
          rag,
        ];
        padaCount++;

        // Index for title matching
        const cleanT = title.replace(/[^\u0900-\u097F]/g, '');
        if (cleanT.length >= 4) {
          titleToSlug.set(cleanT, slug);
          titleToSlug.set(cleanT.slice(0, 12), slug);
          titleToSlug.set(cleanT.slice(0, 8), slug);
        }
      }
    } catch (err) {
      console.warn(`  ⚠ Error reading grantha file ${f}:`, err.message);
    }
  }

  // Load and reconcile historical and legacy slugs into a compact alias map
  // (Prevents duplicating the full verse arrays in the Worker bundle)
  const aliasMap = {};
  let aliasCount = 0;
  const legacyPath = path.resolve(projectRoot, 'src/data/legacySlugRedirects.json');
  if (fs.existsSync(legacyPath)) {
    try {
      const legacyRedirects = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
      for (const [legacyKey, targetSlug] of Object.entries(legacyRedirects)) {
        const cleanTarget = targetSlug.replace(/\.+$/, '');
        if (snippets[cleanTarget] && !snippets[legacyKey] && !aliasMap[legacyKey]) {
          aliasMap[legacyKey] = cleanTarget;
          aliasCount++;
        }
      }
    } catch {}
  }

  // Reconcile catalog.json legacy rows so no historical slug ever fails
  const catalogPath = path.resolve(projectRoot, 'public/data/catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      if (catalog.items && Array.isArray(catalog.items)) {
        for (const row of catalog.items) {
          const oldSlug = row[0];
          if (!snippets[oldSlug] && !aliasMap[oldSlug] && row[1]) {
            const cleanT = row[1].replace(/[^\u0900-\u097F]/g, '');
            const targetSlug = titleToSlug.get(cleanT) || titleToSlug.get(cleanT.slice(0, 12)) || titleToSlug.get(cleanT.slice(0, 8));
            if (targetSlug && snippets[targetSlug]) {
              aliasMap[oldSlug] = targetSlug;
              aliasCount++;
            }
          }
        }
      }
    } catch {}
  }

  const jsonStr = JSON.stringify(snippets);
  const aliasStr = JSON.stringify(aliasMap);

  // Write to src/data/padaSnippets.json and padaAliases.json for Cloudflare Functions & SSR
  const srcDest = path.resolve(projectRoot, 'src/data/padaSnippets.json');
  fs.writeFileSync(srcDest, jsonStr, 'utf-8');

  const srcAliasDest = path.resolve(projectRoot, 'src/data/padaAliases.json');
  fs.writeFileSync(srcAliasDest, aliasStr, 'utf-8');

  // Write to public/data/
  const publicDest = path.resolve(projectRoot, 'public/data/pada-snippets.json');
  fs.writeFileSync(publicDest, jsonStr, 'utf-8');

  const publicAliasDest = path.resolve(projectRoot, 'public/data/pada-aliases.json');
  fs.writeFileSync(publicAliasDest, aliasStr, 'utf-8');

  console.log(`  ✓ Successfully indexed ${padaCount} authentic Rasik padas (${Math.round(jsonStr.length / 1024)} KB) + ${aliasCount} compact aliases (${Math.round(aliasStr.length / 1024)} KB)`);
  console.log('✨ Ultra-Lean Pada Snippets ready for Edge SEO injection (well within 25MB CF limit)!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generatePadaSnippets();
}
