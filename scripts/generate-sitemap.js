/**
 * Vrindopnisad 2.0 - Sitemap Generation Script
 * Generates official Google & Bing XML sitemaps for all 4,204+ verses, granthas, and saints
 * for both primary (bhav.vrindopnishad.in) and secondary (path.vrindopnishad.in) domains.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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
    let u = `<url><loc>${escapeXml(item.loc)}</loc>`;
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
  const catalogPath = path.resolve(projectRoot, 'public/data/catalog.json');
  const padasPath = path.resolve(projectRoot, 'src/data/canonicalPadas.json');
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
      { loc: `${baseUrl}/?tab=granthas`, lastmod: today, changefreq: 'daily', priority: 0.95 },
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
    };
  }

  // -------------------------------------------------------------
  // bhav.vrindopnishad.in - Primary Ras & Padavali Sanctuary Domain
  // Dedicated to 44,000+ Padas, 29 Ras Collections, 131 Saints, Daily Seva
  // -------------------------------------------------------------
  let padas = [];
  if (fs.existsSync(catalogPath)) {
    const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    if (rawCatalog.items && Array.isArray(rawCatalog.items)) {
      const cols = rawCatalog.cols || [];
      padas = rawCatalog.items.map((row) => ({
        slug: row[0],
        titleDevanagari: row[1],
        collectionId: cols[row[2]] || '',
      }));
    } else if (Array.isArray(rawCatalog)) {
      padas = rawCatalog;
    }
  } else if (fs.existsSync(padasPath)) {
    padas = JSON.parse(fs.readFileSync(padasPath, 'utf-8'));
  }

  // 1. Core Sanctuary Views
  const mainUrls = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/?tab=smaran`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${baseUrl}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${baseUrl}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
  ];
  const mainXml = buildUrlset(mainUrls);

  // 2. Granthas (29 Ras Collections)
  const EPIC_IDS = new Set(['valmiki-ramayana', 'shrimad-bhagavatam', 'ramcharitmanas', 'bhagavad-gita', 'durga-saptashati']);
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

  // 4. Padas (Gzip compressed for optimal web performance & crawler ingestion)
  const padasUrls = padas.map((p) => {
    const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
    const slug = p.slug || p.id;
    return {
      loc: `${baseUrl}/?tab=padavali&pad=${encodeURIComponent(slug)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: isCelebrated ? 0.9 : 0.8,
    };
  });
  const padasXml = buildUrlset(padasUrls);
  const padasXmlGz = zlib.gzipSync(Buffer.from(padasXml), { level: 9 });

  // 5. Sitemap Index (pointing to standard .xml and .xml.gz)
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${baseUrl}/${filePrefix}-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-saints.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas.xml.gz</loc><lastmod>${today}</lastmod></sitemap>`,
    '</sitemapindex>',
  ].join('\n');

  return {
    [`${filePrefix}.xml`]: { content: indexXml, isBinary: false },
    [`${filePrefix}-main.xml`]: { content: mainXml, isBinary: false },
    [`${filePrefix}-granthas.xml`]: { content: granthasXml, isBinary: false },
    [`${filePrefix}-saints.xml`]: { content: saintsXml, isBinary: false },
    [`${filePrefix}-padas.xml.gz`]: { content: padasXmlGz, isBinary: true },
  };
}

export function generateAllSitemaps(outputDirs = ['public', 'dist']) {
  console.log('🌸 Generating Dynamic Sitemaps for bhav.vrindopnishad.in and path.vrindopnishad.in...');

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

    // Clean up old uncompressed sitemap files to free ~17.2 MB of storage
    const staleFiles = [
      'sitemap-padas.xml',
      'sitemap-path-padas.xml',
      'sitemap-all.xml',
      'sitemap-path-all.xml',
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

  console.log('  ✓ Generated compressed sitemap suites (.xml.gz) saving ~16.3 MB');
  console.log('✨ All Dynamic Sitemaps generated successfully!');
}

generateAllSitemaps();
