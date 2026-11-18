/**
 * Vrindopnisad 2.0 - Dynamic SEO & Schema.org Structured Data Service
 * Provides full OpenGraph, Twitter Cards, Canonical Links, and Google JSON-LD schema
 * for sacred literature, padas, granthas, and devotional views.
 * Supports both client-side DOM mutation and dynamic SSR server injection.
 */

import { SacredPad } from '../types/devotional';
import { NavTab } from '../components/common/FloatingNavbar';

export interface SEOConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogType?: 'website' | 'article' | 'book';
  ogImage?: string;
  pad?: SacredPad;
  tab?: NavTab;
  grantha?: {
    id: string;
    name: string;
    author: string;
    description?: string;
    category?: string;
    totalVerses?: number;
  };
  chapter?: {
    id: string;
    name: string;
    section?: string;
    verseCount?: number;
    granthaId: string;
    granthaName?: string;
    author?: string;
  };
  author?: {
    name: string;
    slug?: string;
    biography?: string;
    tradition?: string;
  };
  ritual?: {
    id: string;
    title: string;
    titleDevanagari: string;
    category: string;
    deity: string;
    description?: string;
  };
  place?: {
    id: string;
    name: string;
    nameDevanagari: string;
    region: string;
    significance: string;
    deity?: string;
  };
  story?: {
    id: string;
    title: string;
    titleDevanagari: string;
    summary: string;
    tradition?: string;
  };
  biography?: {
    id: string;
    name: string;
    nameDevanagari: string;
    tradition: string;
    titleHonorific?: string;
    period?: string;
  };
  audioUrl?: string;
}

export interface SEOMetadataResult {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  ogType: string;
  ogImage: string;
  schemas: any[];
  htmlHead: string;
}

