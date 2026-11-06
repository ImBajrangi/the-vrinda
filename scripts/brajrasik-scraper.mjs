#!/usr/bin/env node
/**
 * Vrindopnisad 2.0 - High Performance Braj Rasik Scraper & Aggregator
 *
 * Scrapes canonical Rasik articles, padavalis, and saints from brajrasik.org
 * using lightweight Next.js __NEXT_DATA__ hydration parsing with:
 *   - Turbo batching (high-throughput parallel workers with polite jitter)
 *   - Resumable checkpointing (never re-scrapes existing items)
 *   - Auto-formatting to Vrindopnisad canonical schema
 *   - Auto-merging into canonicalPadas.json & searchCatalog.json
 *
 * Usage:
 *   node scripts/brajrasik-scraper.mjs --batch 100 --merge
 *   node scripts/brajrasik-scraper.mjs --batches 5 --batch 100 --merge
 *   node scripts/brajrasik-scraper.mjs --all --concurrency 8 --delay 120 --merge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT_DIR, 'src', 'data', 'scraped-brajrasik');
const CHECKPOINT_FILE = path.join(OUT_DIR, 'scraper-checkpoint.json');
const ARTICLES_FILE = path.join(OUT_DIR, 'brajrasik-articles.json');
const SITEMAP_CACHE = path.join(OUT_DIR, 'sitemap-urls.json');

// Command line argument parser
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}
const hasArg = (flag) => args.includes(flag);

const BATCH_SIZE = hasArg('--all') ? Infinity : parseInt(getArg('--batch', '100'), 10);
const NUM_BATCHES = parseInt(getArg('--batches', '1'), 10);
const CONCURRENCY = parseInt(getArg('--concurrency', '8'), 10);
const DELAY_MS = parseInt(getArg('--delay', '120'), 10);
const SHOULD_MERGE = hasArg('--merge');

// Setup output directory
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Checkpoint state
let checkpoint = {
  visitedUrls: {},
  totalScraped: 0,
  lastUpdated: new Date().toISOString(),
};

if (fs.existsSync(CHECKPOINT_FILE)) {
  try {
    checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    checkpoint.visitedUrls = checkpoint.visitedUrls || {};
  } catch (err) {
    console.warn('Warning: Could not read checkpoint, starting fresh.');
  }
}

// Existing articles
let articles = [];
if (fs.existsSync(ARTICLES_FILE)) {
  try {
    articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
  } catch (err) {
    articles = [];
  }
}

// 2. Fetch or load sitemap URLs
async function getSitemapUrls() {
  if (fs.existsSync(SITEMAP_CACHE)) {
    return JSON.parse(fs.readFileSync(SITEMAP_CACHE, 'utf8'));
  }

  console.log('Fetching sitemap from https://www.brajrasik.org/sitemaps/content.xml ...');
  const res = await fetch('https://www.brajrasik.org/sitemaps/content.xml');
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.statusText}`);
  const xml = await res.text();

  const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  const rawUrls = urlMatches.map((m) => m.replace(/<\/?loc>/g, '').trim());

  // Filter out duplicate /hi/ mirror links because the English URL contains both translations in __NEXT_DATA__
  const uniqueUrls = rawUrls.filter((url) => !url.includes('/hi/articles/'));
  console.log(`Discovered ${rawUrls.length} sitemap URLs. Filtered to ${uniqueUrls.length} canonical articles.`);

  fs.writeFileSync(SITEMAP_CACHE, JSON.stringify(uniqueUrls, null, 2), 'utf8');
  return uniqueUrls;
}

// Helper: Sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 3. Scrape a single article URL with retry logic
async function scrapeArticle(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (res.status === 429) {
        console.warn(`[RateLimit 429] Pausing for 1.8s on ${url.split('/').pop()}...`);
        await sleep(1800);
        continue;
      }

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }

      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (!match) {
        return { ok: false, error: 'No __NEXT_DATA__ payload' };
      }

      const nextData = JSON.parse(match[1]);
      const article = nextData?.props?.pageProps?.article;
      if (!article || !article.translation) {
        return { ok: false, error: 'Empty article payload' };
      }

      // Identify Hindi and English translations
      const enTrans = article.translation.find((t) => !/[\u0900-\u097F]/.test(t.title || '')) || article.translation[0] || {};
      const hiTrans = article.translation.find((t) => /[\u0900-\u097F]/.test(t.title || '')) || article.translation[1] || {};

      // Verse extraction from <strong>
      const strongMatchHi = hiTrans.detail?.match(/<strong>(.*?)<\/strong>/s);
      const verseLinesHi = strongMatchHi
        ? strongMatchHi[1]
            .split(/<br\s*\/?>/)
            .map((s) => s.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean)
        : [];

      const strongMatchEn = enTrans.detail?.match(/<strong>(.*?)<\/strong>/s);
      const verseLinesEn = strongMatchEn
        ? strongMatchEn[1]
            .split(/<br\s*\/?>/)
            .map((s) => s.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean)
        : [];

      // Attribution extraction from <em>
      const emMatchHi = hiTrans.detail?.match(/<em>(.*?)<\/em>/s);
      const attributionHi = emMatchHi ? emMatchHi[1].replace(/^[-\s]+/, '').replace(/<[^>]+>/g, '').trim() : '';

      const emMatchEn = enTrans.detail?.match(/<em>(.*?)<\/em>/s);
      const attributionEn = emMatchEn ? emMatchEn[1].replace(/^[-\s]+/, '').replace(/<[^>]+>/g, '').trim() : '';

      const slug = url.split('/').pop();

      return {
        ok: true,
        data: {
          id: article._id || slug,
          slug,
          url,
          titleDevanagari: hiTrans.title || '',
          titleEnglish: enTrans.title || '',
          verseLinesDevanagari: verseLinesHi,
          verseLinesEnglish: verseLinesEn,
          attributionDevanagari: attributionHi,
          attributionEnglish: attributionEn,
          raag: article.raag || [],
          tags: article.tags || [],
          photos: (article.photos || []).map((p) => (typeof p === 'string' ? p : p.url)),
          audios: (article.album_audios || []).map((a) => (typeof a === 'string' ? a : a.url)),
          scrapedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      if (attempt === retries) {
        return { ok: false, error: err.message };
      }
      await sleep(500 * (attempt + 1));
    }
  }
  return { ok: false, error: 'Max retries exceeded' };
}

// 4. Batch Queue Runner
async function runSingleBatch(batchNum, totalBatches, urls) {
  const pendingUrls = urls.filter((u) => !checkpoint.visitedUrls[u]);

  if (pendingUrls.length === 0) {
    console.log('🎉 All URLs have already been scraped!');
    return false;
  }

  const toScrape = pendingUrls.slice(0, BATCH_SIZE);
  console.log(`\n======================================================`);
  console.log(`📦 RUNNING BATCH ${batchNum}/${totalBatches}: ${toScrape.length} items`);
  console.log(`⚡ Speed: ${CONCURRENCY} workers, ${DELAY_MS}ms delay`);
  console.log(`======================================================`);

  const startTime = Date.now();
  let currentIndex = 0;
  let successCount = 0;
  let failureCount = 0;

  async function worker(workerId) {
    while (currentIndex < toScrape.length) {
      const idx = currentIndex++;
      const targetUrl = toScrape[idx];
      if (!targetUrl) break;

      const slug = targetUrl.split('/').pop();
      const result = await scrapeArticle(targetUrl);
      checkpoint.visitedUrls[targetUrl] = true;

      if (result.ok && result.data) {
        articles.push(result.data);
        successCount++;
        checkpoint.totalScraped = articles.length;
      } else {
        failureCount++;
      }

      const totalDone = successCount + failureCount;
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = elapsedSec > 0 ? (totalDone / elapsedSec).toFixed(1) : '0';

      if (totalDone % 15 === 0 || totalDone === toScrape.length) {
        const pct = Math.round((totalDone / toScrape.length) * 100);
        console.log(`[Batch ${batchNum}] Progress: ${totalDone}/${toScrape.length} (${pct}%) | Rate: ${rate} items/sec | Total Saved: ${articles.length}`);
      }

      await sleep(DELAY_MS);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, toScrape.length) }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Save checkpoint & articles
  checkpoint.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf8');
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Batch ${batchNum} completed in ${elapsed}s! (Success: ${successCount}, Failures: ${failureCount})`);

  if (SHOULD_MERGE) {
    mergeScrapedData();
  }

  return true;
}

// 5. Merge into canonical app data
function mergeScrapedData() {
  const canonicalPadasFile = path.join(ROOT_DIR, 'src', 'data', 'canonicalPadas.json');
  const searchCatalogFile = path.join(ROOT_DIR, 'src', 'data', 'searchCatalog.json');

  let padas = [];
  try {
    padas = JSON.parse(fs.readFileSync(canonicalPadasFile, 'utf8'));
  } catch (e) {}

  const existingIds = new Set(padas.map((p) => p.id));
  let addedPadas = 0;

  for (const item of articles) {
    if (!existingIds.has(item.id) && item.verseLinesDevanagari && item.verseLinesDevanagari.length > 0) {
      padas.push({
        id: item.id,
        granthaId: 'rasik-vani',
        number: padas.length + 1,
        titleDevanagari: item.titleDevanagari.split('-')[0].trim() || item.slug,
        composer: item.attributionDevanagari.split(',')[0].trim() || 'श्री रसिक वाणी',
        stanzas: [
          {
            index: 1,
            linesDevanagari: item.verseLinesDevanagari,
            linesEnglish: item.verseLinesEnglish,
          },
        ],
        tags: item.tags,
      });
      existingIds.add(item.id);
      addedPadas++;
    }
  }

  fs.writeFileSync(canonicalPadasFile, JSON.stringify(padas, null, 2), 'utf8');

  // Update searchCatalog
  let catalog = [];
  try {
    catalog = JSON.parse(fs.readFileSync(searchCatalogFile, 'utf8'));
  } catch (e) {}

  const existingCatalogIds = new Set(catalog.map((c) => c.id));
  let addedCatalog = 0;

  for (const item of articles) {
    if (!existingCatalogIds.has(item.id)) {
      catalog.push({
        id: item.id,
        type: 'pada',
        title: item.titleDevanagari,
        titleEnglish: item.titleEnglish,
        subtitle: item.attributionDevanagari,
        keywords: [item.titleDevanagari, item.titleEnglish, item.attributionDevanagari, ...item.tags].filter(Boolean),
      });
      existingCatalogIds.add(item.id);
      addedCatalog++;
    }
  }

  fs.writeFileSync(searchCatalogFile, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`🔗 App Data Merged: +${addedPadas} padas (Total: ${padas.length}) | +${addedCatalog} search catalog entries (Total: ${catalog.length})`);
}

// Main Controller
async function main() {
  console.log('🚀 Starting Turbo BrajRasik Scraper');
  console.log(`Planned: ${NUM_BATCHES} batch(es) of size ${BATCH_SIZE}`);

  const urls = await getSitemapUrls();

  for (let b = 1; b <= NUM_BATCHES; b++) {
    const hasMore = await runSingleBatch(b, NUM_BATCHES, urls);
    if (!hasMore) break;
    if (b < NUM_BATCHES) {
      console.log('Pausing 1s before next batch...');
      await sleep(1000);
    }
  }

  console.log(`\n🎉 All planned batches complete! Total articles in store: ${articles.length}`);
}

main().catch((err) => {
  console.error('Scraper fatal error:', err);
  process.exit(1);
});
