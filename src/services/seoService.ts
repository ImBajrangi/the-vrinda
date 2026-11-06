/**
 * Vrindopnisad 2.0 - Dynamic SEO & Schema.org Structured Data Service
 * Provides full OpenGraph, Twitter Cards, Canonical Links, and Google JSON-LD schema
 * for sacred literature, padas, granthas, and devotional views.
 */

import { SacredPad } from '../types/devotional';

export interface SEOConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogType?: 'website' | 'article' | 'book';
  ogImage?: string;
  pad?: SacredPad;
  tab?: 'smaran' | 'padavali' | 'feed' | 'milestones';
}

const DEFAULT_SEO = {
  siteName: 'वृन्दोपनिषद् 2.0 (Vrindopnisad)',
  title: 'वृन्दोपनिषद् 2.0 • Digital Sanctuary for Nitya Nikunj Ras & Sacred Pada Literature',
  description:
    'Comprehensive repository of 4,200+ canonical Braj Ras verses, Hit Chaurasi, Radha Sudha Nidhi, Ashtayama timeline, daily sadhana rings, and sacred audio recitation.',
  keywords: [
    'Vrindavan',
    'Vrindopnisad',
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
  baseUrl: 'https://vrindopnisad.org',
  defaultImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
};

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
   * Set or update dynamic meta tags in the document head
   */
  public updateSEO(config: SEOConfig = {}): void {
    if (typeof document === 'undefined') return;

    const title = config.title
      ? `${config.title} | ${DEFAULT_SEO.siteName}`
      : DEFAULT_SEO.title;

    const description = config.description || DEFAULT_SEO.description;
    const canonical = config.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : DEFAULT_SEO.baseUrl);
    const ogImage = config.ogImage || DEFAULT_SEO.defaultImage;
    const ogType = config.ogType || (config.pad ? 'article' : 'website');

    // 1. Update Document Title
    document.title = title;

    // 2. Standard Meta Tags
    this.setMetaTag('name', 'description', description);
    this.setMetaTag(
      'name',
      'keywords',
      (config.keywords || DEFAULT_SEO.keywords).join(', ')
    );

    // 3. Canonical Link
    this.setCanonicalLink(canonical);

    // 4. OpenGraph Tags
    this.setMetaTag('property', 'og:site_name', DEFAULT_SEO.siteName);
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:url', canonical);
    this.setMetaTag('property', 'og:type', ogType);
    this.setMetaTag('property', 'og:image', ogImage);
    this.setMetaTag('property', 'og:locale', 'hi_IN');

    // 5. Twitter Card Tags
    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', ogImage);

    // 6. Structured Data (JSON-LD)
    this.updateStructuredData(config, canonical, ogImage);

    // 7. Update URL search query cleanly for shareable permalinks
    if (typeof window !== 'undefined' && config.tab) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', config.tab);
        if (config.pad?.id) {
          url.searchParams.set('pad', config.pad.id);
        } else {
          url.searchParams.delete('pad');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore URL mutation errors
      }
    }
  }

  /**
   * Helper to set or update meta tag
   */
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

  /**
   * Helper to set or update canonical link
   */
  private setCanonicalLink(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  /**
   * Inject or update JSON-LD Schema.org structured data
   */
  private updateStructuredData(
    config: SEOConfig,
    url: string,
    image: string
  ): void {
    let script = document.getElementById('vrindopnisad-schema') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'vrindopnisad-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemas: any[] = [
      // 1. Website Schema with Sitelinks Searchbox
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: DEFAULT_SEO.siteName,
        url: DEFAULT_SEO.baseUrl,
        description: DEFAULT_SEO.description,
        inLanguage: ['hi', 'sa', 'en'],
        potentialAction: {
          '@type': 'SearchAction',
          target: `${DEFAULT_SEO.baseUrl}/?tab=padavali&q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      // 2. Organization Schema
      {
        '@context': 'https://schema.org',
        '@type': 'ReligiousOrganization',
        name: DEFAULT_SEO.siteName,
        url: DEFAULT_SEO.baseUrl,
        logo: `${DEFAULT_SEO.baseUrl}/lotus.svg`,
        description: 'Vrindavan Sacred Rasik Heritage & Canonical Pada Sanctuary',
      },
    ];

    // 3. CreativeWork / Article Schema if viewing a specific Pada
    if (config.pad) {
      const pad = config.pad;
      const stanzaSample = pad.verses?.[0]?.linesDevanagari?.join(' ') || pad.titleDevanagari;
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
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
        timeRequired: pad.duration ? `PT${pad.duration.replace(':', 'M')}S` : undefined,
        publisher: {
          '@type': 'Organization',
          name: DEFAULT_SEO.siteName,
          url: DEFAULT_SEO.baseUrl,
        },
        url,
        image,
      });

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
            name: pad.titleDevanagari,
            item: url,
          },
        ],
      });
    }

    script.textContent = JSON.stringify(schemas, null, 2);
  }
}

export const seo = SEOService.getInstance();
