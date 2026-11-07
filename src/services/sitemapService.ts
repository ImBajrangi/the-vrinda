/**
 * Vrindopnisad 2.0 - Dynamic Sitemap Service
 * Generates Google & Bing compliant XML Sitemaps dynamically from the 4,204+ verse database.
 * Supports Sitemap Index format, chunked sitemaps, and unified full sitemap.
 */

import { SacredDatabase } from './sacredDatabase';

const DEFAULT_BASE_URL = 'https://vrindopnisad.org';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate standard XML wrapper for a list of URLs
 */
function buildUrlset(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }>): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const item of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(item.loc)}</loc>`);
    if (item.lastmod) {
      lines.push(`    <lastmod>${item.lastmod}</lastmod>`);
    }
    if (item.changefreq) {
      lines.push(`    <changefreq>${item.changefreq}</changefreq>`);
    }
    if (item.priority !== undefined) {
      lines.push(`    <priority>${item.priority.toFixed(2)}</priority>`);
    }
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

export const SitemapService = {
  /**
   * 1. Core Sanctuary Views (Home, Padavali, Darshan Feed, Devotion Milestones)
   */
  generateMainSitemap(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const urls = [
      { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
      { loc: `${baseUrl}/?tab=smaran`, lastmod: today, changefreq: 'daily', priority: 0.95 },
      { loc: `${baseUrl}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
      { loc: `${baseUrl}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
      { loc: `${baseUrl}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
    ];
    return buildUrlset(urls);
  },

  /**
   * 2. Canonical Granthas & Tradition Collections
   */
  generateGranthasSitemap(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const granthas = SacredDatabase.getAllGranthas();

    const urls = granthas.map((g) => ({
      loc: `${baseUrl}/?tab=padavali&grantha=${encodeURIComponent(g.id)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9,
    }));

    return buildUrlset(urls);
  },

  /**
   * 3. Sacred Braj Saints & Rasik Acharyas Directory
   */
  generateSaintsSitemap(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const saints = SacredDatabase.getAllSaints();

    const urls = saints.map((s) => ({
      loc: `${baseUrl}/?tab=padavali&author=${encodeURIComponent(s.name)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.85,
    }));

    return buildUrlset(urls);
  },

  /**
   * 4. All 4,204 Canonical Pada Scriptures (Deep-link Permalinks)
   */
  generatePadasSitemap(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const allPadas = SacredDatabase.getAllPadas();

    const urls = allPadas.map((p) => {
      // Celebrated granthas get higher search crawler priority
      const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
      const slug = p.slug || p.id;
      return {
        loc: `${baseUrl}/?tab=padavali&pad=${encodeURIComponent(slug)}`,
        lastmod: today,
        changefreq: 'monthly',
        priority: isCelebrated ? 0.9 : 0.8,
      };
    });

    return buildUrlset(urls);
  },

  /**
   * 5. Unified Sitemap with All 4,350+ URLs
   */
  generateAllSitemap(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }> = [];

    // Core Tabs
    urls.push(
      { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
      { loc: `${baseUrl}/?tab=smaran`, lastmod: today, changefreq: 'daily', priority: 0.95 },
      { loc: `${baseUrl}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
      { loc: `${baseUrl}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
      { loc: `${baseUrl}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 }
    );

    // Granthas
    const granthas = SacredDatabase.getAllGranthas();
    for (const g of granthas) {
      urls.push({
        loc: `${baseUrl}/?tab=padavali&grantha=${encodeURIComponent(g.id)}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9,
      });
    }

    // Saints
    const saints = SacredDatabase.getAllSaints();
    for (const s of saints) {
      urls.push({
        loc: `${baseUrl}/?tab=padavali&author=${encodeURIComponent(s.name)}`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.85,
      });
    }

    // 4,204 Padas with headline/title slugs
    const allPadas = SacredDatabase.getAllPadas();
    for (const p of allPadas) {
      const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
      const slug = p.slug || p.id;
      urls.push({
        loc: `${baseUrl}/?tab=padavali&pad=${encodeURIComponent(slug)}`,
        lastmod: today,
        changefreq: 'monthly',
        priority: isCelebrated ? 0.9 : 0.8,
      });
    }

    return buildUrlset(urls);
  },

  /**
   * 6. Google & Bing Standard Sitemap Index (Hierarchical Architecture)
   */
  generateSitemapIndex(baseUrl: string = DEFAULT_BASE_URL): string {
    const today = getTodayIsoDate();
    const sitemaps = [
      { loc: `${baseUrl}/sitemap-main.xml`, lastmod: today },
      { loc: `${baseUrl}/sitemap-granthas.xml`, lastmod: today },
      { loc: `${baseUrl}/sitemap-saints.xml`, lastmod: today },
      { loc: `${baseUrl}/sitemap-padas.xml`, lastmod: today },
    ];

    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    for (const sm of sitemaps) {
      lines.push('  <sitemap>');
      lines.push(`    <loc>${escapeXml(sm.loc)}</loc>`);
      lines.push(`    <lastmod>${sm.lastmod}</lastmod>`);
      lines.push('  </sitemap>');
    }

    lines.push('</sitemapindex>');
    return lines.join('\n');
  },
};

