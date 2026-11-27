/**
 * Vrindopnisad 2.0 - Static Site Generation (SSG) Pre-render Script
 * Runs after client and SSR builds to inject pre-rendered HTML, meta tags, and structured data
 * into static HTML files for crawlers and CDNs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function injectSSRContent(template, html, seoHead) {
  let result = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  const startMarker = '<!-- SSR_HEAD_START -->';
  const endMarker = '<!-- SSR_HEAD_END -->';
  const startIndex = result.indexOf(startMarker);
  const endIndex = result.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && seoHead) {
    result =
      result.substring(0, startIndex) +
      startMarker +
      '\n    ' +
      seoHead +
      '\n    ' +
      result.substring(endIndex);
  } else if (seoHead) {
    result = result.replace('</head>', `    ${seoHead}\n  </head>`);
  }

  return result;
}

async function prerender() {
  const distPath = path.resolve(projectRoot, 'dist');
  const templatePath = path.resolve(distPath, 'index.html');
  const serverEntryPath = path.resolve(projectRoot, 'dist-server', 'entry-server.js');

  if (!fs.existsSync(templatePath)) {
    console.error('Error: dist/index.html not found. Please run client build first.');
    process.exit(1);
  }

  if (!fs.existsSync(serverEntryPath)) {
    console.error('Error: dist-server/entry-server.js not found. Please run SSR build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const { render } = await import(`file://${serverEntryPath}`);

  // 1. Core Sanctuary Tabs & Authority Pillar Guides
  const routes = [
    { url: '/', file: 'index.html' },
    { url: '/rasik-saints-of-vrindavan', file: 'rasik-saints-of-vrindavan.html' },
    { url: '/vrindavan-ashtayama-seva-darshan-timings', file: 'vrindavan-ashtayama-seva-darshan-timings.html' },
    { url: '/rasik-vani-granthas-list', file: 'rasik-vani-granthas-list.html' },
    { url: '/online-tulsi-mala-naam-jap', file: 'online-tulsi-mala-naam-jap.html' },
    { url: '/padavali', file: 'padavali.html' },
    { url: '/granthas', file: 'granthas.html' },
    { url: '/feed', file: 'feed.html' },
    { url: '/milestones', file: 'milestones.html' },
    { url: '/smaran', file: 'smaran.html' },
    { url: '/rituals', file: 'rituals.html' },
    { url: '/places', file: 'places.html' },
    { url: '/stories', file: 'stories.html' },
    { url: '/biographies', file: 'biographies.html' },
    { url: '/knowledge-base', file: 'knowledge-base.html' },
    { url: '/guides', file: 'guides.html' },
    { url: '/festivals', file: 'festivals.html' },
    { url: '/festivals/jhulan-yatra', file: 'festivals/jhulan-yatra.html' },
    { url: '/festivals/radhashtami', file: 'festivals/radhashtami.html' },
    { url: '/festivals/sharad-purnima', file: 'festivals/sharad-purnima.html' },
    { url: '/festivals/latthmar-holi', file: 'festivals/latthmar-holi.html' },
    { url: '/festivals/krishna-janmashtami', file: 'festivals/krishna-janmashtami.html' },
    { url: '/festivals/gopashtami', file: 'festivals/gopashtami.html' },
    { url: '/glossary', file: 'glossary.html' },
  ];

  // 2. Pre-render ALL 29 Scripture Collections (5 Epics + 24 Rasik Granthas)
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  if (fs.existsSync(granthasPath)) {
    const granthasData = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
    for (const g of granthasData) {
      const routeUrl = `/grantha/${encodeURIComponent(g.id)}`;
      const routeFile = `grantha-${g.id}.html`;
      if (!routes.some((r) => r.file === routeFile)) {
        routes.push({ url: routeUrl, file: routeFile });
      }
      routes.push({ url: routeUrl, file: `grantha/${g.id}.html` });
    }
  }

  // 3. Pre-render Top Canonical Saints Profiles
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');
  if (fs.existsSync(saintsPath)) {
    const saintsData = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));
    for (const s of saintsData.slice(0, 10)) {
      const slug = s.slug || s.id;
      const routeUrl = `/sant/${encodeURIComponent(slug)}`;
      routes.push({ url: routeUrl, file: `sant/${slug}.html` });
    }
  }

  // 4. Pre-render Authentic Epic Chapter & Celebrated Pad Samples
  routes.push(
    { url: '/grantha/bhagavad-gita/adhyay-1', file: 'grantha-bhagavad-gita-adhyay-1.html' },
    { url: '/grantha/bhagavad-gita/adhyay-2', file: 'grantha-bhagavad-gita-adhyay-2.html' },
    { url: '/grantha/ramcharitmanas/bal-kand', file: 'grantha-ramcharitmanas-bal-kand.html' },
    { url: '/grantha/ramcharitmanas/sundar-kand', file: 'grantha-ramcharitmanas-sundar-kand.html' },
    { url: '/grantha/valmiki-ramayana/bal-kand-sarga-1', file: 'grantha-valmiki-ramayana-bal-kand-sarga-1.html' },
    { url: '/grantha/valmiki-ramayana/sundar-kand-sarga-1', file: 'grantha-valmiki-ramayana-sundar-kand-sarga-1.html' },
    { url: '/grantha/durga-saptashati/adhyay-1', file: 'grantha-durga-saptashati-adhyay-1.html' },
    { url: '/pad/radheju-merau-janam-sudharau', file: 'pad-radheju-merau-janam-sudharau.html' },
    { url: '/pad/shri-radha-kripa-kataksha-stotram', file: 'pad-shri-radha-kripa-kataksha-stotram.html' },
    { url: '/pad/bainu-maai-baajai-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64', file: 'pad-bainu-mai-baje-bansivat.html' },
    { url: '/pad/main-to-govardhan-ko-jaun-meri-veer-shri-chandrasakhi-ji', file: 'pad-main-to-govardhan-ko-jaun-meri-veer-shri-chandrasakhi-ji.html' },
    { url: '/pad/radhika-ravan-ki-murlika-shravan-suni-shri-chaturbhujdas-ji', file: 'pad-radhika-ravan-ki-murlika-shravan-suni-shri-chaturbhujdas-ji.html' }
  );

  // 5. Pre-render All Sacred Rituals (Aartis, Chalisas, Stotras)
  const ritualsIndexPath = path.resolve(projectRoot, 'public/data/rituals/index.json');
  if (fs.existsSync(ritualsIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(ritualsIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        routes.push({ url: `/ritual/${item.slug}`, file: `ritual/${item.slug}.html` });
      }
    } catch {}
  }

  // 6. Pre-render All Sacred Places & Dhams
  const placesIndexPath = path.resolve(projectRoot, 'public/data/places/index.json');
  if (fs.existsSync(placesIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(placesIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        routes.push({ url: `/place/${item.slug}`, file: `place/${item.slug}.html` });
      }
    } catch {}
  }

  // 7. Pre-render All Sacred Stories & Leelas
  const storiesIndexPath = path.resolve(projectRoot, 'public/data/stories/index.json');
  if (fs.existsSync(storiesIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(storiesIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        routes.push({ url: `/story/${item.slug}`, file: `story/${item.slug}.html` });
      }
    } catch {}
  }

  // 8. Pre-render All Saint Biographies
  const biosIndexPath = path.resolve(projectRoot, 'public/data/biographies/index.json');
  if (fs.existsSync(biosIndexPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(biosIndexPath, 'utf-8'));
      for (const item of data.items || []) {
        routes.push({ url: `/bio/${item.slug}`, file: `bio/${item.slug}.html` });
      }
    } catch {}
  }

  // 9. Pre-render All 34 High-Authority Topical Pillar Guides
  const guidesMetaPath = path.resolve(projectRoot, 'src/data/topicalGuidesMeta.json');
  if (fs.existsSync(guidesMetaPath)) {
    try {
      const guidesMeta = JSON.parse(fs.readFileSync(guidesMetaPath, 'utf-8'));
      for (const slug of Object.keys(guidesMeta)) {
        if (slug === 'glossary') continue;
        routes.push({ url: `/${slug}`, file: `${slug}.html` });
      }
    } catch {}
  }

  // 10. Pre-render All Braj Glossary Term Pages
  const glossaryPath = path.resolve(projectRoot, 'src/data/brajGlossary.json');
  if (fs.existsSync(glossaryPath)) {
    try {
      const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
      for (const term of glossary) {
        if (term.id) {
          routes.push({
            url: `/glossary/${encodeURIComponent(term.id)}`,
            file: `glossary/${term.id}.html`,
          });
        }
      }
    } catch {}
  }

  console.log('🌸 Pre-rendering Vrindopnisad routes for SEO & SSR...');

  for (const route of routes) {
    try {
      const { html, seo } = render(route.url);
      const appHtml = injectSSRContent(template, html, seo?.htmlHead);
      const targetFile = path.resolve(distPath, route.file);
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, appHtml, 'utf-8');
      console.log(`  ✓ Pre-rendered: ${route.file} (${Math.round(html.length / 1024)} KB markup)`);
    } catch (err) {
      console.warn(`  ⚠ Warning pre-rendering route ${route.url}:`, err.message);
    }
  }

  console.log('✨ SSG Pre-render completed successfully!');
}

prerender();
