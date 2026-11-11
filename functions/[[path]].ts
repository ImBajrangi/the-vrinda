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

interface Env {}

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

const padaSnippetsObj: Record<string, [string, string, string, string]> =
  (padaSnippetsData as any)?.default || padaSnippetsData || {};

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

function getChapterSnippet(granthaId: string, chapterId: string) {
  return CHAPTER_SNIPPETS[`${granthaId}:${chapterId}`] || null;
}

function mapPadToEpicChapter(padId: string): { grantha: string; chapter: string; verseId: string } | null {
  if (!padId) return null;
  const clean = decodeURIComponent(padId).trim();

  // 1. Ramcharitmanas (e.g. ramcharitmanas-kand-5-doha-14)
  const rcMatch = clean.match(/^ramcharitmanas(?:-kand)?[-_](\d+|[a-zA-Z]+)(?:[-_](?:doha|chaupai)[-_](\d+.*))?$/i);
  if (rcMatch || clean.startsWith('ramcharitmanas')) {
    const kands = ['', 'बालकाण्ड', 'अयोध्याकाण्ड', 'अरण्यकाण्ड', 'किष्किन्धाकाण्ड', 'सुन्दरकाण्ड', 'लंकाकाण्ड', 'उत्तरकाण्ड'];
    const kNum = rcMatch ? parseInt(rcMatch[1], 10) : 0;
    let kandName = '';
    if (kNum >= 1 && kNum <= 7) {
      kandName = kands[kNum];
    } else if (/sundar|सुन्दर/i.test(clean)) {
      kandName = 'सुन्दरकाण्ड';
    } else if (/bal|बाल/i.test(clean)) {
      kandName = 'बालकाण्ड';
    } else if (/ayodhya|अयोध्या/i.test(clean)) {
      kandName = 'अयोध्याकाण्ड';
    } else if (/aranya|अरण्य/i.test(clean)) {
      kandName = 'अरण्यकाण्ड';
    } else if (/kishkindha|किष्किन्धा/i.test(clean)) {
      kandName = 'किष्किन्धाकाण्ड';
    } else if (/lanka|लंका/i.test(clean)) {
      kandName = 'लंकाकाण्ड';
    } else if (/uttar|उत्तर/i.test(clean)) {
      kandName = 'उत्तरकाण्ड';
    }
    return {
      grantha: 'ramcharitmanas',
      chapter: kandName ? `kand-${kandName}` : 'kand-सुन्दरकाण्ड',
      verseId: clean,
    };
  }

  // 2. Valmiki Ramayana (e.g. valmiki-ramayana-5-sarga-4-shlok-12)
  const vrMatch = clean.match(/^valmiki-ramayana(?:-kand)?[-_](\d+)[-_]sarga[-_](\d+)/i);
  if (vrMatch || clean.startsWith('valmiki-ramayana')) {
    const kands = ['', 'बालकाण्ड', 'अयोध्याकाण्ड', 'अरण्यकाण्ड', 'किष्किन्धाकाण्ड', 'सुन्दरकाण्ड', 'युद्धकाण्ड', 'उत्तरकाण्ड'];
    const kNum = vrMatch ? parseInt(vrMatch[1], 10) : (/sundar|सुन्दर/i.test(clean) ? 5 : 1);
    const sNum = vrMatch ? parseInt(vrMatch[2], 10) : 1;
    const kandName = kands[kNum] || 'बालकाण्ड';
    return {
      grantha: 'valmiki-ramayana',
      chapter: `${kandName}-sarga-${sNum}`,
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

    const sitemapUrl = isPathDomain
      ? 'https://path.vrindopnishad.in/sitemap.xml'
      : 'https://bhav.vrindopnishad.in/sitemap.xml';

    const robotsBody = [
      '# https://www.robotstxt.org/robotstxt.html',
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /admin/',
      '',
      `Sitemap: ${sitemapUrl}`,
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

  // 3.1 Legacy & indexed verse URL 301 redirects (/lyrics/:id, /hi/lyrics/:id, /content/:id, /verse/:id, /pada/:id, /pad/:id)
  const legacyMatch = pathname.match(/^(?:\/(?:hi|en))?\/(?:lyrics|content|verse|pada|pad)\/([^/?#]+)/i);
  if (legacyMatch) {
    const rawPad = decodeURIComponent(legacyMatch[1]).trim();
    const mappedEpic = mapPadToEpicChapter(rawPad);
    if (mappedEpic) {
      return Response.redirect(
        `https://path.vrindopnishad.in/grantha/${encodeURIComponent(mappedEpic.grantha)}/${encodeURIComponent(mappedEpic.chapter)}`,
        301
      );
    } else {
      const isCleanOnBhav = !isPathDomain && (pathname === `/pad/${encodeURIComponent(rawPad)}` || pathname === `/pad/${rawPad}`);
      if (!isCleanOnBhav) {
        return Response.redirect(
          `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(rawPad)}`,
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
    '.ico', '.xml', '.gz', '.json', '.webmanifest', '.woff', '.woff2', '.ttf',
  ];
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/data/') ||
    staticExtensions.some((ext) => pathname.endsWith(ext))
  ) {
    const res = await next();

    // Guard: Prevent Cloudflare Pages SPA fallback from returning index.html with 200 OK for missing XML/sitemap files
    // Clean empty XML sitemap ensures Google Search Console NEVER encounters an HTML error or failed status
    if (
      (pathname.endsWith('.xml') || pathname.endsWith('.xml.gz')) &&
      res.headers.get('content-type')?.includes('text/html')
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
    if (isStaging) {
      const headers = new Headers(res.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }
    return res;
  }

  // Clean static route parsing: /pad/:id, /sant/:id, /grantha/:id, /grantha/:id/:ch, pillar paths
  let pathPad: string | null = null;
  let pathGrantha: string | null = null;
  let pathChapter: string | null = null;
  let pathAuthor: string | null = null;

  if (pathname.startsWith('/pad/')) {
    pathPad = decodeURIComponent(pathname.slice(5)).trim();
  } else if (pathname.startsWith('/sant/') || pathname.startsWith('/author/')) {
    pathAuthor = decodeURIComponent(pathname.replace(/^\/(?:sant|author)\//, '')).trim();
  } else if (pathname.startsWith('/grantha/')) {
    const parts = pathname.slice(9).split('/').map((p) => decodeURIComponent(p).trim()).filter(Boolean);
    if (parts.length >= 2) {
      pathGrantha = parts[0];
      pathChapter = parts.slice(1).join('/');
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

  // 4. Cross-Domain 301 Permanent Redirects for duplicated URLs
  const epicPad = qPad ? mapPadToEpicChapter(qPad) : null;

  if (isPathDomain && !isStaging) {
    // path.vrindopnishad.in owns ONLY Mahagranth Parayana (epics & chapters)
    if (pathname === '/rasik-saints-of-vrindavan' || pathname === '/vrindavan-ashtayama-seva-darshan-timings' || pathname === '/rasik-vani-granthas-list' || pathname === '/online-tulsi-mala-naam-jap') {
      return Response.redirect(`https://bhav.vrindopnishad.in${pathname}`, 301);
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
    if (qGrantha && EPICS_META[qGrantha]) {
      const targetChapter = qChapter ? `/${encodeURIComponent(qChapter)}` : '';
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
  let canonicalUrl = `${canonicalBaseDomain}${url.search ? url.search : (pathname === '/' ? '/' : pathname)}`;
  let entitySchema: Record<string, unknown> | null = null;
  const extraSchemas: Record<string, unknown>[] = [];
  let customKeywords: string | null = null;
  let dynamicRootHtml: string | null = null;

  const padId = qPad || pathPad;

  if (padId) {
    const cleanPadId = decodeURIComponent(padId).trim();
    const snippet = padaSnippetsObj[cleanPadId] || padaSnippetsObj[padId];
    const known = KNOWN_PADAS_META[cleanPadId] || KNOWN_PADAS_META[padId];

    const padTitle = known?.title || snippet?.[0] || formatSlug(cleanPadId);
    const padAuthor = known?.author || snippet?.[1] || 'रसिक संत';
    const granthaId = snippet?.[2] || '';
    const granthaMeta = granthaId ? GRANTHAS_MAP.get(granthaId) : null;
    const granthaLabel = granthaMeta?.name || 'रसिक वाणी संग्रह';
    const granthaCategory = 'रसिक वाणी संग्रह';
    const openingVerse = known?.sampleVerse || snippet?.[3] || '';
    const romanTitle = formatSlug(cleanPadId);

    title = `${padTitle} (${padAuthor}) • पावन रसिक पद | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
    description = openingVerse
      ? `«${openingVerse.replace(/\n+/g, ' ')}» ${padTitle} (${granthaLabel}) के पावन पद, मूल पाठ व भावार्थ। रचयिता: ${padAuthor}। वृन्दोपनिषद् 2.0`
      : `${padTitle} (${granthaLabel}) के पावन पद, मूल पाठ, भावार्थ व नित्य अनुशीलन। रचयिता: ${padAuthor}। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/pad/${encodeURIComponent(cleanPadId)}`;

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
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'वृन्दोपनिषद् 2.0 (Vrindopnishad)',
        'url': 'https://bhav.vrindopnishad.in/',
      },
    };

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
          'item': `https://bhav.vrindopnishad.in/?tab=padavali&grantha=${encodeURIComponent(granthaId || '')}`,
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
          'name': `${padTitle} के रचयिता कौन हैं?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `इस पावन पद के रचयिता ${padAuthor} जी हैं, जो श्री धाम वृन्दावन की पावन रसिक वाणी परंपरा के प्रमुख संत हैं।`,
          },
        },
        {
          '@type': 'Question',
          'name': `यह पद किस पावन संग्रह में संकलित है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `यह पद '${granthaLabel}' संग्रह में संकलित है।`,
          },
        },
        {
          '@type': 'Question',
          'name': `इस पद का मुख्य आध्यात्मिक भाव क्या है?`,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': `${padTitle} में श्री प्रिया-प्रियतम के नित्य निकुंज विलास, अनन्य प्रेम व युगल चरण शरणागति का पावन गान है।`,
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
              <a itemprop="item" href="/?tab=padavali&grantha=${encodeURIComponent(granthaId || '')}" style="color: #b45309; text-decoration: none;"><span itemprop="name">${granthaLabel}</span></a>
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

        <!-- Authentic Sacred Verse Body -->
        <section class="verse-body" style="font-size: 1.35rem; line-height: 2.1; color: #292524; background: linear-gradient(180deg, #fffbeb 0%, #fef9c3 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #fde68a; white-space: pre-line; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.06); text-align: center;">
          ${openingVerse || `${padTitle} के पावन पद का अखंड स्वाध्याय व चिंतन।`}
        </section>

        <!-- Sacred Meaning / Spiritual Context -->
        <section style="margin-top: 2rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #f5f5f4; padding: 1.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">पावन भाव व अनुशीलन</h2>
          <p style="font-size: 1rem; line-height: 1.8; color: #44403c; margin: 0;">
            ${padTitle} श्री धाम वृन्दावन की पावन रसिक वाणी परंपरा का अनुपम पद है। इस पावन पद में श्री प्रिया-प्रियतम (श्रीराधा-कृष्ण) के नित्य निकुंज रस, परम विलास एवं अनन्य शरणागति का दिव्य वर्णन मिलता है। रसिक संतों के अनुसार इस वाणी का नित्य अनुशीलन हृदय में अहैतुकी प्रीति व शांति का संचार करता है।
          </p>
        </section>

        <!-- Structured Metadata Table (GeeksforGeeks-Style Schema Table) -->
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #78350f; margin: 0 0 0.75rem 0;">ग्रंथ एवं संत विवरण</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; border: 1px solid #e7e5e4;">
            <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">पद शीर्षक (Title)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">${padTitle} (${romanTitle})</td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">रचयिता (Author)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="/?tab=padavali&q=${encodeURIComponent(padAuthor)}" style="color: #b45309; text-decoration: underline;">${padAuthor}</a></td></tr>
            <tr style="background-color: #f5f5f4;"><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">संग्रह (Grantha)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="/?tab=padavali&grantha=${encodeURIComponent(granthaId || '')}" style="color: #b45309; text-decoration: underline;">${granthaLabel}</a></td></tr>
            <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">साधना धारा (Tradition)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;">श्री वृन्दावन नित्य निकुंज रस उपासना</td></tr>
          </table>
        </section>

        <!-- Google FAQ Rich Snippets Section -->
        <section style="margin-top: 2rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 0.75rem; padding: 1.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #92400e; margin: 0 0 1rem 0;">अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2>
          <details open style="margin-bottom: 0.75rem; padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">${padTitle} के रचयिता कौन हैं?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">इस पावन पद के रचयिता <strong>${padAuthor}</strong> जी हैं।</p>
          </details>
          <details open style="padding: 0.75rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #fef3c7;">
            <summary style="font-weight: 600; color: #78350f; cursor: pointer;">यह पद किस पावन संग्रह का अंग है?</summary>
            <p style="margin: 0.5rem 0 0 0; color: #44403c; font-size: 0.95rem;">यह पद <strong>${granthaLabel}</strong> संग्रह का पावन अंग है।</p>
          </details>
        </section>

        <!-- Internal Cross-Linking Grid (Zero Dead Ends for Crawlers) -->
        <section style="margin-top: 2rem; padding: 1.5rem; background-color: #fafaf9; border-radius: 0.75rem; border: 1px solid #e7e5e4;">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #44403c; margin: 0 0 1rem 0;">संबंधित पावन पद व स्वाध्याय</h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <li><a href="/?tab=padavali&grantha=${encodeURIComponent(granthaId || '')}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📖 ${granthaLabel} के समस्त पद &rarr;</a></li>
            <li><a href="/?tab=padavali&q=${encodeURIComponent(padAuthor)}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 ${padAuthor} की अन्य रचनाएँ &rarr;</a></li>
            <li><a href="/?tab=feed" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🛕 श्री धाम वृन्दावन मंदिर दर्शन &rarr;</a></li>
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
    const tradition = saint?.tradition ? ` (${saint.tradition})` : '';
    const bio = saint?.biography ? `${saint.biography} ` : '';

    title = `${saintName}${tradition} • रसिक संत पदावली व जीवन चरित | वृन्दोपनिषद् 2.0`;
    description = `${bio}${saintName} की समस्त पावन पदों व वाणियों का प्रामाणिक संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/?tab=padavali&author=${encodeURIComponent(saint?.slug || qAuthor)}`;

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

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <span>संत परंपरा</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">रसिक संत परंपरा</span>
          <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${saintName}</h1>
          <p style="font-size: 0.95rem; color: #78716c; margin: 0;">${saint?.tradition ? `संप्रदाय: ${saint.tradition} • ` : ''}पावन वाणी व रसिक पद संग्रह</p>
        </header>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #44403c;">${description}</p>
      </article>
    `;
  } else if (qGrantha && EPICS_META[qGrantha]) {
    const epic = EPICS_META[qGrantha];
    if (qChapter || epicPad?.chapter) {
      let targetChapter = qChapter || epicPad!.chapter;
      if (qGrantha === 'ramcharitmanas') {
        const decCh = decodeURIComponent(targetChapter).toLowerCase();
        if (/sundar|सुन्दर|kand-5/i.test(decCh)) {
          targetChapter = 'kand-सुन्दरकाण्ड';
        }
      } else if (qGrantha === 'valmiki-ramayana') {
        const decCh = decodeURIComponent(targetChapter).toLowerCase();
        if (/sundar|सुन्दर/i.test(decCh) && !decCh.includes('-sarga-')) {
          targetChapter = 'सुन्दरकाण्ड-sarga-1';
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
                <a itemprop="item" href="https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: none;"><span itemprop="name">${epic.name}</span></a>
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
              <tr><td style="padding: 0.75rem; border: 1px solid #e7e5e4; font-weight: 600;">महाग्रंथ (Epic)</td><td style="padding: 0.75rem; border: 1px solid #e7e5e4;"><a href="https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: underline;">${epic.name}</a></td></tr>
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
              <li><a href="https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">📜 ${epic.name} के समस्त अध्याय &rarr;</a></li>
              <li><a href="https://path.vrindopnishad.in/" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🏛️ ५ अमर सनातन महाकाव्य &rarr;</a></li>
              <li><a href="https://bhav.vrindopnishad.in/?tab=padavali" style="color: #b45309; text-decoration: none; display: block; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #e7e5e4; border-radius: 0.5rem;">🌸 ४४,०००+ रसिक वाणी संग्रह &rarr;</a></li>
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
    title = `${g.name}${authorText} • संपूर्ण वाणी संग्रह | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
    description = `${g.description || g.name} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(g.id || qGrantha)}`;

    entitySchema = {
      '@type': 'Book',
      '@id': `${canonicalUrl}#book`,
      'name': g.name,
      ...(g.author ? { 'author': { '@type': 'Person', 'name': g.author } } : {}),
      'description': g.description || description,
    };

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <span>पावन ग्रंथ संग्रह</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">पावन वाणी ग्रंथ</span>
          <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${g.name}</h1>
          <p style="font-size: 0.95rem; color: #78716c; margin: 0;">रचयिता: ${g.author || 'रसिक संत'} • नित्य स्वाध्याय व अनुशीलन</p>
        </header>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #44403c;">${description}</p>
      </article>
    `;
  } else if (qGrantha) {
    const formatted = formatSlug(qGrantha);
    title = `${formatted} • संपूर्ण ग्रंथ संग्रह | वृन्दोपनिषद् 2.0 (Vrindopnishad)`;
    description = `${formatted} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(qGrantha)}`;
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

  // If this deep-link did not hit a pre-rendered static HTML file, inject semantic article into #seo-prerender & #root
  if (dynamicRootHtml) {
    rewriter = rewriter
      .on('#seo-prerender', new ElementHtmlModifier(dynamicRootHtml))
      .on('#root', new ElementHtmlModifier(dynamicRootHtml));
  }

  if (isStaging) {
    rewriter = rewriter.on('meta[name="robots"]', new ElementAttributeModifier('content', 'noindex, nofollow'));
  }

  const resHeaders = new Headers(response.headers);
  resHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  if (isStaging) {
    resHeaders.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return rewriter.transform(
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    })
  );
};
