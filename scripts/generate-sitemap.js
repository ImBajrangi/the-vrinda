/**
 * Vrindopnisad 2.0 - Sitemap Generation Script
 * Generates official Google & Bing XML sitemaps for all 4,204+ verses, granthas, and saints.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://vrindopnisad.org';

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

export function generateAllSitemaps(outputDirs = ['public', 'dist']) {
  const today = getTodayIsoDate();

  const padasPath = path.resolve(projectRoot, 'src/data/canonicalPadas.json');
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');

  const padas = JSON.parse(fs.readFileSync(padasPath, 'utf-8'));
  const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
  const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));

  console.log(`🌸 Generating Dynamic Sitemaps for ${padas.length} verses, ${granthas.length} granthas, ${saints.length} saints...`);

  // 1. Core Sanctuary Views
  const mainUrls = [
    { loc: `${DEFAULT_BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${DEFAULT_BASE_URL}/?tab=smaran`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${DEFAULT_BASE_URL}/?tab=padavali`, lastmod: today, changefreq: 'daily', priority: 0.95 },
    { loc: `${DEFAULT_BASE_URL}/?tab=feed`, lastmod: today, changefreq: 'hourly', priority: 0.9 },
    { loc: `${DEFAULT_BASE_URL}/?tab=milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
  ];
  const mainXml = buildUrlset(mainUrls);

  // 2. Granthas
  const granthasUrls = granthas.map((g) => ({
    loc: `${DEFAULT_BASE_URL}/?tab=padavali&grantha=${encodeURIComponent(g.id)}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: 0.9,
  }));
  const granthasXml = buildUrlset(granthasUrls);

  // 3. Saints
  const saintsUrls = saints.map((s) => ({
    loc: `${DEFAULT_BASE_URL}/?tab=padavali&author=${encodeURIComponent(s.name)}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: 0.85,
  }));
  const saintsXml = buildUrlset(saintsUrls);

  // 4. Padas (All 4,204 verses with headline/title slugs for SEO indexing perfection)
  const padasUrls = padas.map((p) => {
    const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
    const slug = p.slug || p.id;
    return {
      loc: `${DEFAULT_BASE_URL}/?tab=padavali&pad=${encodeURIComponent(slug)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: isCelebrated ? 0.9 : 0.8,
    };
  });
  const padasXml = buildUrlset(padasUrls);

  // 5. Sitemap Index (Standard entry point for Googlebot & Bing)
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${DEFAULT_BASE_URL}/sitemap-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${DEFAULT_BASE_URL}/sitemap-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${DEFAULT_BASE_URL}/sitemap-saints.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${DEFAULT_BASE_URL}/sitemap-padas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    '</sitemapindex>',
  ].join('\n');

  // 6. Unified Full Sitemap (All 4,350+ URLs in a single file)
  const allUrls = [...mainUrls, ...granthasUrls, ...saintsUrls, ...padasUrls];
  const allXml = buildUrlset(allUrls);

  // Write files to target directories
  for (const dirName of outputDirs) {
    const dir = path.resolve(projectRoot, dirName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path.resolve(dir, 'sitemap.xml'), indexXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'sitemap-main.xml'), mainXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'sitemap-granthas.xml'), granthasXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'sitemap-saints.xml'), saintsXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'sitemap-padas.xml'), padasXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'sitemap-all.xml'), allXml, 'utf-8');
  }

  console.log(`  ✓ Written sitemap.xml (Sitemap Index)`);
  console.log(`  ✓ Written sitemap-main.xml (${mainUrls.length} core routes)`);
  console.log(`  ✓ Written sitemap-granthas.xml (${granthasUrls.length} collections)`);
  console.log(`  ✓ Written sitemap-saints.xml (${saintsUrls.length} rasik saints)`);
  console.log(`  ✓ Written sitemap-padas.xml (${padasUrls.length} canonical verses)`);
  console.log(`  ✓ Written sitemap-all.xml (${allUrls.length} total URLs, ${Math.round(allXml.length / 1024)} KB)`);
  console.log('✨ All Dynamic Sitemaps generated successfully!');
}

generateAllSitemaps();

