/**
 * Vrindopnisad 2.0 - Epic Chapter Slug Transliteration Utility
 * Maps Devanagari Kand names, numerals, and terms to clean, SEO-optimized Hinglish slugs.
 * Eliminates percent-encoded URLs (%E0%A4...) for Valmiki Ramayana, Ramcharitmanas, Bhagavatam, Gita, Durga Saptashati.
 */

export const DEV_DIGITS_MAP = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

export function toAsciiDigits(str) {
  return str.replace(/[०-९]/g, (d) => DEV_DIGITS_MAP[d] || d);
}

export const KAND_SLUG_MAP = {
  'बालकाण्ड': 'bal-kand',
  'अयोध्याकाण्ड': 'ayodhya-kand',
  'अरण्यकाण्ड': 'aranya-kand',
  'किष्किन्धाकाण्ड': 'kishkindha-kand',
  'किष्किंधाकाण्ड': 'kishkindha-kand',
  'सुन्दरकाण्ड': 'sundar-kand',
  'सुंदरकाण्ड': 'sundar-kand',
  'युद्धकाण्ड': 'yuddha-kand',
  'लंकाकाण्ड': 'lanka-kand',
  'उत्तरकाण्ड': 'uttar-kand',
};

export const REVERSE_KAND_MAP = {
  'bal-kand': 'बालकाण्ड',
  'ayodhya-kand': 'अयोध्याकाण्ड',
  'aranya-kand': 'अरण्यकाण्ड',
  'kishkindha-kand': 'किष्किन्धाकाण्ड',
  'sundar-kand': 'सुन्दरकाण्ड',
  'yuddha-kand': 'युद्धकाण्ड',
  'uttar-kand': 'उत्तरकाण्ड',
  'lanka-kand': 'लंकाकाण्ड',
};

export function normalizeEpicChapterSlug(granthaId, chapterId) {
  if (!chapterId) return chapterId;
  let ch = decodeURIComponent(chapterId).trim();
  ch = toAsciiDigits(ch);

  if (granthaId === 'valmiki-ramayana') {
    for (const [kand, slug] of Object.entries(KAND_SLUG_MAP)) {
      if (ch.includes(kand)) {
        ch = ch.replace(kand, slug);
        break;
      }
    }
    ch = ch.replace(/सर्ग/g, 'sarga');
    ch = ch.replace(/[,:：]/g, ' ');
    ch = ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return ch;
  }

  if (granthaId === 'ramcharitmanas') {
    for (const [kand, slug] of Object.entries(KAND_SLUG_MAP)) {
      if (ch.includes(kand)) {
        return slug;
      }
    }
    if (ch.startsWith('kand-')) {
      const rest = ch.replace(/^kand-/, '').toLowerCase();
      for (const slug of Object.values(KAND_SLUG_MAP)) {
        if (rest === slug || rest.replace(/-/g, '') === slug.replace(/-/g, '')) {
          return slug;
        }
      }
      const numMatch = rest.match(/\d+/);
      if (numMatch) {
        const order = ['', 'bal-kand', 'ayodhya-kand', 'aranya-kand', 'kishkindha-kand', 'sundar-kand', 'lanka-kand', 'uttar-kand'];
        const n = parseInt(numMatch[0], 10);
        if (n >= 1 && n <= 7) return order[n];
      }
    }
    const cleanLower = ch.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const slug of Object.values(KAND_SLUG_MAP)) {
      if (cleanLower === slug.replace(/-/g, '')) {
        return slug;
      }
    }
    return ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  if (granthaId === 'shrimad-bhagavatam') {
    const skMatch = ch.match(/स्कन्ध\s*(\d+)/i) || ch.match(/skandh[_\-\s]*(\d+)/i);
    const adMatch = ch.match(/अध्याय\s*(\d+)/i) || ch.match(/adhyay[_\-\s]*(\d+)/i);
    if (skMatch && adMatch) {
      return `skandh-${skMatch[1]}-adhyay-${adMatch[1]}`;
    }
    ch = ch.replace(/स्कन्ध/g, 'skandh').replace(/अध्याय/g, 'adhyay');
    return ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  if (granthaId === 'bhagavad-gita' || granthaId === 'durga-saptashati') {
    const numMatch = ch.match(/(\d+)/);
    if (numMatch) {
      return `adhyay-${numMatch[1]}`;
    }
    ch = ch.replace(/अध्याय/g, 'adhyay');
    return ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  return ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
