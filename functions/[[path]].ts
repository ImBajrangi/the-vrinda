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
  const isStaging = host.endsWith('.pages.dev');
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
        ...(isStaging ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
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
        `https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(mappedEpic.grantha)}&chapter=${encodeURIComponent(mappedEpic.chapter)}&verse=${encodeURIComponent(rawPad)}`,
        301
      );
    } else {
      return Response.redirect(
        `https://bhav.vrindopnishad.in/?tab=padavali&pad=${encodeURIComponent(rawPad)}`,
        301
      );
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

  // Parse queries and determine active domain & tab
  const qTab = url.searchParams.get('tab');
  const qPad = url.searchParams.get('pad');
  const qGrantha = url.searchParams.get('grantha');
  const qAuthor = url.searchParams.get('author');
  const qChapter = url.searchParams.get('chapter');

  // 4. Cross-Domain 301 Permanent Redirects for duplicated URLs
  const epicPad = qPad ? mapPadToEpicChapter(qPad) : null;

  if (isPathDomain && !isStaging) {
    // path.vrindopnishad.in owns ONLY Mahagranth Parayana (epics & chapters)
    if (qGrantha && EPICS_META[qGrantha]) {
      // Epics belong strictly to path.vrindopnishad.in. Ensure tab=granthas without ping-ponging!
      if (qTab && qTab !== 'granthas') {
        const target = new URL(url.toString());
        target.searchParams.set('tab', 'granthas');
        return Response.redirect(target.toString(), 301);
      }
    } else if (epicPad) {
      // Epic verse query on path.vrindopnishad.in -> normalize to tab=granthas
      const target = new URL('https://path.vrindopnishad.in/');
      target.searchParams.set('tab', 'granthas');
      target.searchParams.set('grantha', epicPad.grantha);
      target.searchParams.set('chapter', epicPad.chapter);
      target.searchParams.set('verse', epicPad.verseId);
      return Response.redirect(target.toString(), 301);
    } else {
      if (qTab && qTab !== 'granthas') {
        return Response.redirect(`https://bhav.vrindopnishad.in${url.search}`, 301);
      }
      if (qPad || qAuthor) {
        return Response.redirect(`https://bhav.vrindopnishad.in${url.search}`, 301);
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
      return Response.redirect('https://path.vrindopnishad.in/?tab=granthas', 301);
    }
    if (qGrantha && EPICS_META[qGrantha]) {
      const target = new URL(url.toString());
      target.hostname = 'path.vrindopnishad.in';
      target.searchParams.set('tab', 'granthas');
      return Response.redirect(target.toString(), 301);
    }
    if (epicPad) {
      const target = new URL('https://path.vrindopnishad.in/');
      target.searchParams.set('tab', 'granthas');
      target.searchParams.set('grantha', epicPad.grantha);
      target.searchParams.set('chapter', epicPad.chapter);
      target.searchParams.set('verse', epicPad.verseId);
      return Response.redirect(target.toString(), 301);
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
  let dynamicRootHtml: string | null = null;

  const padId = qPad || (pathname.startsWith('/pad/') ? decodeURIComponent(pathname.replace('/pad/', '')).trim() : null);

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

    title = `${padTitle} (${padAuthor}) • पावन रसिक पद | वृन्दोपनिषद् 2.0`;
    description = openingVerse
      ? `«${openingVerse.replace(/\n+/g, ' ')}» ${padTitle} (${granthaLabel}) के पावन पद, मूल पाठ व भावार्थ। रचयिता: ${padAuthor}। वृन्दोपनिषद् 2.0`
      : `${padTitle} (${granthaLabel}) के पावन पद, मूल पाठ, भावार्थ व नित्य अनुशीलन। रचयिता: ${padAuthor}। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/?tab=padavali&pad=${encodeURIComponent(cleanPadId)}`;

    entitySchema = {
      '@type': 'CreativeWork',
      '@id': `${canonicalUrl}#creativework`,
      'headline': padTitle,
      'name': padTitle,
      'author': {
        '@type': 'Person',
        'name': padAuthor,
      },
      'inLanguage': 'hi',
      'text': openingVerse || padTitle,
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'वृन्दोपनिषद् 2.0 (Vrindopnisad)',
        'url': 'https://bhav.vrindopnishad.in/',
      },
    };

    dynamicRootHtml = `
      <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
        <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
          <a href="/" style="color: #b45309; text-decoration: none;">वृन्दोपनिषद् 2.0</a> &rsaquo; <span>${granthaLabel}</span>
        </nav>
        <header style="margin-bottom: 2rem;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">${granthaCategory}</span>
          <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${padTitle}</h1>
          <p style="font-size: 0.95rem; color: #78716c; margin: 0;">रचयिता: ${padAuthor} • संग्रह: ${granthaLabel}</p>
        </header>
        <section class="verse-body" style="font-size: 1.25rem; line-height: 2; color: #292524; background-color: #fffbeb; padding: 1.5rem; border-radius: 1rem; border: 1px solid #fef3c7; white-space: pre-line;">
          ${openingVerse || `${padTitle} के पावन पद का अखंड स्वाध्याय व चिंतन।`}
        </section>
        <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #f5f5f4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center;">
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

    entitySchema = {
      '@type': 'ProfilePage',
      'headline': `${saintName} - रसिक संत परंपरा`,
      'mainEntity': {
        '@type': 'Person',
        'name': saintName,
        'description': saint?.biography || `${saintName} - ब्रज निकुंज रस व पावन वाणी के प्रणेता।`,
        ...(saint?.tradition ? { 'knowsAbout': saint.tradition } : {}),
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

      title = `${chName} (${epic.name}) • प्रणेता: ${epic.author} | वृन्दोपनिषद् 2.0`;
      description = `«${chOpeningVerse}» ${epic.name} का पावन अध्याय ${chName} (${chVerseCount} श्लोक)। मूल श्लोक, पाठ व पारायण। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}&chapter=${encodeURIComponent(targetChapter)}`;

      entitySchema = {
        '@type': 'Chapter',
        '@id': `${canonicalUrl}#chapter`,
        'name': `${epic.name} - ${chName}`,
        'numberOfPages': chVerseCount || undefined,
        'isPartOf': {
          '@type': 'Book',
          '@id': `https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}#book`,
          'name': epic.name,
          'author': { '@type': 'Person', 'name': epic.author },
        },
      };

      dynamicRootHtml = `
        <article class="sanctuary-ssr-content" style="max-width: 820px; margin: 0 auto; padding: 2.5rem 1.25rem; font-family: 'Noto Serif Devanagari', serif;">
          <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #b45309;">
            <a href="https://path.vrindopnishad.in/" style="color: #b45309; text-decoration: none;">महाग्रंथ पारायण</a> &rsaquo; <span>${epic.name}</span>
          </nav>
          <header style="margin-bottom: 2rem;">
            <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background-color: #fef3c7; color: #92400e; margin-bottom: 0.75rem;">सनातन महाग्रंथ</span>
            <h1 style="font-size: 2rem; font-weight: 700; line-height: 1.3; color: #1c1917; margin: 0 0 0.75rem 0;">${chName}</h1>
            <p style="font-size: 0.95rem; color: #78716c; margin: 0;">${epic.name} • प्रणेता: ${epic.author} • ${chVerseCount} पावन श्लोक</p>
          </header>
          <section class="verse-body" style="font-size: 1.25rem; line-height: 2; color: #292524; background-color: #fffbeb; padding: 1.5rem; border-radius: 1rem; border: 1px solid #fef3c7; white-space: pre-line;">
            ${chOpeningVerse}
          </section>
          <footer style="margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #f5f5f4; font-size: 0.875rem; color: #a8a29e; display: flex; justify-content: space-between; align-items: center;">
            <span>वृन्दोपनिषद् 2.0 • Digital Sanctuary for Sanatan Mahagranth Parayana</span>
            <a href="${canonicalUrl}" style="color: #b45309; text-decoration: underline;">अखंड स्वाध्याय व पाठ</a>
          </footer>
        </article>
      `;
    } else {
      title = `${epic.name} (${epic.author}) • संपूर्ण मूल पाठ व पारायण | वृन्दोपनिषद् 2.0`;
      description = `${epic.desc}। प्रणेता: ${epic.author}। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `https://path.vrindopnishad.in/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}`;

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
    title = `${g.name}${authorText} • संपूर्ण वाणी संग्रह | वृन्दोपनिषद् 2.0`;
    description = `${g.description || g.name} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/?tab=padavali&grantha=${encodeURIComponent(g.id || qGrantha)}`;

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
    title = `${formatted} • संपूर्ण ग्रंथ संग्रह | वृन्दोपनिषद् 2.0`;
    description = `${formatted} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `https://bhav.vrindopnishad.in/?tab=padavali&grantha=${encodeURIComponent(qGrantha)}`;
  } else {
    switch (activeTab) {
      case 'granthas':
        title = 'Sanatan Mahagranth Parayana • ५ अमर महाकाव्य एवं अखंड शास्त्र स्वाध्याय | वृन्दोपनिषद् 2.0';
        description = 'श्रीमद् वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, श्री रामचरितमानस, श्रीमद्भगवद्गीता व श्री दुर्गा सप्तशती का संपूर्ण मूल पाठ व ऑन-डिमांड त्वरित पारायण।';
        canonicalUrl = 'https://path.vrindopnishad.in/?tab=granthas';
        break;
      case 'padavali':
        title = 'Scriptures Repository • ४४,०००+ पावन महाग्रंथ व रसिक वाणी संग्रह | वृन्दोपनिषद् 2.0';
        description = 'वाल्मीकि रामायण, श्रीमद् भागवत, रामचरितमानस, भगवद्गीता, हित चौरासी, केलिमाल, सूरसागर सहित सनातन महाग्रंथ व समस्त रसिक वाणी का अगाध संग्रह।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/?tab=padavali';
        break;
      case 'feed':
        title = 'Darshan Feed • नित्य वृन्दावन धाम दर्शन | वृन्दोपनिषद् 2.0';
        description = 'श्री वृन्दावन धाम के प्रमुख मंदिरों के प्रत्यक्ष दर्शन, उत्सव, आरती व नित्य विलास।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/?tab=feed';
        break;
      case 'milestones':
        title = 'Devotion Milestones • अखंड निष्ठा व साधना सोपान | वृन्दोपनिषद् 2.0';
        description = 'अखंड साधना स्ट्रीक, अंतरंग ध्यान सिद्धि एवं श्रीजी कृपा के पावन सोपान।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/?tab=milestones';
        break;
      default:
        title = 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा | वृन्दोपनिषद् 2.0';
        description = 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।';
        canonicalUrl = 'https://bhav.vrindopnishad.in/';
        break;
    }
  }

  // Generate dynamic Schema.org JSON-LD
  const schemaGraph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      'name': 'वृन्दोपनिषद् 2.0 (Vrindopnisad)',
      'url': 'https://bhav.vrindopnishad.in/',
      'description': 'Digital sanctuary for Nitya Nikunj Ras & Canonical Braj Pada Literature',
      'inLanguage': ['hi', 'sa', 'en'],
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://bhav.vrindopnishad.in/?tab=padavali&q={search_term_string}',
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

  // If this deep-link did not hit a pre-rendered static HTML file, inject semantic article into #root
  if (dynamicRootHtml) {
    rewriter = rewriter.on('#root', new ElementHtmlModifier(dynamicRootHtml));
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
