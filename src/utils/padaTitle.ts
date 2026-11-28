import type { SacredPad } from '../types/devotional';

export const EPIC_COLLECTION_IDS = new Set([
  'valmiki-ramayana',
  'shrimad-bhagavatam',
  'ramcharitmanas',
  'bhagavad-gita',
  'durga-saptashati',
]);

/**
 * Strips raw HTML entities (&zwnj;, &zwj;, etc.), zero-width unicode artifacts,
 * and unwanted scraper symbols from Devanagari and English strings.
 */
export function cleanSacredString(str: string): string {
  if (!str) return '';
  let res = String(str);
  res = res.replace(/&amp;/gi, '&');
  res = res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '');
  res = res.replace(/[\u200B-\u200D\uFEFF]/g, '');
  res = res
    .replace(/&(?:ndash|#8211);/gi, '–')
    .replace(/&(?:mdash|#8212);/gi, '—')
    .replace(/&(?:lsquo|#8216);/gi, '‘')
    .replace(/&(?:rsquo|#8217);/gi, '’')
    .replace(/&(?:ldquo|#8220);/gi, '“')
    .replace(/&(?:rdquo|#8221);/gi, '”')
    .replace(/&(?:bull|#8226);/gi, '•')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  return res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '').replace(/🥀/g, '');
}

const KNOWN_GRANTHAS: Array<[string, string]> = [
  ['हित चौरासी', 'श्री हित चौरासी'],
  ['हित चतुरासी', 'श्री हित चौरासी'],
  ['राधा सुधा निधि', 'श्री राधा सुधा निधि'],
  ['केलिमाल', 'श्री केलिमाल'],
  ['केलीमाल', 'श्री केलिमाल'],
  ['व्यास वाणी', 'श्री व्यास वाणी'],
  ['स्फुट वाणी', 'श्री स्फुट वाणी'],
  ['बयालीस लीला', 'बयालीस लीला'],
  ['सूरसागर', 'सूरसागर'],
  ['विनय पत्रिका', 'विनय पत्रिका'],
  ['भक्ति शतक', 'भक्ति शतक'],
  ['माधुर्य कादम्बिनी', 'माधुर्य कादम्बिनी'],
  ['निजमत सिद्धान्त', 'निजमत सिद्धान्त'],
  ['किशोरी कृपा कटाक्ष', 'किशोरी कृपा कटाक्ष'],
];

/**
 * Separates the pure Mukhda title from trailing catalog/author/grantha/raga suffixes
 * such as "- श्री हित हरिवंश महाप्रभु, श्री हित चौरासी (पद 1) (विभास)" or trailing "(हरिदास)".
 * Preserves internal hyphenated Braj compounds like "जोई-जोई".
 */
export function extractPurePadaTitle(rawTitle: string): {
  title: string;
  padHint?: string;
  padNumber?: number;
  granthaHint?: string;
} {
  if (!rawTitle) return { title: '' };
  const cleaned = cleanSacredString(rawTitle).trim();

  // Split only when a dash has surrounding whitespace (keeps hyphenated words like जोई-जोई intact)
  const parts = cleaned.split(/\s+[-–—]\s+|\s*[-–—]\s+/);
  let pureTitle = parts[0].trim();
  const trailingMeta = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';

  const combined = `${trailingMeta} ${cleaned}`;
  let padHint: string | undefined;
  let padNumber: number | undefined;
  const padMatch = combined.match(/पद\s*(\d+|[०-९]+)/);
  if (padMatch) {
    padHint = `पद ${padMatch[1]}`;
    const asciiDigits = padMatch[1].replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
    const parsed = parseInt(asciiDigits, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      padNumber = parsed;
    }
  }

  // Strip one or more trailing parenthetical metadata tags like "(पद 1)", "(विभास)", "(हरिदास)"
  // without removing essential prose titles when they are not trailing annotations.
  let prev: string;
  do {
    prev = pureTitle;
    pureTitle = pureTitle
      .replace(/\s*\((?:पद\s*[\d०-९]+|राग\s*[^)]+|हरिदास|विभास|सारंग|कान्हरौ|कल्याण|मल्हार|बिलावल|अर्थ सहित|\d+|[०-९]+)\)\s*$/g, '')
      .trim();
  } while (pureTitle !== prev);

  // Strip trailing standalone verse/author markers like "(12)" only at the very end
  pureTitle = pureTitle.replace(/\s*\([^)]{1,24}\)\s*$/g, (match) => {
    const inner = match.replace(/[()\s]/g, '');
    // Preserve legitimate Sanskrit qualifiers unless clearly scraper metadata
    if (/^\d+$/.test(inner) || /^[०-९]+$/.test(inner) || /हरिदास|व्यास|रसिक/.test(inner)) {
      return '';
    }
    return match;
  }).trim();

  let granthaHint: string | undefined;
  for (const [needle, label] of KNOWN_GRANTHAS) {
    if (combined.includes(needle)) {
      granthaHint = label;
      break;
    }
  }

  return {
    title: pureTitle || cleaned,
    padHint,
    padNumber,
    granthaHint,
  };
}

/**
 * Normalizes Braj orthographic variations (औ/ओ, ऐ/ए, व/ब, nasalization, spaces, dashes)
 * exclusively for comparing duplicate seeded vs imported pad records.
 */
export function canonicalPadaTextKey(raw: string): string {
  const { title } = extractPurePadaTitle(raw || '');
  return title
    .replace(/ौ/g, 'ो')
    .replace(/औ/g, 'ओ')
    .replace(/ै/g, 'े')
    .replace(/ऐ/g, 'ए')
    .replace(/व/g, 'ब')
    .replace(/ं/g, '')
    .replace(/ँ/g, '')
    .replace(/[^\u0900-\u097Fa-zA-Z0-9]/g, '')
    .toLowerCase();
}

function scorePadaRichness(pad: SacredPad): number {
  let score = 0;
  if (!pad.isStub) score += 20;
  const vCount = pad.verses?.length || 0;
  score += Math.min(vCount, 15) * 3;
  if (pad.verses?.[0]?.linesTransliteration?.length) score += 5;
  if (pad.verses?.[0]?.linesEnglish?.length) score += 5;
  if (pad.rag) score += 2;
  if (!/^(hit-chaurasi|kelimal)-\d+$/.test(pad.id) && pad.id !== 'radha-kripa-kataksha') {
    score += 4;
  }
  return score;
}

/**
 * Deduplicates non-epic pad lists by ID, normalized slug, and semantic Mukhda key within the same grantha,
 * keeping whichever version has richer verse data while leaving epic verses untouched.
 */
export function deduplicatePadas(pads: SacredPad[]): SacredPad[] {
  if (!pads || pads.length <= 1) return pads || [];

  const result: SacredPad[] = [];
  const seenIds = new Map<string, number>();
  const seenSlugs = new Map<string, number>();
  const seenSemantic = new Map<string, number>();

  for (const pad of pads) {
    if (!pad || !pad.id) continue;

    // Never collapse distinct verses in Mahagranth Epics
    if (EPIC_COLLECTION_IDS.has(pad.collectionId)) {
      if (!seenIds.has(pad.id)) {
        seenIds.set(pad.id, result.length);
        result.push(pad);
      }
      continue;
    }

    const slugKey = (pad.slug || '').trim().toLowerCase();
    const titleKey = canonicalPadaTextKey(pad.titleDevanagari);
    const firstVerseLine = pad.verses?.[0]?.linesDevanagari?.[0] || '';
    const verseKey = canonicalPadaTextKey(firstVerseLine).slice(0, 28);

    // Semantic key inside the same grantha when either titles match with sufficient length or first lines match
    const semanticKey =
      titleKey.length >= 10
        ? `${pad.collectionId}::${titleKey}::${verseKey || ''}`
        : '';
    const shortTitleKey =
      titleKey.length >= 16 ? `${pad.collectionId}::${titleKey}` : '';

    const matchIdx =
      seenIds.get(pad.id) ??
      (slugKey ? seenSlugs.get(slugKey) : undefined) ??
      (semanticKey ? seenSemantic.get(semanticKey) : undefined) ??
      (shortTitleKey ? seenSemantic.get(shortTitleKey) : undefined);

    if (matchIdx !== undefined) {
      const existing = result[matchIdx];
      if (scorePadaRichness(pad) > scorePadaRichness(existing)) {
        result[matchIdx] = pad;
      }
      seenIds.set(pad.id, matchIdx);
      if (slugKey) seenSlugs.set(slugKey, matchIdx);
      if (semanticKey) seenSemantic.set(semanticKey, matchIdx);
      if (shortTitleKey) seenSemantic.set(shortTitleKey, matchIdx);
      continue;
    }

    const idx = result.length;
    result.push(pad);
    seenIds.set(pad.id, idx);
    if (slugKey) seenSlugs.set(slugKey, idx);
    if (semanticKey) seenSemantic.set(semanticKey, idx);
    if (shortTitleKey) seenSemantic.set(shortTitleKey, idx);
  }

  return result;
}
