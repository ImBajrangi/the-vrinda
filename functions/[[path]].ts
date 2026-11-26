/**
 * Vrindopnisad 2.0 - Cloudflare Pages Functions Edge Interceptor
 * Dynamically handles edge SEO, 301 cross-domain redirects, multi-domain canonical ownership,
 * pre-rendered static HTML routing for all 29 collections, response-level content injection for all 781 chapters,
 * dynamic JSON-LD Schema.org graphs, and staging noindex protection for the-vrinda.pages.dev.
 */

import chapterSnippetsData from '../src/data/chapterSnippets.json';
import canonicalGranthasData from '../src/data/canonicalGranthas.json';
import canonicalSaintsData from '../src/data/canonicalSaints.json';
import padaSnippetsData from '../src/data/padaSnippets.json';
import padaAliasesData from '../src/data/padaAliases.json';
import legacySlugRedirectsData from '../src/data/legacySlugRedirects.json';
import topicalGuidesMetaData from '../src/data/topicalGuidesMeta.json';
import ritualsIndexData from '../public/data/rituals/index.json';
import placesIndexData from '../public/data/places/index.json';
import storiesIndexData from '../public/data/stories/index.json';
import biosIndexData from '../public/data/biographies/index.json';
import ragaIndexData from '../src/data/ragaIndex.json';
import themeHubsData from '../src/data/themeHubs.json';
import brajGlossaryData from '../src/data/brajGlossary.json';
import ritualMetaData from '../src/data/ritualMeta.json';
import placeMetaData from '../src/data/placeMeta.json';
import edgeCacheVersionData from '../src/data/edgeCacheVersion.json';

interface Env {}

const EDGE_CACHE_VERSION: string = (edgeCacheVersionData as any)?.v || 'v1';

function buildCachedRedirect(targetUrl: string, status = 301): Response {
  return new Response(null, {
    status,
    headers: {
      Location: targetUrl,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'public, max-age=86400',
    },
  });
}

function normPadKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/^-+/, '')
    .replace(/\.+$/, '')
    .replace(/-[0-9a-f]{4,8}$/i, '')
    .replace(/shri-/g, 'sri-')
    .replace(/hita-/g, 'hit-')
    .replace(/bayal(?:is|ees)/g, 'byl')
    .replace(/l(?:ee|i)la/g, 'll')
    .replace(/dhruv[ai]?das/g, 'dhrvds')
    .replace(/anand[ai]?ghan/g, 'nndgn')
    .replace(/par[ai]?man[an]+d[a]?/g, 'prmnnd')
    .replace(/kripalu-?ji(?:-maharaj)?/g, 'krplj')
    .replace(/v/g, 'b')
    .replace(/ph/g, 'f')
    .replace(/[aeiouyw-]+/g, '')
    .replace(/(.)\1+/g, '$1');
}

function recoverMissingPadSlug(rawId: string): string | null {
  const clean = rawId.trim().replace(/^-+/, '').replace(/\.+$/, '');
  const noHash = clean.replace(/-[0-9a-f]{4,8}$/i, '');
  const candidates = [clean, noHash, clean.toLowerCase(), noHash.toLowerCase()];
  for (const c of candidates) {
    if (!c) continue;
    const hit = padaAliasesObj[c] || (padaSnippetsObj[c] ? c : null);
    if (hit && padaSnippetsObj[hit]) return hit;
  }

  const keys = Object.keys(padaSnippetsObj);
  if (noHash.length >= 24) {
    const lowerNoHash = noHash.toLowerCase();
    const prefixLen = Math.min(48, lowerNoHash.length);
    const prefix = lowerNoHash.slice(0, prefixLen);
    const prefMatch = keys.find(
      (k) => k.startsWith(prefix) || (k.length >= 24 && lowerNoHash.startsWith(k))
    );
    if (prefMatch) return prefMatch;
  }

  const sk = normPadKey(noHash);
  if (sk.length >= 20) {
    const skPrefix = sk.slice(0, Math.min(28, sk.length));
    for (const k of keys) {
      const kSk = normPadKey(k);
      if (kSk === sk || (kSk.length >= 20 && (kSk.startsWith(skPrefix) || sk.startsWith(kSk)))) {
        return k;
      }
    }
  }
  return null;
}

const GRANTHA_ALIASES: Record<string, string> = {
  'shri-hit-chaurasi': 'hit-chaurasi',
  'hita-chaurasi': 'hit-chaurasi',
  'sri-hit-chaurasi': 'hit-chaurasi',
  'shri-kelimal': 'kelimal',
  'shri-radha-sudha-nidhi': 'stotras',
  'radha-sudha-nidhi': 'stotras',
  'radha-govind-git': 'bhakti-shatak',
  'shyama-shyam-gita': 'bhakti-shatak',
  'prata-smaran-stotra': 'stotras',
  'ras-man-ke-pada': 'rasik-vani-sangrah',
  'bayalis-leela': 'bayalees-leela',
};

const SAINT_ALIASES: Record<string, { kind: 'sant' | 'pad' | 'grantha' | 'guide'; target: string }> = {
  'shri-hathi-radha-sudha-shatak': { kind: 'sant', target: 'hathi-ji' },
  'shri-hathi': { kind: 'sant', target: 'hathi-ji' },
  'shri-biharin-dev-biharin-dev-siddhant-ki-sakhi': { kind: 'sant', target: 'biharin-dev-ji' },
  'shri-biharin-dev': { kind: 'sant', target: 'biharin-dev-ji' },
  'shri-ladaili-lala': { kind: 'sant', target: 'lalit-ladaiti' },
  'shri-radhacharan-dasa': { kind: 'sant', target: 'krishnachandra-radhacharan-das' },
  'shri-keli-sakhi': { kind: 'pad', target: 'jagat-mein-jaagai-jaako-bhaag-shri-keli-sakhi-ji' },
  'krishnayamal-tntra': { kind: 'pad', target: 'radhapriyamayurasya-yatra-radhekshanaprabham-krishnayamal-tantra-167' },
  'braj-dham-lila': { kind: 'grantha', target: 'braj-dham-mahatmya' },
  'shri-kashthajihv-svami': { kind: 'guide', target: 'rasik-saints-of-vrindavan' },
  'shri-chndr-lal-gosvami-ji': { kind: 'guide', target: 'rasik-saints-of-vrindavan' },
};

// Cloudflare Workers / Pages runtime ambient type definitions
interface CFElement {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  before(content: string, extra?: { html?: boolean }): void;
  after(content: string, extra?: { html?: boolean }): void;
  prepend(content: string, extra?: { html?: boolean }): void;
  append(content: string, extra?: { html?: boolean }): void;
  setInnerContent(content: string, extra?: { html?: boolean }): void;
  remove(): void;
  removeAndKeepContent(): void;
  tagName: string;
}

interface CFHTMLRewriter {
  on(selector: string, handlers: { element?: (el: CFElement) => void }): CFHTMLRewriter;
  onDocument(handlers: { comments?: (comment: unknown) => void; text?: (text: unknown) => void }): CFHTMLRewriter;
  transform(response: Response): Response;
}

declare const HTMLRewriter: {
  prototype: CFHTMLRewriter;
  new (): CFHTMLRewriter;
};

type PagesFunction<T = Record<string, unknown>> = (context: {
  request: Request;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: T;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
  waitUntil: (promise: Promise<unknown>) => void;
}) => Promise<Response>;

const EPICS_META: Record<string, { name: string; author: string; desc: string }> = {
  'valmiki-ramayana': {
    name: 'श्रीमद् वाल्मीकि रामायण',
    author: 'महर्षि वाल्मीकि',
    desc: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के पावन चरित्र का अमर महाकाव्य',
  },
  'shrimad-bhagavatam': {
    name: 'श्रीमद् भागवत महापुराण',
    author: 'महर्षि वेदव्यास',
    desc: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा',
  },
  'ramcharitmanas': {
    name: 'श्री रामचरितमानस',
    author: 'गोस्वामी तुलसीदास',
    desc: 'कलयुग तारक प्रभु श्री राम के पावन चरित्र का अवधी महाकाव्य',
  },
  'bhagavad-gita': {
    name: 'श्रीमद्भगवद्गीता',
    author: 'महर्षि वेदव्यास',
    desc: 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया आत्मज्ञान',
  },
  'durga-saptashati': {
    name: 'श्री दुर्गा सप्तशती',
    author: 'महर्षि मार्कण्डेय',
    desc: 'मार्कण्डेय पुराणान्तर्गत आदिशक्ति माँ भगवती के प्राकट्य व महात्म्य की पवित्र सप्तशती',
  },
};

const saintsList: any[] = Array.isArray(canonicalSaintsData)
  ? canonicalSaintsData
  : (canonicalSaintsData as any)?.default || [];

const granthasList: any[] = Array.isArray(canonicalGranthasData)
  ? canonicalGranthasData
  : (canonicalGranthasData as any)?.default || [];

const snippetsObj: Record<string, any> =
  (chapterSnippetsData as any)?.default || chapterSnippetsData || {};

const GRANTHAS_MAP = new Map<string, { id: string; name: string; author: string; description: string; category?: string }>();
for (const g of granthasList) {
  GRANTHAS_MAP.set(g.id, g);
  if (g.slug && g.slug !== g.id) GRANTHAS_MAP.set(g.slug, g);
}

const SAINTS_MAP = new Map<string, { id: string; name: string; slug: string; tradition?: string; biography?: string }>();
for (const s of saintsList) {
  if (s.slug) SAINTS_MAP.set(s.slug, s);
  if (s.nameEng) SAINTS_MAP.set(s.nameEng.toLowerCase().replace(/[^a-z0-9]+/g, '-'), s);
  if (s.name) SAINTS_MAP.set(s.name, s);
}

const CHAPTER_SNIPPETS = snippetsObj as Record<string, {
  granthaId: string;
  granthaName: string;
  author: string;
  chapterId: string;
  chapterName: string;
  section?: string;
  verseCount: number;
  openingVerse: string;
}>;

const padaSnippetsObj: Record<string, [string, string, string, string, string?, string?, string?, string?]> =
  (padaSnippetsData as any)?.default || padaSnippetsData || {};

const padaAliasesObj: Record<string, string> =
  (padaAliasesData as any)?.default || padaAliasesData || {};

const ragaIndexObj: Record<string, { name: string; padas: string[] }> =
  (ragaIndexData as any)?.default || ragaIndexData || {};

const themeHubsObj: Record<string, { slug: string; nameDevanagari: string; nameEnglish: string; description: string; padas: string[] }> =
  (themeHubsData as any)?.default || themeHubsData || {};

const brajGlossaryList: { id: string; term: string; transliteration: string; meaningDevanagari: string; context?: string }[] =
  Array.isArray(brajGlossaryData) ? brajGlossaryData : (brajGlossaryData as any)?.default || [];
const GLOSSARY_MAP = new Map(brajGlossaryList.map((g) => [g.id, g]));

const ritualMetaObj: Record<string, { durationMinutes?: number; pujaVidhi?: { timing?: string; requiredItems?: string[]; steps?: string[]; benefits?: string } }> =
  (ritualMetaData as any)?.default || ritualMetaData || {};

const placeMetaObj: Record<string, { darshanTimings?: { morning?: { open: string; close: string; aartiName?: string }; evening?: { open: string; close: string; aartiName?: string }; specialNotes?: string }; coordinates?: { lat: number; lng: number } }> =
  (placeMetaData as any)?.default || placeMetaData || {};

const PRERENDERED_GRANTHA_IDS = new Set(granthasList.map((g: any) => g.id).filter(Boolean));
const PRERENDERED_SAINT_SLUGS = new Set(saintsList.slice(0, 10).map((s: any) => s.slug || s.id).filter(Boolean));
const PRERENDERED_PAD_SLUGS = new Set([
  'radheju-merau-janam-sudharau',
  'shri-radha-kripa-kataksha-stotram',
  'bainu-maai-baajai-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64',
  'main-to-govardhan-ko-jaun-meri-veer-shri-chandrasakhi-ji',
  'radhika-ravan-ki-murlika-shravan-suni-shri-chaturbhujdas-ji',
]);

const TOPICAL_GUIDES_META = (
  (topicalGuidesMetaData as any)?.default || topicalGuidesMetaData || {}
) as Record<string, { title: string; description: string; faqs?: { q: string; a: string }[] }>;

const RITUALS_MAP = new Map<string, any>();
for (const item of ((ritualsIndexData as any)?.items || [])) {
  if (item.slug) RITUALS_MAP.set(item.slug, item);
}

const PLACES_MAP = new Map<string, any>();
for (const item of ((placesIndexData as any)?.items || [])) {
  if (item.slug) PLACES_MAP.set(item.slug, item);
}

const STORIES_MAP = new Map<string, any>();
for (const item of ((storiesIndexData as any)?.items || [])) {
  if (item.slug) STORIES_MAP.set(item.slug, item);
}

