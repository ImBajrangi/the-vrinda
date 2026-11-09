/**
 * Vrindopnisad 2.0 - Epic Scripture Chunking Engine
 * Segregates monumental Sanatan epics (Valmiki Ramayana, Bhagavatam, Ramcharitmanas, Gita, Durga Saptashati)
 * into lightweight, on-demand chapter/sarga chunks (~15 KB to 35 KB) to eliminate delivery lag
 * and bandwidth overhead on low-end and high-end mobile devices.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const epicsConfig = [
  { id: 'valmiki-ramayana', name: 'श्रीमद् वाल्मीकि रामायण', author: 'महर्षि वाल्मीकि', description: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के दिव्य चरित्र का अमर महाकाव्य' },
  { id: 'shrimad-bhagavatam', name: 'श्रीमद् भागवत महापुराण', author: 'महर्षि वेदव्यास', description: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा' },
  { id: 'ramcharitmanas', name: 'श्री रामचरितमानस', author: 'गोस्वामी तुलसीदास', description: 'कलयुग तारक प्रभु श्री राम के पावन चरित्र का अवधी महाकाव्य' },
  { id: 'bhagavad-gita', name: 'श्रीमद्भगवद्गीता', author: 'महर्षि वेदव्यास', description: 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया आत्मज्ञान' },
  { id: 'durga-saptashati', name: 'श्री दुर्गा सप्तशती', author: 'महर्षि मार्कण्डेय', description: 'मार्कण्डेय पुराणान्तर्गत आदिशक्ति माँ भगवती के प्राकट्य व महात्म्य की पवित्र सप्तशती' }
];

export function splitEpicChunks() {
  console.log('🌸 Partitioning Monumental Sanatan Epics into On-Demand Chunks...');

  const sourceDataDir = path.resolve(projectRoot, 'public/data/granthas');
  const targetEpicsBaseDir = path.resolve(projectRoot, 'public/data/epics');
  fs.mkdirSync(targetEpicsBaseDir, { recursive: true });

  const manifestEpics = [];

  for (const epic of epicsConfig) {
    const sourceFile = path.resolve(sourceDataDir, `${epic.id}.json`);
    if (!fs.existsSync(sourceFile)) {
      console.warn(`⚠️ Warning: Source file ${sourceFile} not found. Skipping ${epic.id}.`);
      continue;
    }

    const epicData = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
    const targetEpicDir = path.resolve(targetEpicsBaseDir, epic.id);
    fs.mkdirSync(targetEpicDir, { recursive: true });

    // Filter out mismatched non-epic verses if any (e.g. scraped brajrasik articles with keyword 'भागवत')
    const validData = epicData.filter((pad) => {
      if (epic.id === 'shrimad-bhagavatam') {
        const auth = pad.author || '';
        const title = pad.titleDevanagari || '';
        if (auth.includes('भगवत रसिक') || auth.includes('विहारीवल्लभ') || title.includes('भगवत रसिक')) {
          return false;
        }
      }
      return true;
    });

    // Group padas by chapterId (or chapterName)
    const chapterMap = new Map();
    validData.forEach((pad, idx) => {
      const chId = pad.chapterId || `chapter-${idx + 1}`;
      const chName = pad.chapterName || `अध्याय ${idx + 1}`;
      if (!chapterMap.has(chId)) {
        chapterMap.set(chId, {
          id: chId,
          name: chName,
          padas: []
        });
      }
      chapterMap.get(chId).padas.push(pad);
    });

    const chaptersIndex = [];
    let fileCounter = 0;

    for (const [chId, chObj] of chapterMap.entries()) {
      fileCounter++;
      // Clean safe filename using index and sanitized slug
      const safeId = chId
        .replace(/[^a-zA-Z0-9_\-\u0900-\u097F]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 45);
      const fileName = `ch-${String(fileCounter).padStart(3, '0')}-${safeId}.json`;
      const filePath = path.resolve(targetEpicDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(chObj.padas, null, 2), 'utf-8');

      // Extract section (Kanda or Skandha) from chapter name if present
      const nameParts = chObj.name.split(/[,:]/);
      const sectionName = nameParts.length > 1 ? nameParts[0].trim() : 'मूल पाठ';

      chaptersIndex.push({
        id: chObj.id,
        name: chObj.name,
        section: sectionName,
        verseCount: chObj.padas.length,
        file: fileName,
        firstPadId: chObj.padas[0]?.id,
        firstPadSlug: chObj.padas[0]?.slug
      });
    }

    // Write index.json for this epic
    const epicIndexData = {
      id: epic.id,
      name: epic.name,
      author: epic.author,
      description: epic.description,
      totalVerses: validData.length,
      totalChapters: chaptersIndex.length,
      chapters: chaptersIndex
    };

    fs.writeFileSync(
      path.resolve(targetEpicDir, 'index.json'),
      JSON.stringify(epicIndexData, null, 2),
      'utf-8'
    );

    console.log(`  ✓ ${epic.name} (${epic.id}): Split into ${chaptersIndex.length} on-demand chapter chunks (${validData.length} total verses)`);

    manifestEpics.push({
      id: epic.id,
      name: epic.name,
      author: epic.author,
      description: epic.description,
      totalVerses: validData.length,
      totalChapters: chaptersIndex.length,
      indexPath: `/data/epics/${epic.id}/index.json`
    });
  }

  // Write master epics manifest.json
  fs.writeFileSync(
    path.resolve(targetEpicsBaseDir, 'manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      epicsCount: manifestEpics.length,
      epics: manifestEpics
    }, null, 2),
    'utf-8'
  );

  console.log('✨ All Sanatan Mahagranth chunks generated successfully!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  splitEpicChunks();
}

