/**
 * Vrindopnisad 2.0 - Real-Time RSS 2.0 & WebSub Feed Generator
 * Generates Google-compliant RSS feeds:
 * - feed.xml & rss.xml for bhav.vrindopnishad.in (Ras Sanctuary & Padas)
 * - feed-path.xml for path.vrindopnishad.in (Sanatan Mahagranth Parayana & Epics)
 * with PubSubHubbub hub links to force high-frequency Googlebot crawling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

export function generateRssFeed(outputDirs = ['public', 'dist']) {
  console.log('🌸 Generating Google-Optimized RSS 2.0 & WebSub Feeds (Bhav & Path)...');

  const now = new Date();
  const buildDateRfc822 = now.toUTCString();

  // Load canonical items
  const catalogPath = path.resolve(projectRoot, 'src/data/searchCatalog.json');
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const chapterSnippetsPath = path.resolve(projectRoot, 'src/data/chapterSnippets.json');

  // ==========================================
  // 1. BHAV DOMAIN (bhav.vrindopnishad.in)
  // ==========================================
  const bhavBase = 'https://bhav.vrindopnishad.in';
  const bhavItems = [];

  // Pillar Pages
  const bhavPillars = [
    {
      title: 'वृन्दोपनिषद् 2.0 • Home Sanctuary (दैनिक स्मरण व नित्य सेवा)',
      link: `${bhavBase}/`,
      desc: 'Digital sanctuary for Nitya Nikunj Ras & Sanatan Mahagranth Parayana. Explore 44,000+ canonical Braj Ras verses.',
    },
    {
      title: 'श्री धाम वृन्दावन के प्रमुख रसिक संत मंडल एवं वाणी परंपरा',
      link: `${bhavBase}/rasik-saints-of-vrindavan`,
      desc: 'श्री स्वामी हरिदास, श्री हित हरिवंश महाप्रभु, श्री रूप-सनातन गोस्वामी आदि 131 प्रामाणिक संतों की जीवन-गाथा एवं वाणी संग्रह।',
    },
    {
      title: 'श्री धाम वृन्दावन अष्टयाम सेवा व दर्शन समय-सारिणी',
      link: `${bhavBase}/vrindavan-ashtayama-seva-darshan-timings`,
      desc: 'श्री बांके बिहारी, श्री राधा रमण, श्री राधा वल्लभ आदि प्रमुख मंदिरों की दैनिक मंगला, राजभोग, शयन आरती एवं अष्टयाम सेवा दर्शन समय।',
    },
    {
      title: 'श्री वृन्दावन रसिक वाणी प्रामाणिक ग्रंथ सूची',
      link: `${bhavBase}/rasik-vani-granthas-list`,
      desc: 'श्री हित चौरासी, श्री राधा सुधा निधि, केलिमाल, सेवक वाणी आदि 24 प्रामाणिक रसिक ग्रंथों की संपूर्ण ग्रंथ सूची।',
    },
    {
      title: 'ऑनलाइन तुलसी माला जप एवं नित्य नाम साधना',
      link: `${bhavBase}/online-tulsi-mala-naam-jap`,
      desc: 'नित्य 108 मनका पावन नाम संकीर्तन, डिजिटल माला जप एवं युगल स्मरण काउंटर।',
    },
  ];

  for (const p of bhavPillars) {
    bhavItems.push({
      title: p.title,
      link: p.link,
      guid: p.link,
      pubDate: buildDateRfc822,
      description: p.desc,
    });
  }

  // Granthas
  if (fs.existsSync(granthasPath)) {
    try {
      const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
      for (const g of granthas.slice(0, 15)) {
        bhavItems.push({
          title: `${g.name || g.title} (${g.author || 'रसिक वाणी'}) • प्रामाणिक ग्रंथ`,
          link: `${bhavBase}/grantha/${encodeURIComponent(g.id)}`,
          guid: `${bhavBase}/grantha/${encodeURIComponent(g.id)}`,
          pubDate: buildDateRfc822,
          description: `${g.name || g.title} का संपूर्ण मूल पाठ, भावार्थ व पद अनुशीलन। रचयिता: ${g.author || 'श्री रसिक संत'}।`,
        });
      }
    } catch (e) {
      console.warn('Warning reading granthas for RSS:', e.message);
    }
  }

  // Celebrated Padas
  if (fs.existsSync(catalogPath)) {
    try {
      const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const entries = Object.values(rawCatalog);
      let count = 0;
      for (const item of entries) {
        if (count >= 50) break;
        const slug = item.id || item.slug;
        const title = item.title;
        if (slug && !slug.startsWith('valmiki-') && !slug.startsWith('shrimad-') && !slug.startsWith('ramcharitmanas')) {
          const author = item.author || 'श्री रसिक संत';
          const snippet = item.snippet ? item.snippet.replace(/\n+/g, ' ') : '';
          bhavItems.push({
            title: `${title} (${author}) • पावन रसिक पद`,
            link: `${bhavBase}/pad/${encodeURIComponent(slug)}`,
            guid: `${bhavBase}/pad/${encodeURIComponent(slug)}`,
            pubDate: buildDateRfc822,
            description: snippet || `${title} का मूल पाठ, पद भावार्थ एवं युगल निकुंज उपासना अनुशीलन। रचयिता: ${author}।`,
          });
          count++;
        }
      }
    } catch (e) {
      console.warn('Warning reading catalog for RSS:', e.message);
    }
  }

  const bhavRssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>वृन्दोपनिषद् 2.0 • Nitya Nikunj Ras &amp; Canonical Literature Stream</title>
    <link>${bhavBase}/</link>
    <description>Daily sacred Ras padas, Ashtayama seva timings, and canonical Braj literature updates from Vrindopnishad.</description>
    <language>hi-IN</language>
    <lastBuildDate>${buildDateRfc822}</lastBuildDate>
    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com/" />
    <atom:link rel="self" href="${bhavBase}/feed.xml" type="application/rss+xml" />
${bhavItems
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  // ==========================================
  // 2. PATH DOMAIN (path.vrindopnishad.in)
  // ==========================================
  const pathBase = 'https://path.vrindopnishad.in';
  const pathItems = [];

  // Root Parayana View
  pathItems.push({
    title: 'सनातन महाग्रंथ पारायण • संपूर्ण वाल्मीकि रामायण, भागवत, गीता | वृन्दोपनिषद् 2.0',
    link: `${pathBase}/`,
    guid: `${pathBase}/`,
    pubDate: buildDateRfc822,
    description: '५ अमर सनातन महाकाव्य: आदिकवि वाल्मीकि रामायण, श्रीमद्भागवत महापुराण, रामचरितमानस, श्रीमद्भगवद्गीता व श्री दुर्गा सप्तशती का अखंड मूल पाठ व पारायण।',
  });

  // 5 Epics Root
  const epics = [
    {
      id: 'valmiki-ramayana',
      title: 'श्रीमद् वाल्मीकि रामायण (सम्पूर्ण २४,००० श्लोक)',
      desc: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के पावन चरित्र का अमर महाकाव्य। ७ काण्ड, ५००+ सर्ग।',
    },
    {
      id: 'shrimad-bhagavatam',
      title: 'श्रीमद् भागवत महापुराण (सम्पूर्ण १२ स्कन्ध, ३३५ अध्याय)',
      desc: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा।',
    },
    {
      id: 'ramcharitmanas',
      title: 'श्री रामचरितमानस (गोस्वामी तुलसीदास कृत ७ काण्ड)',
      desc: 'गोस्वामी तुलसीदास जी विरचित पावन श्री राम कथा, दोहा, चौपाई, छन्द व सोरठा सहित सम्पूर्ण पारायण।',
    },
    {
      id: 'bhagavad-gita',
      title: 'श्रीमद्भगवद्गीता (सम्पूर्ण १८ अध्याय, ७०० श्लोक)',
      desc: 'योगेश्वर श्रीकृष्ण द्वारा कुरुक्षेत्र के रणक्षेत्र में अर्जुन को दिया गया सनातन अमर ज्ञानोपदेश।',
    },
    {
      id: 'durga-saptashati',
      title: 'श्री दुर्गा सप्तशती (मार्कण्डेय पुराण - सम्पूर्ण ७०० मन्त्र)',
      desc: 'भगवती जगदम्बा महामाया के दिव्य चरित्र, कवच, अर्गला, कीलक व १३ अध्याय का पावन पाठ।',
    },
  ];

  for (const ep of epics) {
    pathItems.push({
      title: `${ep.title} • सनातन महाग्रंथ`,
      link: `${pathBase}/grantha/${ep.id}`,
      guid: `${pathBase}/grantha/${ep.id}`,
      pubDate: buildDateRfc822,
      description: ep.desc,
    });
  }

  // Celebrated Epic Chapters from chapterSnippets
  if (fs.existsSync(chapterSnippetsPath)) {
    try {
      const snippets = JSON.parse(fs.readFileSync(chapterSnippetsPath, 'utf-8'));
      const entries = Object.values(snippets);

      let epCount = 0;
      for (const ch of entries) {
        if (epCount >= 50) break;
        if (ch.granthaId === 'valmiki-ramayana' || ch.granthaId === 'ramcharitmanas' || ch.granthaId === 'bhagavad-gita' || ch.granthaId === 'shrimad-bhagavatam' || ch.granthaId === 'durga-saptashati') {
          const chUrl = `${pathBase}/grantha/${ch.granthaId}/${encodeURIComponent(ch.chapterId)}`;
          pathItems.push({
            title: `${ch.chapterName} (${ch.granthaName}) • अध्याय पारायण`,
            link: chUrl,
            guid: chUrl,
            pubDate: buildDateRfc822,
            description: `${ch.granthaName} - ${ch.chapterName} का पावन मूल पाठ व श्लोक संग्रह। कुल श्लोक: ${ch.verseCount}। प्रणेता: ${ch.author}।`,
          });
          epCount++;
        }
      }
    } catch (e) {
      console.warn('Warning reading chapterSnippets for RSS:', e.message);
    }
  }

  const pathRssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>वृन्दोपनिषद् 2.0 • Sanatan Mahagranth Parayana Stream</title>
    <link>${pathBase}/</link>
    <description>Continuous sacred Parayana of Valmiki Ramayana, Shrimad Bhagavatam, Ramcharitmanas, Bhagavad Gita, and Durga Saptashati.</description>
    <language>sa-IN, hi-IN</language>
    <lastBuildDate>${buildDateRfc822}</lastBuildDate>
    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com/" />
    <atom:link rel="self" href="${pathBase}/feed.xml" type="application/rss+xml" />
${pathItems
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  for (const dirName of outputDirs) {
    const dir = path.resolve(projectRoot, dirName);
    if (!fs.existsSync(dir)) continue;

    // Bhav feeds
    fs.writeFileSync(path.resolve(dir, 'feed.xml'), bhavRssXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'rss.xml'), bhavRssXml, 'utf-8');

    // Path feeds
    fs.writeFileSync(path.resolve(dir, 'feed-path.xml'), pathRssXml, 'utf-8');
    fs.writeFileSync(path.resolve(dir, 'rss-path.xml'), pathRssXml, 'utf-8');

    console.log(`  ✓ Written Bhav RSS feeds to ${dirName}/feed.xml (${bhavItems.length} items)`);
    console.log(`  ✓ Written Path RSS feeds to ${dirName}/feed-path.xml (${pathItems.length} items)`);
  }

  console.log('✨ RSS 2.0 feeds generation complete for both domains!');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('generate-rss.mjs')) {
  generateRssFeed();
}
