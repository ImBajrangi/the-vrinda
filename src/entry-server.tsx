import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { NavTab } from './components/common/FloatingNavbar';
import { SacredDatabase } from './services/sacredDatabase';
import { generateSEOMetadata, SEOMetadataResult, SEOConfig } from './services/seoService';
import canonicalPadasData from './data/canonicalPadas.json';
import { SacredPad } from './types/devotional';

// Ensure SSR server pre-warms with full 4,204 canonical padas for instant bot rendering and SEO extraction
function ensureDatabasePrewarmed(): void {
  if (!SacredDatabase.isLoaded()) {
    SacredDatabase.loadPadas(canonicalPadasData as any[]);
  }
}

export interface RenderResult {
  html: string;
  seo: SEOMetadataResult;
  initialState: {
    tab: NavTab;
    padId?: string;
    initialPad?: SacredPad;
  };
}

export function render(url: string = '/'): RenderResult {
  ensureDatabasePrewarmed();
  let tab: NavTab = 'smaran';
  let padId: string | undefined;
  let authorQuery: string | undefined;
  let granthaQuery: string | undefined;

  try {
    const parsed = new URL(url, 'https://bhav.vrindopnishad.in');
    const qTab = parsed.searchParams.get('tab') as NavTab;
    const qPad = parsed.searchParams.get('pad');
    const qAuthor = parsed.searchParams.get('author');
    const qGrantha = parsed.searchParams.get('grantha');

    if (qAuthor) authorQuery = qAuthor;
    if (qGrantha) granthaQuery = qGrantha;

    if (qTab && ['smaran', 'granthas', 'padavali', 'feed', 'milestones'].includes(qTab)) {
      tab = qTab;
    }
    if (qPad || qAuthor) {
      tab = 'padavali';
    } else if (qGrantha) {
      if (['valmiki-ramayana', 'shrimad-bhagavatam', 'ramcharitmanas', 'bhagavad-gita', 'durga-saptashati'].includes(qGrantha)) {
        tab = 'granthas';
      } else {
        tab = 'padavali';
      }
    }
    if (qPad) {
      padId = qPad;
    }

    // Pathname support: /pad/:id, /padavali, /granthas, /feed, /smaran, /milestones
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname.startsWith('/pad/')) {
      padId = decodeURIComponent(pathname.replace('/pad/', '')).trim();
      tab = 'padavali';
    } else if (pathname === '/padavali') {
      tab = 'padavali';
    } else if (pathname === '/granthas') {
      tab = 'granthas';
    } else if (pathname === '/feed') {
      tab = 'feed';
    } else if (pathname === '/milestones') {
      tab = 'milestones';
    } else if (pathname === '/smaran') {
      tab = 'smaran';
    }
  } catch {
    tab = 'smaran';
  }

  // Look up specific pad if requested for deep-link SEO
  const pad = padId ? SacredDatabase.getPadById(padId) : undefined;

  let seoConfig: SEOConfig = {
    tab,
    canonicalUrl: `https://bhav.vrindopnishad.in${url}`,
  };

  const epicsMeta: Record<string, { name: string; author: string; desc: string }> = {
    'valmiki-ramayana': { name: 'श्रीमद् वाल्मीकि रामायण', author: 'महर्षि वाल्मीकि', desc: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के पावन चरित्र का अमर महाकाव्य' },
    'shrimad-bhagavatam': { name: 'श्रीमद् भागवत महापुराण', author: 'महर्षि वेदव्यास', desc: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा' },
    'ramcharitmanas': { name: 'श्री रामचरितमानस', author: 'गोस्वामी तुलसीदास', desc: 'कलयुग तारक प्रभु श्री राम के पावन चरित्र का अवधी महाकाव्य' },
    'bhagavad-gita': { name: 'श्रीमद्भगवद्गीता', author: 'महर्षि वेदव्यास', desc: 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया आत्मज्ञान' },
    'durga-saptashati': { name: 'श्री दुर्गा सप्तशती', author: 'महर्षि मार्कण्डेय', desc: 'मार्कण्डेय पुराणान्तर्गत आदिशक्ति माँ भगवती के प्राकट्य व महात्म्य की पवित्र सप्तशती' },
  };

  if (pad) {
    const slug = pad.slug || pad.id;
    seoConfig = {
      tab: 'padavali',
      pad,
      title: `${pad.titleDevanagari} (${pad.author})`,
      description: `राग ${pad.rag} में निबद्ध पावन पद। रचयिता: ${pad.author}। वृन्दोपनिषद् 2.0`,
      canonicalUrl: `https://bhav.vrindopnishad.in/?tab=padavali&pad=${encodeURIComponent(slug)}`,
    };
  } else if (authorQuery) {
    const saint = SacredDatabase.getSaintBySlugOrName(authorQuery);
    const saintName = saint ? saint.name : authorQuery;
    const tradition = saint ? ` (${saint.tradition})` : '';
    const bio = saint?.biography ? `${saint.biography} ` : '';
    seoConfig = {
      tab: 'padavali',
      title: `${saintName}${tradition} • रसिक संत पदावली | वृन्दोपनिषद् 2.0`,
      description: `${bio}${saintName} की समस्त पावन पदों व वाणियों का प्रामाणिक संग्रह। वृन्दोपनिषद् 2.0`,
      canonicalUrl: `https://bhav.vrindopnishad.in/?tab=padavali&author=${saint?.slug || encodeURIComponent(authorQuery)}`,
    };
  } else if (granthaQuery && epicsMeta[granthaQuery]) {
    const e = epicsMeta[granthaQuery];
    seoConfig = {
      tab: 'granthas',
      title: `${e.name} (${e.author}) • संपूर्ण मूल पाठ व पारायण | वृन्दोपनिषद् 2.0`,
      description: `${e.desc}। प्रणेता: ${e.author}। वृन्दोपनिषद् 2.0`,
      canonicalUrl: `https://bhav.vrindopnishad.in/?tab=granthas&grantha=${granthaQuery}`,
    };
  } else if (granthaQuery) {
    const grantha = SacredDatabase.getGranthaById(granthaQuery);
    const gName = grantha ? grantha.name : granthaQuery;
    const gAuthor = grantha ? ` (${grantha.author})` : '';
    const gDesc = grantha?.description ? `${grantha.description} ` : '';
    seoConfig = {
      tab: 'padavali',
      title: `${gName}${gAuthor} • संपूर्ण वाणी संग्रह | वृन्दोपनिषद् 2.0`,
      description: `${gDesc}${gName} के समस्त पावन श्लोकों व पदों का नित्य स्वाध्याय व अनुशीलन। वृन्दोपनिषद् 2.0`,
      canonicalUrl: `https://bhav.vrindopnishad.in/?tab=padavali&grantha=${grantha?.id || encodeURIComponent(granthaQuery)}`,
    };
  } else {
    switch (tab) {
      case 'smaran':
        seoConfig.title = 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा';
        seoConfig.description = 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।';
        break;
      case 'granthas':
        seoConfig.title = 'Sanatan Mahagranth Parayana • ५ अमर महाकाव्य एवं अखंड शास्त्र स्वाध्याय';
        seoConfig.description = 'श्रीमद् वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, श्री रामचरितमानस, श्रीमद्भगवद्गीता व श्री दुर्गा सप्तशती का संपूर्ण मूल पाठ व ऑन-डिमांड त्वरित पारायण।';
        break;
      case 'padavali':
        seoConfig.title = 'Scriptures Repository • ४४,०००+ पावन महाग्रंथ व रसिक वाणी संग्रह';
        seoConfig.description = 'वाल्मीकि रामायण, श्रीमद् भागवत, रामचरितमानस, भगवद्गीता, हित चौरासी, केलिमाल, सूरसागर सहित सनातन महाग्रंथ व समस्त रसिक वाणी का अगाध संग्रह।';
        break;
      case 'feed':
        seoConfig.title = 'Darshan Feed • नित्य वृन्दावन धाम दर्शन';
        seoConfig.description = 'श्री वृन्दावन धाम के प्रमुख मंदिरों के प्रत्यक्ष दर्शन, उत्सव, आरती व नित्य विलास।';
        break;
      case 'milestones':
        seoConfig.title = 'Devotion Milestones • अखंड निष्ठा व साधना सोपान';
        seoConfig.description = 'अखंड साधना स्ट्रीक, अंतरंग ध्यान सिद्धि एवं श्रीजी कृपा के पावन सोपान।';
        break;
    }
  }

  const seo = generateSEOMetadata(seoConfig);

  const html = renderToString(
    <StrictMode>
      <App initialTab={tab} initialPadId={padId} />
    </StrictMode>
  );

  return {
    html,
    seo,
    initialState: {
      tab,
      padId,
      initialPad: pad,
    },
  };
}
