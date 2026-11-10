/**
 * Vrindopnisad 2.0 - Comprehensive Daily SEO Regression & Observability Suite
 * 
 * Verifies live production health across both canonical domains:
 * 1. Robots.txt directives and domain sitemap definitions.
 * 2. Complete Sitemap Suite Accessibility:
 *    - /sitemap.xml (index)
 *    - /sitemap-main.xml (core sanctuary views)
 *    - /sitemap-granthas.xml (24 Ras collections)
 *    - /sitemap-saints.xml (131 Canonical Saints)
 *    - /sitemap-padas.xml.gz (43,597 Padas gzip stream)
 *    - Secondary domain epics & chapters sitemaps on path.vrindopnishad.in
 * 3. 301 Permanent Redirect Matrix:
 *    - /granthas -> path.vrindopnishad.in
 *    - /padavali -> bhav.vrindopnishad.in
 *    - Trailing slash normalization (/path/ -> /path)
 * 4. Canonical Tag Correctness & Domain Ownership Enforcement.
 * 5. Representative Content Integrity:
 *    - Saint profile Devanagari H1 & ProfilePage schema
 *    - Epic chapter Devanagari opening verse & Chapter schema
 *    - Canonical Pada title, author & CreativeWork schema
 * 
 * Writes timestamped JSON report to .seo-reports/daily-seo-health.json for CI artifact upload.
 * Exits with code 1 upon any critical regression.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function runComprehensiveSeoMonitor() {
  console.log('🌸 Vrindopnisad 2.0 — Comprehensive Daily SEO Regression Monitor\n');
  const timestamp = new Date().toISOString();

  const auditReport = {
    timestamp,
    overallStatus: 'HEALTHY',
    summary: { total: 0, passed: 0, failed: 0 },
    checks: [],
  };

  function recordCheck(name, passed, details = {}) {
    auditReport.summary.total++;
    if (passed) {
      auditReport.summary.passed++;
      console.log(`  ✓ ${name}`);
    } else {
      auditReport.summary.failed++;
      auditReport.overallStatus = 'DEGRADED';
      console.error(`  ✗ ${name}: ${JSON.stringify(details)}`);
    }
    auditReport.checks.push({ name, passed, ...details });
  }

  // 1. Robots.txt Directives
  console.log('📌 1. Robots.txt Directives');
  try {
    const resBhav = await fetch('https://bhav.vrindopnishad.in/robots.txt');
    const txtBhav = await resBhav.text();
    recordCheck('bhav robots.txt status 200', resBhav.status === 200);
    recordCheck('bhav robots.txt specifies sitemap', txtBhav.includes('https://bhav.vrindopnishad.in/sitemap.xml'));

    const resPath = await fetch('https://path.vrindopnishad.in/robots.txt');
    const txtPath = await resPath.text();
    recordCheck('path robots.txt status 200', resPath.status === 200);
    recordCheck('path robots.txt specifies sitemap', txtPath.includes('https://path.vrindopnishad.in/sitemap.xml'));
  } catch (e) {
    recordCheck('Robots.txt network fetch', false, { error: e.message });
  }

  // 2. Complete Sitemap Suite Accessibility
  console.log('\n📌 2. Sitemaps Suite Accessibility');
  const sitemaps = [
    { url: 'https://bhav.vrindopnishad.in/sitemap.xml', expectXml: true },
    { url: 'https://bhav.vrindopnishad.in/sitemap-main.xml', expectXml: true },
    { url: 'https://bhav.vrindopnishad.in/sitemap-granthas.xml', expectXml: true },
    { url: 'https://bhav.vrindopnishad.in/sitemap-saints.xml', expectXml: true },
    { url: 'https://bhav.vrindopnishad.in/sitemap-padas.xml', expectXml: true },
    { url: 'https://bhav.vrindopnishad.in/sitemap-padas.xml.gz', expectXml: true },
    { url: 'https://path.vrindopnishad.in/sitemap.xml', expectXml: true },
    { url: 'https://path.vrindopnishad.in/sitemap-path-main.xml', expectXml: true },
    { url: 'https://path.vrindopnishad.in/sitemap-path-granthas.xml', expectXml: true },
  ];

  for (const s of sitemaps) {
    try {
      const res = await fetch(s.url);
      const isOk = res.status === 200;
      if (s.isGzip) {
        const buf = await res.arrayBuffer();
        recordCheck(`Sitemap ${path.basename(s.url)} accessible (HTTP 200, ${Math.round(buf.byteLength / 1024)} KB)`, isOk && buf.byteLength > 50000, {
          byteLength: buf.byteLength,
        });
      } else {
        const txt = await res.text();
        const hasXmlTag = txt.includes('<?xml') && (txt.includes('<sitemapindex') || txt.includes('<urlset'));
        recordCheck(`Sitemap ${path.basename(s.url)} valid XML (HTTP 200)`, isOk && hasXmlTag);
      }
    } catch (e) {
      recordCheck(`Sitemap ${path.basename(s.url)} fetch`, false, { error: e.message });
    }
  }

  // 3. 301 Permanent Redirect Matrix
  console.log('\n📌 3. Cross-Domain 301 Permanent Redirects & Trailing Slash');
  const redirects = [
    {
      name: 'bhav /granthas -> path',
      url: 'https://bhav.vrindopnishad.in/granthas',
      expectedTarget: 'https://path.vrindopnishad.in/?tab=granthas',
    },
    {
      name: 'path /padavali -> bhav',
      url: 'https://path.vrindopnishad.in/padavali',
      expectedTarget: 'https://bhav.vrindopnishad.in/padavali',
    },
    {
      name: 'Trailing slash normalization /granthas/ -> /granthas',
      url: 'https://bhav.vrindopnishad.in/granthas/',
      expectedTarget: 'https://bhav.vrindopnishad.in/granthas',
    },
  ];

  for (const r of redirects) {
    try {
      const res = await fetch(r.url, { redirect: 'manual' });
      const location = res.headers.get('location');
      recordCheck(`${r.name} (HTTP 301)`, res.status === 301 && location === r.expectedTarget, {
        actualStatus: res.status,
        actualLocation: location,
      });
    } catch (e) {
      recordCheck(r.name, false, { error: e.message });
    }
  }

  // 4. Representative Content Integrity & Initial HTML Edge Rendering
  console.log('\n📌 4. Representative Live Content & Canonical Verification');
  const contentEndpoints = [
    {
      name: 'Saint Profile: किशोरी अलि',
      url: 'https://bhav.vrindopnishad.in/?tab=padavali&author=kishori-ali',
      assertText: 'किशोरी अलि',
      expectedCanonical: 'https://bhav.vrindopnishad.in/?tab=padavali&author=kishori-ali',
      assertSchema: 'ProfilePage',
    },
    {
      name: 'Epic Chapter: श्रीमद् भागवत प्रथम स्कन्ध',
      url: 'https://path.vrindopnishad.in/?tab=granthas&grantha=shrimad-bhagavatam&chapter=skandh-1-adhyay-1',
      assertText: 'प्रथम स्कन्ध',
      expectedCanonical: 'https://path.vrindopnishad.in/?tab=granthas&grantha=shrimad-bhagavatam&chapter=skandh-1-adhyay-1',
      assertSchema: 'Chapter',
    },
    {
      name: 'Canonical Pada: राधेजू मेरौ जनम सुधारौ',
      url: 'https://bhav.vrindopnishad.in/?tab=padavali&pad=radheju-merau-janam-sudharau',
      assertText: 'राधेजू मेरौ जनम सुधारौ',
      expectedCanonical: 'https://bhav.vrindopnishad.in/?tab=padavali&pad=radheju-merau-janam-sudharau',
      assertSchema: 'CreativeWork',
    },
  ];

  for (const ep of contentEndpoints) {
    try {
      const res = await fetch(ep.url);
      const html = await res.text();
      const hasStatus = res.status === 200;
      const hasText = html.includes(ep.assertText);
      const hasCanonical = html.includes(`href="${ep.expectedCanonical}"`);
      const hasSchema = html.includes(ep.assertSchema);

      recordCheck(`${ep.name} returns HTTP 200 with Devanagari text`, hasStatus && hasText, { hasStatus, hasText });
      recordCheck(`${ep.name} has authoritative canonical tag`, hasCanonical);
      recordCheck(`${ep.name} contains Schema.org ${ep.assertSchema}`, hasSchema);
    } catch (e) {
      recordCheck(ep.name, false, { error: e.message });
    }
  }

  // Write CI Artifact Report
  const reportsDir = path.resolve(projectRoot, '.seo-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.resolve(reportsDir, 'daily-seo-health.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\n📊 SEO Health Report saved to ${reportPath}`);
  console.log(`   Summary: ${auditReport.summary.passed}/${auditReport.summary.total} checks passed (${auditReport.overallStatus})\n`);

  if (auditReport.overallStatus !== 'HEALTHY') {
    console.error('❌ SEO Regression Detected! Daily monitor failed.');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runComprehensiveSeoMonitor().catch((err) => {
    console.error('Fatal SEO Monitor Error:', err);
    process.exit(1);
  });
}
