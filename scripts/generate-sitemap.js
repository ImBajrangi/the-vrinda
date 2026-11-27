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
      page: `${baseUrl}/feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari-v2.webp`,
      title: 'श्री बांके बिहारी जी महाराज दर्शन (वृन्दावन)',
      caption: 'श्री ठाकुर बांके बिहारी जी महाराज के पावन दर्शन एवं वृन्दावन धाम की अनुपम आभा।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari-gate.webp`,
      title: 'श्री बांके बिहारी मंदिर प्रवेश द्वार',
      caption: 'वृन्दावन धाम स्थित श्री बांके बिहारी मंदिर का भव्य एवं पावन प्रवेश द्वार।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/feed`,
      loc: `${baseUrl}/assets/temples/banke-bihari.webp`,
      title: 'ठाकुर श्री बांके बिहारी जी छवि',
      caption: 'स्वामी हरिदास जी द्वारा सेवित लाड़िले ठाकुर बांके बिहारी जी की अलौकिक छवि।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/place/barsana-shriji-mandir`,
      loc: `${baseUrl}/assets/temples/barsana-radharani.webp`,
      title: 'श्री लाड़ली जी महल (बरसाना)',
      caption: 'भानुपुरा शिखर पर स्थित श्री राधा रानी मंदिर (लाड़ली जी महल) बरसाना धाम।',
      geo: 'Barsana, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/place/shri-radha-raman-mandir`,
      loc: `${baseUrl}/assets/temples/radha-raman.webp`,
      title: 'श्री राधा रमण जी महाराज मंदिर',
      caption: 'श्रीयुत गोपाल भट्ट गोस्वामी जी द्वारा शालिग्राम शिला से प्रकट स्वयं-प्रकट श्री राधा रमण देव।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/place/shri-radha-vallabh-mandir`,
      loc: `${baseUrl}/assets/temples/radha-vallabh.webp`,
      title: 'श्री राधा वल्लभ जी महाराज मंदिर',
      caption: 'श्री हित हरिवंश महाप्रभु प्राकट्य एवं राधावल्लभ संप्रदाय का प्रधान देवालय।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/place/vrindavan-dham`,
      loc: `${baseUrl}/assets/temples/keshi-ghat.webp`,
      title: 'पावन केशी घाट एवं यमुना जी तट',
      caption: 'श्री यमुना जी के पावन तट पर स्थित ऐतिहासिक केशी घाट, वृन्दावन।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/feed`,
      loc: `${baseUrl}/assets/temples/diya-pujan.webp`,
      title: 'संध्या आरती दीप पूजन',
      caption: 'पावन यमुना तट एवं वृन्दावन देवालयों में नित्य दीपदान व संध्या आरती।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/feed`,
      loc: `${baseUrl}/assets/temples/aarti-lamp.webp`,
      title: 'मंगला व शयन आरती दीप ज्योति',
      caption: 'वृन्दावन रसिक संतों द्वारा सेवित युगल सरकार की मंगला व शयन आरती दीप।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/swami-haridas`,
      loc: `${baseUrl}/assets/saints/swami-haridas.webp`,
      title: 'संगीत शिरोमणि स्वामी हरिदास जी महाराज',
      caption: 'निधिवन राज रस प्रणेता एवं तानसेन के गुरु पूज्य स्वामी हरिदास जी महाराज।',
      geo: 'Nidhivan, Vrindavan, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/chaitanya-mahaprabhu`,
      loc: `${baseUrl}/assets/saints/chaitanya.webp`,
      title: 'श्री चैतन्य महाप्रभु (गौर हरि)',
      caption: 'संकीर्तन आंदोलन के प्रवर्तक एवं प्रेम रस अवतार श्री कृष्ण चैतन्य महाप्रभु।',
      geo: 'Mayapur, Nadia, West Bengal, India',
    },
    {
      page: `${baseUrl}/sant/nagaridas`,
      loc: `${baseUrl}/assets/saints/nagaridas.webp`,
      title: 'रसिक कवि भक्त नागरीदास जी महाराज',
      caption: 'किशनगढ़ नरेश सावंत सिंह (भक्त नागरीदास) एवं वाणी रचनाकार।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/raskhan`,
      loc: `${baseUrl}/assets/saints/raskhan.webp`,
      title: 'परम कृष्ण भक्त रसखान जी',
      caption: 'मानुष हों तो वही रसखानि बसौं ब्रज गोकुल गाँव के ग्वारन।',
      geo: 'Gokul, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/vyas-ji`,
      loc: `${baseUrl}/assets/saints/vyas.webp`,
      title: 'श्री हरिराम व्यास जी महाराज',
      caption: 'किशोर वन वृन्दावन के अनन्य रसिक संत श्री हरिराम व्यास जी।',
      geo: 'Kishore Van, Vrindavan, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/surdas`,
      loc: `${baseUrl}/assets/saints/surdas.webp`,
      title: 'महाकवि सूरदास जी',
      caption: 'सूरसागर एवं अष्टछाप के महाकवि भक्त सूरदास जी महाराज।',
      geo: 'Parsauli, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/nimbarkacharya`,
      loc: `${baseUrl}/assets/saints/nimbarka.webp`,
      title: 'जगद्गुरु श्री निम्बार्काचार्य जी',
      caption: 'द्वैताद्वैत दर्शन एवं राधा-कृष्ण युगल उपासना के आदि आचार्य।',
      geo: 'Nimgaon, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/vallabhacharya`,
      loc: `${baseUrl}/assets/saints/vallabha.webp`,
      title: 'जगद्गुरु श्रीमद् वल्लभाचार्य जी महाप्रभु',
      caption: 'शुद्धाद्वैत दर्शन एवं पुष्टिमार्ग भक्ति परंपरा के प्रणेता।',
      geo: 'Varanasi, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/meera-bai`,
      loc: `${baseUrl}/assets/saints/meera.webp`,
      title: 'अनन्य कृष्ण प्रेमानुरागिणी भक्त मीराबाई जी',
      caption: 'मेरो तो गिरधर गोपाल दूसरो न कोई। अनन्य प्रेम दीवानी मीराबाई।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/shri-hita-harivansh-mahaprabhu`,
      loc: `${baseUrl}/assets/saints/hit-harivansh.webp`,
      title: 'श्री हित हरिवंश महाप्रभु जी',
      caption: 'राधावल्लभ संप्रदाय के प्रवर्तक एवं श्री हित चौरासी के रचयिता श्री हित हरिवंश महाप्रभु।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/dhruvdas`,
      loc: `${baseUrl}/assets/saints/dhruvdas.webp`,
      title: 'श्री ध्रुवदास जी महाराज',
      caption: 'बयालीस लीला के रचयिता राधावल्लभ संप्रदाय के महान रसिक संत श्री ध्रुवदास जी।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/biharin-dev`,
      loc: `${baseUrl}/assets/saints/biharin-dev.webp`,
      title: 'श्री बिहारिन देव जी महाराज',
      caption: 'स्वामी हरिदास जी की परंपरा के अनन्य रसिक आचार्य श्री बिहारिन देव जी।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/vitthal-vipul`,
      loc: `${baseUrl}/assets/saints/vitthal-vipul.webp`,
      title: 'श्री विट्ठल विपुल देव जी महाराज',
      caption: 'सखी संप्रदाय के प्रमुख रसिक संत श्री विट्ठल विपुल देव जी।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/lalit-kishori`,
      loc: `${baseUrl}/assets/saints/lalit-kishori.webp`,
      title: 'श्री ललित किशोरी देव जी महाराज',
      caption: 'टट्टी स्थान वृन्दावन के परम रसिक आचार्य श्री ललित किशोरी देव जी।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/sevak-ji`,
      loc: `${baseUrl}/assets/saints/sevak-ji.webp`,
      title: 'श्री सेवक जी महाराज (दामोदरदास)',
      caption: 'श्री हरिवंश चरित्र एवं सेवक वाणी के रचयिता परम रसिक श्री सेवक जी।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/nabhaji`,
      loc: `${baseUrl}/assets/saints/nabhaji.webp`,
      title: 'भक्तमाल प्रणेता श्री नाभादास जी',
      caption: 'प्रसिद्ध भक्तमाल ग्रंथ के रचयिता पूज्य श्री नाभादास जी महाराज।',
      geo: 'Galta, Jaipur, Rajasthan, India',
    },
    {
      page: `${baseUrl}/sant/malookdas`,
      loc: `${baseUrl}/assets/saints/malookdas.webp`,
      title: 'परम संत श्री मलूकदास जी महाराज',
      caption: 'भक्तिकाल के महान संत श्री मलूकदास जी महाराज।',
      geo: 'Kara, Kaushambi, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/ramanandacharya`,
      loc: `${baseUrl}/assets/saints/ramanandacharya.webp`,
      title: 'जगद्गुरु श्री रामानन्दाचार्य जी',
      caption: 'भक्ति आंदोलन के आदि प्रवर्तक जगद्गुरु श्री रामानन्दाचार्य जी महाराज।',
      geo: 'Varanasi, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/sant/rajendradasji`,
      loc: `${baseUrl}/assets/saints/rajendradasji.webp`,
      title: 'परम पूज्य श्री राजेन्द्रदास देवाचार्य जी महाराज',
      caption: 'श्री मलूकपीठ वृन्दावन के वर्तमान पीठाधीश्वर परम पूज्य श्री राजेन्द्रदास जी महाराज।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/festivals/jhulan-yatra`,
      loc: `${baseUrl}/assets/darshan/barsana-radhavallabh-jhanki.webp`,
      title: 'श्री वृन्दावन सावन झूलन यात्रा दर्शन',
      caption: 'पावस ऋतु में मेघ मल्हार मध्य श्री राधावल्लभ लाल जी का स्वर्ण-रजत हिंडोला दर्शन।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/festivals/radhashtami`,
      loc: `${baseUrl}/assets/temples/barsana-radharani.webp`,
      title: 'श्री राधाष्टमी महामहोत्सव — बरसाना लाड़िली जी महल',
      caption: 'निकुंजेश्वरी करुणामयी श्री राधारानी का पावन प्राकट्य महोत्सव, बरसाना धाम।',
      geo: 'Barsana, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/festivals/latthmar-holi`,
      loc: `${baseUrl}/assets/darshan/radharaman-gulabi-pag.webp`,
      title: 'श्री राधारमण लाल जी गुलाल व वसंत-फाग शृंगार',
      caption: 'फाल्गुन रंगोत्सव व लठमार होरी में श्री राधारमण देव जू का गुलाबी पाग दर्शन।',
      geo: 'Vrindavan, Mathura, Uttar Pradesh, India',
    },
    {
      page: `${baseUrl}/festivals/sharad-purnima`,
      loc: `${baseUrl}/assets/darshan/radhavallabh-peacock.webp`,
      title: 'शरद पूर्णिमा महारास दर्शन — मोरपंख पीठिका',
      caption: 'शरद चन्द्र की धवल चाँदनी में नित्य महारास व वंशीवट रस उत्सव।',
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
            loc: `${baseUrl}/grantha/${encodeURIComponent(epic.id)}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: 0.95,
          });

          const epicIndexPath = path.resolve(projectRoot, `public/data/epics/${epic.id}/index.json`);
          if (fs.existsSync(epicIndexPath)) {
            const epicData = JSON.parse(fs.readFileSync(epicIndexPath, 'utf-8'));
            for (const ch of epicData.chapters || []) {
              granthasUrls.push({
                loc: `${baseUrl}/grantha/${encodeURIComponent(epic.id)}/${encodeURIComponent(ch.id)}`,
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
  // Dedicated to 11,832 Authentic Ras Padas, 24 Ras Collections, 131 Saints, Daily Seva
  // ZERO EPIC REDIRECTS & 100% CANONICAL MATCH WITH PADA SNIPPETS!
  // -------------------------------------------------------------
  let rawPadas = [];
  const granthasDir = path.resolve(projectRoot, 'public/data/granthas');
  if (fs.existsSync(granthasDir)) {
    const chunkFiles = fs.readdirSync(granthasDir).filter(
      (f) => f.endsWith('.json') && !EPIC_IDS.has(f.replace('.json', ''))
    );
    const seenSlugs = new Set();
    for (const f of chunkFiles) {
      const colId = f.replace('.json', '');
      try {
        const items = JSON.parse(fs.readFileSync(path.join(granthasDir, f), 'utf-8'));
        for (const item of items) {
          const s = (item.slug || item.id || '').trim().replace(/\.+$/, '');
          if (s && !seenSlugs.has(s)) {
            seenSlugs.add(s);
            rawPadas.push({
              slug: s,
              titleDevanagari: item.titleDevanagari,
              collectionId: colId,
            });
          }
        }
      } catch (err) {
        console.warn(`  ⚠ Warning reading grantha file ${f}:`, err.message);
      }
    }
  }

  // Filter strictly to non-epic authentic Ras padas (prevents 31,689 301 redirects!)
  const rasPadas = rawPadas;

  // 1. Core Sanctuary Views (Clean canonical URLs, high-authority pillar routes)
  const mainUrls = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/rasik-saints-of-vrindavan`, lastmod: today, changefreq: 'weekly', priority: 0.95 },
    { loc: `${baseUrl}/vrindavan-ashtayama-seva-darshan-timings`, lastmod: today, changefreq: 'weekly', priority: 0.95 },
    { loc: `${baseUrl}/rasik-vani-granthas-list`, lastmod: today, changefreq: 'weekly', priority: 0.95 },
    { loc: `${baseUrl}/online-tulsi-mala-naam-jap`, lastmod: today, changefreq: 'weekly', priority: 0.95 },
    { loc: `${baseUrl}/padavali`, lastmod: today, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/feed`, lastmod: today, changefreq: 'hourly', priority: 0.85 },
    { loc: `${baseUrl}/milestones`, lastmod: today, changefreq: 'weekly', priority: 0.85 },
    { loc: `${baseUrl}/stories`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/biographies`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/places`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/rituals`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
  ];

  // Ingest all Sacred Sections (Rituals, Places, Stories, Biographies) with clean ASCII URLs
  const ritualsIndexPath = path.resolve(projectRoot, 'public/data/rituals/index.json');
  if (fs.existsSync(ritualsIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(ritualsIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        mainUrls.push({
          loc: `${baseUrl}/ritual/${item.slug}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
        });
      }
    } catch {}
  }

  const placesIndexPath = path.resolve(projectRoot, 'public/data/places/index.json');
  if (fs.existsSync(placesIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(placesIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        mainUrls.push({
          loc: `${baseUrl}/place/${item.slug}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
        });
      }
    } catch {}
  }

  const storiesIndexPath = path.resolve(projectRoot, 'public/data/stories/index.json');
  if (fs.existsSync(storiesIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(storiesIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        mainUrls.push({
          loc: `${baseUrl}/story/${item.slug}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
        });
      }
    } catch {}
  }

  const biosIndexPath = path.resolve(projectRoot, 'public/data/biographies/index.json');
  if (fs.existsSync(biosIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(biosIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        mainUrls.push({
          loc: `${baseUrl}/bio/${item.slug}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
        });
      }
    } catch {}
  }

  // Ingest all 34 High-Authority Topical Pillar Guides
  const guidesMetaPath = path.resolve(projectRoot, 'src/data/topicalGuidesMeta.json');
  if (fs.existsSync(guidesMetaPath)) {
    try {
      const guidesMeta = JSON.parse(fs.readFileSync(guidesMetaPath, 'utf-8'));
      for (const slug of Object.keys(guidesMeta)) {
        mainUrls.push({
          loc: `${baseUrl}/${slug}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
        });
      }
    } catch {}
  }

  // Ingest Programmatic SEO Hubs: Knowledge Base, Festivals, Ragas, Themes & Braj Glossary
  mainUrls.push(
    { loc: `${baseUrl}/knowledge-base`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/festivals`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/festivals/jhulan-yatra`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/festivals/radhashtami`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/festivals/sharad-purnima`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/festivals/latthmar-holi`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/festivals/krishna-janmashtami`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/festivals/gopashtami`, lastmod: today, changefreq: 'monthly', priority: 0.85 },
    { loc: `${baseUrl}/ragas`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/themes`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${baseUrl}/glossary`, lastmod: today, changefreq: 'weekly', priority: 0.9 }
  );

  const ragaIndexPath = path.resolve(projectRoot, 'src/data/ragaIndex.json');
  if (fs.existsSync(ragaIndexPath)) {
    try {
      const ragaIndex = JSON.parse(fs.readFileSync(ragaIndexPath, 'utf-8'));
      for (const rSlug of Object.keys(ragaIndex)) {
        mainUrls.push({
          loc: `${baseUrl}/raga/${encodeURIComponent(rSlug)}`,
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.8,
        });
      }
    } catch {}
  }

  const themeHubsPath = path.resolve(projectRoot, 'src/data/themeHubs.json');
  if (fs.existsSync(themeHubsPath)) {
    try {
      const themeHubs = JSON.parse(fs.readFileSync(themeHubsPath, 'utf-8'));
      for (const tSlug of Object.keys(themeHubs)) {
        mainUrls.push({
          loc: `${baseUrl}/theme/${encodeURIComponent(tSlug)}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: 0.85,
        });
      }
    } catch {}
  }

  const glossaryPath = path.resolve(projectRoot, 'src/data/brajGlossary.json');
  if (fs.existsSync(glossaryPath)) {
    try {
      const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
      for (const term of glossary) {
        if (term.id) {
          mainUrls.push({
            loc: `${baseUrl}/glossary/${encodeURIComponent(term.id)}`,
            lastmod: today,
            changefreq: 'monthly',
            priority: 0.8,
          });
        }
      }
    } catch {}
  }
  const mainXml = buildUrlset(mainUrls);

  // Compute exact pada counts per grantha & saint for paginated sub-hubs (100 padas/page)
  const PAGE_SIZE = 100;
  const granthaCounts = new Map();
  const saintCounts = new Map();
  const padaSnippetsPath = path.resolve(projectRoot, 'src/data/padaSnippets.json');
  if (fs.existsSync(padaSnippetsPath)) {
    try {
      const snippets = JSON.parse(fs.readFileSync(padaSnippetsPath, 'utf-8'));
      for (const tuple of Object.values(snippets)) {
        const auth = tuple[1];
        const gId = tuple[2];
        if (gId) granthaCounts.set(gId, (granthaCounts.get(gId) || 0) + 1);
        if (auth) saintCounts.set(auth, (saintCounts.get(auth) || 0) + 1);
      }
    } catch {}
  }

  // 2. Granthas (24 Ras Collections + Paginated Sub-Hubs)
  const granthasUrls = [];
  for (const g of granthas.filter((gr) => !EPIC_IDS.has(gr.id))) {
    granthasUrls.push({
      loc: `${baseUrl}/grantha/${encodeURIComponent(g.id)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9,
    });
    const total = granthaCounts.get(g.id) || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      granthasUrls.push({
        loc: `${baseUrl}/grantha/${encodeURIComponent(g.id)}/page/${p}`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.75,
      });
    }
  }
  const granthasXml = buildUrlset(granthasUrls);

  // 3. Saints (131 Canonical Saints + Paginated Sub-Hubs)
  const saintsUrls = [];
  for (const s of saints) {
    const slug = s.slug || s.id || s.name;
    saintsUrls.push({
      loc: `${baseUrl}/sant/${encodeURIComponent(slug)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.85,
    });
    const total = saintCounts.get(s.name) || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      saintsUrls.push({
        loc: `${baseUrl}/sant/${encodeURIComponent(slug)}/page/${p}`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.75,
      });
    }
  }
  const saintsXml = buildUrlset(saintsUrls);

  // Load legacy slug redirects to resolve any legacy Devanagari slugs into clean Roman canonical URLs
  let legacyRedirects = {};
  const legacyPath = path.resolve(projectRoot, 'src/data/legacySlugRedirects.json');
  if (fs.existsSync(legacyPath)) {
    try {
      legacyRedirects = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
    } catch {}
  }

  // 4. Padas (11,909 Ras Verses - 100% Clean Canonical Roman URLs)
  const padasUrls = rasPadas.map((p) => {
    const isCelebrated = ['hit-chaurasi', 'radha-sudha-nidhi', 'kelimal'].includes(p.collectionId);
    let rawSlug = (p.slug || p.id || '').trim();
    if (legacyRedirects[rawSlug]) {
      rawSlug = legacyRedirects[rawSlug];
    }
    // Clean ASCII slug with zero percent encoding
    const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return {
      loc: `${baseUrl}/pad/${cleanSlug}`,
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