export const DEFAULT_SEO = {
  siteName: 'वृन्दोपनिषद् 2.0 (Vrindopnishad)',
  title: 'वृन्दोपनिषद् 2.0 • Sacred Vrindavan Ras Sanctuary & Canonical Pada Literature',
  description:
    'Comprehensive repository of 44,000+ canonical Braj Ras verses, Hit Chaurasi, Radha Sudha Nidhi, Ashtayama timeline, daily sadhana rings, and sacred audio recitation.',
  keywords: [
    'Vrindavan',
    'Vrindopnishad',
    'Braj Ras',
    'Hit Chaurasi',
    'Radha Sudha Nidhi',
    'Kelimal',
    'Swami Haridas',
    'Hit Harivansh',
    'Ashtayama',
    'Sadhana',
    'Sacred Pada',
    'Braj Bhasha',
  ],
  baseUrl: 'https://bhav.vrindopnishad.in',
  defaultImage: 'https://bhav.vrindopnishad.in/assets/temples/banke-bihari-v2.webp',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Pure generator for dynamic SEO tags, canonical URL, and Schema.org JSON-LD structured data.
 * Safe to execute on both Node.js (SSR) and browser environments.
 */
export function generateSEOMetadata(config: SEOConfig = {}): SEOMetadataResult {
  const title = config.title
    ? `${config.title} | ${DEFAULT_SEO.siteName}`
    : DEFAULT_SEO.title;

  const description = config.description || DEFAULT_SEO.description;
  const padSlug = config.pad ? (config.pad.slug || config.pad.id) : undefined;
  const canonicalUrl =
    config.canonicalUrl ||
    (padSlug
      ? `${DEFAULT_SEO.baseUrl}/?tab=padavali&pad=${encodeURIComponent(padSlug)}`
      : typeof window !== 'undefined'
      ? window.location.href
      : DEFAULT_SEO.baseUrl);
  const ogImage = config.ogImage || DEFAULT_SEO.defaultImage;
  const ogType = config.ogType || (config.pad ? 'article' : 'website');
  const keywords = config.keywords || DEFAULT_SEO.keywords;

  const schemas: any[] = [
    // 1. Website Schema with Sitelinks Searchbox
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${DEFAULT_SEO.baseUrl}/#website`,
      name: DEFAULT_SEO.siteName,
      url: DEFAULT_SEO.baseUrl,
      description: DEFAULT_SEO.description,
      inLanguage: ['hi', 'sa', 'en'],
      publisher: {
        '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${DEFAULT_SEO.baseUrl}/?tab=padavali&q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    // 2. Religious Organization Schema
    {
      '@context': 'https://schema.org',
      '@type': 'ReligiousOrganization',
      '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      name: DEFAULT_SEO.siteName,
      url: DEFAULT_SEO.baseUrl,
      logo: `${DEFAULT_SEO.baseUrl}/official-logo.svg`,
      description: 'Vrindavan Sacred Rasik Heritage & Canonical Pada Sanctuary',
    },
  ];

  // 3. Structured Data for specific Sacred Pada
  if (config.pad) {
    const pad = config.pad;
    const stanzaSample =
      pad.verses?.[0]?.linesDevanagari?.join(' ') || pad.titleDevanagari;
    const padSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': `${canonicalUrl}#verse`,
      headline: pad.titleDevanagari,
      alternativeHeadline: pad.titleEnglish,
      name: pad.titleDevanagari,
      author: {
        '@type': 'Person',
        name: pad.author || 'श्री ब्रज रसिक परंपरा',
      },
      genre: 'Sacred Devotional Braj Pada',
      inLanguage: 'hi',
      text: stanzaSample,
      musicalKey: pad.rag,
      publisher: {
        '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      },
      isPartOf: {
        '@id': `${DEFAULT_SEO.baseUrl}/#website`,
      },
      url: canonicalUrl,
      image: ogImage,
    };

    if (config.audioUrl || pad.audioUrl) {
      padSchema.audio = {
        '@type': 'AudioObject',
        '@id': `${canonicalUrl}#audio`,
        name: `${pad.titleDevanagari} • Sacred Audio Recitation`,
        contentUrl: config.audioUrl || pad.audioUrl,
        inLanguage: 'hi',
      };
    }

    schemas.push(padSchema);

    // Breadcrumb Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Scriptures Repository',
          item: `${DEFAULT_SEO.baseUrl}/?tab=padavali`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: pad.collectionId || 'Braj Ras Vani',
          item: `${DEFAULT_SEO.baseUrl}/?tab=padavali&grantha=${encodeURIComponent(pad.collectionId || '')}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: pad.titleDevanagari,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.chapter) {
    // 4. Chapter Schema for Monumental Epic Chapters
    const ch = config.chapter;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Chapter',
      '@id': `${canonicalUrl}#chapter`,
      name: ch.name,
      headline: ch.name,
      inLanguage: ['hi', 'sa'],
      numberOfPages: ch.verseCount || undefined,
      isPartOf: {
        '@type': 'Book',
        '@id': `${DEFAULT_SEO.baseUrl}/?tab=granthas&grantha=${encodeURIComponent(ch.granthaId)}#book`,
        name: ch.granthaName || ch.granthaId,
        author: ch.author ? { '@type': 'Person', name: ch.author } : undefined,
      },
      url: canonicalUrl,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Mahagranth Parayana',
          item: `${DEFAULT_SEO.baseUrl}/?tab=granthas`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: ch.granthaName || ch.granthaId,
          item: `${DEFAULT_SEO.baseUrl}/?tab=granthas&grantha=${encodeURIComponent(ch.granthaId)}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: ch.name,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.grantha) {
    // 5. Book Schema for Epics and Major Scriptures
    const g = config.grantha;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Book',
      '@id': `${canonicalUrl}#book`,
      name: g.name,
      author: {
        '@type': 'Person',
        name: g.author,
      },
      description: g.description,
      inLanguage: ['hi', 'sa'],
      publisher: {
        '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      },
      isPartOf: {
        '@id': `${DEFAULT_SEO.baseUrl}/#website`,
      },
      url: canonicalUrl,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: g.category === 'mahagranth' ? 'Mahagranth Parayana' : 'Scriptures Repository',
          item: `${DEFAULT_SEO.baseUrl}/?tab=${g.category === 'mahagranth' ? 'granthas' : 'padavali'}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: g.name,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.author) {
    // 6. ProfilePage & Person Schema for Canonical Saints
    const a = config.author;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${canonicalUrl}#profile`,
      mainEntity: {
        '@type': 'Person',
        '@id': `${canonicalUrl}#person`,
        name: a.name,
        description: a.biography,
        memberOf: a.tradition ? { '@type': 'Organization', name: a.tradition } : undefined,
      },
      url: canonicalUrl,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Saints & Acharyas',
          item: `${DEFAULT_SEO.baseUrl}/?tab=padavali`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: a.name,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.ritual) {
    // 7. Ritual Schema (Article / HowTo) for Aartis, Chalisas, and Stotras
    const r = config.ritual;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#ritual`,
      headline: r.titleDevanagari,
      name: r.titleDevanagari,
      description: r.description || `${r.titleDevanagari} • प्रामाणिक मूल पाठ, भावार्थ व नित्य स्तुति।`,
      inLanguage: ['hi', 'sa'],
      genre: 'Sacred Ritual Hymn',
      publisher: {
        '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      },
      isPartOf: {
        '@id': `${DEFAULT_SEO.baseUrl}/#website`,
      },
      url: canonicalUrl,
      image: ogImage,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Nitya Upasana',
          item: `${DEFAULT_SEO.baseUrl}/rituals`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: r.titleDevanagari,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.place) {
    // 8. Place Schema for Sacred Dhams and Tirthas
    const p = config.place;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Place',
      '@id': `${canonicalUrl}#place`,
      name: p.nameDevanagari,
      description: p.significance,
      address: {
        '@type': 'PostalAddress',
        addressRegion: p.region,
        addressCountry: 'IN',
      },
      url: canonicalUrl,
      image: ogImage,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sacred Places & Dhams',
          item: `${DEFAULT_SEO.baseUrl}/places`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.nameDevanagari,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.story) {
    // 9. Story Schema for Sacred Kathas & Leelas
    const s = config.story;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#story`,
      headline: s.titleDevanagari,
      name: s.titleDevanagari,
      description: s.summary,
      inLanguage: 'hi',
      genre: 'Sacred Puranic Leela',
      publisher: {
        '@id': `${DEFAULT_SEO.baseUrl}/#organization`,
      },
      url: canonicalUrl,
      image: ogImage,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Katha Sanctuary',
          item: `${DEFAULT_SEO.baseUrl}/stories`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: s.titleDevanagari,
          item: canonicalUrl,
        },
      ],
    });
  } else if (config.biography) {
    // 10. Biography Schema for Saint and Rishi Profiles
    const b = config.biography;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${canonicalUrl}#profile`,
      mainEntity: {
        '@type': 'Person',
        name: b.nameDevanagari,
        honorificPrefix: b.titleHonorific,
        memberOf: b.tradition ? { '@type': 'Organization', name: b.tradition } : undefined,
      },
      url: canonicalUrl,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home Sanctuary',
          item: DEFAULT_SEO.baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Charitra Darshan',
          item: `${DEFAULT_SEO.baseUrl}/biographies`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: b.nameDevanagari,
          item: canonicalUrl,
        },
      ],
    });
  }

  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description);
  const escapedKeywords = escapeHtml(keywords.join(', '));
  const escapedCanonical = escapeHtml(canonicalUrl);
  const escapedOgImage = escapeHtml(ogImage);

  const headLines = [
    `<title>${escapedTitle}</title>`,
    `<meta name="title" content="${escapedTitle}" />`,
    `<meta name="description" content="${escapedDesc}" />`,
    `<meta name="keywords" content="${escapedKeywords}" />`,
    `<meta name="author" content="वृन्दोपनिषद् 2.0 Sansthan" />`,
    `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />`,
    `<link rel="canonical" href="${escapedCanonical}" />`,
    `<meta property="og:site_name" content="${escapeHtml(DEFAULT_SEO.siteName)}" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDesc}" />`,
    `<meta property="og:url" content="${escapedCanonical}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:image" content="${escapedOgImage}" />`,
    `<meta property="og:locale" content="hi_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDesc}" />`,
    `<meta name="twitter:image" content="${escapedOgImage}" />`,
    `<script id="vrindopnisad-schema" type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n</script>`,
  ];

  return {
    title,
    description,
    canonicalUrl,
    keywords,
    ogType,
    ogImage,
    schemas,
    htmlHead: headLines.join('\n    '),
  };
}

