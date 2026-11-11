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
    }
  }

  // 3. Pre-render Top Canonical Saints Profiles
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');
  if (fs.existsSync(saintsPath)) {
    const saintsData = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));
    for (const s of saintsData.slice(0, 10)) {
      const slug = s.slug || s.id;
      const routeUrl = `/sant/${encodeURIComponent(slug)}`;
      const routeFile = `saint-${slug}.html`;
      if (!routes.some((r) => r.file === routeFile)) {
        routes.push({ url: routeUrl, file: routeFile });
      }
    }
  }

  // 4. Pre-render Authentic Epic Chapter & Celebrated Pad Samples
  routes.push(
    { url: '/grantha/bhagavad-gita/adhyay-1', file: 'grantha-bhagavad-gita-adhyay-1.html' },
    { url: '/grantha/bhagavad-gita/adhyay-2', file: 'grantha-bhagavad-gita-adhyay-2.html' },
    { url: '/grantha/ramcharitmanas/kand-%E0%A4%AC%E0%A4%BE%E0%A4%B2%E0%A4%95%E0%A4%BE%E0%A4%A3%E0%A4%A1', file: 'grantha-ramcharitmanas-kand-1.html' },
    { url: '/grantha/durga-saptashati/adhyay-1', file: 'grantha-durga-saptashati-adhyay-1.html' },
    { url: '/pad/radheju-merau-janam-sudharau', file: 'pad-radheju-merau-janam-sudharau.html' },
    { url: '/pad/shri-radha-kripa-kataksha-stotram', file: 'pad-shri-radha-kripa-kataksha-stotram.html' },
    { url: '/pad/bainu-maai-baajai-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64', file: 'pad-bainu-mai-baje-bansivat.html' },
    { url: '/pad/main-to-govardhan-ko-jaun-meri-veer-shri-chandrasakhi-ji', file: 'pad-main-to-govardhan-ko-jaun-meri-veer-shri-chandrasakhi-ji.html' },
    { url: '/pad/radhika-ravan-ki-murlika-shravan-suni-shri-chaturbhujdas-ji', file: 'pad-radhika-ravan-ki-murlika-shravan-suni-shri-chaturbhujdas-ji.html' }
  );

  console.log('🌸 Pre-rendering Vrindopnisad routes for SEO & SSR...');

  for (const route of routes) {
    try {
      const { html, seo } = render(route.url);
      const appHtml = injectSSRContent(template, html, seo?.htmlHead);
      const targetFile = path.resolve(distPath, route.file);
      fs.writeFileSync(targetFile, appHtml, 'utf-8');
      console.log(`  ✓ Pre-rendered: ${route.file} (${Math.round(html.length / 1024)} KB markup)`);
    } catch (err) {
      console.warn(`  ⚠ Warning pre-rendering route ${route.url}:`, err.message);
    }
  }

  console.log('✨ SSG Pre-render completed successfully!');
}

prerender();
