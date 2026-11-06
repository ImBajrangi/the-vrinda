import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { NavTab } from './components/common/FloatingNavbar';
import { SacredDatabase } from './services/sacredDatabase';
import { generateSEOMetadata, SEOMetadataResult, SEOConfig } from './services/seoService';

export interface RenderResult {
  html: string;
  seo: SEOMetadataResult;
  initialState: {
    tab: NavTab;
    padId?: string;
  };
}

export function render(url: string = '/'): RenderResult {
  let tab: NavTab = 'smaran';
  let padId: string | undefined;

  try {
    const parsed = new URL(url, 'https://vrindopnisad.org');
    const qTab = parsed.searchParams.get('tab') as NavTab;
    const qPad = parsed.searchParams.get('pad');

    if (qTab && ['smaran', 'padavali', 'feed', 'milestones'].includes(qTab)) {
      tab = qTab;
    }
    if (qPad) {
      padId = qPad;
      tab = 'padavali';
    }

    // Pathname support: /pad/:id, /padavali, /feed, /smaran, /milestones
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname.startsWith('/pad/')) {
      padId = decodeURIComponent(pathname.replace('/pad/', '')).trim();
      tab = 'padavali';
    } else if (pathname === '/padavali') {
      tab = 'padavali';
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
    canonicalUrl: `https://vrindopnisad.org${url}`,
  };

  if (pad) {
    seoConfig = {
      tab: 'padavali',
      pad,
      title: `${pad.titleDevanagari} (${pad.author})`,
      description:
        pad.verses?.[0]?.bhavarth ||
        `राग ${pad.rag} में निबद्ध पावन पद। रचयिता: ${pad.author}। वृन्दोपनिषद् 2.0`,
      canonicalUrl: `https://vrindopnisad.org/?tab=padavali&pad=${pad.id}`,
    };
  } else {
    switch (tab) {
      case 'smaran':
        seoConfig.title = 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा';
        seoConfig.description = 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।';
        break;
      case 'padavali':
        seoConfig.title = 'Scriptures Repository • ४२००+ पावन पद वाणी संग्रह';
        seoConfig.description = 'हित चौरासी, राधा सुधा निधि, केलिमाल, सूरसागर, रसखान पदावली सहित समस्त रसिक वाणियों का अगाध संग्रह।';
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
    },
  };
}
