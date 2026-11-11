/**
/**
 * Vrindopnisad 2.0 - IndexNow Instant Submission Script
 * Submits high-priority canonical URLs to IndexNow (Bing, Yandex, Seznam, Naver, Copilot, Perplexity)
 * for immediate indexing without crawl budget delays.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const INDEXNOW_KEY = 'e3d4891bca7f4a0889c2510b14798e94';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function submitIndexNowBatch(host, urlList) {
  if (!urlList.length) return;
  console.log(`📡 Submitting ${urlList.length} URLs to IndexNow for host: ${host}...`);

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`  ✓ Successfully submitted ${urlList.length} URLs to IndexNow (Status: ${res.status} OK/Accepted)`);
    } else {
      console.warn(`  ⚠ IndexNow responded with HTTP ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn(`  ⚠ IndexNow submission failed (offline or network error): ${err.message}`);
  }
}

export async function runIndexNowSubmission() {
  console.log('⚡ Initializing IndexNow Protocol Batch...');

  // 1. Gather URLs from sitemap-main.xml, sitemap-granthas.xml, and sitemap-saints.xml for bhav
  const extractUrls = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    const xml = fs.readFileSync(filePath, 'utf-8');
    const urls = [];
    const regex = /<loc>(https:\/\/[^<]+)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      urls.push(match[1].replace(/&amp;/g, '&'));
    }
    return urls;
  };

  const bhavUrls = [
    ...extractUrls(path.resolve(projectRoot, 'public/sitemap-main.xml')),
    ...extractUrls(path.resolve(projectRoot, 'public/sitemap-granthas.xml')),
    ...extractUrls(path.resolve(projectRoot, 'public/sitemap-saints.xml')),
  ];

  // Pick top 200 high-priority padas from sitemap-padas-1.xml
  const pada1Urls = extractUrls(path.resolve(projectRoot, 'public/sitemap-padas-1.xml')).slice(0, 500);
  bhavUrls.push(...pada1Urls);

  // 2. Gather URLs for path domain
  const pathUrls = [
    ...extractUrls(path.resolve(projectRoot, 'public/sitemap-path-main.xml')),
    ...extractUrls(path.resolve(projectRoot, 'public/sitemap-path-granthas.xml')),
  ];

  await submitIndexNowBatch('bhav.vrindopnishad.in', Array.from(new Set(bhavUrls)));
  await submitIndexNowBatch('path.vrindopnishad.in', Array.from(new Set(pathUrls)));

  console.log('✨ IndexNow submission routine complete!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runIndexNowSubmission();
}
