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
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(item.loc)}</loc>`);
    if (item.lastmod) lines.push(`    <lastmod>${item.lastmod}</lastmod>`);
    if (item.changefreq) lines.push(`    <changefreq>${item.changefreq}</changefreq>`);
    if (item.priority !== undefined) lines.push(`    <priority>${item.priority.toFixed(2)}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

function createSitemapSuite(baseUrl, prefix = '') {
  const today = getTodayIsoDate();
  const padasPath = path.resolve(projectRoot, 'src/data/canonicalPadas.json');
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');

  const padas = JSON.parse(fs.readFileSync(padasPath, 'utf-8'));
  const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
  const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));

  // 1. Core Sanctuary Views
  const mainUrls = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/?tab=smaran`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${baseUrl}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${baseUrl}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
  ];
  const mainXml = buildUrlset(mainUrls);

  // 2. Granthas
  const granthasUrls = granthas.map((g) => ({
    loc: `${baseUrl}/?tab=padavali&grantha=${encodeURIComponent(g.id)}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: 0.9,
  }));
  const granthasXml = buildUrlset(granthasUrls);

  // 3. Saints
  const saintsUrls = saints.map((s) => ({
    loc: `${baseUrl}/?tab=padavali&author=${encodeURIComponent(s.name)}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: 0.85,
  }));
  const saintsXml = buildUrlset(saintsUrls);

  // 4. Padas
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

  // 5. Sitemap Index
  const filePrefix = prefix ? `sitemap-${prefix}` : 'sitemap';
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${baseUrl}/${filePrefix}-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-saints.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-padas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    '</sitemapindex>',
  ].join('\n');

  // 6. Unified Full Sitemap
  const allUrls = [...mainUrls, ...granthasUrls, ...saintsUrls, ...padasUrls];
  const allXml = buildUrlset(allUrls);

  return {
    [`${filePrefix}.xml`]: indexXml,
    [`${filePrefix}-main.xml`]: mainXml,
    [`${filePrefix}-granthas.xml`]: granthasXml,
    [`${filePrefix}-saints.xml`]: saintsXml,
    [`${filePrefix}-padas.xml`]: padasXml,
    [`${filePrefix}-all.xml`]: allXml,
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

    for (const [filename, content] of Object.entries(allFiles)) {
      fs.writeFileSync(path.resolve(dir, filename), content, 'utf-8');
    }
  }

  // Ensure canonical database endpoints and pre-compressed .gz archives are synced
  const padasPath = path.resolve(projectRoot, 'src/data/canonicalPadas.json');
  const rawBytes = fs.readFileSync(padasPath);
  const compressedGz = zlib.gzipSync(rawBytes, { level: 9 });

  for (const dirName of outputDirs) {
    const dataDir = path.resolve(projectRoot, dirName, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(dataDir, 'canonicalPadas.json'), rawBytes);
    fs.writeFileSync(path.resolve(dataDir, 'canonicalPadas.json.gz'), compressedGz);
  }

  console.log('  ✓ Generated sitemap suites for both bhav & path subdomains');
  console.log('✨ All Dynamic Sitemaps generated successfully!');
}

generateAllSitemaps();
