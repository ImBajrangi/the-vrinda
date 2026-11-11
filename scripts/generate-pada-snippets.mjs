/**
 * Vrindopnisad 2.0 - Rasik Pada Snippets & Verse Previews Index Generator
 * Extracts title, author, collection, and authentic Devanagari opening verses for all 11,909 non-epic padas
 * for instantaneous Edge HTML Rewriter SEO injection and elimination of thin-content soft 404s.
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
  console.log('🌸 Generating Authentic Pada Snippets for all Rasik Padas...');
  const granthasDir = path.resolve(projectRoot, 'public/data/granthas');
  if (!fs.existsSync(granthasDir)) {
    console.warn('  ⚠ granthas directory not found at:', granthasDir);
    return;
  }

  const files = fs.readdirSync(granthasDir).filter(
    (f) => f.endsWith('.json') && !EPIC_IDS.has(f.replace('.json', ''))
  );

  const snippets = {};
  let padaCount = 0;

  for (const f of files) {
    const granthaId = f.replace('.json', '');
    const granthaPath = path.join(granthasDir, f);
    try {
      const padas = JSON.parse(fs.readFileSync(granthaPath, 'utf-8'));
      for (const p of padas) {
        const slug = p.slug || p.id;
        let lines = [];
        if (p.verses && Array.isArray(p.verses) && p.verses.length > 0) {
          const firstVerse = p.verses[0];
          if (Array.isArray(firstVerse.linesDevanagari)) {
            lines = firstVerse.linesDevanagari.slice(0, 4);
          }
        }

        const openingText = lines.length > 0 ? lines.join('\n') : '';
        // Compact tuple: [titleDev, author, granthaId, openingVerse]
        snippets[slug] = [
          p.titleDevanagari || slug,
          p.author || 'रसिक संत',
          granthaId,
          openingText,
        ];
        padaCount++;
      }
    } catch (err) {
      console.warn(`  ⚠ Error reading grantha file ${f}:`, err.message);
    }
  }

  const jsonStr = JSON.stringify(snippets);

  // Write to src/data/padaSnippets.json for Cloudflare Functions & SSR
  const srcDest = path.resolve(projectRoot, 'src/data/padaSnippets.json');
  fs.writeFileSync(srcDest, jsonStr, 'utf-8');

  // Write to public/data/pada-snippets.json
  const publicDest = path.resolve(projectRoot, 'public/data/pada-snippets.json');
  fs.writeFileSync(publicDest, jsonStr, 'utf-8');

  console.log(`  ✓ Successfully indexed ${padaCount} authentic Rasik padas (${Math.round(jsonStr.length / 1024)} KB)`);
  console.log('✨ Pada Snippets ready for Edge SEO injection!');
}

generatePadaSnippets();

