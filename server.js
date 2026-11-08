/**
 * Vrindopnisad 2.0 - High-Performance Dynamic SSR & SEO Server
 * Dynamically serves pre-rendered HTML, meta tags, and Schema.org JSON-LD
 * to search bots (Googlebot, Bing, Twitter, WhatsApp) and clients on demand.
 * 
 * Features:
 *  - 0 external dependencies (uses native Node.js http, fs, zlib)
 *  - Smart Bot Detection (crawlers & social scrapers)
 *  - Dynamic verse/pada metadata extraction & server rendering
 *  - In-memory LRU TTL Cache for sub-5ms responses
 *  - Gzip streaming compression
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const CLIENT_INDEX = path.resolve(DIST_DIR, 'index.html');
const SERVER_ENTRY = path.resolve(__dirname, 'dist-server', 'entry-server.js');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Known bot and social crawler user-agents
const BOT_REGEX = /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|twitterbot|facebookexternalhit|facebot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|pinterestbot|applebot|screaming frog|w3c_validator/i;

// In-memory cache for dynamic SSR HTML (Key: URL path+query, Value: { html, timestamp })
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const ssrCache = new Map();

// MIME Types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function injectSSRContent(template, html, seoHead, initialState) {
  let result = template;

  // 1. Replace <div id="root"></div> with server-rendered markup
  result = result.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  // 2. Inject dynamic SEO <head> tags
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

  // 3. Inject initial state script if initialPad exists for 0-latency hydration
  if (initialState) {
    const safeJson = JSON.stringify(initialState).replace(/</g, '\\u003c');
    const stateScript = `<script id="__VRIND_INITIAL_STATE__">window.__INITIAL_STATE__=${safeJson};</script>`;
    result = result.replace('</body>', `  ${stateScript}\n  </body>`);
  }

  return result;
}

function serveStaticFile(req, res, filePath, mime, isImmutable) {
  const stat = fs.statSync(filePath);
  const etag = `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
  const ifNoneMatch = req.headers['if-none-match'];

  const headers = {
    'Content-Type': mime,
    'ETag': etag,
    'Cache-Control': isImmutable
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600',
  };

  if (ifNoneMatch && ifNoneMatch === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const gzPath = filePath + '.gz';

  // If pre-compressed .gz file exists and client supports gzip, stream it directly (0 CPU cost)
  if (acceptEncoding.includes('gzip') && fs.existsSync(gzPath)) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    fs.createReadStream(gzPath).pipe(res);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  if (acceptEncoding.includes('gzip') && (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('json') || mime.includes('svg'))) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    fileStream.pipe(zlib.createGzip()).pipe(res);
  } else {
    res.writeHead(200, headers);
    fileStream.pipe(res);
  }
}

async function startServer() {
  if (!fs.existsSync(CLIENT_INDEX)) {
    console.error('❌ dist/index.html not found! Please run `npm run build` first.');
    process.exit(1);
  }

  if (!fs.existsSync(SERVER_ENTRY)) {
    console.error('❌ dist-server/entry-server.js not found! Please run `npm run build:server` first.');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(CLIENT_INDEX, 'utf-8');
  const { render } = await import(`file://${SERVER_ENTRY}`);

  const server = http.createServer(async (req, res) => {
    const reqUrl = req.url || '/';
    const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 0. API Endpoint for Canonical Database Padas
    if (pathname === '/api/padas') {
      const padasFile = path.join(DIST_DIR, 'data', 'canonicalPadas.json');
      if (fs.existsSync(padasFile)) {
        serveStaticFile(req, res, padasFile, 'application/json; charset=utf-8', true);
        return;
      }
    }

    // 1. Check for Static Files in dist/
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(DIST_DIR, safePath);

    if (pathname !== '/' && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const isImmutable = pathname.startsWith('/assets/') || pathname.startsWith('/data/');
      serveStaticFile(req, res, filePath, mime, isImmutable);
      return;
    }

    // 2. HTML Navigation Request: Determine if Bot or SEO Request
    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_REGEX.test(userAgent);
    const hasSsrParam = parsedUrl.searchParams.has('ssr') || parsedUrl.searchParams.has('bot') || parsedUrl.searchParams.has('seo');
    const isSeoDriven = isBot || hasSsrParam;

    const cacheKey = `${pathname}${parsedUrl.search}`;
    const now = Date.now();

    // Check In-Memory Cache
    const cached = ssrCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Cache': 'HIT',
        'X-Render-Mode': isBot ? 'dynamic-ssr-bot' : 'dynamic-ssr-client',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      });
      res.end(cached.html);
      return;
    }

    // Dynamic Render Execution
    try {
      const { html, seo, initialState } = render(reqUrl);
      const renderedHtml = injectSSRContent(baseTemplate, html, seo?.htmlHead, initialState);

      // Save to LRU / in-memory cache
      if (ssrCache.size > 500) {
        // Evict oldest entries if cache exceeds 500
        const firstKey = ssrCache.keys().next().value;
        if (firstKey) ssrCache.delete(firstKey);
      }
      ssrCache.set(cacheKey, { html: renderedHtml, timestamp: now });

      const responseHeaders = {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Cache': 'MISS',
        'X-Render-Mode': isBot ? 'dynamic-ssr-bot' : 'dynamic-ssr-client',
        'X-SEO-Target': initialState?.padId || initialState?.tab || 'home',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      };

      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (acceptEncoding.includes('gzip')) {
        responseHeaders['Content-Encoding'] = 'gzip';
        res.writeHead(200, responseHeaders);
        zlib.gzip(Buffer.from(renderedHtml, 'utf-8'), (err, buffer) => {
          if (err) {
            res.end(renderedHtml);
          } else {
            res.end(buffer);
          }
        });
      } else {
        res.writeHead(200, responseHeaders);
        res.end(renderedHtml);
      }
    } catch (renderError) {
      console.error(`⚠ Dynamic SSR render error for ${reqUrl}:`, renderError);
      // Graceful fallback: return client SPA shell
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Render-Mode': 'spa-fallback',
      });
      res.end(baseTemplate);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`\n🌸 वृन्दोपनिषद् 2.0 Dynamic SSR & SEO Server running at:`);
    console.log(`   ➜ Local:   http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
    console.log(`   ➜ Mode:    Dynamic SSR for SEO & Search Crawlers`);
    console.log(`   ➜ Cache:   In-Memory TTL Cache Enabled (${CACHE_TTL_MS / 60000}m)`);
  });
}

startServer();