class SEOService {
  private static instance: SEOService;

  private constructor() {}

  public static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }

  /**
   * Set or update dynamic meta tags in the document head (Client DOM)
   */
  public updateSEO(config: SEOConfig = {}): void {
    if (typeof document === 'undefined') return;

    const metadata = generateSEOMetadata(config);

    // 1. Update Document Title
    document.title = metadata.title;

    // 2. Standard Meta Tags
    this.setMetaTag('name', 'description', metadata.description);
    this.setMetaTag('name', 'keywords', metadata.keywords.join(', '));

    // 3. Canonical Link
    this.setCanonicalLink(metadata.canonicalUrl);

    // 4. OpenGraph Tags
    this.setMetaTag('property', 'og:site_name', DEFAULT_SEO.siteName);
    this.setMetaTag('property', 'og:title', metadata.title);
    this.setMetaTag('property', 'og:description', metadata.description);
    this.setMetaTag('property', 'og:url', metadata.canonicalUrl);
    this.setMetaTag('property', 'og:type', metadata.ogType);
    this.setMetaTag('property', 'og:image', metadata.ogImage);
    this.setMetaTag('property', 'og:locale', 'hi_IN');

    // 5. Twitter Card Tags
    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', metadata.title);
    this.setMetaTag('name', 'twitter:description', metadata.description);
    this.setMetaTag('name', 'twitter:image', metadata.ogImage);

    // 6. Structured Data (JSON-LD)
    let script = document.getElementById('vrindopnisad-schema') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'vrindopnisad-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(metadata.schemas, null, 2);
  }

  private setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
    if (!content) return;
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.content = content;
  }

  private setCanonicalLink(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }
}

export const seo = SEOService.getInstance();
