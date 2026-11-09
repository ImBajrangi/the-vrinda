/**
 * Vrindopnisad 2.0 - Cloudflare Pages Functions Edge Interceptor
 * Dynamically handles edge SEO, deep link canonicals, meta injection via HTMLRewriter,
 * and staging noindex protection for the-vrinda.pages.dev.
 */

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

const GRANTHAS_META: Record<string, { name: string; author: string; desc: string }> = {
  'hit-chaurasi': {
    name: 'श्री हित चौरासी',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'श्री राधा वल्लभ संप्रदाय का शिरोमणि ग्रंथ, ८४ पावन पदों में नित्य निकुंज रस का अमूर्त विलास।',
  },
  'kelimal': {
    name: 'केलिमाल',
    author: 'स्वामी श्री हरिदास जी',
    desc: 'श्री स्वामी हरिदास जी महाराज द्वारा रचित नित्य निकुंज रस केलि के परम पावन पद।',
  },
  'radha-sudha-nidhi': {
    name: 'श्री राधा सुधा निधि',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'श्री राधा रानी के पावन चरण कमलों की अनन्य निष्ठा व परम रस सुधा का स्तोत्र।',
  },
  'sur-sagar': {
    name: 'सूरसागर',
    author: 'महाकवि सूरदास',
    desc: 'महाकवि सूरदास प्रणीत वात्सल्य एवं मधुर रस के अमूल्य पद।',
  },
  'vyas-vani': {
    name: 'व्यास वाणी',
    author: 'श्री हरिराम व्यास',
    desc: 'श्री व्यास जी रचित अनन्य रस व ब्रज निष्ठा की पावन वाणी।',
  },
  'meera-padavali': {
    name: 'मीराबाई पदावली',
    author: 'भक्त शिरोमणि मीराबाई',
    desc: 'गिरधर गोपाल के अनन्य विरह और समर्पण से ओतप्रोत पावन पद।',
  },
  'raskhan-padavali': {
    name: 'रसखान पदावली',
    author: 'रसखान',
    desc: 'ब्रजभूमि और नंदनंदन के पावन प्रेम में निबद्ध सवैये व दोहे।',
  },
};

