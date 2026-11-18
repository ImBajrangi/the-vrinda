/**
 * Vrindopnisad 2.0 - High-Speed Google Indexing & WebSub Notification Dispatcher
 *
 * Capabilities:
 * 1. Pings Google's PubSubHubbub / WebSub hub (https://pubsubhubbub.appspot.com/) to force
 *    immediate Googlebot retrieval of https://bhav.vrindopnishad.in/feed.xml
 * 2. Authenticates with Google Indexing API via Service Account JWT to submit up to 200 URLs/day
 *    directly into Google's instant crawl queue (typical Googlebot visit within 5-15 mins).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const HUB_URL = 'https://pubsubhubbub.appspot.com/';
const BHAV_FEED_URL = 'https://bhav.vrindopnishad.in/feed.xml';
const PATH_FEED_URL = 'https://path.vrindopnishad.in/feed.xml';

/**
 * 1. Ping Google's PubSubHubbub / WebSub Live Hub for both domains
 */
async function pingGoogleWebSub() {
  console.log('⚡ Pinging Google PubSubHubbub Hub with live feed URLs...');
  for (const [domain, feedUrl] of [['bhav.vrindopnishad.in', BHAV_FEED_URL], ['path.vrindopnishad.in', PATH_FEED_URL]]) {
    try {
      const params = new URLSearchParams();
      params.append('hub.mode', 'publish');
      params.append('hub.url', feedUrl);

      const res = await fetch(HUB_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Vrindopnishad-Bot/2.0 (SearchEngineNotification)',
        },
        body: params.toString(),
      });

      if (res.status === 204 || res.status === 200) {
        console.log(`  ✓ Google WebSub Hub notified for ${domain} (HTTP ${res.status}). Googlebot queued to fetch feed.`);
      } else {
        const text = await res.text();
        console.log(`  ℹ Hub response for ${domain} (${res.status}): ${text.slice(0, 150)}`);
      }
    } catch (err) {
      console.warn(`  ⚠ Failed to ping Google WebSub Hub for ${domain}:`, err.message);
    }
  }
}

/**
 * Helper to generate a Google OAuth2 JWT token from service account JSON
 */
