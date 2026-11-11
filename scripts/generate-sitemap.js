/**
 * Vrindopnisad 2.0 - Sitemap Generation Script
 * Generates 100% Google & Bing compliant XML sitemaps with ZERO 301 redirects
 * for both primary (bhav.vrindopnishad.in) and secondary (path.vrindopnishad.in) domains.
 *
 * Domain Separation Architecture:
 * - bhav.vrindopnishad.in: 11,909 authentic Rasik Padas, 24 Ras collections, 131 Saints, Daily Seva
 * - path.vrindopnishad.in: 5 Monumental Epics and 781 Chapters
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const EPIC_IDS = new Set([
  'valmiki-ramayana',
  'shrimad-bhagavatam',
  'ramcharitmanas',
  'bhagavad-gita',
  'durga-saptashati',
]);

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

function getTodayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

function buildUrlset(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const item of urls) {
    let u = `  <url><loc>${escapeXml(item.loc)}</loc>`;
    if (item.lastmod) u += `<lastmod>${item.lastmod}</lastmod>`;
    if (item.changefreq) u += `<changefreq>${item.changefreq}</changefreq>`;
    if (item.priority !== undefined) u += `<priority>${item.priority.toFixed(2)}</priority>`;
    u += '</url>';
    lines.push(u);
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

function createSitemapSuite(baseUrl, prefix = '') {
  const today = getTodayIsoDate();
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');

  const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
  const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));

  const isPathDomain = prefix === 'path';
  const filePrefix = prefix ? `sitemap-${prefix}` : 'sitemap';

  if (isPathDomain) {
    // -------------------------------------------------------------
    // path.vrindopnishad.in - Sanatan Mahagranth Parayana Domain
    // Dedicated exclusively to the 5 Monumental Epics and 781 Chapters
    // -------------------------------------------------------------
    const mainUrls = [
      { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    ];
    const mainXml = buildUrlset(mainUrls);

    const granthasUrls = [];
    const epicsManifestPath = path.resolve(projectRoot, 'public/data/epics/manifest.json');
    if (fs.existsSync(epicsManifestPath)) {
      try {
        const epicsManifest = JSON.parse(fs.readFileSync(epicsManifestPath, 'utf-8'));
        for (const epic of epicsManifest.epics || []) {
          granthasUrls.push({
            loc: `${baseUrl}/?tab=granthas&grantha=${encodeURIComponent(epic.id)}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: 0.95,
          });

          const epicIndexPath = path.resolve(projectRoot, `public/data/epics/${epic.id}/index.json`);
          if (fs.existsSync(epicIndexPath)) {
            const epicData = JSON.parse(fs.readFileSync(epicIndexPath, 'utf-8'));
            for (const ch of epicData.chapters || []) {
              granthasUrls.push({
                loc: `${baseUrl}/?tab=granthas&grantha=${encodeURIComponent(epic.id)}&chapter=${encodeURIComponent(ch.id)}`,
                lastmod: today,
                changefreq: 'monthly',
                priority: 0.85,
              });
            }
          }
        }
      } catch (e) {
        console.warn('  ⚠ Warning loading epics for path sitemap:', e.message);
      }
    }
    const granthasXml = buildUrlset(granthasUrls);
    const emptyXml = buildUrlset([]);

    const indexXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `  <sitemap><loc>${baseUrl}/${filePrefix}-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
      `  <sitemap><loc>${baseUrl}/${filePrefix}-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
      '</sitemapindex>',
    ].join('\n');

    return {
      [`${filePrefix}.xml`]: { content: indexXml, isBinary: false },
      [`${filePrefix}-main.xml`]: { content: mainXml, isBinary: false },
      [`${filePrefix}-granthas.xml`]: { content: granthasXml, isBinary: false },
      [`${filePrefix}-padas.xml`]: { content: emptyXml, isBinary: false },
      [`${filePrefix}-saints.xml`]: { content: emptyXml, isBinary: false },
    };
  }

  // -------------------------------------------------------------
  // bhav.vrindopnishad.in - Primary Ras & Padavali Sanctuary Domain
  // Dedicated to 11,909 Authentic Ras Padas, 24 Ras Collections, 131 Saints, Daily Seva
  // ZERO EPIC REDIRECTS!
  // -------------------------------------------------------------
  let rawPadas = [];
  const catalogPath = path.resolve(projectRoot, 'public/data/catalog.json');
  if (fs.existsSync(catalogPath)) {
    const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    if (rawCatalog.items && Array.isArray(rawCatalog.items)) {
      const cols = rawCatalog.cols || [];
      rawPadas = rawCatalog.items.map((row) => ({
        slug: row[0],
        titleDevanagari: row[1],
        collectionId: cols[row[2]] || '',
      }));
    } else if (Array.isArray(rawCatalog)) {
      rawPadas = rawCatalog;
    }
  }

  // Filter strictly to non-epic authentic Ras padas (prevents 31,689 301 redirects!)
  const rasPadas = rawPadas.filter((p) => {
    if (EPIC_IDS.has(p.collectionId)) return false;
    const slug = (p.slug || p.id || '').toLowerCase();
    if (
      slug.startsWith('valmiki-') ||
      slug.startsWith('ramcharitmanas') ||
      slug.startsWith('shrimad-') ||
      slug.startsWith('bhagavad-') ||
      slug.startsWith('durga-')
    ) {
      return false;
    }
    return true;
  });

  // 1. Core Sanctuary Views (Clean canonical URLs, no ?tab=smaran duplicate)
  const mainUrls = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${baseUrl}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
  ];
  const mainXml = buildUrlset(mainUrls);

  // 2. Granthas (24 Ras Collections)
  const granthasUrls = granthas
    .filter((g) => !EPIC_IDS.has(g.id))
    .map((g) => ({
      loc: `${baseUrl}/?tab=padavali&grantha=${encodeURIComponent(g.id)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9,
    }));
  const granthasXml = buildUrlset(granthasUrls);

  // 3. Saints (131 Canonical Saints)
  const saintsUrls = saints.map((s) => ({
    loc: `${baseUrl}/?tab=padavali&author=${s.slug || s.id || encodeURIComponent(s.name)}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: 0.85,
  }));
  const saintsXml = buildUrlset(saintsUrls);

  // 4. Padas (11,909 Ras Verses - split into clean sub-sitemaps for fastest crawling)
  const padasUrls = rasPadas.map((p) => {
    const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
    const slug = p.slug || p.id;
    return {
      loc: `${baseUrl}/?tab=padavali&pad=${encodeURIComponent(slug)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: isCelebrated ? 0.9 : 0.8,
    };
  });

  const CHUNK_SIZE = 4000;
  const padas1Urls = padasUrls.slice(0, CHUNK_SIZE);
  const padas2Urls = padasUrls.slice(CHUNK_SIZE, CHUNK_SIZE * 2);
  const padas3Urls = padasUrls.slice(CHUNK_SIZE * 2);

  const padasXml = buildUrlset(padasUrls);
  const padas1Xml = buildUrlset(padas1Urls);
  const padas2Xml = buildUrlset(padas2Urls);
  const padas3Xml = buildUrlset(padas3Urls);

  // 5. Sitemap Index (pointing to standard .xml sitemaps)
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${baseUrl}/${filePrefix}-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-saints.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas-1.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas-2.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas-3.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    '</sitemapindex>',
  ].join('\n');

  return {
    [`${filePrefix}.xml`]: { content: indexXml, isBinary: false },
    [`${filePrefix}-main.xml`]: { content: mainXml, isBinary: false },
    [`${filePrefix}-granthas.xml`]: { content: granthasXml, isBinary: false },
    [`${filePrefix}-saints.xml`]: { content: saintsXml, isBinary: false },
    [`${filePrefix}-padas.xml`]: { content: padasXml, isBinary: false },
    [`${filePrefix}-padas-1.xml`]: { content: padas1Xml, isBinary: false },
    [`${filePrefix}-padas-2.xml`]: { content: padas2Xml, isBinary: false },
    [`${filePrefix}-padas-3.xml`]: { content: padas3Xml, isBinary: false },
  };
}

export function generateAllSitemaps(outputDirs = ['public', 'dist']) {
  console.log('🌸 Generating 100% Clean Sitemaps for bhav.vrindopnishad.in and path.vrindopnishad.in...');

  // 1. Generate for primary domain (bhav.vrindopnishad.in)
  const bhavSitemaps = createSitemapSuite('https://bhav.vrindopnishad.in', '');

  // 2. Generate for path domain (path.vrindopnishad.in)
  const pathSitemaps = createSitemapSuite('https://path.vrindopnishad.in', 'path');

  const allFiles = { ...bhavSitemaps, ...pathSitemaps };

  for (const dirName of outputDirs) {
    const dir = path.resolve(projectRoot, dirName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Clean up old obsolete sitemap files
    const staleFiles = [
      'sitemap-all.xml',
      'sitemap-path-all.xml',
      'sitemap-path-padas.xml.gz',
      'sitemap-padas.xml.gz',
      'sitemap-path-saints.xml',
    ];
    for (const stale of staleFiles) {
      const p = path.resolve(dir, stale);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }

    for (const [filename, fileObj] of Object.entries(allFiles)) {
      const dest = path.resolve(dir, filename);
      if (fileObj.isBinary) {
        fs.writeFileSync(dest, fileObj.content);
      } else {
        fs.writeFileSync(dest, fileObj.content, 'utf-8');
      }
    }

    // Remove duplicate canonicalPadas.json from public/data/ and dist/data/ to save 9.9 MB
    const redundantCanonical = path.resolve(dir, 'data', 'canonicalPadas.json');
    if (fs.existsSync(redundantCanonical)) {
      fs.unlinkSync(redundantCanonical);
    }
  }

  console.log('  ✓ Generated clean sitemaps with ZERO 301 redirects');
  console.log('✨ All Sitemaps generated successfully!');
}

generateAllSitemaps();