const KNOWN_PADAS_META: Record<string, { title: string; author: string; desc: string }> = {
  'radheju-merau-janam-sudharau': {
    title: 'राधेजू मेरौ जनम सुधारौ',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'राधेजू मेरौ जनम सुधारौ। नित्य निकुंज रस व किशोरी जी की अनन्य कृपा का पावन पद। वृन्दोपनिषद् 2.0',
  },
  'shri-radha-kripa-kataksha-stotram': {
    title: 'श्री राधा कृपा कटाक्ष स्तोत्रम्',
    author: 'उर्ध्वान्नाय तंत्र',
    desc: 'मुनीन्द्रवृन्दवन्दिते त्रिलोकशोकहारिणी। श्री राधा रानी के पावन कृपा कटाक्ष का दिव्य स्तोत्र। वृन्दोपनिषद् 2.0',
  },
  'bainu-mai-baje-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64': {
    title: 'बैनु मैं बाजै बंसीवट',
    author: 'श्री हित हरिवंश महाप्रभु',
    desc: 'श्री हित चौरासी पद ६४: बैनु मैं बाजै बंसीवट। नित्य विलास व ब्रज रस का अमर पद। वृन्दोपनिषद् 2.0',
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  const host = url.hostname;
  const isStaging = host.endsWith('.pages.dev');
  const isPathDomain = host === 'path.vrindopnishad.in' || host.startsWith('path.');
  const baseDomain = isPathDomain ? 'https://path.vrindopnishad.in' : 'https://bhav.vrindopnishad.in';
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 1. Dynamic Robots.txt routing per domain (bhav vs path vs staging)
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
      ...(isPathDomain ? ['Sitemap: https://path.vrindopnishad.in/sitemap-path.xml'] : []),
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

  // 2. Intelligent Sitemap Routing for path.vrindopnishad.in
  // If request is made to path.vrindopnishad.in and asks for standard sitemap URLs,
  // transparently map it to the corresponding sitemap-path-* file.
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
    if (pathname === '/sitemap-saints.xml') {
      const redirectedUrl = new URL('/sitemap-path-saints.xml', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
    if (pathname === '/sitemap-padas.xml.gz') {
      const redirectedUrl = new URL('/sitemap-path-padas.xml.gz', request.url);
      return next(new Request(redirectedUrl.toString(), request));
    }
  }

  // Fast-path for non-HTML assets
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

  // Fetch the static HTML from Pages CDN
  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Determine SEO metadata based on URL and query params
  const qTab = url.searchParams.get('tab');
  const qPad = url.searchParams.get('pad');
  const qGrantha = url.searchParams.get('grantha');
  const qAuthor = url.searchParams.get('author');
  const qChapter = url.searchParams.get('chapter');

  let activeTab = 'smaran';
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

  let title = 'वृन्दोपनिषद् 2.0 • Sacred Vrindavan Ras Sanctuary & Canonical Pada Literature';
  let description = 'Digital sanctuary for Nitya Nikunj Ras. Explore 44,000+ canonical Braj Ras verses, Hit Chaurasi, Radha Sudha Nidhi, Kelimal, Ashtayama daily seva schedule, and contemplative dhyana sadhana.';
  let canonicalUrl = `${baseDomain}${url.search ? url.search : (pathname === '/' ? '/' : pathname)}`;

  const padId = qPad || (pathname.startsWith('/pad/') ? decodeURIComponent(pathname.replace('/pad/', '')).trim() : null);

  if (padId) {
    const known = KNOWN_PADAS_META[padId];
    if (known) {
      title = `${known.title} (${known.author}) • वृन्दोपनिषद् 2.0`;
      description = known.desc;
    } else {
      const formattedName = formatSlug(padId);
      title = `${formattedName} • पावन रसिक पद | वृन्दोपनिषद् 2.0`;
      description = `${formattedName} के पावन पद, मूल पाठ, राग, भावार्थ व नित्य अनुशीलन। वृन्दोपनिषद् 2.0`;
    }
    canonicalUrl = `${baseDomain}/?tab=padavali&pad=${encodeURIComponent(padId)}`;
  } else if (qAuthor) {
    title = `${qAuthor} • रसिक संत पदावली व जीवन चरित | वृन्दोपनिषद् 2.0`;
    description = `${qAuthor} की समस्त पावन पदों व वाणियों का प्रामाणिक संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `${baseDomain}/?tab=padavali&author=${encodeURIComponent(qAuthor)}`;
  } else if (qGrantha && EPICS_META[qGrantha]) {
    const epic = EPICS_META[qGrantha];
    if (qChapter) {
      title = `${epic.name} (${qChapter}) • प्रणेता: ${epic.author} | वृन्दोपनिषद् 2.0`;
      description = `${epic.name} का पावन अध्याय ${qChapter}। मूल श्लोक, अवधी/संस्कृत पाठ व पारायण। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `${baseDomain}/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}&chapter=${encodeURIComponent(qChapter)}`;
    } else {
      title = `${epic.name} (${epic.author}) • संपूर्ण मूल पाठ व पारायण | वृन्दोपनिषद् 2.0`;
      description = `${epic.desc}। प्रणेता: ${epic.author}। वृन्दोपनिषद् 2.0`;
      canonicalUrl = `${baseDomain}/?tab=granthas&grantha=${encodeURIComponent(qGrantha)}`;
    }
  } else if (qGrantha && GRANTHAS_META[qGrantha]) {
    const g = GRANTHAS_META[qGrantha];
    title = `${g.name} (${g.author}) • संपूर्ण वाणी संग्रह | वृन्दोपनिषद् 2.0`;
    description = `${g.desc} वृन्दोपनिषद् 2.0`;
    canonicalUrl = `${baseDomain}/?tab=padavali&grantha=${encodeURIComponent(qGrantha)}`;
  } else if (qGrantha) {
    const formatted = formatSlug(qGrantha);
    title = `${formatted} • संपूर्ण ग्रंथ संग्रह | वृन्दोपनिषद् 2.0`;
    description = `${formatted} के समस्त पावन पदों व श्लोकों का संग्रह। वृन्दोपनिषद् 2.0`;
    canonicalUrl = `${baseDomain}/?tab=padavali&grantha=${encodeURIComponent(qGrantha)}`;
  } else {
    switch (activeTab) {
      case 'granthas':
        title = 'Sanatan Mahagranth Parayana • ५ अमर महाकाव्य एवं अखंड शास्त्र स्वाध्याय | वृन्दोपनिषद् 2.0';
        description = 'श्रीमद् वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, श्री रामचरितमानस, श्रीमद्भगवद्गीता व श्री दुर्गा सप्तशती का संपूर्ण मूल पाठ व ऑन-डिमांड त्वरित पारायण।';
        canonicalUrl = `${baseDomain}/?tab=granthas`;
        break;
      case 'padavali':
        title = 'Scriptures Repository • ४४,०००+ पावन महाग्रंथ व रसिक वाणी संग्रह | वृन्दोपनिषद् 2.0';
        description = 'वाल्मीकि रामायण, श्रीमद् भागवत, रामचरितमानस, भगवद्गीता, हित चौरासी, केलिमाल, सूरसागर सहित सनातन महाग्रंथ व समस्त रसिक वाणी का अगाध संग्रह।';
        canonicalUrl = `${baseDomain}/?tab=padavali`;
        break;
      case 'feed':
        title = 'Darshan Feed • नित्य वृन्दावन धाम दर्शन | वृन्दोपनिषद् 2.0';
        description = 'श्री वृन्दावन धाम के प्रमुख मंदिरों के प्रत्यक्ष दर्शन, उत्सव, आरती व नित्य विलास।';
        canonicalUrl = `${baseDomain}/?tab=feed`;
        break;
      case 'milestones':
        title = 'Devotion Milestones • अखंड निष्ठा व साधना सोपान | वृन्दोपनिषद् 2.0';
        description = 'अखंड साधना स्ट्रीक, अंतरंग ध्यान सिद्धि एवं श्रीजी कृपा के पावन सोपान।';
        canonicalUrl = `${baseDomain}/?tab=milestones`;
        break;
      default:
        title = 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा | वृन्दोपनिषद् 2.0';
        description = 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।';
        canonicalUrl = `${baseDomain}/`;
        break;
    }
  }

  let rewriter = new HTMLRewriter()
    .on('title', new ElementTextModifier(title))
    .on('meta[name="title"]', new ElementAttributeModifier('content', title))
    .on('meta[name="description"]', new ElementAttributeModifier('content', description))
    .on('meta[property="og:title"]', new ElementAttributeModifier('content', title))
    .on('meta[property="og:description"]', new ElementAttributeModifier('content', description))
    .on('meta[property="og:url"]', new ElementAttributeModifier('content', canonicalUrl))
    .on('meta[name="twitter:title"]', new ElementAttributeModifier('content', title))
    .on('meta[name="twitter:description"]', new ElementAttributeModifier('content', description))
    .on('link[rel="canonical"]', new ElementAttributeModifier('href', canonicalUrl));

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