const BIOS_MAP = new Map<string, any>();
for (const item of ((biosIndexData as any)?.items || [])) {
  if (item.slug) BIOS_MAP.set(item.slug, item);
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function notFoundResponse(message = 'Not Found'): Response {
  return new Response(
    `<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>404 • पृष्ठ उपलब्ध नहीं | वृन्दोपनिषद् 2.0</title></head><body style="font-family:sans-serif;text-align:center;padding:4rem 1rem;background:#FAF8F5;color:#1c1917;"><h1>404 — ${message}</h1><p><a href="https://bhav.vrindopnishad.in/" style="color:#b45309;">वृन्दोपनिषद् 2.0 मुख्य पृष्ठ पर लौटें</a></p></body></html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}

const granthaCrawlMap: Record<string, [string, string][]> = {};
const saintCrawlMap: Record<string, [string, string][]> = {};
let isCrawlIndexed = false;

function ensureCrawlIndex() {
  if (isCrawlIndexed) return;
  for (const [slug, item] of Object.entries(padaSnippetsObj)) {
    const title = item[0];
    const author = item[1];
    const granthaId = item[2];
    if (granthaId) {
      if (!granthaCrawlMap[granthaId]) granthaCrawlMap[granthaId] = [];
      granthaCrawlMap[granthaId].push([slug, title]);
    }
    if (author) {
      if (!saintCrawlMap[author]) saintCrawlMap[author] = [];
      saintCrawlMap[author].push([slug, title]);
    }
  }
  isCrawlIndexed = true;
}

const SAINT_KNOWLEDGE_GRAPH: Record<string, string[]> = {
  'swami-haridas': [
    'https://www.wikidata.org/wiki/Q11158580',
    'https://en.wikipedia.org/wiki/Swami_Haridas',
    'https://hi.wikipedia.org/wiki/%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%AE%E0%A5%80_%E0%A4%B9%E0%A4%B0%E0%A4%BF%E0%A4%A6%E0%A4%BE%E0%A4%B8',
  ],
  'shri-hita-harivansh-mahaprabhu': [
    'https://www.wikidata.org/wiki/Q5871638',
    'https://en.wikipedia.org/wiki/Hith_Harivansh_Mahaprabhu',
    'https://hi.wikipedia.org/wiki/%E0%A4%B9%E0%A4%BF%E0%A4%A4_%E0%A4%B9%E0%A4%B0%E0%A4%BF%E0%A4%B5%E0%A4%82%E0%A4%B6_%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%AD%E0%A5%81',
  ],
  'surdas': [
    'https://www.wikidata.org/wiki/Q12457813',
    'https://en.wikipedia.org/wiki/Surdas',
    'https://hi.wikipedia.org/wiki/%E0%A4%B8%E0%A5%82%E0%A4%B0%E0%A4%A6%E0%A4%BE%E0%A4%B8',
  ],
  'raskhan': [
    'https://www.wikidata.org/wiki/Q3635334',
    'https://en.wikipedia.org/wiki/Raskhan',
    'https://hi.wikipedia.org/wiki/%E0%A4%B0%E0%A4%B8%E0%A4%96%E0%A4%BE%E0%A4%A8',
  ],
  'meera-bai': [
    'https://www.wikidata.org/wiki/Q300185',
    'https://en.wikipedia.org/wiki/Mirabai',
    'https://hi.wikipedia.org/wiki/%E0%A4%AE%E0%A5%80%E0%A4%B0%E0%A4%BE%E0%A4%AC%E0%A4%BE%E0%A4%88',
  ],
  'chaitanya-mahaprabhu': [
    'https://www.wikidata.org/wiki/Q192207',
    'https://en.wikipedia.org/wiki/Chaitanya_Mahaprabhu',
    'https://hi.wikipedia.org/wiki/%E0%A4%9A%E0%A5%88%E0%A4%A4%E0%A4%A8%E0%A5%8D%E0%A4%AF_%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%AD%E0%A5%81',
  ],
  'tulsidas': [
    'https://www.wikidata.org/wiki/Q312610',
    'https://en.wikipedia.org/wiki/Tulsidas',
    'https://hi.wikipedia.org/wiki/%E0%A4%A4%E0%A5%81%E0%A4%B2%E0%A4%B8%E0%A5%80%E0%A4%A6%E0%A4%BE%E0%A4%B8',
  ],
  'nimbarkacharya': [
    'https://www.wikidata.org/wiki/Q3349767',
    'https://en.wikipedia.org/wiki/Nimbarka',
  ],
  'vallabhacharya': [
    'https://www.wikidata.org/wiki/Q2722108',
    'https://en.wikipedia.org/wiki/Vallabha',
  ],
  'nagaridas': [
    'https://www.wikidata.org/wiki/Q7428581',
    'https://en.wikipedia.org/wiki/Sawant_Singh',
  ],
  'maharishi-valmiki': [
    'https://www.wikidata.org/wiki/Q462000',
    'https://en.wikipedia.org/wiki/Valmiki',
  ],
  'maharishi-vedavyasa': [
    'https://www.wikidata.org/wiki/Q167384',
    'https://en.wikipedia.org/wiki/Vyasa',
  ],
  'prabodhananda-sarasvati': [
    'https://www.wikidata.org/wiki/Q4379309',
  ],
};

function getSaintSameAs(authorName: string): string[] | undefined {
  if (!authorName) return undefined;
  const lower = authorName.toLowerCase();
  if (/हरिदास|haridas/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['swami-haridas'];
  if (/हरिवंश|harivansh/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['shri-hita-harivansh-mahaprabhu'];
  if (/सूरदास|surdas/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['surdas'];
  if (/रसखान|raskhan/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['raskhan'];
  if (/मीरा|meera|mira/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['meera-bai'];
  if (/चैतन्य|chaitanya/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['chaitanya-mahaprabhu'];
  if (/तुलसी|tulsidas/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['tulsidas'];
  if (/निम्बार्क|nimbarka/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['nimbarkacharya'];
  if (/वल्लभ|vallabha/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['vallabhacharya'];
  if (/नागरी|nagaridas|सावंत/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['nagaridas'];
  if (/वाल्मीकि|valmiki/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['maharishi-valmiki'];
  if (/वेदव्यास|vedavyasa/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['maharishi-vedavyasa'];
  if (/प्रबोधानन्द|prabodhananda/i.test(lower)) return SAINT_KNOWLEDGE_GRAPH['prabodhananda-sarasvati'];
  return undefined;
}

const KAND_SLUG_MAP: Record<string, string> = {
  'बालकाण्ड': 'bal-kand',
  'अयोध्याकाण्ड': 'ayodhya-kand',
  'अरण्यकाण्ड': 'aranya-kand',
  'किष्किन्धाकाण्ड': 'kishkindha-kand',
  'सुन्दरकाण्ड': 'sundar-kand',
  'युद्धकाण्ड': 'yuddha-kand',
  'उत्तरकाण्ड': 'uttar-kand',
  'लंकाकाण्ड': 'lanka-kand',
};

function normalizeEpicChapterSlug(granthaId: string, chapterId: string): string {
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

function getChapterSnippet(granthaId: string, chapterId: string) {
  const norm = normalizeEpicChapterSlug(granthaId, chapterId);
  return CHAPTER_SNIPPETS[`${granthaId}:${norm}`] || CHAPTER_SNIPPETS[`${granthaId}:${chapterId}`] || null;
}

function mapPadToEpicChapter(padId: string): { grantha: string; chapter: string; verseId: string } | null {
  if (!padId) return null;
  const clean = decodeURIComponent(padId).trim();

  // 1. Ramcharitmanas (e.g. ramcharitmanas-kand-5-doha-14)
  const rcMatch = clean.match(/^ramcharitmanas(?:-kand)?[-_](\d+|[a-zA-Z]+)(?:[-_](?:doha|chaupai)[-_](\d+.*))?$/i);
  if (rcMatch || clean.startsWith('ramcharitmanas')) {
    const kands = ['', 'bal-kand', 'ayodhya-kand', 'aranya-kand', 'kishkindha-kand', 'sundar-kand', 'lanka-kand', 'uttar-kand'];
    const kNum = rcMatch ? parseInt(rcMatch[1], 10) : 0;
    let kandSlug = '';
    if (kNum >= 1 && kNum <= 7) {
      kandSlug = kands[kNum];
    } else if (/sundar|सुन्दर/i.test(clean)) {
      kandSlug = 'sundar-kand';
    } else if (/bal|बाल/i.test(clean)) {
      kandSlug = 'bal-kand';
    } else if (/ayodhya|अयोध्या/i.test(clean)) {
      kandSlug = 'ayodhya-kand';
    } else if (/aranya|अरण्य/i.test(clean)) {
      kandSlug = 'aranya-kand';
    } else if (/kishkindha|किष्किन्धा/i.test(clean)) {
      kandSlug = 'kishkindha-kand';
    } else if (/lanka|लंका/i.test(clean)) {
      kandSlug = 'lanka-kand';
    } else if (/uttar|उत्तर/i.test(clean)) {
      kandSlug = 'uttar-kand';
    }
    return {
      grantha: 'ramcharitmanas',
      chapter: kandSlug || 'sundar-kand',
      verseId: clean,
    };
  }

  // 2. Valmiki Ramayana (e.g. valmiki-ramayana-5-sarga-4-shlok-12)
  const vrMatch = clean.match(/^valmiki-ramayana(?:-kand)?[-_](\d+)[-_]sarga[-_](\d+)/i);
  if (vrMatch || clean.startsWith('valmiki-ramayana')) {
    const kands = ['', 'bal-kand', 'ayodhya-kand', 'aranya-kand', 'kishkindha-kand', 'sundar-kand', 'yuddha-kand', 'uttar-kand'];
    const kNum = vrMatch ? parseInt(vrMatch[1], 10) : (/sundar|सुन्दर/i.test(clean) ? 5 : 1);
    const sNum = vrMatch ? parseInt(vrMatch[2], 10) : 1;
    const kandSlug = kands[kNum] || 'bal-kand';
    return {
      grantha: 'valmiki-ramayana',
      chapter: `${kandSlug}-sarga-${sNum}`,
      verseId: clean,
    };
  }

  // 3. Shrimad Bhagavatam (e.g. shrimad-bhagwat-skandh-1-adhyay-1-shlok-1)
  const sbMatch = clean.match(/^shrimad-bhagwat[-_]skandh[-_](\d+)[-_]adhyay[-_](\d+)/i) ||
                  clean.match(/^shrimad-bhagavatam[-_]skandh[-_](\d+)[-_]adhyay[-_](\d+)/i);
  if (sbMatch) {
    return {
      grantha: 'shrimad-bhagavatam',
      chapter: `skandh-${sbMatch[1]}-adhyay-${sbMatch[2]}`,
      verseId: clean,
    };
  }

  // 4. Bhagavad Gita (e.g. shrimad-bhagavad-gita-adhyay-1-shlok-1)
  const bgMatch = clean.match(/^(?:shrimad-)?bhagavad-gita[-_]adhyay[-_](\d+)/i) ||
                  clean.match(/^gita[-_]adhyay[-_](\d+)/i);
  if (bgMatch) {
    return {
      grantha: 'bhagavad-gita',
      chapter: `adhyay-${bgMatch[1]}`,
      verseId: clean,
    };
  }

  // 5. Durga Saptashati (e.g. durga-saptashati-adhyay-1-shlok-1)
  const dsMatch = clean.match(/^durga-saptashati[-_]adhyay[-_](\d+)/i);
  if (dsMatch) {
    return {
      grantha: 'durga-saptashati',
      chapter: `adhyay-${dsMatch[1]}`,
      verseId: clean,
    };
  }

  return null;
}

const KNOWN_PADAS_META: Record<string, { title: string; author: string; desc: string; sampleVerse?: string }> = {
  'radheju-merau-janam-sudharau': {
    title: 'राधेजू मेरौ जनम सुधारौ',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'राधेजू मेरौ जनम सुधारौ। नित्य निकुंज रस व किशोरी जी की अनन्य कृपा का पावन पद। वृन्दोपनिषद् 2.0',
    sampleVerse: 'राधेजू मेरौ जनम सुधारौ।\nकरहु कृपा करुणामयी राधे, अपनौ जानि उर धारौ॥',
  },
  'shri-radha-kripa-kataksha-stotram': {
    title: 'श्री राधा कृपा कटाक्ष स्तोत्रम्',
    author: 'उर्ध्वान्नाय तंत्र',
    desc: 'मुनीन्द्रवृन्दवन्दिते त्रिलोकशोकहारिणी। श्री राधा रानी के पावन कृपा कटाक्ष का दिव्य स्तोत्र। वृन्दोपनिषद् 2.0',
    sampleVerse: 'मुनीन्द्रवृन्दवन्दिते त्रिलोकशोकहारिणी, प्रसन्नास्यपङ्कजे निकुञ्जभूविलासिनी।\nव्रजेन्द्रभानुगोपिके नमामि राधिके सदा, कदा करिष्यसीह मां कृपाकटाक्षभाजनम्॥',
  },
  'bainu-maai-baajai-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64': {
    title: 'बैनु मैं बाजै बंसीवट',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'श्री हित चौरासी पद ६४: बैनु मैं बाजै बंसीवट। नित्य विलास व ब्रज रस का अमर पद। वृन्दोपनिषद् 2.0',
    sampleVerse: 'बैनु मैं बाजै बंसीवट।\nसुनत सखी आनंदित भईं, तजि गृह सुख कुल वट॥',
  },
  'bainu-mai-baje-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64': {
    title: 'बैनु मैं बाजै बंसीवट',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'श्री हित चौरासी पद ६४: बैनु मैं बाजै बंसीवट। नित्य विलास व ब्रज रस का अमर पद। वृन्दोपनिषद् 2.0',
    sampleVerse: 'बैनु मैं बाजै बंसीवट।\nसुनत सखी आनंदित भईं, तजि गृह सुख कुल वट॥',
  },
};

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

class ElementAttributeModifier {
  private value: string;
  private attributeName: string;

  constructor(attributeName: string, value: string) {
    this.attributeName = attributeName;
    this.value = value;
  }

  element(el: CFElement) {
    el.setAttribute(this.attributeName, this.value);
  }
}

class ElementTextModifier {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  element(el: CFElement) {
    el.setInnerContent(this.content);
  }
}

class ElementHtmlModifier {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  element(el: CFElement) {
    el.setInnerContent(this.content, { html: true });
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const hostLower = reqUrl.hostname.toLowerCase();
  const isStagingHost = hostLower.endsWith('.pages.dev') || hostLower.includes('vercel.app');
  const isCacheableMethod = request.method === 'GET' || request.method === 'HEAD';

  let edgeCache: any = null;
  let cacheKey: Request | null = null;
  if (isCacheableMethod && !isStagingHost && typeof caches !== 'undefined' && (caches as any).default) {
    try {
      edgeCache = (caches as any).default;
      const cacheUrl = new URL(reqUrl.toString());
      for (const key of Array.from(cacheUrl.searchParams.keys())) {
        if (/^(?:utm_|fbclid$|gclid$|_gl$|mc_)/i.test(key)) {
          cacheUrl.searchParams.delete(key);
        }
      }
      cacheUrl.searchParams.set('_ecv', EDGE_CACHE_VERSION);
      cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
      const cachedHit: Response | undefined = await edgeCache.match(cacheKey);
      if (cachedHit) {
        const hitHeaders = new Headers(cachedHit.headers);
        hitHeaders.set('X-Vrind-Edge-Cache', 'HIT');
        return new Response(request.method === 'HEAD' ? null : cachedHit.body, {
          status: cachedHit.status,
          statusText: cachedHit.statusText,
          headers: hitHeaders,
        });
      }
    } catch {}
  }

  const response = await handleEdgeRequest(context);

  if (
    edgeCache &&
    cacheKey &&
    (response.status === 200 || response.status === 301) &&
    !response.headers.get('Cache-Control')?.includes('no-store')
  ) {
    try {
      const outHeaders = new Headers(response.headers);
      if (response.status === 301 && !outHeaders.get('Cache-Control')) {
        outHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      }
      outHeaders.set('X-Vrind-Edge-Cache', 'MISS');
      const finalResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: outHeaders,
      });
      if (typeof context.waitUntil === 'function') {
        context.waitUntil(edgeCache.put(cacheKey, finalResponse.clone()));
      } else {
        await edgeCache.put(cacheKey, finalResponse.clone());
      }
      return request.method === 'HEAD'
        ? new Response(null, { status: finalResponse.status, statusText: finalResponse.statusText, headers: outHeaders })
        : finalResponse;
    } catch {}
  }

  return response;
};

const handleEdgeRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  const host = url.hostname;
  const isStaging = host.endsWith('.pages.dev') || host.includes('vercel.app');
  const isPathDomain = host === 'path.vrindopnishad.in' || host.startsWith('path.');
  const isApexOrWww = host === 'vrindopnishad.in' || host === 'www.vrindopnishad.in';
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 0. Apex & WWW Canonical 301 Redirection to Primary bhav.vrindopnishad.in
  if (isApexOrWww) {
    const cleanUrl = new URL(`https://bhav.vrindopnishad.in${pathname === '/' ? '' : pathname}${url.search}`);
    return Response.redirect(cleanUrl.toString(), 301);
  }

  // 1. Trailing slash normalization: 301 redirect /path/ to /path
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    const cleanUrl = new URL(request.url);
    cleanUrl.pathname = url.pathname.replace(/\/+$/, '');
    return Response.redirect(cleanUrl.toString(), 301);
  }

  // 2. Dynamic Robots.txt routing per domain (bhav vs path vs staging)
  if (pathname === '/robots.txt') {
    if (isStaging) {
      return new Response('# Staging & Preview Environments - Do Not Index\nUser-agent: *\nDisallow: /\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }

    const robotsBody = [
      '# https://www.robotstxt.org/robotstxt.html',
      '# Vrindopnisad 2.0 - Universal Search & AI Retrieval Directives',
      '',
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /admin/',
      '',
      '# Explicit permissions for Primary Search Engines',
      'User-agent: Googlebot',
      'Allow: /',
      '',
      'User-agent: Bingbot',
      'Allow: /',
      '',
      'User-agent: YandexBot',
      'Allow: /',
      '',
      'User-agent: DuckDuckBot',
      'Allow: /',
      '',
      'User-agent: Baiduspider',
      'Allow: /',
      '',
      'User-agent: Applebot',
      'Allow: /',
      '',
      '# Generative Engine Optimization (GEO) & AI Retrieval Crawlers',
      'User-agent: GPTBot',
      'Allow: /',
      '',
      'User-agent: ChatGPT-User',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
      'Allow: /',
      '',
      'User-agent: ClaudeBot',
      'Allow: /',
      '',
      'User-agent: Claude-Web',
      'Allow: /',
      '',
      'User-agent: Google-Extended',
      'Allow: /',
      '',
      'User-agent: Amazonbot',
      'Allow: /',
      '',
      'User-agent: OAI-SearchBot',
      'Allow: /',
      '',
      'User-agent: cohere-ai',
      'Allow: /',
      '',
      '# Sitemaps & High-Frequency RSS Stream',
      ...(isPathDomain
        ? [
            'Sitemap: https://path.vrindopnishad.in/sitemap.xml',
            'Sitemap: https://path.vrindopnishad.in/feed.xml',
            '',
            'Host: https://path.vrindopnishad.in',
          ]
        : [
            'Sitemap: https://bhav.vrindopnishad.in/sitemap.xml',
            'Sitemap: https://bhav.vrindopnishad.in/sitemap-images.xml',
            'Sitemap: https://bhav.vrindopnishad.in/feed.xml',
            'Sitemap: https://path.vrindopnishad.in/sitemap-path.xml',
            'Sitemap: https://path.vrindopnishad.in/feed.xml',
            '',
            'Host: https://bhav.vrindopnishad.in',
          ]),
      '',
    ].join('\n');

    return new Response(robotsBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  }

  // 3. Intelligent Sitemap Routing & Fix for .xml.gz encoding error
  // Map legacy .xml.gz sitemap requests to canonical uncompressed .xml sitemaps via 301
  if (pathname === '/sitemap-padas.xml.gz' || pathname === '/sitemap-path-padas.xml.gz') {
    return Response.redirect('https://bhav.vrindopnishad.in/sitemap-padas.xml', 301);
  }

  // 3.0 Legacy /sitemaps/* 301 Permanent Redirects
  if (pathname.startsWith('/sitemaps/')) {
    const file = pathname.slice('/sitemaps/'.length).toLowerCase();
    const baseDomain = isPathDomain ? 'https://path.vrindopnishad.in' : 'https://bhav.vrindopnishad.in';
    if (file.includes('saint')) {
      return Response.redirect('https://bhav.vrindopnishad.in/sitemap-saints.xml', 301);
    }
    if (file.includes('grantha')) {
      return Response.redirect(
        isPathDomain
          ? 'https://path.vrindopnishad.in/sitemap-path-granthas.xml'
          : 'https://bhav.vrindopnishad.in/sitemap-granthas.xml',
        301
      );
    }
    if (file.includes('pada')) {
      const partMatch = file.match(/padas?-(\d+)/);
      const part = partMatch ? partMatch[1] : '1';
      return Response.redirect(`https://bhav.vrindopnishad.in/sitemap-padas-${part}.xml`, 301);
    }
    if (file.includes('image')) {
      return Response.redirect('https://bhav.vrindopnishad.in/sitemap-images.xml', 301);
    }
    if (file.includes('main')) {
      return Response.redirect(
        isPathDomain
          ? 'https://path.vrindopnishad.in/sitemap-path-main.xml'
          : 'https://bhav.vrindopnishad.in/sitemap-main.xml',
        301
      );
    }
    return Response.redirect(`${baseDomain}/sitemap.xml`, 301);
  }

  // 3.0b Plural & Legacy Sant-Vaani Route 301 Redirects
  const legacySaintMatch = pathname.match(/^(?:\/(?:hi|en))?\/(?:saints|saint|sants)\/([^/?#]+)/i) ||
    pathname.match(/^\/(?:hi|en)\/sant\/([^/?#]+)/i);
  if (legacySaintMatch) {
    const slug = safeDecodeURIComponent(legacySaintMatch[1]).trim();
    return Response.redirect(`https://bhav.vrindopnishad.in/sant/${encodeURIComponent(slug)}`, 301);
  }

  const legacyGranthaMatch = pathname.match(/^(?:\/(?:hi|en))?\/granthas\/([^/?#]+)/i) ||
    pathname.match(/^\/(?:hi|en)\/grantha\/([^/?#]+)/i);
  if (legacyGranthaMatch) {
    const slug = safeDecodeURIComponent(legacyGranthaMatch[1]).trim();
    const targetHost = EPICS_META[slug] ? 'https://path.vrindopnishad.in' : 'https://bhav.vrindopnishad.in';
    return Response.redirect(`${targetHost}/grantha/${encodeURIComponent(slug)}`, 301);
  }

  const legacyRagaMatch = pathname.match(/^(?:\/(?:hi|en))?\/ragas\/([^/?#]+)/i);
  if (legacyRagaMatch) {
    const slug = safeDecodeURIComponent(legacyRagaMatch[1]).trim();
    return Response.redirect(`https://bhav.vrindopnishad.in/raga/${encodeURIComponent(slug)}`, 301);
  }

  const langGlossaryMatch = pathname.match(/^\/(?:hi|en)\/glossary(\/[^/?#]+)?/i);
  if (langGlossaryMatch) {
    const sub = langGlossaryMatch[1] || '';
    return Response.redirect(`https://bhav.vrindopnishad.in/glossary${sub}`, 301);
  }

  // 3.1 Legacy & indexed verse URL 301 redirects (/lyrics/:id, /hi/lyrics/:id, /content/:id, /verse/:id, /pada/:id, /pad/:id)
  const legacyMatch = pathname.match(/^(?:\/(?:hi|en))?\/(?:lyrics|content|verse|pada|pad)\/([^/?#]+)/i);
  if (legacyMatch) {
    const rawPad = safeDecodeURIComponent(legacyMatch[1]).trim();
    const mappedEpic = mapPadToEpicChapter(rawPad);
    if (mappedEpic) {
      return Response.redirect(
        `https://path.vrindopnishad.in/grantha/${encodeURIComponent(mappedEpic.grantha)}/${encodeURIComponent(mappedEpic.chapter)}`,
        301
      );
    } else {
      const canonicalSingleHop =
        (padaSnippetsObj[rawPad] ? rawPad : null) ||
        padaAliasesObj[rawPad] ||
        padaAliasesObj[rawPad.toLowerCase()] ||
        recoverMissingPadSlug(rawPad) ||
        rawPad;
      const isCleanOnBhav = !isPathDomain && canonicalSingleHop === rawPad && (pathname === `/pad/${encodeURIComponent(rawPad)}` || pathname === `/pad/${rawPad}`);
      if (!isCleanOnBhav) {
        return buildCachedRedirect(
          `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(canonicalSingleHop)}`,
          301
        );
      }
    }
  }

  if (isPathDomain) {
    if (pathname === '/sitemap.xml') {
      const redirectedUrl = new URL('/sitemap-path.xml', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
    if (pathname === '/sitemap-main.xml') {
      const redirectedUrl = new URL('/sitemap-path-main.xml', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
    if (pathname === '/sitemap-granthas.xml') {
      const redirectedUrl = new URL('/sitemap-path-granthas.xml', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
    if (pathname === '/feed.xml' || pathname === '/rss.xml') {
      const redirectedUrl = new URL('/feed-path.xml', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
    // Path domain strictly owns only Mahagranth Parayana (Epics). Keep both domains 100% separate on Google.
    // Clean empty XML sitemap ensures GSC never gets an HTML error or cross-domain redirect.
    if (
      pathname.startsWith('/sitemap-path-padas') ||
      pathname.startsWith('/sitemap-padas') ||
      pathname.startsWith('/sitemap-path-saints') ||
      pathname.startsWith('/sitemap-saints')
    ) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>',
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
          },
        }
      );
    }
  }

  // Fast-path for non-HTML static assets
  const staticExtensions = [
    '.js', '.css', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg',
    '.ico', '.xml', '.gz', '.json', '.webmanifest', '.woff', '.woff2', '.ttf', '.mp3',
  ];
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/data/') ||
    staticExtensions.some((ext) => pathname.endsWith(ext))
  ) {
    const res = await next();

    // Guard: Prevent Cloudflare Pages SPA fallback from returning index.html with 200 OK for missing XML/sitemap files
    // Inspect response body prefix (not just content-type, since _headers forces application/xml on /*.xml)
    if (pathname.endsWith('.xml') || pathname.endsWith('.xml.gz')) {
      const contentTypeHeader = res.headers.get('content-type') || '';
      let isHtmlFallback = contentTypeHeader.includes('text/html');
      if (!isHtmlFallback && pathname.endsWith('.xml')) {
        try {
          const bodyPrefix = (await res.clone().text()).slice(0, 200).trimStart().toLowerCase();
          if (bodyPrefix.startsWith('<!doctype') || bodyPrefix.startsWith('<html')) {
            isHtmlFallback = true;
          }
        } catch {}
      }
      if (isHtmlFallback) {
        return new Response('404 Not Found: XML resource does not exist.', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
    }

    const headers = new Headers(res.headers);
    if (isStaging) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    } else if (res.status === 200) {
      // Maximize Cloudflare CDN Cache Hit Rate
      if (
        pathname.startsWith('/assets/') ||
        (pathname.startsWith('/data/') && !pathname.endsWith('manifest.json') && !pathname.endsWith('catalog.json'))
      ) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('CDN-Cache-Control', 'public, max-age=31536000');
        headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=31536000');
      } else if (pathname.endsWith('.xml') || pathname.endsWith('.txt')) {
        headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
        headers.set('CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      }
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // Clean static route parsing: /pad/:id, /sant/:id(/page/:n), /grantha/:id(/page/:n), /grantha/:id/:ch, pillar paths
  let pathPad: string | null = null;
  let pathGrantha: string | null = null;
  let pathChapter: string | null = null;
  let pathAuthor: string | null = null;
  let granthaPageNum = 1;
  let saintPageNum = 1;
  let isPaginatedGrantha = false;
  let isPaginatedSaint = false;

  if (pathname.startsWith('/pad/')) {
    pathPad = decodeURIComponent(pathname.slice(5)).trim();
  } else if (pathname.startsWith('/sant/') || pathname.startsWith('/author/')) {
    const sub = pathname.replace(/^\/(?:sant|author)\//, '');
    const parts = sub.split('/').map((p) => decodeURIComponent(p).trim()).filter(Boolean);
    if (parts.length === 3 && parts[1] === 'page' && /^\d+$/.test(parts[2])) {
      pathAuthor = parts[0];
      saintPageNum = Math.max(1, parseInt(parts[2], 10));
      isPaginatedSaint = true;
    } else {
      pathAuthor = decodeURIComponent(sub).trim();
    }
  } else if (pathname.startsWith('/grantha/')) {
    const rawParts = pathname.slice(9).split('/').filter(Boolean);
    const parts = pathname.slice(9).split('/').map((p) => decodeURIComponent(p).trim()).filter(Boolean);
    if (parts.length === 3 && parts[1] === 'page' && /^\d+$/.test(parts[2])) {
      pathGrantha = parts[0];
      granthaPageNum = Math.max(1, parseInt(parts[2], 10));
      isPaginatedGrantha = true;
    } else if (parts.length >= 2) {
      pathGrantha = parts[0];
      pathChapter = parts.slice(1).join('/');
      // If chapter contains percent-encoding or non-ASCII Devanagari or non-canonical format, 301 redirect to clean Hinglish!
      if (pathGrantha === 'valmiki-ramayana' || pathGrantha === 'ramcharitmanas') {
        const cleanCh = normalizeEpicChapterSlug(pathGrantha, pathChapter);
        const rawCh = rawParts.slice(1).join('/');
        if (cleanCh && (rawCh !== cleanCh || rawCh.includes('%') || /[^\x00-\x7F]/.test(rawCh))) {
          return Response.redirect(`https://path.vrindopnishad.in/grantha/${encodeURIComponent(pathGrantha)}/${encodeURIComponent(cleanCh)}`, 301);
        }
      }
    } else if (parts.length === 1) {
      pathGrantha = parts[0];
    }
  }

  // Parse queries and determine active domain & tab
  const qTab = url.searchParams.get('tab');
  const qPad = url.searchParams.get('pad') || pathPad;
  const qGrantha = url.searchParams.get('grantha') || pathGrantha;
  const qAuthor = url.searchParams.get('author') || pathAuthor;
  const qChapter = url.searchParams.get('chapter') || pathChapter;

  // 3b. Legacy Slug 301 Permanent Redirects (converts non-ASCII/encoded slugs to clean Hinglish ASCII)
  const rawPadTarget = qPad || pathPad;
  if (rawPadTarget && !isStaging) {
    const decodedPadTarget = safeDecodeURIComponent(rawPadTarget).trim().toLowerCase();
    const candidateRedirect =
      (legacySlugRedirectsData as Record<string, string>)[rawPadTarget] ||
      (legacySlugRedirectsData as Record<string, string>)[decodedPadTarget];
    if (candidateRedirect && candidateRedirect !== rawPadTarget) {
      const resolvedRedirect =
        padaAliasesObj[candidateRedirect] ||
        padaAliasesObj[rawPadTarget] ||
        padaAliasesObj[decodedPadTarget] ||
        candidateRedirect;
      const isResolvableTarget = Boolean(
        padaSnippetsObj[resolvedRedirect] ||
        KNOWN_PADAS_META[resolvedRedirect] ||
        mapPadToEpicChapter(resolvedRedirect)
      );
      if (isResolvableTarget) {
        return Response.redirect(`https://bhav.vrindopnishad.in/pad/${encodeURIComponent(resolvedRedirect)}`, 301);
      }
    }
  }

  // 4. Cross-Domain 301 Permanent Redirects for duplicated URLs
  const epicPad = qPad ? mapPadToEpicChapter(qPad) : null;

  if (isPathDomain && !isStaging) {
    // path.vrindopnishad.in owns ONLY Mahagranth Parayana (epics & chapters)
    const guideSlugOnPath = pathname.replace(/^\/+/, '');
    if (
      pathname === '/rasik-saints-of-vrindavan' ||
      pathname === '/vrindavan-ashtayama-seva-darshan-timings' ||
      pathname === '/rasik-vani-granthas-list' ||
      pathname === '/online-tulsi-mala-naam-jap' ||
      pathname === '/rituals' ||
      pathname === '/places' ||
      pathname === '/stories' ||
      pathname === '/biographies' ||
      pathname.startsWith('/ritual/') ||
      pathname.startsWith('/place/') ||
      pathname.startsWith('/story/') ||
      pathname.startsWith('/bio/') ||
      pathname === '/ragas' ||
      pathname.startsWith('/raga/') ||
      pathname === '/themes' ||
      pathname.startsWith('/theme/') ||
      pathname === '/glossary' ||
      pathname.startsWith('/glossary/') ||
      Boolean(TOPICAL_GUIDES_META[guideSlugOnPath])
    ) {
      return Response.redirect(`https://bhav.vrindopnishad.in${pathname}${url.search}`, 301);
    }
    if (qGrantha && EPICS_META[qGrantha]) {
      // Epics belong strictly to path.vrindopnishad.in.
      if (qTab && qTab !== 'granthas') {
        const target = new URL(url.toString());
        target.searchParams.set('tab', 'granthas');
        return Response.redirect(target.toString(), 301);
      }
    } else if (epicPad) {
      return Response.redirect(
        `https://path.vrindopnishad.in/grantha/${encodeURIComponent(epicPad.grantha)}/${encodeURIComponent(epicPad.chapter)}`,
        301
      );
    } else {
      if (qGrantha && !EPICS_META[qGrantha]) {
        return Response.redirect(`https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}`, 301);
      }
      if (pathname.startsWith('/grantha/')) {
        const segs = pathname.slice('/grantha/'.length).split('/').filter(Boolean);
        const gName = segs[0] ? decodeURIComponent(segs[0]) : '';
        if (gName && !EPICS_META[gName]) {
          return Response.redirect(`https://bhav.vrindopnishad.in${url.pathname}${url.search}`, 301);
        }
      }
      if (qTab && qTab !== 'granthas') {
        return Response.redirect(`https://bhav.vrindopnishad.in${url.search}`, 301);
      }
      if (qPad) {
        return Response.redirect(`https://bhav.vrindopnishad.in/pad/${encodeURIComponent(qPad)}`, 301);
      }
      if (qAuthor) {
        return Response.redirect(`https://bhav.vrindopnishad.in/sant/${encodeURIComponent(qAuthor)}`, 301);
      }
      if (pathname === '/padavali' || pathname.startsWith('/pad/')) {
        return Response.redirect(`https://bhav.vrindopnishad.in${url.pathname}${url.search}`, 301);
      }
      if (pathname === '/feed' || pathname === '/milestones' || pathname === '/smaran') {
        return Response.redirect(`https://bhav.vrindopnishad.in${url.pathname}${url.search}`, 301);
      }
    }
  } else if (!isPathDomain && !isStaging) {
    // bhav.vrindopnishad.in redirects direct deep epic requests to path.vrindopnishad.in
    if (pathname === '/granthas') {
      return Response.redirect('https://path.vrindopnishad.in/', 301);
    }
    if (pathname === '/grantha/all') {
      return Response.redirect('https://bhav.vrindopnishad.in/rasik-vani-granthas-list', 301);
    }
    if (qGrantha && EPICS_META[qGrantha]) {
      const cleanCh = qChapter ? normalizeEpicChapterSlug(qGrantha, qChapter) : '';
      const targetChapter = cleanCh ? `/${encodeURIComponent(cleanCh)}` : '';
      return Response.redirect(`https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}${targetChapter}`, 301);
    }
    if (epicPad) {
      return Response.redirect(
        `https://path.vrindopnishad.in/grantha/${encodeURIComponent(epicPad.grantha)}/${encodeURIComponent(epicPad.chapter)}`,
        301
      );
    }
  }

  let activeTab = isPathDomain ? 'granthas' : 'smaran';
  if (qTab && ['smaran', 'padavali', 'granthas', 'feed', 'milestones'].includes(qTab)) {
    activeTab = qTab;
  } else if (qPad || qAuthor) {
    activeTab = 'padavali';
  } else if (qGrantha) {
    if (EPICS_META[qGrantha]) {
      activeTab = 'granthas';
    } else {
      activeTab = 'padavali';
    }
  } else if (pathname === '/granthas') {
    activeTab = 'granthas';
  } else if (pathname === '/padavali' || pathname.startsWith('/pad/')) {
    activeTab = 'padavali';
  } else if (pathname === '/feed') {
    activeTab = 'feed';
  } else if (pathname === '/milestones') {
    activeTab = 'milestones';
  }

  // Canonical base domain
  const isGranthasParayana = activeTab === 'granthas' || (qGrantha && EPICS_META[qGrantha]);
  const canonicalBaseDomain = isGranthasParayana ? 'https://path.vrindopnishad.in' : 'https://bhav.vrindopnishad.in';

  // 5. Fetch HTML response from Pages CDN
  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Build entity SEO metadata and Schema.org graph
  let title = 'वृन्दोपनिषद् 2.0 • Sacred Vrindavan Ras Sanctuary & Canonical Pada Literature';
  let description = 'Digital sanctuary for Nitya Nikunj Ras. Explore 44,000+ canonical Braj Ras verses, Hit Chaurasi, Radha Sudha Nidhi, Kelimal, Ashtayama daily seva schedule, and contemplative dhyana sadhana.';
  const cleanSearchParams = new URLSearchParams(url.searchParams);
  for (const key of Array.from(cleanSearchParams.keys())) {
    if (/^(?:utm_|fbclid$|gclid$|_gl$|mc_)/i.test(key)) {
      cleanSearchParams.delete(key);
    }
  }
  const cleanSearch = cleanSearchParams.toString();
  let canonicalUrl = `${canonicalBaseDomain}${pathname === '/' ? '/' : pathname}${cleanSearch ? `?${cleanSearch}` : ''}`;
  let entitySchema: Record<string, unknown> | null = null;
  const extraSchemas: Record<string, unknown>[] = [];
  let customKeywords: string | null = null;
  let dynamicRootHtml: string | null = null;
  let hasPrerenderedStaticRoot = false;
  let prevLinkUrl: string | null = null;
  let nextLinkUrl: string | null = null;

  const padId = qPad || pathPad;

  if (padId) {
    const cleanPadId = safeDecodeURIComponent(padId).trim();
    const strippedPadId = cleanPadId.replace(/\.+$/, '');
    const lowerPadId = strippedPadId.toLowerCase();
    const effectiveSlug =
      padaAliasesObj[cleanPadId] ||
      padaAliasesObj[padId] ||
      padaAliasesObj[strippedPadId] ||
      padaAliasesObj[lowerPadId] ||
      cleanPadId;
    const strippedEffective = effectiveSlug.replace(/\.+$/, '');
    const snippet =
      padaSnippetsObj[effectiveSlug] ||
      padaSnippetsObj[strippedEffective] ||
      padaSnippetsObj[cleanPadId] ||
      padaSnippetsObj[strippedPadId] ||
      padaSnippetsObj[lowerPadId] ||
      padaSnippetsObj[padId];
    const known =
      KNOWN_PADAS_META[cleanPadId] ||
      KNOWN_PADAS_META[strippedPadId] ||
      KNOWN_PADAS_META[padId] ||
      KNOWN_PADAS_META[effectiveSlug];

    if (!snippet && !known) {
      const recoveredSlug = recoverMissingPadSlug(cleanPadId);
      if (recoveredSlug && padaSnippetsObj[recoveredSlug]) {
        return buildCachedRedirect(
          `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(recoveredSlug)}`,
          301
        );
      }
      return notFoundResponse('यह पावन पद उपलब्ध नहीं है (Pad Not Found)');
    }

    const canonicalPadSlug = snippet && strippedEffective && padaSnippetsObj[strippedEffective]
      ? strippedEffective
      : cleanPadId;

    const padTitle = known?.title || snippet?.[0] || formatSlug(cleanPadId);
    const padAuthor = known?.author || snippet?.[1] || 'रसिक संत';
    const granthaId = snippet?.[2] || '';
    const granthaMeta = granthaId ? GRANTHAS_MAP.get(granthaId) : null;
    const granthaLabel = granthaMeta?.name || 'रसिक वाणी संग्रह';
    const granthaCategory = 'रसिक वाणी संग्रह';
    const openingVerse = known?.sampleVerse || snippet?.[3] || '';
    const prevSlug = snippet?.[4] || '';
    const nextSlug = snippet?.[5] || '';
    const ragName = snippet?.[6] || '';
    const prevEffective = (prevSlug && padaAliasesObj[prevSlug]) || prevSlug;
    const nextEffective = (nextSlug && padaAliasesObj[nextSlug]) || nextSlug;
    const prevTitle = prevSlug && padaSnippetsObj[prevEffective] ? padaSnippetsObj[prevEffective][0] : '';
    const nextTitle = nextSlug && padaSnippetsObj[nextEffective] ? padaSnippetsObj[nextEffective][0] : '';
    const romanTitle = formatSlug(canonicalPadSlug);

    ensureCrawlIndex();
    const granthaPadasForRelated = (granthaId && granthaCrawlMap[granthaId]) ? granthaCrawlMap[granthaId] : [];
    const relatedPadas = granthaPadasForRelated.filter(([s]) => s !== cleanPadId && s !== padId && s !== effectiveSlug).slice(0, 6);

    const titleClean = padTitle.split(' - ')[0].trim();
    title = `${titleClean} - ${padAuthor} | लिरिक्स व भावार्थ सहित • ${granthaLabel} - वृन्दोपनिषद्`;
    const firstLinePreview = openingVerse ? openingVerse.split('\n')[0].trim() : titleClean;
    description = openingVerse
      ? `«${firstLinePreview.slice(0, 90)}» पढ़िए ${titleClean} का प्रामाणिक मूल पाठ, भावार्थ व अर्थ सहित। रचयिता: ${padAuthor} (${granthaLabel})। नित्य निकुंज रस व दिव्य स्वाध्याय।`
      : `पढ़िए ${titleClean} (${granthaLabel}) का प्रामाणिक मूल पाठ, भावार्थ व नित्य अनुशीलन। रचयिता: ${padAuthor}। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(canonicalPadSlug)}`;

    customKeywords = [
      padTitle,
      padAuthor,
      granthaLabel,
      `${romanTitle} lyrics`,
      `${romanTitle} in hindi`,
      `${romanTitle} meaning`,
      `${padTitle} lyrics`,
      `${padTitle} अर्थ`,
      `${padTitle} भावार्थ`,
      'vrindavan ras vani',
      'radha rasik vani',
      'hit chaurasi padas',
      'braj ras padavali',
      'vrindopnisad',
    ].join(', ');

    const authorSameAs = getSaintSameAs(padAuthor);
    const padAudioPath = snippet?.[7] || undefined;
    const padAudioUrl = padAudioPath
      ? (padAudioPath.startsWith('http') ? padAudioPath : `https://bhav.vrindopnishad.in${padAudioPath}`)
      : undefined;
    if (PRERENDERED_PAD_SLUGS.has(cleanPadId) || PRERENDERED_PAD_SLUGS.has(effectiveSlug)) {
      hasPrerenderedStaticRoot = true;
    }

    entitySchema = {
      '@type': 'CreativeWork',
      '@id': `${canonicalUrl}#creativework`,
      'headline': padTitle,
      'name': padTitle,
      'alternativeHeadline': `${romanTitle} Lyrics in Hindi & Braj Bhasha`,
      'image': 'https://bhav.vrindopnishad.in/assets/temples/banke-bihari-v2.webp',
      'author': {
        '@type': 'Person',
        'name': padAuthor,
        ...(authorSameAs ? { 'sameAs': authorSameAs } : {}),
      },
      'genre': 'Sacred Braj Ras Literature',
      'inLanguage': ['hi', 'sa', 'en'],
      'text': openingVerse || padTitle,
      'speakable': {
        '@type': 'SpeakableSpecification',
        'cssSelector': ['.verse-body', '.sanctuary-ssr-title'],
      },
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'वृन्दोपनिषद् 2.0 (Vrindopnishad)',
        'url': 'https://bhav.vrindopnishad.in/',
      },
      ...(padAudioUrl ? {
        'audio': {
          '@id': `${canonicalUrl}#audio`,
        },
      } : {}),
    };

    if (padAudioUrl) {
      extraSchemas.push({
        '@type': 'AudioObject',
        '@id': `${canonicalUrl}#audio`,
        'name': `${padTitle} • Sacred Audio Recitation`,
        'contentUrl': padAudioUrl,
        'encodingFormat': 'audio/mpeg',
        'inLanguage': 'hi',
      });
    }

    if (ragName) {
      extraSchemas.push({
        '@type': 'MusicComposition',
        '@id': `${canonicalUrl}#composition`,
        'name': padTitle,
        'composer': {
          '@type': 'Person',
          'name': padAuthor,
          ...(authorSameAs ? { 'sameAs': authorSameAs } : {}),
        },
        'inLanguage': 'hi',
        'musicalKey': `राग ${ragName}`,
        'text': openingVerse || padTitle,
      });
    }

    const authorSaint = SAINTS_MAP.get(padAuthor) || SAINTS_MAP.get(padAuthor.toLowerCase());
    const saintLink = authorSaint?.slug ? `/sant/${encodeURIComponent(authorSaint.slug)}` : '/rasik-saints-of-vrindavan';
    const granthaLink = granthaId ? `/grantha/${encodeURIComponent(granthaId)}` : '/rasik-vani-granthas-list';

    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'वृन्दोपनिषद् 2.0',
          'item': 'https://bhav.vrindopnishad.in/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': granthaLabel,
          'item': granthaId ? `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(granthaId)}` : 'https://bhav.vrindopnishad.in/rasik-vani-granthas-list',
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': padTitle,
          'item': canonicalUrl,
        },
      ],
    });

    extraSchemas.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      'mainEntity': [
        {
          '@type': 'Question',
          'name': `${titleClean} के रचयिता कौन हैं और यह किस परंपरा का अंग है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `इस पावन पद के रचयिता परम पूज्य ${padAuthor} जी हैं। यह पद श्री धाम वृन्दावन की नित्य निकुंज रस उपासना परंपरा का पावन अंग है।`,
          },
        },
        {
          '@type': 'Question',
          'name': `यह पद किस राग व पावन संग्रह में संकलित है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `यह पद '${granthaLabel}' संग्रह में संकलित है${ragName ? ` और शास्त्रीय राग ${ragName} में निबद्ध है` : ''}। रसिक संतों द्वारा इसका गायन अत्यंत प्रेम व भावपूर्ण रीति से किया जाता है।`,
          },
        },
        {
          '@type': 'Question',
          'name': `${titleClean} का आध्यात्मिक भावार्थ क्या है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `${titleClean} में श्री प्रिया-प्रियतम (श्रीराधा-कृष्ण) के नित्य निकुंज विलास, अनन्य प्रेम, रूप-माधुरी एवं युगल चरण शरणागति का अनुपम निरूपण है।`,
          },
        },
        {
          '@type': 'Question',
          'name': `क्या वृन्दोपनिषद् पर इस पद का शुद्ध मूल पाठ उपलब्ध है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `हाँ, वृन्दोपनिषद् 2.0 पर ${titleClean} का संपूर्ण प्रामाणिक पाठ, शुद्ध देवनागरी लिपि, रचयिता परिचय, संबंधित पद व भावार्थ नित्य स्वाध्याय हेतु उपलब्ध है।`,
          },
        },
      ],
    });

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', Georgia, serif; color: #1c1917; line-height: 1.8;">
        <!-- Breadcrumb Navigation with Microdata -->
        <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem;">
          <ol itemscope itemtype="https://schema.org/BreadcrumbList" style="display: flex; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; gap: 0.5rem; color: #b45309;">
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <a itemprop="item" href="/" style="color: #b45309; text-decoration: none;"><span itemprop="name">वृन्दोपनिषद् 2.0</span></a>
              <meta itemprop="position" content="1" />
            </li>
            <li style="color: #d97706;">&rsaquo;</li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <a itemprop="item" href="${granthaLink}" style="color: #b45309; text-decoration: none;"><span itemprop="name">${granthaLabel}</span></a>
              <meta itemprop="position" content="2" />
            </li>
            <li style="color: #d97706;">&rsaquo;</li>
            <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <span itemprop="name" style="color: #78716c;">${padTitle}</span>
              <meta itemprop="position" content="3" />
            </li>
          </ol>
        </nav>

        <!-- Article Header -->
        <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
            <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e;">${granthaCategory}</span>
            <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fae8ff; color: #86198f;">${granthaLabel}</span>
          </div>
          <h1 class="sanctuary-ssr-title" style="font-size: 2.25rem; font-weight: 700; line-height: 1.25; color: #1c1917; margin: 0 0 0.5rem 0;">${padTitle}</h1>
          <p style="font-size: 1rem; color: #78716c; margin: 0;">रचयिता: <strong style="color: #b45309;">${padAuthor}</strong> • पावन वाणी संग्रह: <strong>${granthaLabel}</strong></p>
          <p style="font-size: 0.85rem; color: #a8a29e; margin-top: 0.25rem;">Hinglish / Roman: <em>${romanTitle}</em> • भाषा: ब्रजभाषा / संस्कृत</p>
        </header>

        <!-- Sequential Crawl Navigation (Bidirectional Mesh) -->
        ${(prevSlug || nextSlug) ? `
        <nav class="pad-navigation" aria-label="पद क्रम नेविगेशन" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; padding: 1rem 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem;">
          ${prevSlug ? `<a href="/pad/${encodeURIComponent(prevSlug)}" style="color: #b45309; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;"><span>&larr;</span> <span>पिछला पद: ${prevTitle || 'पूर्व पद'}</span></a>` : '<span></span>'}
          ${nextSlug ? `<a href="/pad/${encodeURIComponent(nextSlug)}" style="color: #b45309; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;"><span>अगला पद: ${nextTitle || 'अग्रिम पद'}</span> <span>&rarr;</span></a>` : '<span></span>'}
        </nav>
        ` : ''}

        <!-- Authentic Sacred Verse Body -->
        <section class="verse-body" style="font-size: 1.35rem; line-height: 2.1; color: #292524; background: linear-gradient(180deg, #fffbeb 0%, #fef9c3 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #fde68a; white-space: pre-line; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.06); text-align: center;">
          ${openingVerse || `${padTitle} के पावन पद का अखंड स्वाध्याय व चिंतन।`}
        </section>

        <!-- Devotional Engagement Action Bar (WhatsApp Share, Jap, Bhavarth) -->
        <div class="devotional-action-bar" style="margin-top: 1rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem;">
          <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`🌸 ${padTitle} (${padAuthor})\n«${openingVerse.split('\n')[0] || ''}»\n📖 पूरा पद, भावार्थ व व्याख्या यहाँ पढ़ें:\nhttps://bhav.vrindopnishad.in/pad/${encodeURIComponent(cleanPadId)}`)}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #25d366; color: #ffffff; border-radius: 9999px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">
            <span>💬 व्हाट्सएप पर साझा करें</span>
          </a>
          <a href="/online-tulsi-mala-naam-jap" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; border: 1px solid #fde68a; color: #78350f; border-radius: 9999px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">
            <span>📿 नित्य नाम जप माला</span>
          </a>
          <a href="#pad-bhavarth" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; border: 1px solid #fde68a; color: #78350f; border-radius: 9999px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">
            <span>📖 भावार्थ व साधना</span>
          </a>
        </div>

        <!-- Spiritual Essence Card (Core Devotional Takeaway) -->
        <section style="margin-top: 1.5rem; background: #fffdf5; border: 1px solid #fed7aa; border-radius: 0.75rem; padding: 1.25rem;">
          <h2 style="font-size: 1.15rem; font-weight: 700; color: #9a3412; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>💎 पद का मुख्य आध्यात्मिक भाव (Spiritual Essence)</span>
          </h2>
          <div style="font-size: 0.95rem; line-height: 1.8; color: #431407;">
            <p style="margin: 0 0 0.5rem 0;">
              <strong>रस निष्पत्ति:</strong> श्री वृन्दावन नित्य निकुंज रस • <strong>भाव धारा:</strong> अनन्य शरणागति एवं युगल चरणानुराग
            </p>
            <p style="margin: 0; color: #7c2d12;">
              ${padAuthor} जी कृत यह वाणी साधक के चित्त से लौकिक वासनाओं का शमन कर श्रीराधा-माधव के अलौकिक प्रेम-राज्य में प्रवेश कराती है। नित्य पाठ व मनन से अंतःकरण में वृन्दावन रज व नाम-स्मरण के प्रति अनन्य निष्ठा जाग्रत होती है।
            </p>
          </div>
        </section>

        <!-- Sacred Meaning / Spiritual Context -->
        <section id="pad-bhavarth" style="margin-top: 1.5rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #f5f5f4; padding: 1.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">पावन भाव व अनुशीलन</h2>
          <p style="font-size: 1rem; line-height: 1.8; color: #44403c; margin: 0;">
            <strong>«${padTitle}»</strong> श्री धाम वृन्दावन की पावन <em>${granthaLabel}</em> परंपरा का अनुपम दिव्य पद है। इस पावन पद की रचना परम रसिक संत <strong>${padAuthor}</strong> जी द्वारा ${ragName ? `राग <strong>${ragName}</strong> में निबद्ध कर ` : ''}की गई है। इसमें श्री प्रिया-प्रियतम (श्रीराधा-कृष्ण) के नित्य निकुंज रस, परम विलास, अहैतुकी प्रीति एवं युगल चरण शरणागति का पावन गान है। नित्य अनुशीलन व चिंतन से यह वाणी चित्त को निर्मल कर भगवद्भाव में लीन करती है।
          </p>
        </section>

        <!-- Structured Metadata Table (GeeksforGeeks-Style Schema Table) -->
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">ग्रंथ एवं संत विवरण</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; border: 1px solid #e7e5e4;">
            <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">पद शीर्षक (Title)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">${padTitle} (${romanTitle})</td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">रचयिता (Author)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="${saintLink}" style="color: #b45309; text-decoration: underline;">${padAuthor}</a></td></tr>
            <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">संग्रह (Grantha)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="${granthaLink}" style="color: #b45309; text-decoration: underline;">${granthaLabel}</a></td></tr>
            ${ragName ? `<tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">राग (Raga)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">राग ${ragName}</td></tr>` : ''}
            <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">साधना धारा (Tradition)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">श्री वृन्दावन नित्य निकुंज रस उपासना</td></tr>
          </table>
        </section>

        <!-- Related Padas in Same Grantha (Exponential Spidering Mesh) -->
        ${relatedPadas.length > 0 ? `
        <section style="margin-top: 2rem; background: #ffffff; padding: 1.5rem; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 1rem 0;">📖 ${granthaLabel} के अन्य पावन पद</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem;">
            ${relatedPadas.map(([rSlug, rTitle]) => `
              <a href="/pad/${encodeURIComponent(rSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem; font-weight: 500;">
                ${rTitle} &rarr;
              </a>
            `).join('')}
          </div>
        </section>
        ` : ''}

        <!-- Google FAQ Rich Snippets Section -->
        <section style="margin-top: 2rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; padding: 1.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #92400e; margin: 0 0 1rem 0;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${padTitle} के रचयिता कौन हैं और यह किस परंपरा का अंग है?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">इस पावन पद के रचयिता <strong>${padAuthor}</strong> जी हैं। यह पद श्री धाम वृन्दावन की नित्य निकुंज रस उपासना परंपरा का पावन अंग है।</p>
          </details>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">यह पद किस राग व पावन संग्रह में संकलित है?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">यह पद <strong>${granthaLabel}</strong> संग्रह का पावन अंग है${ragName ? ` और शास्त्रीय राग <strong>${ragName}</strong> में निबद्ध है` : ''}।</p>
          </details>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">इस पद का मुख्य आध्यात्मिक भाव क्या है?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">इस पद में श्री प्रिया-प्रियतम (श्रीराधा-कृष्ण) के नित्य निकुंज विलास, अनन्य प्रेम, रूप-माधुरी एवं युगल चरण शरणागति का अनुपम निरूपण है।</p>
          </details>
          <details open style="padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">क्या वृन्दोपनिषद् पर इस पद का शुद्ध मूल पाठ उपलब्ध है?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">हाँ, वृन्दोपनिषद् 2.0 पर <strong>${padTitle}</strong> का संपूर्ण प्रामाणिक पाठ, शुद्ध देवनागरी लिपि, रचयिता परिचय, संबंधित पद व भावार्थ नित्य स्वाध्याय हेतु उपलब्ध है।</p>
          </details>
        </section>

        <!-- Internal Cross-Linking Grid (Zero Dead Ends for Crawlers) -->
        <section style="margin-top: 2rem; padding: 1.5rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #e7e5e4;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #44403c; margin: 0 0 1rem 0;">संबंधित पावन पद व स्वाध्याय</h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <li><a href="${granthaLink}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📖 ${granthaLabel} के समस्त पद &rarr;</a></li>
            <li><a href="${saintLink}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 ${padAuthor} की समस्त पावन रचनाएँ &rarr;</a></li>
            <li><a href="/feed" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🛕 श्री धाम वृन्दावन मंदिर दर्शन &rarr;</a></li>
            <li><a href="/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📿 नित्य अष्टयाम सेवा व नाम जप &rarr;</a></li>
          </ul>
        </section>

        <!-- Footer Colophon -->
        <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e7e5e4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span>वृन्दोपनिषद् 2.0 • Digital Sanctuary for Nitya Nikunj Ras</span>
          <a href="${canonicalUrl}" style="color: #b45309; text-decoration: underline;">मूल पाठ व स्वाध्याय</a>
        </footer>
      </article>
    `;
  } else if (qAuthor) {
    const saint = SAINTS_MAP.get(qAuthor) || SAINTS_MAP.get(decodeURIComponent(qAuthor).trim()) || SAINTS_MAP.get(qAuthor.toLowerCase());
    const saintName = saint ? saint.name : formatSlug(qAuthor);
    const saintCanonicalSlug = saint?.slug || qAuthor;
    const tradition = saint?.tradition ? ` (${saint.tradition})` : '';
    const bio = saint?.biography ? `${saint.biography} ` : '';

    ensureCrawlIndex();
    let saintPadas: [string, string][] = saintCrawlMap[saintName] || [];
    if (saintPadas.length === 0 && saint?.name) {
      saintPadas = saintCrawlMap[saint.name] || [];
    }
    if (saintPadas.length === 0) {
      const targetClean = (saintName || '').replace(/^(श्री|जगद्गुरु|स्वामी|संत|गोस्वामी)\s*/g, '').trim().toLowerCase();
      for (const [key, padas] of Object.entries(saintCrawlMap)) {
        const keyClean = key.replace(/^(श्री|जगद्गुरु|स्वामी|संत|गोस्वामी)\s*/g, '').trim().toLowerCase();
        if (keyClean && (keyClean.includes(targetClean) || targetClean.includes(keyClean))) {
          saintPadas = padas;
          break;
        }
      }
    }

    if (!saint && saintPadas.length === 0) {
      const lowerSaint = safeDecodeURIComponent(qAuthor).trim().toLowerCase();
      const strippedSaint = lowerSaint.replace(/-\d+$/, '');
      const aliasHit = SAINT_ALIASES[lowerSaint] || SAINT_ALIASES[strippedSaint];
      if (aliasHit) {
        const dest =
          aliasHit.kind === 'sant'
            ? `/sant/${encodeURIComponent(aliasHit.target)}`
            : aliasHit.kind === 'pad'
              ? `/pad/${encodeURIComponent(aliasHit.target)}`
              : aliasHit.kind === 'grantha'
                ? `/grantha/${encodeURIComponent(aliasHit.target)}`
                : `/${aliasHit.target}`;
        return buildCachedRedirect(`https://bhav.vrindopnishad.in${dest}`, 301);
      }
      const noHonorific = strippedSaint.replace(/^(?:shri|sri|sant|goswami|swami)-/, '');
      const matchedSaint = SAINTS_MAP.get(noHonorific) || SAINTS_MAP.get(`${noHonorific}-ji`);
      if (matchedSaint) {
        return buildCachedRedirect(
          `https://bhav.vrindopnishad.in/sant/${encodeURIComponent(matchedSaint.slug || noHonorific)}`,
          301
        );
      }
      return notFoundResponse('यह रसिक संत पृष्ठ उपलब्ध नहीं है (Saint Not Found)');
    }

    const PAGE_SIZE = 100;
    const totalSaintPadas = saintPadas.length;
    const totalSaintPages = Math.max(1, Math.ceil(totalSaintPadas / PAGE_SIZE));
    if (isPaginatedSaint && saintPageNum > totalSaintPages) {
      return notFoundResponse('संत पदावली पृष्ठ उपलब्ध नहीं है (Page Not Found)');
    }
    const currentSaintPage = isPaginatedSaint ? saintPageNum : 1;
    const pagedSaintPadas = saintPadas.slice((currentSaintPage - 1) * PAGE_SIZE, currentSaintPage * PAGE_SIZE);
    const saintBaseUrl = `https://bhav.vrindopnishad.in/sant/${encodeURIComponent(saintCanonicalSlug)}`;
    if (currentSaintPage > 1) {
      prevLinkUrl = currentSaintPage === 2 ? saintBaseUrl : `${saintBaseUrl}/page/${currentSaintPage - 1}`;
    }
    if (currentSaintPage < totalSaintPages) {
      nextLinkUrl = `${saintBaseUrl}/page/${currentSaintPage + 1}`;
    }
    if (!isPaginatedSaint && PRERENDERED_SAINT_SLUGS.has(saintCanonicalSlug)) {
      hasPrerenderedStaticRoot = true;
    }

    title = `${saintName}${currentSaintPage > 1 ? ` (पृष्ठ ${currentSaintPage})` : ''} | रसिक जीवन चरित्र, वाणियाँ व समस्त पद • वृन्दोपनिषद्`;
    description = `परम पूज्य ${saintName} जी का प्रामाणिक जीवन चरित्र, निकुंज उपासना, संप्रदाय${saint?.tradition ? ` (${saint.tradition})` : ''} एवं समस्त ${totalSaintPadas} पावन पदों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = currentSaintPage > 1 ? `${saintBaseUrl}/page/${currentSaintPage}` : saintBaseUrl;

    const saintSameAs = getSaintSameAs(saintName);

    entitySchema = {
      '@type': 'ProfilePage',
      'headline': `${saintName} - रसिक संत परंपरा`,
      'mainEntity': {
        '@type': 'Person',
        'name': saintName,
        'description': saint?.biography || `${saintName} - ब्रज निकुंज रस व पावन वाणी के प्रणेता।`,
        ...(saint?.tradition ? { 'knowsAbout': saint.tradition } : {}),
        ...(saintSameAs ? { 'sameAs': saintSameAs } : {}),
      },
    };

    const saintPaginationHtml = totalSaintPages > 1 ? `
      <nav aria-label="Pagination" style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
        ${prevLinkUrl ? `<a href="${prevLinkUrl}" style="padding: 0.4rem 0.85rem; background: #fef3c7; color: #92400e; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">&larr; पिछला पृष्ठ</a>` : ''}
        <span style="font-size: 0.9rem; color: #78716c;">पृष्ठ ${currentSaintPage} / ${totalSaintPages} (कुल ${totalSaintPadas} पद)</span>
        ${nextLinkUrl ? `<a href="${nextLinkUrl}" style="padding: 0.4rem 0.85rem; background: #fef3c7; color: #92400e; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">अगला पृष्ठ &rarr;</a>` : ''}
      </nav>
    ` : '';

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <a href="/rasik-saints-of-vrindavan" style="color: #b45309; text-decoration: none;">संत परंपरा</a> &rsaquo; <span>${saintName}</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">रसिक संत परंपरा</span>
          <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${saintName}</h1>
          <p style="font-size: 0.95rem; color: #78716c; margin: 0;">${saint?.tradition ? `संप्रदाय: ${saint.tradition} • ` : ''}पावन वाणी व रसिक पद संग्रह</p>
        </header>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #44403c;">${description}</p>

        <!-- Saint Pada Directory (Spidering Discovery Mesh) -->
        ${pagedSaintPadas.length > 0 ? `
        <section style="margin-top: 2rem; background: #ffffff; padding: 1.25rem; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 1rem 0;">🌸 ${saintName} के पावन पद एवं अमृत वाणियाँ (कुल ${totalSaintPadas} पद)</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
            ${pagedSaintPadas.map(([pSlug, pTitle]) => `
              <a href="/pad/${encodeURIComponent(pSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem; font-weight: 500;">
                ${pTitle} &rarr;
              </a>
            `).join('')}
          </div>
          ${saintPaginationHtml}
        </section>
        ` : ''}

        <!-- FAQ Rich Snippets -->
        <section style="margin-top: 2rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; padding: 1.25rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #92400e; margin: 0 0 1rem 0;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${saintName} किस परंपरा/संप्रदाय से संबद्ध हैं?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">${saintName} जी ${saint?.tradition ? `<strong>${saint.tradition}</strong>` : 'श्री वृन्दावन नित्य निकुंज रस परंपरा'} के परम पूज्य संत हैं।</p>
          </details>
          <details open style="padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">वृन्दोपनिषद् में ${saintName} के कितने पद उपलब्ध हैं?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">वृन्दोपनिषद् डिजिटल आर्काइव में ${saintName} जी के <strong>${totalSaintPadas || 'अनेक'}</strong> प्रामाणिक पद एवं वाणियाँ मूल पाठ, भावार्थ व स्वर-राग सहित उपलब्ध हैं।</p>
          </details>
        </section>

        <!-- Cross-Linking Navigation -->
        <section style="margin-top: 2rem; padding: 1.25rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #e7e5e4;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #44403c; margin: 0 0 1rem 0;">संत मंडल एवं अन्य पावन संग्रह</h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <li><a href="/rasik-saints-of-vrindavan" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 १३१ रसिक संतों का जीवन चरित &rarr;</a></li>
            <li><a href="/rasik-vani-granthas-list" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📖 प्रमुख रसिक वाणी ग्रंथ &rarr;</a></li>
            <li><a href="/padavali" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📜 ४४,०००+ समस्त पावन पद &rarr;</a></li>
            <li><a href="/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📿 नित्य सेवा व अष्टयाम स्मरण &rarr;</a></li>
          </ul>
        </section>

        <!-- Footer Colophon -->
        <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e7e5e4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span>वृन्दोपनिषद् 2.0 • Digital Sanctuary for Rasik Saints</span>
          <a href="${canonicalUrl}" style="color: #b45309; text-decoration: underline;">संत वाणी स्वाध्याय</a>
        </footer>
      </article>
    `;
  } else if (qGrantha && EPICS_META[qGrantha]) {
    const epic = EPICS_META[qGrantha];
    if (qChapter || epicPad?.chapter) {
      let targetChapter = qChapter || epicPad!.chapter;
      targetChapter = normalizeEpicChapterSlug(qGrantha, targetChapter);
      if (qGrantha === 'ramcharitmanas') {
        const decCh = decodeURIComponent(targetChapter).toLowerCase();
        if (/sundar|सुन्दर/i.test(decCh)) {
          targetChapter = 'sundar-kand';
        }
      } else if (qGrantha === 'valmiki-ramayana') {
        const decCh = decodeURIComponent(targetChapter).toLowerCase();
        if (/sundar|सुन्दर/i.test(decCh) && !decCh.includes('-sarga-')) {
          targetChapter = 'sundar-kand-sarga-1';
        }
      }
      const chSnippet = getChapterSnippet(qGrantha, targetChapter);
      const chName = chSnippet ? chSnippet.chapterName : targetChapter;
      const chOpeningVerse = chSnippet?.openingVerse || `${epic.name} का पावन अध्याय ${chName}`;
      const chVerseCount = chSnippet?.verseCount || 0;

      title = `${chName} (${epic.name}) • प्रणेता: ${epic.author} | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
      description = `«${chOpeningVerse}» ${epic.name} का पावन अध्याय ${chName} (${chVerseCount} श्लोक)। मूल श्लोक, पाठ व पारायण। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}/${encodeURIComponent(targetChapter)}`;

      customKeywords = [
        epic.name,
        chName,
        epic.author,
        `${epic.name} ${chName}`,
        `${formatSlug(qGrantha)} ${formatSlug(targetChapter)} shlokas`,
        `${chName} shloka hindi meaning`,
        'sanatan mahagranth parayana',
        'vrindopnisad path',
        'vedic scriptures online',
      ].join(', ');

      const epicAuthorSameAs = getSaintSameAs(epic.author);

      entitySchema = {
        '@type': 'Chapter',
        '@id': `${canonicalUrl}#chapter`,
        'name': `${epic.name} - ${chName}`,
        'numberOfPages': chVerseCount || undefined,
        'inLanguage': ['hi', 'sa'],
        'isPartOf': {
          '@type': 'Book',
          '@id': `https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}#book`,
          'name': epic.name,
          'author': {
            '@type': 'Person',
            'name': epic.author,
            ...(epicAuthorSameAs ? { 'sameAs': epicAuthorSameAs } : {}),
          },
        },
      };

      extraSchemas.push({
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'महाग्रंथ पारायण',
            'item': 'https://path.vrindopnishad.in/',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': epic.name,
            'item': `https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': chName,
            'item': canonicalUrl,
          },
        ],
      });

      extraSchemas.push({
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        'mainEntity': [
          {
            '@type': 'Question',
            'name': `${epic.name} के प्रणेता कौन हैं?`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': `इस अमर सनातन महाकाव्य के प्रणेता ${epic.author} हैं।`,
            },
          },
          {
            '@type': 'Question',
            'name': `${chName} में कुल कितने श्लोक हैं?`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': `${chName} में कुल ${chVerseCount} प्रामाणिक श्लोक व छंद संकलित हैं।`,
            },
          },
        ],
      });

      dynamicRootHtml = `
        <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', Georgia, serif; color: #1c1917; line-height: 1.8;">
          <!-- Breadcrumb Navigation with Microdata -->
          <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem;">
            <ol itemscope itemtype="https://schema.org/BreadcrumbList" style="display: flex; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; gap: 0.5rem; color: #b45309;">
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="item" href="https://path.vrindopnishad.in/" style="color: #b45309; text-decoration: none;"><span itemprop="name">महाग्रंथ पारायण</span></a>
                <meta itemprop="position" content="1" />
              </li>
              <li style="color: #d97706;">&rsaquo;</li>
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a itemprop="item" href="https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: none;"><span itemprop="name">${epic.name}</span></a>
                <meta itemprop="position" content="2" />
              </li>
              <li style="color: #d97706;">&rsaquo;</li>
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <span itemprop="name" style="color: #78716c;">${chName}</span>
                <meta itemprop="position" content="3" />
              </li>
            </ol>
          </nav>

          <!-- Article Header -->
          <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e;">सनातन महाग्रंथ</span>
              <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #f0fdf4; color: #166534;">${epic.name}</span>
            </div>
            <h1 class="sanctuary-ssr-title" style="font-size: 2.25rem; font-weight: 700; line-height: 1.25; color: #1c1917; margin: 0 0 0.5rem 0;">${chName}</h1>
            <p style="font-size: 1rem; color: #78716c; margin: 0;">महाग्रंथ: <strong style="color: #b45309;">${epic.name}</strong> • प्रणेता: <strong>${epic.author}</strong> • कुल श्लोक: <strong>${chVerseCount}</strong></p>
          </header>

          <!-- Authentic Sacred Opening Shloka -->
          <section class="verse-body" style="font-size: 1.35rem; line-height: 2.1; color: #292524; background: linear-gradient(180deg, #fffbeb 0%, #fef9c3 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #fde68a; white-space: pre-line; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.06); text-align: center;">
            ${chOpeningVerse}
          </section>

          <!-- Chapter Context & Importance -->
          <section style="margin-top: 2rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #f5f5f4; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">पावन अध्याय माहात्म्य व पारायण</h2>
            <p style="font-size: 1rem; line-height: 1.8; color: #44403c; margin: 0;">
              ${epic.name} का यह पावन अध्याय (${chName}) सनातन धर्म संस्कृति का अनमोल रत्न है। इसमें कुल ${chVerseCount} पवित्र श्लोक संकलित हैं। वृन्दोपनिषद् 2.0 पर इस पावन अध्याय का मूल संस्कृत/अवधी पाठ, अन्वय व भावार्थ अखंड स्वाध्याय के लिए उपलब्ध है।
            </p>
          </section>

          <!-- Structured Metadata Table -->
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">महाग्रंथ एवं अध्याय विवरण</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; border: 1px solid #e7e5e4;">
              <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">अध्याय नाम (Chapter)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">${chName}</td></tr>
              <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">महाग्रंथ (Epic)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: underline;">${epic.name}</a></td></tr>
              <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">प्रणेता (Sage/Author)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">${epic.author}</td></tr>
              <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">कुल श्लोक संख्या</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">${chVerseCount} श्लोक</td></tr>
            </table>
          </section>

          <!-- Google FAQ Rich Snippets Section -->
          <section style="margin-top: 2rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #92400e; margin: 0 0 1rem 0;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
            <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
              <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${epic.name} के प्रणेता कौन हैं?</summary>
              <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">इस पावन महाकाव्य के प्रणेता <strong>${epic.author}</strong> हैं।</p>
            </details>
            <details open style="padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
              <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${chName} में कितने श्लोक हैं?</summary>
              <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">${chName} में कुल <strong>${chVerseCount}</strong> पावन श्लोक हैं।</p>
            </details>
          </section>

          <!-- Internal Cross-Linking Grid (Zero Dead Ends for Crawlers) -->
          <section style="margin-top: 2rem; padding: 1.5rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #e7e5e4;">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #44403c; margin: 0 0 1rem 0;">महाग्रंथ पारायण नेविगेशन</h2>
            <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
              <li><a href="https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📜 ${epic.name} के समस्त अध्याय &rarr;</a></li>
              <li><a href="https://path.vrindopnishad.in/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🏛️ ५ अमर सनातन महाकाव्य &rarr;</a></li>
              <li><a href="https://bhav.vrindopnishad.in/padavali" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 ४४,०००+ रसिक वाणी संग्रह &rarr;</a></li>
              <li><a href="https://bhav.vrindopnishad.in/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📿 दैनिक स्मरण व नित्य सेवा &rarr;</a></li>
            </ul>
          </section>

          <!-- Footer Colophon -->
          <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e7e5e4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span>वृन्दोपनिषद् 2.0 • Digital Sanctuary for Sanatan Mahagranth Parayana</span>
            <a href="${canonicalUrl}" style="color: #b45309; text-decoration: underline;">अखंड स्वाध्याय व पारायण</a>
          </footer>
        </article>
      `;
    } else {
      title = `${epic.name} (${epic.author}) • संपूर्ण मूल पाठ व पारायण | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
      description = `${epic.desc}। प्रणेता: ${epic.author}। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `https://path.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}`;

      entitySchema = {
        '@type': 'Book',
        '@id': `${canonicalUrl}#book`,
        'name': epic.name,
        'author': { '@type': 'Person', 'name': epic.author },
        'description': epic.desc,
      };
    }
  } else if (qGrantha && (GRANTHAS_MAP.has(qGrantha) || GRANTHAS_MAP.has(decodeURIComponent(qGrantha).trim()))) {
    const g = GRANTHAS_MAP.get(qGrantha) || GRANTHAS_MAP.get(decodeURIComponent(qGrantha).trim())!;
    const authorText = g.author ? ` (${g.author})` : '';
    const romanTitle = formatSlug(g.id || qGrantha);
    title = `${g.name} (${g.author || 'रसिक संत'}) | संपूर्ण मूल पाठ, पद संग्रह व व्याख्या • वृन्दोपनिषद्`;
    const granthaId = g.id || qGrantha;
    ensureCrawlIndex();
    const granthaPadas: [string, string][] = granthaCrawlMap[granthaId] || [];
    const PAGE_SIZE = 100;
    const totalGranthaPadas = granthaPadas.length;
    const totalGranthaPages = Math.max(1, Math.ceil(totalGranthaPadas / PAGE_SIZE));
    if (isPaginatedGrantha && granthaPageNum > totalGranthaPages) {
      return notFoundResponse('ग्रंथ पृष्ठ उपलब्ध नहीं है (Page Not Found)');
    }
    const currentGranthaPage = isPaginatedGrantha ? granthaPageNum : 1;
    const pagedGranthaPadas = granthaPadas.slice((currentGranthaPage - 1) * PAGE_SIZE, currentGranthaPage * PAGE_SIZE);
    const granthaBaseUrl = `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(granthaId)}`;
    if (currentGranthaPage > 1) {
      prevLinkUrl = currentGranthaPage === 2 ? granthaBaseUrl : `${granthaBaseUrl}/page/${currentGranthaPage - 1}`;
    }
    if (currentGranthaPage < totalGranthaPages) {
      nextLinkUrl = `${granthaBaseUrl}/page/${currentGranthaPage + 1}`;
    }
    if (!isPaginatedGrantha && PRERENDERED_GRANTHA_IDS.has(granthaId)) {
      hasPrerenderedStaticRoot = true;
    }

    title = `${g.name}${currentGranthaPage > 1 ? ` (पृष्ठ ${currentGranthaPage})` : ''}${g.author ? ` (${g.author})` : ''} | संपूर्ण मूल पाठ व पद संग्रह • वृन्दोपनिषद्`;
    description = `पावन वाणी ग्रंथ ${g.name} का संपूर्ण मूल पाठ, श्लोक व ${totalGranthaPadas} पद संग्रह। रचयिता: ${g.author || 'रसिक संत'}। नित्य स्वाध्याय, भावार्थ व अर्थ सहित।`;
    canonicalUrl = currentGranthaPage > 1 ? `${granthaBaseUrl}/page/${currentGranthaPage}` : granthaBaseUrl;

    entitySchema = {
      '@type': 'Book',
      '@id': `${canonicalUrl}#book`,
      'name': g.name,
      ...(g.author ? { 'author': { '@type': 'Person', 'name': g.author } } : {}),
      'description': g.description || description,
      ...(granthaId === 'hit-chaurasi' ? {
        'audio': [
          {
            '@type': 'AudioObject',
            'name': 'श्री हित चौरासी मंगलाचरण एवं परिचय (Intro)',
            'contentUrl': 'https://bhav.vrindopnishad.in/audio/hit-chaurasi/SHCJ0.mp3',
            'encodingFormat': 'audio/mpeg',
            'inLanguage': 'hi',
          },
          {
            '@type': 'AudioObject',
            'name': 'श्री हित चौरासी फलश्रुति एवं समापन (Outro)',
            'contentUrl': 'https://bhav.vrindopnishad.in/audio/hit-chaurasi/SHCJ85.mp3',
            'encodingFormat': 'audio/mpeg',
            'inLanguage': 'hi',
          },
        ],
      } : {}),
    };

    const granthaPaginationHtml = totalGranthaPages > 1 ? `
      <nav aria-label="Pagination" style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
        ${prevLinkUrl ? `<a href="${prevLinkUrl}" style="padding: 0.4rem 0.85rem; background: #fef3c7; color: #92400e; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">&larr; पिछला पृष्ठ</a>` : ''}
        <span style="font-size: 0.9rem; color: #78716c;">पृष्ठ ${currentGranthaPage} / ${totalGranthaPages} (कुल ${totalGranthaPadas} पद)</span>
        ${nextLinkUrl ? `<a href="${nextLinkUrl}" style="padding: 0.4rem 0.85rem; background: #fef3c7; color: #92400e; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">अगला पृष्ठ &rarr;</a>` : ''}
      </nav>
    ` : '';

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <a href="/rasik-vani-granthas-list" style="color: #b45309; text-decoration: none;">पावन ग्रंथ संग्रह</a> &rsaquo; <span>${g.name}</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">पावन वाणी ग्रंथ</span>
          <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${g.name}</h1>
          <p style="font-size: 0.95rem; color: #78716c; margin: 0;">रचयिता: ${g.author || 'रसिक संत'} • नित्य स्वाध्याय व अनुशीलन</p>
        </header>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #44403c;">${description}</p>

        <!-- Grantha Pada Directory (Spidering Discovery Mesh) -->
        ${pagedGranthaPadas.length > 0 ? `
        <section style="margin-top: 2rem; background: #ffffff; padding: 1.25rem; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 1rem 0;">📖 ${g.name} के समस्त पावन पद (कुल ${totalGranthaPadas} पद)</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
            ${pagedGranthaPadas.map(([pSlug, pTitle]) => `
              <a href="/pad/${encodeURIComponent(pSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem; font-weight: 500;">
                ${pTitle} &rarr;
              </a>
            `).join('')}
          </div>
          ${granthaPaginationHtml}
        </section>
        ` : ''}

        <!-- FAQ Rich Snippets -->
        <section style="margin-top: 2rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; padding: 1.25rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #92400e; margin: 0 0 1rem 0;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${g.name} के रचयिता कौन हैं?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">${g.name} के रचयिता <strong>${g.author || 'रसिक संत'}</strong> जी हैं।</p>
          </details>
          <details open style="padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${g.name} में कुल कितने पद हैं?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">इस पावन ग्रंथ में कुल <strong>${totalGranthaPadas || 'अनेक'}</strong> पद संकलित हैं।</p>
          </details>
        </section>

        <!-- Cross-Linking Navigation -->
        <section style="margin-top: 2rem; padding: 1.25rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #e7e5e4;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #44403c; margin: 0 0 1rem 0;">संबंधित पावन ग्रंथ एवं स्वाध्याय</h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <li><a href="/rasik-vani-granthas-list" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📖 प्रमुख रसिक वाणी ग्रंथ &rarr;</a></li>
            <li><a href="/rasik-saints-of-vrindavan" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 १३१ रसिक संत परंपरा &rarr;</a></li>
            <li><a href="/padavali" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📜 ४४,०००+ समस्त पावन पद &rarr;</a></li>
            <li><a href="/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📿 नित्य सेवा व अष्टयाम स्मरण &rarr;</a></li>
          </ul>
        </section>

        <!-- Footer Colophon -->
        <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e7e5e4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span>वृन्दोपनिषद् 2.0 • Digital Sanctuary for Sacred Grantha</span>
          <a href="${canonicalUrl}" style="color: #b45309; text-decoration: underline;">ग्रंथ मूल पाठ</a>
        </footer>
      </article>
    `;
  } else if (qGrantha) {
    ensureCrawlIndex();
    const formatted = formatSlug(qGrantha);
    const granthaPadas: [string, string][] = granthaCrawlMap[qGrantha] || [];
    if (granthaPadas.length === 0) {
      const lowerGrantha = safeDecodeURIComponent(qGrantha).trim().toLowerCase();
      const padSuffixMatch = Object.keys(padaSnippetsObj).find((k) => k.endsWith(`-${lowerGrantha}`));
      if (padSuffixMatch) {
        return buildCachedRedirect(
          `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(padSuffixMatch)}`,
          301
        );
      }
      const baseGrantha = lowerGrantha.replace(/-\d+$/, '');
      const targetGrantha =
        GRANTHA_ALIASES[lowerGrantha] ||
        GRANTHA_ALIASES[baseGrantha] ||
        (GRANTHAS_MAP.has(baseGrantha) ? baseGrantha : null);
      if (targetGrantha) {
        return buildCachedRedirect(
          `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(targetGrantha)}`,
          301
        );
      }
      return notFoundResponse('यह पावन ग्रंथ उपलब्ध नहीं है (Grantha Not Found)');
    }
    title = `${formatted} • संपूर्ण ग्रंथ संग्रह | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
    description = `${formatted} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}`;
    if (granthaPadas.length > 0) {
      dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <span>${formatted}</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917;">${formatted}</h1>
          <p style="font-size: 0.95rem; color: #78716c;">${description}</p>
        </header>
        <section style="margin-top: 2rem; background: #ffffff; padding: 1.25rem; border: 1px solid #fde68a; border-radius: 0.75rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 1rem 0;">📖 ${formatted} के पद (${granthaPadas.length} पद)</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
            ${granthaPadas.map(([pSlug, pTitle]) => `
              <a href="/pad/${encodeURIComponent(pSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem; font-weight: 500;">
                ${pTitle} &rarr;
              </a>
            `).join('')}
          </div>
        </section>
      </article>
      `;
    }
  } else if (pathname === '/rasik-saints-of-vrindavan') {
    title = 'श्री धाम वृन्दावन के प्रमुख रसिक संत मंडल एवं वाणी परंपरा | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
    description = 'श्री स्वामी हरिदास, श्री हित हरिवंश महाप्रभु, श्री व्यास जी, रसखान, मीराबाई सहित १३१ प्रामाणिक रसिक संतों का पावन जीवन चरित्र, संप्रदाय एवं अमृत वाणी संग्रह।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/rasik-saints-of-vrindavan';
    entitySchema = {
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#itemlist`,
      'name': 'श्री धाम वृन्दावन के प्रमुख रसिक संत',
      'description': description,
      'itemListElement': saintsList.slice(0, 20).map((s, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': s.name,
        'url': `https://bhav.vrindopnishad.in/sant/${s.slug || s.id}`,
      })),
    };
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif; line-height: 1.8;">
        <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">रसिक संत परंपरा</span>
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #1c1917; margin: 0 0 0.5rem 0;">श्री धाम वृन्दावन के प्रमुख रसिक संत मंडल</h1>
          <p style="font-size: 1.05rem; color: #78716c; margin: 0;">१३१ प्रामाणिक रसिक संतों की जीवन गाथा, निकुंज उपासना एवं पावन वाणी संग्रह</p>
        </header>
        <section style="margin-bottom: 2rem;">
          <p style="font-size: 1.1rem; line-height: 1.9; color: #44403c;">
            श्री धाम वृन्दावन की पावन भूमि अनादि काल से रसिक संतों की साधना स्थली रही है। स्वामी हरिदास जी, श्री हित हरिवंश महाप्रभु, श्री व्यास जी, भक्त नागरीदास, रसखान, सूरदास एवं मीराबाई जैसे परम भगवदीयों ने प्रिया-प्रियतम के अनन्य निकुंज रस का जो गान किया है, वही वृन्दोपनिषद् की आत्मा है।
          </p>
        </section>
        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${saintsList.slice(0, 15).map(s => `
            <div style="padding: 1.25rem; background: #fff; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #78350f;"><a href="/sant/${s.slug || s.id}" style="color: #b45309; text-decoration: none;">${s.name}</a></h3>
              <p style="margin: 0; font-size: 0.9rem; color: #78716c;">${s.tradition ? `संप्रदाय: ${s.tradition}` : 'रसिक वाणी संत'}</p>
            </div>
          `).join('')}
        </section>
      </article>
    `;
  } else if (pathname === '/vrindavan-ashtayama-seva-darshan-timings') {
    title = 'श्री धाम वृन्दावन अष्टयाम सेवा व दर्शन समय-सारिणी (Ashtayama Seva Timings) | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
    description = 'श्री धाम वृन्दावन के समस्त आठों प्रहर (मंगला, श्रृंगार, ग्वाल, राजभोग, उत्थापन, भोग, संध्या, शयन) की नित्य अष्टयाम सेवा, मंदिर दर्शन समय व लीला चिंतन।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/vrindavan-ashtayama-seva-darshan-timings';
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif; line-height: 1.8;">
        <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">नित्य अष्टयाम सेवा चक्र</span>
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #1c1917; margin: 0 0 0.5rem 0;">श्री धाम वृन्दावन अष्टयाम सेवा व दर्शन समय-सारिणी</h1>
          <p style="font-size: 1.05rem; color: #78716c; margin: 0;">आठों प्रहर की दिव्य निकुंज लीला, राग-सेवा एवं बांके बिहारी व राधावल्लभ लाल दर्शन समय</p>
        </header>
        <section style="margin-bottom: 2rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; border: 1px solid #e7e5e4;">
            <tr style="background: #fef3c7; color: #92400e;"><th style="padding: 0.75rem; border: 1px solid #e7e5e4;">प्रहर (Phase)</th><th style="padding: 0.75rem; border: 1px solid #e7e5e4;">समय (Timings)</th><th style="padding: 0.75rem; border: 1px solid #e7e5e4;">सेवा व भाव</th></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">मंगला (Mangala)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०३:३० - ०६:०० AM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">जागरण, मंगला आरती व मधुर राग गान</td></tr>
            <tr style="background: #fafaf9;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">श्रृंगार (Shringar)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०६:०० - ०८:३० AM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">दंतधावन, स्नान व दिव्य आभूषण श्रृंगार</td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">ग्वाल (Gwal)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०८:३० - १०:३० AM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">गौचारण लीला व सखा भाव विनोद</td></tr>
            <tr style="background: #fafaf9;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">राजभोग (Rajbhog)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">१०:३० AM - ०३:३० PM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">छप्पन भोग अर्पण, राजभोग आरती व निकुंज विश्राम</td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">उत्थापन (Utthapan)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०३:३० - ०५:०० PM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">विश्रामोपरांत जागरण व शीतल भोग</td></tr>
            <tr style="background: #fafaf9;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">भोग (Bhog)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०५:०० - ०७:०० PM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">सायंकालीन मिष्ठान्न व फल भोग</td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">संध्या आरती (Sandhya)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०७:०० - ०८:३० PM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">दीपदान, संध्या आरती व युगल वंदना</td></tr>
            <tr style="background: #fafaf9;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">शयन (Shayan)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">०८:३० - ११:०० PM</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">शयन आरती, पान बीड़ा सेवा व रास विलास</td></tr>
          </table>
        </section>
      </article>
    `;
  } else if (pathname === '/rasik-vani-granthas-list') {
    title = 'श्री वृन्दावन रसिक वाणी ग्रंथ सूची (Hit Chaurasi, Kelimal, Radha Sudha Nidhi) | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
    description = 'श्री हित चौरासी, श्री केलिमाल, श्री राधा सुधा निधि, सूरसागर, बयालीस लीला सहित समस्त २५ प्रामाणिक रसिक वाणी ग्रंथों की सम्पूर्ण सूची एवं मूल पाठ।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/rasik-vani-granthas-list';
    entitySchema = {
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#itemlist`,
      'name': 'श्री वृन्दावन रसिक वाणी ग्रंथ',
      'description': description,
      'itemListElement': granthasList.filter(g => !EPICS_META[g.id]).map((g, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': g.name,
        'url': `https://bhav.vrindopnishad.in/grantha/${g.id}`,
      })),
    };
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif; line-height: 1.8;">
        <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">पावन साहित्य भंडार</span>
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #1c1917; margin: 0 0 0.5rem 0;">श्री वृन्दावन रसिक वाणी प्रामाणिक ग्रंथ सूची</h1>
          <p style="font-size: 1.05rem; color: #78716c; margin: 0;">२५ मूल प्रामाणिक वाणी ग्रंथ, ४,२०४ निकुंज रस पद एवं शास्त्रीय भावार्थ</p>
        </header>
        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${granthasList.filter(g => !EPICS_META[g.id]).map(g => `
            <div style="padding: 1.25rem; background: #fff; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #78350f;"><a href="/grantha/${g.id}" style="color: #b45309; text-decoration: none;">${g.name}</a></h3>
              <p style="margin: 0; font-size: 0.9rem; color: #78716c;">रचयिता: ${g.author || 'रसिक संत'}</p>
            </div>
          `).join('')}
        </section>
      </article>
    `;
  } else if (pathname === '/online-tulsi-mala-naam-jap') {
    title = 'ऑनलाइन तुलसी माला जप एवं नित्य नाम साधना (Online Tulsi Mala & Japa Counter) | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
    description = '१०८ मनकों की पावन तुलसी माला द्वारा श्री राधा नाम, महामंत्र जप, दैनिक जप चक्र एवं अखंड साधना संकल्प काउंटर।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/online-tulsi-mala-naam-jap';
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif; line-height: 1.8;">
        <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">डिजिटल नाम साधन</span>
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #1c1917; margin: 0 0 0.5rem 0;">ऑनलाइन तुलसी माला जप एवं नित्य नाम साधना</h1>
          <p style="font-size: 1.05rem; color: #78716c; margin: 0;">१०८ मनकों का पावन चक्र, स्पर्श जप, ध्वनि तरंग एवं दैनिक साधना संकल्प</p>
        </header>
        <section style="margin-bottom: 2rem; background: #fffbeb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #fde68a;">
          <h2 style="font-size: 1.3rem; color: #78350f; margin: 0 0 0.75rem 0;">नाम जप का माहात्म्य</h2>
          <p style="font-size: 1.05rem; line-height: 1.8; color: #44403c; margin: 0;">
            कलयुग केवल नाम अधारा, सुमिरि सुमिरि नर उतरहिं पारा। श्री धाम वृन्दावन के रसिकों ने श्री राधा नाम को समस्त वेदों और उपनिषदों का सार तत्व माना है। वृन्दोपनिषद् 2.0 का डिजिटल माला काउंटर आपको १०८ मनकों की अखंड जप साधना में लीन रहने की पावन सुविधा प्रदान करता है।
          </p>
        </section>
      </article>
    `;
  } else if (pathname === '/rituals') {
    title = 'Nitya Upasana • ३१+ नित्य आरती, चालीसा, स्तोत्र व अष्टक संग्रह | वृन्दोपनिषद् 2.0';
    description = 'श्री राधा चालीसा, कुंजबिहारी आरती, हनुमान चालीसा, शिव तांडव स्तोत्र, यमुनाष्टकम् सहित सम्पूर्ण सनातन नित्य उपासना संग्रह।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/rituals';
    hasPrerenderedStaticRoot = true;
  } else if (pathname.startsWith('/ritual/')) {
    const slug = decodeURIComponent(pathname.slice('/ritual/'.length)).trim();
    const r = RITUALS_MAP.get(slug);
    if (!r) return notFoundResponse('यह आरती/चालीसा उपलब्ध नहीं है (Ritual Not Found)');
    hasPrerenderedStaticRoot = true;
    const rMeta = ritualMetaObj[r.slug] || {};
    const pujaVidhi = rMeta.pujaVidhi;
    const durationMin = r.durationMinutes || rMeta.durationMinutes;
    title = `${r.titleDevanagari} • संपूर्ण पाठ, भावार्थ व नित्य स्तुति | वृन्दोपनिषद् 2.0`;
    description = `${r.titleDevanagari} का प्रामाणिक मूल पाठ, विधि एवं भावार्थ। नित्य उपासना संग्रह।`;
    canonicalUrl = `https://bhav.vrindopnishad.in/ritual/${encodeURIComponent(r.slug)}`;
    entitySchema = {
      '@type': 'Article',
      '@id': `${canonicalUrl}#ritual`,
      'headline': r.titleDevanagari,
      'name': r.titleDevanagari,
      'description': pujaVidhi?.benefits || description,
      'inLanguage': ['hi', 'sa'],
      'genre': r.category || 'Nitya Upasana',
      'image': 'https://bhav.vrindopnishad.in/assets/temples/banke-bihari-v2.webp',
      'publisher': {
        '@type': 'ReligiousOrganization',
        'name': 'वृन्दोपनिषद् 2.0',
        'url': 'https://bhav.vrindopnishad.in/',
      },
      'url': canonicalUrl,
    };
    if (pujaVidhi && Array.isArray(pujaVidhi.steps) && pujaVidhi.steps.length > 0) {
      extraSchemas.push({
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        'name': `${r.titleDevanagari} — पूजा एवं पाठ विधि`,
        'description': pujaVidhi.benefits || description,
        ...(durationMin ? { 'totalTime': `PT${durationMin}M` } : {}),
        ...(Array.isArray(pujaVidhi.requiredItems) && pujaVidhi.requiredItems.length > 0 ? {
          'supply': pujaVidhi.requiredItems.map((item) => ({
            '@type': 'HowToSupply',
            'name': item,
          })),
        } : {}),
        'step': pujaVidhi.steps.map((stepText, idx) => ({
          '@type': 'HowToStep',
          'position': idx + 1,
          'text': stepText,
        })),
      });
    }
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'नित्य उपासना', 'item': 'https://bhav.vrindopnishad.in/rituals' },
        { '@type': 'ListItem', 'position': 3, 'name': r.titleDevanagari, 'item': canonicalUrl },
      ],
    });
  } else if (pathname === '/places') {
    title = 'Sacred Places & Dham Darshan • ३३+ पवित्र धाम, तीर्थ व दिव्य लीला स्थल | वृन्दोपनिषद् 2.0';
    description = 'श्री निधिवन राज, सेवा कुंज, राधावल्लभ मंदिर, गोवर्धन, राधा कुण्ड, बरसाना, अयोध्या, काशी, केदारनाथ सहित पावन तीर्थ दर्शन व इतिहास।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/places';
    hasPrerenderedStaticRoot = true;
  } else if (pathname.startsWith('/place/')) {
    const slug = decodeURIComponent(pathname.slice('/place/'.length)).trim();
    const pl = PLACES_MAP.get(slug);
    if (!pl) return notFoundResponse('यह पावन धाम पृष्ठ उपलब्ध नहीं है (Place Not Found)');
    hasPrerenderedStaticRoot = true;
    const pMeta = placeMetaObj[pl.slug] || {};
    const timings = pMeta.darshanTimings;
    const openingHours: Record<string, unknown>[] = [];
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (timings?.morning?.open && timings?.morning?.close) {
      openingHours.push({
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': allDays,
        'opens': timings.morning.open,
        'closes': timings.morning.close,
      });
    }
    if (timings?.evening?.open && timings?.evening?.close) {
      openingHours.push({
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': allDays,
        'opens': timings.evening.open,
        'closes': timings.evening.close,
      });
    }
    title = `${pl.nameDevanagari} (${pl.regionNameHindi || 'ब्रज धाम'}) • दर्शन, इतिहास व महात्म्य | वृन्दोपनिषद् 2.0`;
    description = `${pl.briefSignificance || pl.nameDevanagari}। श्री धाम दर्शन, समय-सारणी एवं इतिहास।`;
    canonicalUrl = `https://bhav.vrindopnishad.in/place/${encodeURIComponent(pl.slug)}`;
    entitySchema = {
      '@type': ['Place', 'TouristAttraction', 'HinduTemple'],
      '@id': `${canonicalUrl}#place`,
      'name': pl.nameDevanagari,
      'description': pl.briefSignificance || description,
      'image': 'https://bhav.vrindopnishad.in/assets/temples/banke-bihari-v2.webp',
      'address': {
        '@type': 'PostalAddress',
        'addressRegion': pl.regionNameHindi || 'Vrindavan',
        'addressCountry': 'IN',
      },
      ...(pMeta.coordinates?.lat && pMeta.coordinates?.lng ? {
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': pMeta.coordinates.lat,
          'longitude': pMeta.coordinates.lng,
        },
      } : {}),
      ...(openingHours.length > 0 ? { 'openingHoursSpecification': openingHours } : {}),
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'श्री धाम तीर्थ दर्शन', 'item': 'https://bhav.vrindopnishad.in/places' },
        { '@type': 'ListItem', 'position': 3, 'name': pl.nameDevanagari, 'item': canonicalUrl },
      ],
    });
  } else if (pathname === '/stories') {
    title = 'Katha Sanctuary • २२+ दिव्य पौराणिक कथाएं एवं ब्रज लीला प्रसंग | वृन्दोपनिषद् 2.0';
    description = 'श्री महारास लीला, शबरी भक्ति, गोवर्धन धारण, नरसी मेहता हुंडी, करमाबाई खिचड़ी, गजेन्द्र मोक्ष सहित प्रेरणादायक भक्ति कथाएं।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/stories';
    hasPrerenderedStaticRoot = true;
  } else if (pathname.startsWith('/story/')) {
    const slug = decodeURIComponent(pathname.slice('/story/'.length)).trim();
    const st = STORIES_MAP.get(slug);
    if (!st) return notFoundResponse('यह दिव्य कथा उपलब्ध नहीं है (Story Not Found)');
    hasPrerenderedStaticRoot = true;
    title = `${st.titleDevanagari} • संपूर्ण दिव्य कथा व आध्यात्मिक मर्म | वृन्दोपनिषद् 2.0`;
    description = `${st.summary || st.titleDevanagari}। पावन पौराणिक आख्यान एवं ब्रज लीला।`;
    canonicalUrl = `https://bhav.vrindopnishad.in/story/${encodeURIComponent(st.slug)}`;
    entitySchema = {
      '@type': 'Article',
      '@id': `${canonicalUrl}#story`,
      'headline': st.titleDevanagari,
      'name': st.titleDevanagari,
      'description': st.summary || description,
      'inLanguage': 'hi',
      'genre': 'Sacred Puranic Leela',
      'image': 'https://bhav.vrindopnishad.in/assets/temples/banke-bihari-v2.webp',
      'publisher': {
        '@type': 'ReligiousOrganization',
        'name': 'वृन्दोपनिषद् 2.0',
        'url': 'https://bhav.vrindopnishad.in/',
      },
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'कथा संकुल', 'item': 'https://bhav.vrindopnishad.in/stories' },
        { '@type': 'ListItem', 'position': 3, 'name': st.titleDevanagari, 'item': canonicalUrl },
      ],
    });
  } else if (pathname === '/biographies') {
    title = 'Charitra Darshan • २५+ पूज्य रसिक संत, महर्षि व आचार्य चरित्र | वृन्दोपनिषद् 2.0';
    description = 'श्री चैतन्य महाप्रभु, वल्लभाचार्य, निम्बार्काचार्य, स्वामी हरिदास, हित हरिवंश, सूरदास, तुलसीदास, मीराबाई, एकनाथ, तुकाराम के पावन जीवन चरित।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/biographies';
    hasPrerenderedStaticRoot = true;
  } else if (pathname.startsWith('/bio/')) {
    const slug = decodeURIComponent(pathname.slice('/bio/'.length)).trim();
    const b = BIOS_MAP.get(slug);
    if (!b) return notFoundResponse('यह संत चरित्र उपलब्ध नहीं है (Biography Not Found)');
    hasPrerenderedStaticRoot = true;
    const bioSameAs = getSaintSameAs(b.name || b.nameDevanagari);
    title = `${b.nameDevanagari}${b.titleHonorific ? ` (${b.titleHonorific})` : ''} • जीवन चरित्र, दर्शन व वाणी | वृन्दोपनिषद् 2.0`;
    description = `${b.nameDevanagari} का पावन जीवन चरित, गुरु परंपरा, संप्रदाय एवं अमृत शिक्षाएं।`;
    canonicalUrl = `https://bhav.vrindopnishad.in/bio/${encodeURIComponent(b.slug)}`;
    entitySchema = {
      '@type': 'ProfilePage',
      '@id': `${canonicalUrl}#profile`,
      'mainEntity': {
        '@type': 'Person',
        'name': b.nameDevanagari,
        ...(b.titleHonorific ? { 'honorificPrefix': b.titleHonorific } : {}),
        ...(b.tradition ? { 'knowsAbout': b.tradition } : {}),
        ...(bioSameAs ? { 'sameAs': bioSameAs } : {}),
      },
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'चरित्र दर्शन', 'item': 'https://bhav.vrindopnishad.in/biographies' },
        { '@type': 'ListItem', 'position': 3, 'name': b.nameDevanagari, 'item': canonicalUrl },
      ],
    });
  } else if (pathname === '/ragas') {
    const ragaEntries = Object.entries(ragaIndexObj);
    title = `शास्त्रीय राग कोष (${ragaEntries.length} राग) • ब्रज रस पदावली | वृन्दोपनिषद् 2.0`;
    description = `श्री वृन्दावन रसिक वाणी में निबद्ध ${ragaEntries.length} शास्त्रीय एवं ब्रज लोक रागों (विभास, कल्याण, केदार, बिलावल, सारंग, मलार) के समस्त पावन पदों का संग्रह।`;
    canonicalUrl = 'https://bhav.vrindopnishad.in/ragas';
    entitySchema = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      'name': title,
      'description': description,
      'url': canonicalUrl,
    };
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">🎶 शास्त्रीय राग एवं ब्रज संगीत कोष (${ragaEntries.length} राग)</h1>
        <p style="font-size: 1.05rem; color: #44403c; margin-bottom: 1.5rem;">${description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
          ${ragaEntries.map(([rSlug, info]) => `
            <a href="/raga/${encodeURIComponent(rSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.5rem; color: #78350f; text-decoration: none; font-weight: 600;">
              राग ${info.name} (${info.padas.length} पद) &rarr;
            </a>
          `).join('')}
        </div>
      </article>
    `;
  } else if (pathname.startsWith('/raga/')) {
    const rSlug = decodeURIComponent(pathname.slice('/raga/'.length)).trim();
    const rInfo = ragaIndexObj[rSlug];
    if (!rInfo) return notFoundResponse('यह राग पृष्ठ उपलब्ध नहीं है (Raga Not Found)');
    title = `राग ${rInfo.name} के पावन पद (${rInfo.padas.length} पद) • ब्रज रसिक संगीत | वृन्दोपनिषद् 2.0`;
    description = `शास्त्रीय राग ${rInfo.name} में निबद्ध ${rInfo.padas.length} प्रामाणिक ब्रज रसिक पदों का मूल पाठ, रचयिता एवं भावार्थ संग्रह।`;
    canonicalUrl = `https://bhav.vrindopnishad.in/raga/${encodeURIComponent(rSlug)}`;
    entitySchema = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      'name': `राग ${rInfo.name} पद संग्रह`,
      'description': description,
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'MusicComposition',
      '@id': `${canonicalUrl}#composition`,
      'name': `राग ${rInfo.name}`,
      'musicalKey': `राग ${rInfo.name}`,
      'inLanguage': 'hi',
    });
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'राग कोष', 'item': 'https://bhav.vrindopnishad.in/ragas' },
        { '@type': 'ListItem', 'position': 3, 'name': `राग ${rInfo.name}`, 'item': canonicalUrl },
      ],
    });
    const ragaPadasSlice = rInfo.padas.slice(0, 120);
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <a href="/ragas" style="color: #b45309; text-decoration: none;">राग कोष</a> &rsaquo; <span>राग ${rInfo.name}</span>
        </nav>
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">🎶 राग ${rInfo.name} — पावन पद संग्रह (${rInfo.padas.length} पद)</h1>
        <p style="font-size: 1.05rem; color: #44403c; margin-bottom: 1.5rem;">${description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
          ${ragaPadasSlice.map((pSlug) => {
            const sn = padaSnippetsObj[pSlug];
            const pTitle = sn ? sn[0] : pSlug;
            return `<a href="/pad/${encodeURIComponent(pSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem;">${pTitle} &rarr;</a>`;
          }).join('')}
        </div>
      </article>
    `;
  } else if (pathname === '/themes') {
    const themes = Object.values(themeHubsObj);
    title = 'ब्रज उत्सव एवं लीला प्रसंग संग्रह (Themes & Festivals) | वृन्दोपनिषद् 2.0';
    description = 'होली-फाग, श्री राधाष्टमी, झूलन महोत्सव, शरद पूर्णिमा महारास, अष्टयाम सेवा एवं एकादशी व्रत के पावन पदों का विषयवार संग्रह।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/themes';
    entitySchema = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      'name': title,
      'description': description,
      'url': canonicalUrl,
    };
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">🌸 ब्रज उत्सव एवं दिव्य लीला प्रसंग</h1>
        <p style="font-size: 1.05rem; color: #44403c; margin-bottom: 1.5rem;">${description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${themes.map((t) => `
            <a href="/theme/${encodeURIComponent(t.slug)}" style="display: block; padding: 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem; color: #1c1917; text-decoration: none;">
              <h2 style="font-size: 1.2rem; font-weight: 700; color: #78350f; margin: 0 0 0.5rem 0;">${t.nameDevanagari} (${t.padas.length} पद)</h2>
              <p style="font-size: 0.9rem; color: #44403c; margin: 0;">${t.description}</p>
            </a>
          `).join('')}
        </div>
      </article>
    `;
  } else if (pathname.startsWith('/theme/')) {
    const tSlug = decodeURIComponent(pathname.slice('/theme/'.length)).trim();
    const tInfo = themeHubsObj[tSlug];
    if (!tInfo) return notFoundResponse('यह उत्सव/विषय पृष्ठ उपलब्ध नहीं है (Theme Not Found)');
    title = `${tInfo.nameDevanagari} (${tInfo.padas.length} पावन पद) • ${tInfo.nameEnglish} | वृन्दोपनिषद् 2.0`;
    description = tInfo.description;
    canonicalUrl = `https://bhav.vrindopnishad.in/theme/${encodeURIComponent(tInfo.slug)}`;
    entitySchema = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      'name': tInfo.nameDevanagari,
      'description': tInfo.description,
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'उत्सव एवं प्रसंग', 'item': 'https://bhav.vrindopnishad.in/themes' },
        { '@type': 'ListItem', 'position': 3, 'name': tInfo.nameDevanagari, 'item': canonicalUrl },
      ],
    });
    const themePadasSlice = tInfo.padas.slice(0, 120);
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <a href="/themes" style="color: #b45309; text-decoration: none;">उत्सव प्रसंग</a> &rsaquo; <span>${tInfo.nameDevanagari}</span>
        </nav>
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">${tInfo.nameDevanagari} (${tInfo.padas.length} पद)</h1>
        <p style="font-size: 1.05rem; color: #44403c; margin-bottom: 1.5rem;">${tInfo.description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
          ${themePadasSlice.map((pSlug) => {
            const sn = padaSnippetsObj[pSlug];
            const pTitle = sn ? sn[0] : pSlug;
            return `<a href="/pad/${encodeURIComponent(pSlug)}" style="display: block; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.5rem; color: #1c1917; text-decoration: none; font-size: 0.95rem;">${pTitle} &rarr;</a>`;
          }).join('')}
        </div>
      </article>
    `;
  } else if (pathname === '/glossary') {
    title = `ब्रज रस शब्दकोश (${brajGlossaryList.length} पारिभाषिक शब्द) • Braj Glossary | वृन्दोपनिषद् 2.0`;
    description = 'नित्य निकुंज, केलि विलास, सहज जोरी, अनन्य धर्म, सखी भाव, रस उपासना सहित ब्रज भक्ति साहित्य के प्रामाणिक पारिभाषिक शब्दों का अर्थ व संदर्भ।';
    canonicalUrl = 'https://bhav.vrindopnishad.in/glossary';
    entitySchema = {
      '@type': 'DefinedTermSet',
      '@id': `${canonicalUrl}#termset`,
      'name': 'ब्रज रस एवं निकुंज उपासना शब्दकोश',
      'description': description,
      'url': canonicalUrl,
      'hasDefinedTerm': brajGlossaryList.map((g) => ({
        '@type': 'DefinedTerm',
        'name': g.term,
        'description': g.meaningDevanagari,
        'url': `https://bhav.vrindopnishad.in/glossary/${encodeURIComponent(g.id)}`,
      })),
    };
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem;">📖 ब्रज रस शब्दकोश (${brajGlossaryList.length} पारिभाषिक पद)</h1>
        <p style="font-size: 1.05rem; color: #44403c; margin-bottom: 1.5rem;">${description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${brajGlossaryList.map((g) => `
            <a href="/glossary/${encodeURIComponent(g.id)}" style="display: block; padding: 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem; color: #1c1917; text-decoration: none;">
              <h2 style="font-size: 1.15rem; font-weight: 700; color: #78350f; margin: 0 0 0.35rem 0;">${g.term}</h2>
              <p style="font-size: 0.85rem; color: #b45309; margin: 0 0 0.5rem 0;">${g.transliteration}</p>
              <p style="font-size: 0.9rem; color: #44403c; margin: 0;">${g.meaningDevanagari}</p>
            </a>
          `).join('')}
        </div>
      </article>
    `;
  } else if (pathname.startsWith('/glossary/')) {
    const termSlug = decodeURIComponent(pathname.slice('/glossary/'.length)).trim();
    const g = GLOSSARY_MAP.get(termSlug);
    if (!g) return notFoundResponse('यह शब्दकोश प्रविष्टि उपलब्ध नहीं है (Glossary Term Not Found)');
    title = `${g.term} (${g.transliteration}) — अर्थ एवं ब्रज रस संदर्भ | वृन्दोपनिषद् 2.0`;
    description = `${g.meaningDevanagari}${g.context ? ` संदर्भ: ${g.context}` : ''}`;
    canonicalUrl = `https://bhav.vrindopnishad.in/glossary/${encodeURIComponent(g.id)}`;
    entitySchema = {
      '@type': 'DefinedTerm',
      '@id': `${canonicalUrl}#term`,
      'name': g.term,
      'alternateName': g.transliteration,
      'description': g.meaningDevanagari,
      'inDefinedTermSet': {
        '@type': 'DefinedTermSet',
        'name': 'ब्रज रस एवं निकुंज उपासना शब्दकोश',
        'url': 'https://bhav.vrindopnishad.in/glossary',
      },
      'url': canonicalUrl,
    };
    extraSchemas.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'वृन्दोपनिषद् 2.0', 'item': 'https://bhav.vrindopnishad.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'ब्रज शब्दकोश', 'item': 'https://bhav.vrindopnishad.in/glossary' },
        { '@type': 'ListItem', 'position': 3, 'name': g.term, 'item': canonicalUrl },
      ],
    });
    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 780px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <a href="/glossary" style="color: #b45309; text-decoration: none;">ब्रज शब्दकोश</a> &rsaquo; <span>${g.term}</span>
        </nav>
        <h1 style="font-size: 2rem; font-weight: 700; color: #1c1917; margin-bottom: 0.5rem;">${g.term}</h1>
        <p style="font-size: 1rem; color: #b45309; margin-bottom: 1.25rem;">${g.transliteration}</p>
        <p style="font-size: 1.15rem; line-height: 1.8; color: #1c1917; margin-bottom: 1rem;">${g.meaningDevanagari}</p>
        ${g.context ? `<blockquote style="padding: 1rem; background: #fffbeb; border-left: 4px solid #d97706; border-radius: 0.5rem; color: #78350f;">${g.context}</blockquote>` : ''}
      </article>
    `;
  } else if (TOPICAL_GUIDES_META[pathname.replace(/^\/+/, '')]) {
    hasPrerenderedStaticRoot = true;
    const guideSlug = pathname.replace(/^\/+/, '');
    const gMeta = TOPICAL_GUIDES_META[guideSlug];
    title = gMeta.title;
    description = gMeta.description;
    canonicalUrl = `https://bhav.vrindopnishad.in/${guideSlug}`;
    entitySchema = {
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      'headline': gMeta.title,
      'description': gMeta.description,
      'inLanguage': ['hi', 'en'],
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      'url': canonicalUrl,
    };
    if (gMeta.faqs && gMeta.faqs.length > 0) {
      extraSchemas.push({
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        'mainEntity': gMeta.faqs.map((item) => ({
          '@type': 'Question',
          'name': item.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.a,
          },
        })),
      });
    }
  } else {
    switch (activeTab) {
      case 'granthas':
        title = 'Sanatan Epics & Mahagranth Parayan • संपूर्ण वाल्मीकि रामायण, भागवत, गीता | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
        description = 'सनातन महाग्रंथ एवं अखंड पारायण पीठ। महर्षि वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, श्री रामचरितमानस, श्रीमद्भगवद्गीता एवं श्री दुर्गा सप्तशती का प्रामाणिक संस्कृत श्लोक एवं भावार्थ पाठ।';
        canonicalUrl = 'https://path.vrindopnishad.in/';
        dynamicRootHtml = `
          <article class="sanctuary-ssr-content" style="max-width: 860px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif; line-height: 1.8;">
            <header style="margin-bottom: 2rem; border-bottom: 2px solid #fef3c7; padding-bottom: 1.5rem;">
              <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">सनातन महाग्रंथ पारायण पीठ</span>
              <h1 style="font-size: 2.25rem; font-weight: 700; color: #1c1917; margin: 0 0 0.5rem 0;">५ अमर सनातन महाकाव्य एवं अखंड शास्त्र स्वाध्याय</h1>
              <p style="font-size: 1.05rem; color: #78716c; margin: 0;">श्रीमद् वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, श्री रामचरितमानस, श्रीमद्भगवद्गीता एवं श्री दुर्गा सप्तशती</p>
            </header>
            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
              ${Object.entries(EPICS_META).map(([id, meta]) => `
                <div style="padding: 1.5rem; background: #fff; border: 1px solid #fde68a; border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.05);">
                  <h2 style="font-size: 1.35rem; font-weight: 700; color: #78350f; margin: 0 0 0.5rem 0;"><a href="/grantha/${id}" style="color: #b45309; text-decoration: none;">${meta.name}</a></h2>
                  <p style="font-size: 0.95rem; color: #78716c; margin: 0 0 0.75rem 0;">प्रणेता: <strong>${meta.author}</strong></p>
                  <p style="font-size: 0.9rem; line-height: 1.6; color: #44403c; margin: 0 0 1rem 0;">${meta.desc}</p>
                  <a href="/grantha/${id}" style="display: inline-block; padding: 0.4rem 0.85rem; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; text-decoration: none;">संपूर्ण अध्याय एवं पारायण &rarr;</a>
                </div>
              `).join('')}
            </section>
          </article>
        `;
        break;
      case 'padavali':
        title = 'Scriptures Repository • ४४,०००+ पावन महाग्रंथ व रसिक वाणी संग्रह | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
        description = 'वाल्मीकि रामायण, श्रीमद् भागवत, रामचरितमानस, भगवद्गीता, हित चौरासी, केलिमाल, सूरसागर सहित सनातन महाग्रंथ व समस्त रसिक वाणी का अगाध संग्रह।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/padavali';
        break;
      case 'feed':
        title = 'Darshan Feed • नित्य वृन्दावन धाम दर्शन | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
        description = 'श्री वृन्दावन धाम के प्रमुख मंदिरों के प्रत्यक्ष दर्शन, उत्सव, आरती व नित्य विलास।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/feed';
        break;
      case 'milestones':
        title = 'Devotion Milestones • अखंड निष्ठा व साधना सोपान | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
        description = 'अखंड साधना स्ट्रीक, अंतरंग ध्यान सिद्धि एवं श्रीजी कृपा के पावन सोपान।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/milestones';
        break;
      default:
        title = 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा | वृन्दोपनिषद् 2.0 (Vrindopnishad)';
        description = 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/';
        break;
    }
  }

  // Generate dynamic Schema.org JSON-LD
  const schemaGraph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      'name': isPathDomain ? 'वृन्दोपनिषद् 2.0 (Vrindopnishad) - सनातन महाग्रंथ' : 'वृन्दोपनिषद् 2.0 (Vrindopnishad)',
      'url': isPathDomain ? 'https://path.vrindopnishad.in/' : 'https://bhav.vrindopnishad.in/',
      'description': isPathDomain
        ? 'Digital sanctuary for Sanatan Mahagranth Parayana (Valmiki Ramayana, Shrimad Bhagavatam, Ramcharitmanas, Bhagavad Gita)'
        : 'Digital sanctuary for Nitya Nikunj Ras & Canonical Braj Pada Literature',
      'inLanguage': ['hi', 'sa', 'en'],
      'potentialAction': {
        '@type': 'SearchAction',
        'target': isPathDomain ? 'https://path.vrindopnishad.in/?tab=granthas&q={search_term_string}' : 'https://bhav.vrindopnishad.in/?tab=padavali&q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'ReligiousOrganization',
      'name': 'वृन्दोपनिषद् 2.0',
      'url': 'https://bhav.vrindopnishad.in/',
      'logo': 'https://bhav.vrindopnishad.in/official-logo.svg',
    },
  ];

  if (entitySchema) {
    schemaGraph.push(entitySchema);
  }
  for (const extra of extraSchemas) {
    schemaGraph.push(extra);
  }

  const jsonLdString = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemaGraph,
  });

  // Edge HTML rewriting
  let rewriter = new HTMLRewriter()
    .on('title', new ElementTextModifier(title))
    .on('meta[name="title"]', new ElementAttributeModifier('content', title))
    .on('meta[name="description"]', new ElementAttributeModifier('content', description))
    .on('meta[property="og:title"]', new ElementAttributeModifier('content', title))
    .on('meta[property="og:description"]', new ElementAttributeModifier('content', description))
    .on('meta[property="og:url"]', new ElementAttributeModifier('content', canonicalUrl))
    .on('meta[name="twitter:title"]', new ElementAttributeModifier('content', title))
    .on('meta[name="twitter:description"]', new ElementAttributeModifier('content', description))
    .on('link[rel="canonical"]', new ElementAttributeModifier('href', canonicalUrl))
    .on('script#vrindopnisad-schema', new ElementTextModifier(jsonLdString));

  if (customKeywords) {
    rewriter = rewriter.on('meta[name="keywords"]', new ElementAttributeModifier('content', customKeywords));
  }

  // If this deep-link did not hit a pre-rendered static HTML file, inject semantic article into #seo-prerender & #root.
  // When serving pre-rendered static entity HTML, only inject into #seo-prerender so #root is preserved intact.
  if (dynamicRootHtml) {
    rewriter = rewriter.on('#seo-prerender', new ElementHtmlModifier(dynamicRootHtml));
    if (!hasPrerenderedStaticRoot) {
      rewriter = rewriter.on('#root', new ElementHtmlModifier(dynamicRootHtml));
    }
  }

  if (prevLinkUrl || nextLinkUrl) {
    const linkTags = [
      prevLinkUrl ? `<link rel="prev" href="${prevLinkUrl}" />` : '',
      nextLinkUrl ? `<link rel="next" href="${nextLinkUrl}" />` : '',
    ].filter(Boolean).join('');
    rewriter = rewriter.on('head', {
      element(el: CFElement) {
        el.append(linkTags, { html: true });
      },
    });
  }

  if (isStaging) {
    rewriter = rewriter.on('meta[name="robots"]', new ElementAttributeModifier('content', 'noindex, nofollow'));
  }

  const resHeaders = new Headers(response.headers);
  resHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  if (isStaging) {
    resHeaders.set('X-Robots-Tag', 'noindex, nofollow');
  } else {
    // 1-hour browser cache, 24-hour Cloudflare Edge cache, 7-day stale-while-revalidate
    resHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    resHeaders.set('CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    resHeaders.set('Cloudflare-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }

  return rewriter.transform(
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    })
  );
};