function createSignedJwt(serviceAccount) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

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
  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signInput}.${signature}`;
}

/**
 * Obtain Google OAuth2 access token
 */
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

/**
 * Publish URL notification to Google Indexing API
 */
async function publishUrlNotification(accessToken, url, type = 'URL_UPDATED') {
  const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url,
      type,
    }),
  });

  return res;
}

/**
 * Main Dispatcher
 */
async function main() {
  console.log('🚀 Vrindopnisad 2.0 - High-Speed Google Indexing Dispatcher');
  console.log('===========================================================');

  // Step 1: Always ping Google WebSub Hub
  await pingGoogleWebSub();

  // Step 2: Check for Service Account Key for Direct Google Indexing API
  const possibleKeyPaths = [
    path.resolve(projectRoot, 'service_account.json'),
    path.resolve(projectRoot, 'google-service-account.json'),
    path.resolve(projectRoot, 'config/google-indexing-key.json'),
  ];

  let keyPath = possibleKeyPaths.find((p) => fs.existsSync(p));

  if (!keyPath) {
    console.log('\n💡 Google Indexing API Setup (Instant Crawling within 10 mins):');
    console.log('-----------------------------------------------------------');
    console.log('Google Indexing API pushes URLs directly to Googlebot with 200 URLs/day quota.');
    console.log('To activate:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/) -> Enable "Web Search Indexing API"');
    console.log('2. Create a Service Account -> Keys -> Create JSON Key');
    console.log('3. In Google Search Console -> Settings -> Users and permissions -> Add the Service Account email as Owner');
    console.log('4. Save the downloaded JSON key as "google-service-account.json" in this repository root.');
    console.log('5. Re-run: npm run seo:google\n');
    return;
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    console.log(`\n🔑 Authenticating with Google Cloud Service Account (${serviceAccount.client_email})...`);
    const accessToken = await getGoogleAccessToken(serviceAccount);
    console.log('  ✓ Google OAuth2 token received successfully!');

    // Assemble high-authority cornerstone URLs (up to 100 within Google's 200/day quota)
    const targetSet = new Set([
      'https://bhav.vrindopnishad.in/',
      'https://bhav.vrindopnishad.in/rasik-saints-of-vrindavan',
      'https://bhav.vrindopnishad.in/vrindavan-ashtayama-seva-darshan-timings',
      'https://bhav.vrindopnishad.in/rasik-vani-granthas-list',
      'https://bhav.vrindopnishad.in/online-tulsi-mala-naam-jap',
      'https://bhav.vrindopnishad.in/padavali',
      'https://bhav.vrindopnishad.in/granthas',
      'https://bhav.vrindopnishad.in/feed',
      'https://bhav.vrindopnishad.in/smaran',
      'https://path.vrindopnishad.in/',
      'https://path.vrindopnishad.in/grantha/bhagavad-gita',
      'https://path.vrindopnishad.in/grantha/ramcharitmanas',
      'https://path.vrindopnishad.in/grantha/valmiki-ramayana',
      'https://path.vrindopnishad.in/grantha/shrimad-bhagavatam',
      'https://path.vrindopnishad.in/grantha/durga-saptashati',
    ]);

    // Add all 24 Rasik Granthas
    const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
    if (fs.existsSync(granthasPath)) {
      try {
        const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
        for (const g of granthas) {
          if (!['valmiki-ramayana', 'shrimad-bhagavatam', 'ramcharitmanas', 'bhagavad-gita', 'durga-saptashati'].includes(g.id)) {
            targetSet.add(`https://bhav.vrindopnishad.in/grantha/${encodeURIComponent(g.id)}`);
          }
        }
      } catch (e) {}
    }

    // Add Gita chapters (1-18)
    for (let i = 1; i <= 18; i++) {
      targetSet.add(`https://path.vrindopnishad.in/grantha/bhagavad-gita/adhyay-${i}`);
    }

    // Add Ramcharitmanas 7 Kands
    const kands = ['bal-kand', 'ayodhya-kand', 'aranya-kand', 'kishkindha-kand', 'sundar-kand', 'lanka-kand', 'uttar-kand'];
    for (const k of kands) {
      targetSet.add(`https://path.vrindopnishad.in/grantha/ramcharitmanas/${k}`);
    }

    // Add Celebrated Padas from searchCatalog
    const catalogPath = path.resolve(projectRoot, 'src/data/searchCatalog.json');
    if (fs.existsSync(catalogPath)) {
      try {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        const entries = Object.values(catalog);
        let pCount = 0;
        for (const item of entries) {
          if (pCount >= 30) break;
          const slug = item.id || item.slug;
          if (slug && !slug.startsWith('valmiki-') && !slug.startsWith('shrimad-') && !slug.startsWith('ramcharitmanas')) {
            targetSet.add(`https://bhav.vrindopnishad.in/pad/${encodeURIComponent(slug)}`);
            pCount++;
          }
        }
      } catch (e) {}
    }

    const targetUrls = Array.from(targetSet);

    console.log(`\n📡 Pushing ${targetUrls.length} cornerstone URLs to Google Indexing API...`);
    let successCount = 0;

    for (const url of targetUrls) {
      try {
        const res = await publishUrlNotification(accessToken, url);
        if (res.ok) {
          console.log(`  ✓ [200 OK] Queued for Googlebot: ${url}`);
          successCount++;
        } else {
          const err = await res.text();
          console.warn(`  ⚠ [${res.status}] ${url}: ${err}`);
        }
      } catch (e) {
        console.warn(`  ⚠ Failed submitting ${url}:`, e.message);
      }
    }

    console.log(`\n✨ Successfully queued ${successCount}/${targetUrls.length} URLs directly into Googlebot's crawl queue!`);
  } catch (err) {
    console.error('❌ Failed to submit via Google Indexing API:', err.message);
  }
}

main();
