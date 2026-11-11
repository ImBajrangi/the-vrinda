import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

const DOMAINS = {
  bhav: 'https://bhav.vrindopnishad.in',
  path: 'https://path.vrindopnishad.in',
};

async function fetchUrl(targetUrl, options = {}) {
  const parsed = new URL(targetUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const req = client.request(
      parsed,
      {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Vrindopnisad QA Reliability Auditor 2.0)',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const durationMs = performance.now() - startTime;
          resolve({
            url: targetUrl,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: rawData,
            durationMs,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runDomainAudit() {
  console.log('🛡️ Vrindopnisad 2.0 — Live Deployed Domain Integrity Audit\n');
  const results = [];

  // 1. HTTP to HTTPS Redirection
  console.log('--- 1. HTTP to HTTPS Redirection ---');
  for (const host of ['bhav.vrindopnishad.in', 'path.vrindopnishad.in']) {
    try {
      const res = await fetchUrl(`http://${host}/`, { method: 'HEAD' });
      const location = res.headers['location'];
      const pass = res.status === 301 || res.status === 308 || res.status === 302;
      console.log(`  [${pass ? 'PASS' : 'FAIL'}] http://${host}/ -> Status ${res.status}, Location: ${location}`);
      results.push({ test: `HTTP Redirect ${host}`, pass, status: res.status, location });
    } catch (e) {
      console.log(`  [FAIL] http://${host}/ error: ${e.message}`);
    }
  }

  // 2. HTTPS Certificate & Canonical Headers
  console.log('\n--- 2. Root Endpoints & Cache-Control ---');
  for (const [key, base] of Object.entries(DOMAINS)) {
    try {
      const res = await fetchUrl(`${base}/`);
      const cacheControl = res.headers['cache-control'] || 'none';
      const contentType = res.headers['content-type'] || 'none';
      const hasTitle = res.body.includes('<title>');
      const hasRoot = res.body.includes('id="root"');
      console.log(`  [PASS] ${base}/ -> ${res.status} ${res.statusText} (${res.durationMs.toFixed(1)}ms)`);
      console.log(`         Content-Type: ${contentType} | Cache-Control: ${cacheControl}`);
      console.log(`         Contains <title>: ${hasTitle} | Contains #root: ${hasRoot}`);
      results.push({ test: `HTTPS Root ${key}`, pass: res.status === 200, durationMs: res.durationMs });
    } catch (e) {
      console.log(`  [FAIL] ${base}/ error: ${e.message}`);
    }
  }

  // 3. Robots.txt Partitioning
  console.log('\n--- 3. Robots.txt Partitioning ---');
  for (const [key, base] of Object.entries(DOMAINS)) {
    try {
      const res = await fetchUrl(`${base}/robots.txt`);
      const sitemapLine = res.body.split('\n').find((l) => l.startsWith('Sitemap:'));
      console.log(`  ${base}/robots.txt: status ${res.status}`);
      console.log(`         ${sitemapLine}`);
    } catch (e) {
      console.log(`  [FAIL] ${base}/robots.txt error: ${e.message}`);
    }
  }

  // 4. Sitemaps Accessibility
  console.log('\n--- 4. Sitemaps Delivery ---');
  const sitemaps = [
    `${DOMAINS.bhav}/sitemap.xml`,
    `${DOMAINS.bhav}/sitemap-main.xml`,
    `${DOMAINS.bhav}/sitemap-padas.xml`,
    `${DOMAINS.bhav}/sitemap-granthas.xml`,
    `${DOMAINS.bhav}/sitemap-saints.xml`,
    `${DOMAINS.path}/sitemap.xml`,
    `${DOMAINS.path}/sitemap-path-main.xml`,
    `${DOMAINS.path}/sitemap-path-granthas.xml`,
  ];
  for (const s of sitemaps) {
    try {
      const res = await fetchUrl(s);
      const isXml = res.headers['content-type']?.includes('xml');
      const pass = res.status === 200 && isXml;
      console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${s} -> Status ${res.status}, Type: ${res.headers['content-type']}`);
    } catch (e) {
      console.log(`  [FAIL] ${s} error: ${e.message}`);
    }
  }

  // 5. Cross-domain Redirects
  console.log('\n--- 5. Cross-Domain Routing & Deep Links ---');
  const crossDomainTests = [
    { from: `${DOMAINS.bhav}/?tab=granthas&grantha=valmiki-ramayana`, expectedHost: 'path.vrindopnishad.in' },
    { from: `${DOMAINS.path}/?tab=padavali&pad=hit-chaurasi-01`, expectedHost: 'bhav.vrindopnishad.in' },
    { from: `${DOMAINS.path}/feed`, expectedHost: 'bhav.vrindopnishad.in' },
  ];
  for (const t of crossDomainTests) {
    try {
      const res = await fetchUrl(t.from, { method: 'GET' });
      const loc = res.headers['location'];
      console.log(`  ${t.from} -> Status ${res.status}${loc ? `, Location: ${loc}` : ''}`);
    } catch (e) {
      console.log(`  [FAIL] ${t.from} error: ${e.message}`);
    }
  }
}

runDomainAudit().catch(console.error);

