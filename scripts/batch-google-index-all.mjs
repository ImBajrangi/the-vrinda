/**
 * Vrindopnisad 2.0 - Universal Full-Catalog Google Indexing Queue Engine
 * 
 * Capability:
 * Compiles the complete universe of all 12,850+ URLs (29 Granthas, 781 Epic Chapters,
 * 131 Canonical Saints, 11,909 Rasik Padas, and Core Pillar views) and submits them in
 * stateful batches to Google's official Indexing API respecting the daily project quota.
 *
 * State Tracking:
 * - Persists submitted URLs to `.google-indexing-state.json` (auto-gitignored)
 * - Skips already-submitted URLs to maximize fresh crawl coverage
 * - Gracefully pauses upon reaching Google's daily quota limit (HTTP 429)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const STATE_FILE = path.resolve(projectRoot, '.google-indexing-state.json');
const KEY_FILE = path.resolve(projectRoot, 'google-service-account.json');

/**
 * Helper to generate a Google OAuth2 JWT token from service account JSON
 */
function createSignedJwt(serviceAccount) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat,
  };

  const base64UrlEncode = (str) =>
    Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claimSet));
  const signInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer
    .sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signInput}.${signature}`;
}

async function getGoogleAccessToken(serviceAccount) {
  const jwt = createSignedJwt(serviceAccount);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth2 Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function publishUrl(accessToken, url, type = 'URL_UPDATED') {
  const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ url, type }),
  });

  return res;
}

/**
 * Gather the master catalog of all 12,850+ URLs
 */
function compileMasterCatalog() {
  const urls = [];
  const bhavBase = 'https://bhav.vrindopnishad.in';
  const pathBase = 'https://path.vrindopnishad.in';

  // 1. Core Sanctuary & Parayana Pillar Views
  const pillars = [
    `${bhavBase}/`,
    `${bhavBase}/rasik-saints-of-vrindavan`,
    `${bhavBase}/vrindavan-ashtayama-seva-darshan-timings`,
    `${bhavBase}/rasik-vani-granthas-list`,
    `${bhavBase}/online-tulsi-mala-naam-jap`,
    `${bhavBase}/padavali`,
    `${bhavBase}/granthas`,
    `${bhavBase}/feed`,
    `${bhavBase}/milestones`,
    `${bhavBase}/smaran`,
    `${bhavBase}/rituals`,
    `${bhavBase}/places`,
    `${bhavBase}/stories`,
    `${bhavBase}/biographies`,
    `${pathBase}/`,
  ];
  for (const u of pillars) urls.push(u);

  // 1.5 Ingest all Sacred Sections (Rituals, Places, Stories, Biographies)
  const sacredSections = [
    { file: 'public/data/rituals/index.json', prefix: 'ritual' },
    { file: 'public/data/places/index.json', prefix: 'place' },
    { file: 'public/data/stories/index.json', prefix: 'story' },
    { file: 'public/data/biographies/index.json', prefix: 'bio' },
  ];
  for (const sec of sacredSections) {
    const secPath = path.resolve(projectRoot, sec.file);
    if (fs.existsSync(secPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(secPath, 'utf-8'));
        for (const item of data.items || []) {
          urls.push(`${bhavBase}/${sec.prefix}/${item.slug}`);
        }
      } catch (e) {}
    }
  }

  // 2. All 29 Scripture Collections & 5 Epics
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  if (fs.existsSync(granthasPath)) {
    try {
      const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
      const epics = new Set(['valmiki-ramayana', 'shrimad-bhagavatam', 'ramcharitmanas', 'bhagavad-gita', 'durga-saptashati']);
      for (const g of granthas) {
        if (epics.has(g.id)) {
          urls.push(`${pathBase}/grantha/${encodeURIComponent(g.id)}`);
        } else {
          urls.push(`${bhavBase}/grantha/${encodeURIComponent(g.id)}`);
        }
      }
    } catch (e) {}
  }

  // 3. All 781 Epic Chapters
  const chaptersPath = path.resolve(projectRoot, 'src/data/chapterSnippets.json');
  if (fs.existsSync(chaptersPath)) {
    try {
      const chapters = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
      for (const ch of Object.values(chapters)) {
        urls.push(`${pathBase}/grantha/${ch.granthaId}/${encodeURIComponent(ch.chapterId)}`);
      }
    } catch (e) {}
  }

  // 4. All 131 Canonical Saints
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');
  if (fs.existsSync(saintsPath)) {
    try {
      const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));
      for (const s of saints) {
        urls.push(`${bhavBase}/sant/${encodeURIComponent(s.slug || s.id)}`);
      }
    } catch (e) {}
  }

  // 5. All 11,909 Rasik Padas
  const catalogPath = path.resolve(projectRoot, 'src/data/searchCatalog.json');
  const padaSnippetsPath = path.resolve(projectRoot, 'src/data/padaSnippets.json');
  if (fs.existsSync(padaSnippetsPath)) {
    try {
      const snippets = JSON.parse(fs.readFileSync(padaSnippetsPath, 'utf-8'));
      for (const key of Object.keys(snippets)) {
        // Pada slugs
        urls.push(`${bhavBase}/pad/${encodeURIComponent(key)}`);
      }
    } catch (e) {}
  }

  // Deduplicate
  return Array.from(new Set(urls));
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return {
        submittedUrls: new Set(data.submittedUrls || []),
        history: data.history || [],
      };
    } catch (e) {}
  }
  return { submittedUrls: new Set(), history: [] };
}

function saveState(state) {
  const payload = {
    totalSubmitted: state.submittedUrls.size,
    lastUpdated: new Date().toISOString(),
    submittedUrls: Array.from(state.submittedUrls),
    history: state.history.slice(-30),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
}

async function runQueue(batchLimit = 100) {
  console.log('🚀 Vrindopnisad 2.0 - Full-Catalog Google Indexing Queue Engine');
  console.log('================================================================');

  if (!fs.existsSync(KEY_FILE)) {
    console.error('❌ Error: google-service-account.json not found in root.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
  console.log(`🔑 Authenticating Service Account: ${serviceAccount.client_email}`);
  const accessToken = await getGoogleAccessToken(serviceAccount);
  console.log('  ✓ OAuth2 Token received.');

  const allUrls = compileMasterCatalog();
  console.log(`\n📚 Total Master Catalog: ${allUrls.length.toLocaleString()} URLs across Bhav & Path domains.`);

  const state = loadState();
  console.log(`📊 State: ${state.submittedUrls.size.toLocaleString()} URLs previously submitted to Google.`);

  // Filter pending URLs
  const pendingUrls = allUrls.filter((u) => !state.submittedUrls.has(u));
  console.log(`⏳ Remaining Pending URLs: ${pendingUrls.length.toLocaleString()}`);

  if (pendingUrls.length === 0) {
    console.log('✨ All 12,850+ URLs have already been submitted to Google Indexing API! Catalog is 100% covered.');
    return;
  }

  // Take next batch
  const batch = pendingUrls.slice(0, batchLimit);
  console.log(`\n📡 Dispatching next batch of ${batch.length} URLs to Googlebot...`);

  let successCount = 0;
  let quotaHit = false;

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    try {
      const res = await publishUrl(accessToken, url);
      if (res.ok) {
        state.submittedUrls.add(url);
        successCount++;
        console.log(`  [${i + 1}/${batch.length}] ✓ 200 OK: ${url}`);
      } else if (res.status === 429) {
        const errText = await res.text();
        console.warn(`\n🛑 Google Project Daily Quota Limit Reached (HTTP 429).`);
        console.warn(`   Google limits free projects to 200 URLs/day.`);
        quotaHit = true;
        break;
      } else {
        const err = await res.text();
        console.warn(`  [${i + 1}/${batch.length}] ⚠ [${res.status}] ${url}: ${err.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`  ⚠ Error dispatching ${url}:`, err.message);
    }

    // Gentle pacing to avoid burst rate-limiting
    await new Promise((r) => setTimeout(r, 120));
  }

  state.history.push({
    timestamp: new Date().toISOString(),
    batchSize: batch.length,
    successCount,
    quotaHit,
  });

  saveState(state);

  console.log('\n================================================================');
  console.log(`✨ Batch Finished: ${successCount} new URLs successfully queued for Googlebot.`);
  console.log(`📈 Total Catalog Progress: ${state.submittedUrls.size.toLocaleString()} / ${allUrls.length.toLocaleString()} URLs (${((state.submittedUrls.size / allUrls.length) * 100).toFixed(1)}%)`);

  if (quotaHit) {
    console.log(`\n💡 Quota Notice: Today's Google quota of 200 requests has been maximized.`);
    console.log(`   Run this command again tomorrow (or request a quota increase in GCP Console) to submit the next batch!`);
  } else if (pendingUrls.length > batchLimit) {
    console.log(`\n💡 To submit another batch today if quota permits: npm run seo:google:queue`);
  }
}

// Allow passing batch limit via CLI: node scripts/batch-google-index-all.mjs 100
const argLimit = parseInt(process.argv[2], 10) || 100;
runQueue(argLimit);
