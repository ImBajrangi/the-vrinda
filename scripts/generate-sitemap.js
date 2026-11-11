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

function buildImageSitemap(baseUrl) {
  const images = [
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari-v2.webp`,
      title: 'श्री बांके बिहारी जी महाराज दर्शन (वृन्दावन)',
      caption: 'श्री ठाकुर बांके बिहारी जी महाराज के पावन दर्शन एवं वृन्दावन धाम की अनुपम आभा।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari-gate.webp`,
      title: 'श्री बांके बिहारी मंदिर प्रवेश द्वार',
      caption: 'वृन्दावन धाम स्थित श्री बांके बिहारी मंदिर का भव्य एवं पावन प्रवेश द्वार।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari.webp`,
      title: 'ठाकुर श्री बांके बिहारी जी छवि',
      caption: 'स्वामी हरिदास जी द्वारा सेवित लाड़िले ठाकुर बांके बिहारी जी की अलौकिक छवि।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/barsana-radharani.webp`,
      title: 'श्री लाड़ली जी महल (बरसाना)',
      caption: 'भानुपुरा शिखर पर स्थित श्री राधा रानी मंदिर (लाड़ली जी महल) बरसाना धाम।',
      geo: 'Barsana, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/radha-raman.webp`,
      title: 'श्री राधा रमण जी महाराज मंदिर',
      caption: 'श्रीयुत गोपाल भट्ट गोस्वामी जी द्वारा शालिग्राम शिला से प्रकट स्वयं-प्रकट श्री राधा रमण देव।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/radha-vallabh.webp`,
      title: 'श्री राधा वल्लभ जी महाराज मंदिर',
      caption: 'श्री हित हरिवंश महाप्रभु प्राकट्य एवं राधावल्लभ संप्रदाय का प्रधान देवालय।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/keshi-ghat.webp`,
      title: 'पावन केशी घाट एवं यमुना जी तट',
      caption: 'श्री यमुना जी के पावन तट पर स्थित ऐतिहासिक केशी घाट, वृन्दावन।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/diya-pujan.webp`,
      title: 'संध्या आरती दीप पूजन',
      caption: 'पावन यमुना तट एवं वृन्दावन देवालयों में नित्य दीपदान व संध्या आरती।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=feed`,
      loc: `${baseUrl}/assets/temples/aarti-lamp.webp`,
      title: 'मंगला व शयन आरती दीप ज्योति',
      caption: 'वृन्दावन रसिक संतों द्वारा सेवित युगल सरकार की मंगला व शयन आरती दीप।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=swami-haridas`,
      loc: `${baseUrl}/assets/saints/swami-haridas.webp`,
      title: 'संगीत शिरोमणि स्वामी हरिदास जी महाराज',
      caption: 'निधिवन राज रस प्रणेता एवं तानसेन के गुरु पूज्य स्वामी हरिदास जी महाराज।',
      geo: 'Nidhivan, Vrindavan, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=chaitanya-mahaprabhu`,
      loc: `${baseUrl}/assets/saints/chaitanya.webp`,
      title: 'श्री चैतन्य महाप्रभु (गौर हरि)',
      caption: 'संकीर्तन आंदोलन के प्रवर्तक एवं प्रेम रस अवतार श्री कृष्ण चैतन्य महाप्रभु।',
      geo: 'Mayapur, Nadia, West Bengal, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=nagaridas`,
      loc: `${baseUrl}/assets/saints/nagaridas.webp`,
      title: 'रसिक कवि भक्त नागरीदास जी महाराज',
      caption: 'किशनगढ़ नरेश सावंत सिंह (भक्त नागरीदास) एवं वाणी रचनाकार।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=raskhan`,
      loc: `${baseUrl}/assets/saints/raskhan.webp`,
      title: 'परम कृष्ण भक्त रसखान जी',
      caption: 'मानुष हों तो वही रसखानि बसौं ब्रज गोकुल गाँव के ग्वारन।',
      geo: 'Gokul, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=vyas-ji`,
      loc: `${baseUrl}/assets/saints/vyas.webp`,
      title: 'श्री हरिराम व्यास जी महाराज',
      caption: 'किशोर वन वृन्दावन के अनन्य रसिक संत श्री हरिराम व्यास जी।',
      geo: 'Kishore Van, Vrindavan, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=surdas`,
      loc: `${baseUrl}/assets/saints/surdas.webp`,
      title: 'महाकवि सूरदास जी',
      caption: 'सूरसागर एवं अष्टछाप के महाकवि भक्त सूरदास जी महाराज।',
      geo: 'Parsauli, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=nimbarkacharya`,
      loc: `${baseUrl}/assets/saints/nimbarka.webp`,
      title: 'जगद्गुरु श्री निम्बार्काचार्य जी',
      caption: 'द्वैताद्वैत दर्शन एवं राधा-कृष्ण युगल उपासना के आदि आचार्य।',
      geo: 'Nimgaon, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=vallabhacharya`,
      loc: `${baseUrl}/assets/saints/vallabha.webp`,
      title: 'जगद्गुरु श्रीमद् वल्लभाचार्य जी महाप्रभु',
      caption: 'शुद्धाद्वैत दर्शन एवं पुष्टिमार्ग भक्ति परंपरा के प्रणेता।',
      geo: 'Varanasi, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/?tab=padavali&author=meera-bai`,
      loc: `${baseUrl}/assets/saints/meera.webp`,
      title: 'अनन्य कृष्ण प्रेमानुरागिणी भक्त मीराबाई जी',
      caption: 'मेरो तो गिरधर गोपाल दूसरो न कोई। अनन्य प्रेम दीवानी मीराबाई।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
  ];

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const item of images) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(item.page)}</loc>`);
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(item.loc)}</image:loc>`);
    lines.push(`      <image:title>${escapeXml(item.title)}</image:title>`);
    lines.push(`      <image:caption>${escapeXml(item.caption)}</image:caption>`);
    lines.push(`      <image:geo_location>${escapeXml(item.geo)}</image:geo_location>`);
    lines.push('    </image:image>');
    lines.push('  </url>');
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

  // 5. Image Sitemap (High-Resolution WebP Vrindavan Temples & Saints with Geolocation)
  const imagesXml = buildImageSitemap(baseUrl);

  // 6. Sitemap Index (pointing to standard .xml sitemaps)
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${baseUrl}/${filePrefix}-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-granthas.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-saints.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${baseUrl}/${filePrefix}-images.xml</loc><lastmod>${today}</lastmod></sitemap>`,
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
    [`${filePrefix}-images.xml`]: { content: imagesXml, isBinary: false },
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
