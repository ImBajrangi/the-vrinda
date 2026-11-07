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
  const serverEntryPath = path.resolve(distPath, 'server', 'entry-server.js');

  if (!fs.existsSync(templatePath)) {
    console.error('Error: dist/index.html not found. Please run client build first.');
    process.exit(1);
  }

  if (!fs.existsSync(serverEntryPath)) {
    console.error('Error: dist/server/entry-server.js not found. Please run SSR build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const { render } = await import(`file://${serverEntryPath}`);

  // Routes to pre-render for static HTML delivery
  const routes = [
    { url: '/', file: 'index.html' },
    { url: '/?tab=smaran', file: 'smaran.html' },
    { url: '/?tab=padavali', file: 'padavali.html' },
    { url: '/?tab=feed', file: 'feed.html' },
    { url: '/?tab=milestones', file: 'milestones.html' },
    // Popular canonical pada deep links for zero-js search bots with headline slugs
    { url: '/?tab=padavali&pad=radheju-merau-janam-sudharau', file: 'pad-radheju-merau-janam-sudharau.html' },
    { url: '/?tab=padavali&pad=shri-radha-kripa-kataksha-stotram', file: 'pad-shri-radha-kripa-kataksha-stotram.html' },
    { url: '/?tab=padavali&pad=bainu-mai-baje-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64', file: 'pad-bainu-mai-baje-bansivat.html' },
  ];

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
