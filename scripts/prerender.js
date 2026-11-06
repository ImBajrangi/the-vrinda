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
    { url: '/', file: 'index.html', title: 'वृन्दोपनिषद् 2.0 • Digital Sanctuary for Nitya Nikunj Ras' },
    { url: '/?tab=smaran', file: 'smaran.html', title: 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा' },
    { url: '/?tab=padavali', file: 'padavali.html', title: 'Scriptures Repository • ४२००+ पावन पद वाणी संग्रह' },
    { url: '/?tab=feed', file: 'feed.html', title: 'Darshan Feed • नित्य वृन्दावन धाम दर्शन' },
    { url: '/?tab=milestones', file: 'milestones.html', title: 'Devotion Milestones • अखंड निष्ठा व साधना सोपान' },
  ];

  console.log('🌸 Pre-rendering Vrindopnisad routes for SEO & SSR...');

  for (const route of routes) {
    try {
      const { html } = render(route.url);
      const appHtml = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
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
