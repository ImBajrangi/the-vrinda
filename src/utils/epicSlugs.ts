/**
 * Vrindopnisad 2.0 - Epic Chapter Slug Transliteration Utility
 * Maps Devanagari Kand names to clean, SEO-optimized Hinglish slugs.
 * Eliminates percent-encoded URLs (%E0%A4...) for Valmiki Ramayana & Ramcharitmanas.
 */

export const KAND_SLUG_MAP: Record<string, string> = {
  'बालकाण्ड': 'bal-kand',
  'अयोध्याकाण्ड': 'ayodhya-kand',
  'अरण्यकाण्ड': 'aranya-kand',
  'किष्किन्धाकाण्ड': 'kishkindha-kand',
  'सुन्दरकाण्ड': 'sundar-kand',
  'युद्धकाण्ड': 'yuddha-kand',
  'उत्तरकाण्ड': 'uttar-kand',
  'लंकाकाण्ड': 'lanka-kand',
};

export const REVERSE_KAND_MAP: Record<string, string> = {
  'bal-kand': 'बालकाण्ड',
  'ayodhya-kand': 'अयोध्याकाण्ड',
  'aranya-kand': 'अरण्यकाण्ड',
  'kishkindha-kand': 'किष्किन्धाकाण्ड',
  'sundar-kand': 'सुन्दरकाण्ड',
  'yuddha-kand': 'युद्धकाण्ड',
  'uttar-kand': 'उत्तरकाण्ड',
  'lanka-kand': 'लंकाकाण्ड',
};

export function normalizeEpicChapterSlug(granthaId: string, chapterId: string): string {
  if (!chapterId) return chapterId;
  let ch = decodeURIComponent(chapterId).trim();

  if (granthaId === 'valmiki-ramayana') {
    for (const [kand, slug] of Object.entries(KAND_SLUG_MAP)) {
      if (ch.startsWith(kand)) {
        ch = ch.replace(kand, slug);
        break;
      }
    }
    return ch.toLowerCase().replace(/_/g, '-');
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
    return ch.toLowerCase();
  }

  return ch;
}
