/**
 * Vrindopnisad 2.0 - Epic Chapter Snippet Index Generator
 * Extracts chapter titles, verse counts, authors, and opening verse text for all 781 chapters
 * across the 5 Monumental Epics for instantaneous Edge and SSR content injection.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function generateChapterSnippets() {
  console.log('🌸 Indexing all 781 Epic Chapter Snippets for Edge & SSR...');
  const manifestPath = path.resolve(projectRoot, 'public/data/epics/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn('  ⚠ Epics manifest not found at:', manifestPath);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const snippets = {};
  let chapterCount = 0;

  for (const epic of manifest.epics || []) {
    const epicIndexPath = path.resolve(projectRoot, 'public/data/epics', epic.id, 'index.json');
    if (!fs.existsSync(epicIndexPath)) continue;

    const epicIndex = JSON.parse(fs.readFileSync(epicIndexPath, 'utf-8'));
    for (const ch of epicIndex.chapters || []) {
      const chDataPath = path.resolve(projectRoot, 'public/data/epics', epic.id, ch.file);
      let openingVerse = '';
      if (fs.existsSync(chDataPath)) {
        try {
          const chData = JSON.parse(fs.readFileSync(chDataPath, 'utf-8'));
          if (Array.isArray(chData) && chData[0]?.verses?.[0]?.linesDevanagari) {
            openingVerse = chData[0].verses[0].linesDevanagari.slice(0, 2).join(' • ');
          }
        } catch (e) {
          console.warn(`  ⚠ Error reading ${ch.file}:`, e.message);
        }
      }

      const key = `${epic.id}:${ch.id}`;
      snippets[key] = {
        granthaId: epic.id,
        granthaName: epicIndex.name,
        author: epicIndex.author,
        chapterId: ch.id,
        chapterName: ch.name,
        section: ch.section || 'मूल पाठ',
        verseCount: ch.verseCount || 0,
        openingVerse: openingVerse || `${epicIndex.name} का पावन अध्याय ${ch.name}`,
      };
      chapterCount++;
    }
  }

  const jsonStr = JSON.stringify(snippets, null, 2);

  // Write to public/data/epics/chapter-snippets.json (for CDN and Edge Functions)
  const publicDest = path.resolve(projectRoot, 'public/data/epics/chapter-snippets.json');
  fs.writeFileSync(publicDest, jsonStr, 'utf-8');

  // Write to src/data/chapterSnippets.json (for build-time SSR entry-server)
  const srcDest = path.resolve(projectRoot, 'src/data/chapterSnippets.json');
  fs.writeFileSync(srcDest, jsonStr, 'utf-8');

  // Also write to dist/data/epics/ if dist exists
  const distEpicsDir = path.resolve(projectRoot, 'dist/data/epics');
  if (fs.existsSync(distEpicsDir)) {
    fs.writeFileSync(path.resolve(distEpicsDir, 'chapter-snippets.json'), jsonStr, 'utf-8');
  }

  console.log(`  ✓ Successfully indexed ${chapterCount} chapters (${Math.round(jsonStr.length / 1024)} KB)`);
  console.log('✨ Chapter Snippets ready for instantaneous Edge & SSR response!');
}

generateChapterSnippets();
