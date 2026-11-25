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

// Lightweight Devanagari -> ASCII transliterator for Raga & Hub slugs
const DEV_CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};
const DEV_VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'अं': 'am', 'अः': 'ah',
};
const DEV_MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '', '़': '',
};

function devanagariToAsciiSlug(input) {
  if (!input) return '';
  let out = '';
  const chars = Array.from(input.trim());
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (DEV_CONSONANTS[ch]) {
      out += DEV_CONSONANTS[ch];
      // Add inherent 'a' if next is not a matra/virama and not end of word
      if (next && DEV_MATRAS[next] !== undefined) {
        // matra or virama follows
      } else if (next && next !== ' ' && next !== '-' && next !== ',') {
        out += 'a';
      }
    } else if (DEV_VOWELS[ch]) {
      out += DEV_VOWELS[ch];
    } else if (DEV_MATRAS[ch] !== undefined) {
      out += DEV_MATRAS[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    } else if (/[\s\-_/,]+/.test(ch)) {
      out += '-';
    }
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const THEME_DEFINITIONS = [
  {
    slug: 'holi-fag',
    nameDevanagari: 'होली एवं फाग महोत्सव',
    nameEnglish: 'Holi & Fag Mahotsav',
    description: 'श्री धाम वृन्दावन एवं बरसाना की रंगीली होली, फाग, धमार, अबीर-गुलाल और प्रिया-प्रियतम की रसभरी होरी लीला के पावन पद।',
    regex: /होली|होरि|होरी|फाग|फागु|अबीर|गुलाल|पिचकारी|रंग\s*खेल|धमार/,
  },
  {
    slug: 'radhashtami',
    nameDevanagari: 'श्री राधाष्टमी एवं प्राकट्य उत्सव',
    nameEnglish: 'Shri Radhashtami & Prakatya Utsav',
    description: 'भाद्रपद शुक्ल अष्टमी श्री किशोरी जी के पावन प्राकट्य महोत्सव, बरसाना बधाई एवं श्री वृषभानु नन्दिनी की स्तुति के दिव्य पद।',
    regex: /राधाष्टमी|भाद्रपद|बरसाने\s*बधाई|वृषभानु\s*नन्दिनी|वृषभान|कीरति\s*सुता|राधे\s*प्रकट|बधाई/,
  },
  {
    slug: 'jhulan',
    nameDevanagari: 'झूलन एवं हिंडोला महोत्सव',
    nameEnglish: 'Jhulan & Hindola Mahotsav',
    description: 'श्रावण मास के पावन हिंडोला, कुंज-झूलन, पावस ऋतु एवं सुरंग झूला लीला में निबद्ध ब्रज रसिक संतों की मधुर वाणियाँ।',
    regex: /झूल|झूलन|हिंडोर|हिण्डोर|हिंडोला|सावन|पावस|झूला|झूलत/,
  },
  {
    slug: 'sharad-purnima-maharaas',
    nameDevanagari: 'शरद पूर्णिमा एवं महारास',
    nameEnglish: 'Sharad Purnima & Maharaas',
    description: 'शरद पूर्णिमा की उज्ज्वल रात्रि, बंसीवट महारास, वेणु-नाद एवं श्रीराधा-कृष्ण के अखंड रास विलास के प्रामाणिक पद।',
    regex: /शरद|महारास|रास\s*रच|रासमंडल|बंसीवट|पूर्णिमा|वेणु|मुरली\s*बज|रासबिहारी/,
  },
  {
    slug: 'ashtayama-aarti',
    nameDevanagari: 'अष्टयाम सेवा एवं आरती',
    nameEnglish: 'Ashtayama Seva & Aarti',
    description: 'मंगला, श्रृंगार, ग्वाल, राजभोग, उत्थापन, संध्या एवं शयन सहित आठों प्रहर की नित्य अष्टयाम सेवा और आरती के पावन पद।',
    regex: /मंगला|श्रृंगार|ग्वाल|राजभोग|उत्थापन|संध्या|शयन|आरती|अष्टयाम|भोग\s*लगा/,
  },
  {
    slug: 'ekadashi',
    nameDevanagari: 'एकादशी एवं व्रत-उपासना',
    nameEnglish: 'Ekadashi & Vrat Upasana',
    description: 'पावन एकादशी व्रत, हरिवासर कीर्तन, तुलसी महारानी महिमा एवं अनन्य नाम-संकीर्तन से संबंधित दिव्य रसिक पद।',
    regex: /एकादशी|ग्यारस|हरिवासर|व्रत|तुलसी/,
  },
];

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
  const ragaMap = new Map(); // rawRaga -> { name, padas: [] }
  const themeBuckets = Object.fromEntries(
    THEME_DEFINITIONS.map((t) => [t.slug, []])
  );
  let padaCount = 0;
  let audioMappedCount = 0;

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
        const rag = (p.rag || '').trim();

        // Wire 84 Hit Chaurasi MP3s (indices 0..83 -> SHCJ1.mp3..SHCJ84.mp3)
        let audioUrl = '';
        if (granthaId === 'hit-chaurasi' && i >= 0 && i <= 83) {
          const mp3Rel = `/audio/hit-chaurasi/SHCJ${i + 1}.mp3`;
          const mp3Disk = path.resolve(projectRoot, 'public', mp3Rel.slice(1));
          if (fs.existsSync(mp3Disk)) {
            audioUrl = mp3Rel;
            audioMappedCount++;
          }
        } else if (p.audioUrl && typeof p.audioUrl === 'string') {
          audioUrl = p.audioUrl;
        }

        // Compact tuple: [0: titleDev, 1: author, 2: granthaId, 3: verseText, 4: prevSlug, 5: nextSlug, 6: rag, 7?: audioUrl]
        const tuple = [
          title,
          author,
          granthaId,
          verseText,
          prevSlug,
          nextSlug,
          rag,
        ];
        if (audioUrl) {
          tuple.push(audioUrl);
        }
        snippets[slug] = tuple;
        padaCount++;

        // Raga Hub indexing
        if (rag) {
          if (!ragaMap.has(rag)) {
            ragaMap.set(rag, { name: rag, padas: [] });
          }
          ragaMap.get(rag).padas.push(slug);
        }

        // Theme Hub deterministic Devanagari keyword tagging
        const combinedText = `${title}\n${verseText}`;
        for (const theme of THEME_DEFINITIONS) {
          if (theme.regex.test(combinedText)) {
            themeBuckets[theme.slug].push(slug);
          }
        }

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

  // Build compact ragaIndex.json (normalized ASCII slugs + Devanagari names + pada slug lists)
  const ragaIndex = {};
  const usedRagaSlugs = new Set();
  for (const [ragName, entry] of ragaMap.entries()) {
    let baseSlug = devanagariToAsciiSlug(ragName);
    if (!baseSlug) baseSlug = 'raag-' + (usedRagaSlugs.size + 1);
    let slug = baseSlug;
    let suffix = 2;
    while (usedRagaSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }
    usedRagaSlugs.add(slug);
    ragaIndex[slug] = {
      name: ragName,
      padas: entry.padas,
    };
  }
  const ragaStr = JSON.stringify(ragaIndex);
  fs.writeFileSync(path.resolve(projectRoot, 'src/data/ragaIndex.json'), ragaStr, 'utf-8');

  // Build compact themeHubs.json
  const themeHubs = {};
  for (const theme of THEME_DEFINITIONS) {
    themeHubs[theme.slug] = {
      slug: theme.slug,
      nameDevanagari: theme.nameDevanagari,
      nameEnglish: theme.nameEnglish,
      description: theme.description,
      padas: themeBuckets[theme.slug],
    };
  }
  const themeStr = JSON.stringify(themeHubs);
  fs.writeFileSync(path.resolve(projectRoot, 'src/data/themeHubs.json'), themeStr, 'utf-8');

  // Build compact ritualMeta.json & placeMeta.json for Edge HowTo / HinduTemple JSON-LD
  const ritualMeta = {};
  const ritualsDir = path.resolve(projectRoot, 'public/data/rituals');
  if (fs.existsSync(ritualsDir)) {
    for (const f of fs.readdirSync(ritualsDir)) {
      if (f.startsWith('ritual-') && f.endsWith('.json')) {
        try {
          const r = JSON.parse(fs.readFileSync(path.join(ritualsDir, f), 'utf-8'));
          if (r.slug) {
            ritualMeta[r.slug] = {
              durationMinutes: r.durationMinutes || undefined,
              pujaVidhi: r.pujaVidhi || undefined,
            };
          }
        } catch {}
      }
    }
  }
  fs.writeFileSync(path.resolve(projectRoot, 'src/data/ritualMeta.json'), JSON.stringify(ritualMeta), 'utf-8');

  const placeMeta = {};
  const placesDir = path.resolve(projectRoot, 'public/data/places');
  if (fs.existsSync(placesDir)) {
    for (const f of fs.readdirSync(placesDir)) {
      if (f.startsWith('place-') && f.endsWith('.json')) {
        try {
          const pl = JSON.parse(fs.readFileSync(path.join(placesDir, f), 'utf-8'));
          if (pl.slug) {
            placeMeta[pl.slug] = {
              darshanTimings: pl.darshanTimings || undefined,
              coordinates: pl.coordinates || undefined,
            };
          }
        } catch {}
      }
    }
  }
  fs.writeFileSync(path.resolve(projectRoot, 'src/data/placeMeta.json'), JSON.stringify(placeMeta), 'utf-8');

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
  console.log(`  ✓ Wired ${audioMappedCount} Hit Chaurasi MP3s, ${Object.keys(ragaIndex).length} Raga Hubs (${Math.round(ragaStr.length / 1024)} KB), ${Object.keys(themeHubs).length} Theme Hubs (${Math.round(themeStr.length / 1024)} KB)`);
  console.log('✨ Ultra-Lean Pada Snippets ready for Edge SEO injection (well within 25MB CF limit)!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generatePadaSnippets();
}
