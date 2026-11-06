/**
 * ============================================================================
 * Vrindopnisad 2.0 - Groq AI Devotional Summary E2E Test Suite (Feature 19)
 * ============================================================================
 * Tier 1: Feature Coverage (F19-01 to F19-05)
 * Tier 2: Boundary & Corner Cases (F19-B01 to F19-B05)
 * Total: 10 comprehensive automated E2E tests
 * ============================================================================
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  test as defaultTest,
  describe as defaultDescribe,
  assert as defaultAssert,
  loadTSModule as defaultLoadTSModule,
  readSource as defaultReadSource,
  MockLocalStorage as defaultMockLocalStorage,
  MockIndexedDB as defaultMockIndexedDB,
  MockBroadcastChannel as defaultMockBroadcastChannel,
  registry,
} from './test-framework.mjs';

// Setup Mock DOM / Storage / Browser APIs for Node environment if missing
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

const storageListeners = new Set();
const prevAddEventListener = globalThis.window?.addEventListener;
globalThis.window.addEventListener = function (type, listener, ...args) {
  if (type === 'storage' && typeof listener === 'function') {
    storageListeners.add(listener);
  }
  if (typeof prevAddEventListener === 'function' && prevAddEventListener !== globalThis.window.addEventListener) {
    try {
      prevAddEventListener.call(globalThis.window, type, listener, ...args);
    } catch {
      // Safe ignore
    }
  }
};

const prevRemoveEventListener = globalThis.window?.removeEventListener;
globalThis.window.removeEventListener = function (type, listener, ...args) {
  if (type === 'storage') {
    storageListeners.delete(listener);
  }
  if (typeof prevRemoveEventListener === 'function' && prevRemoveEventListener !== globalThis.window.removeEventListener) {
    try {
      prevRemoveEventListener.call(globalThis.window, type, listener, ...args);
    } catch {
      // Safe ignore
    }
  }
};

globalThis.window.dispatchEvent = (event) => {
  if (event && event.type === 'storage') {
    for (const listener of storageListeners) {
      try {
        listener(event);
      } catch {
        // Safe ignore
      }
    }
    return true;
  }
  return false;
};

if (!globalThis.localStorage) {
  globalThis.localStorage = new defaultMockLocalStorage();
}

// Always ensure fully functional MockBroadcastChannel with peer routing and addEventListener is available
class FullMockBroadcastChannel extends defaultMockBroadcastChannel {
  constructor(name) {
    super(name);
    this._listeners = new Set();
  }
  addEventListener(event, listener) {
    if (event === 'message' && typeof listener === 'function') {
      this._listeners.add(listener);
    }
  }
  removeEventListener(event, listener) {
    if (event === 'message') {
      this._listeners.delete(listener);
    }
  }
  postMessage(data) {
    super.postMessage(data);
    const peers = defaultMockBroadcastChannel.channels.get(this.name) || new Set();
    for (const peer of peers) {
      if (peer !== this && peer._listeners) {
        for (const l of peer._listeners) {
          try {
            l({ data });
          } catch {
            // Safe ignore
          }
        }
      }
    }
  }
}

globalThis.BroadcastChannel = FullMockBroadcastChannel;

if (typeof globalThis.indexedDB === 'undefined') {
  const memoryDB = new Map();
  globalThis.indexedDB = {
    open(name) {
      const req = {
        result: {
          createObjectStore() {
            return {};
          },
          transaction() {
            const tx = {
              oncomplete: null,
              onerror: null,
              objectStore() {
                return {
                  transaction: tx,
                  get(k) {
                    const r = { result: memoryDB.get(k), onsuccess: null, onerror: null };
                    queueMicrotask(() => {
                      if (r.onsuccess) r.onsuccess();
                    });
                    return r;
                  },
                  put(v, k) {
                    memoryDB.set(k, v);
                    queueMicrotask(() => {
                      if (tx.oncomplete) tx.oncomplete();
                    });
                    return {};
                  },
                  delete(k) {
                    memoryDB.delete(k);
                    queueMicrotask(() => {
                      if (tx.oncomplete) tx.oncomplete();
                    });
                    return {};
                  },
                };
              },
            };
            return tx;
          },
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => {
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
  };
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = defaultMockBroadcastChannel;
}

/**
 * Register all Feature 19 tests into the test registry.
 */
export function registerDevotionalSummaryTests(deps = {}) {
  const test = deps.test || defaultTest;
  const describe = deps.describe || defaultDescribe;
  const assert = deps.assert || defaultAssert;
  const loadTSModule = deps.loadTSModule || defaultLoadTSModule;
  const readSource = deps.readSource || defaultReadSource;

  // ============================================================================
  // Feature 19: Groq AI Devotional Summaries & Multi-Tier Caching (Tier 1)
  // ============================================================================
  describe('Feature 19: Groq AI Devotional Summaries & Multi-Tier Caching', 'Tier 1', 'F19', () => {

    test('F19-01', 'Service contracts & exported config (endpoint api.groq.com, model qwen/qwen3.8-27b, keys)', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      // Verify exported functions
      assert.strictEqual(typeof service.getDevotionalSummary, 'function', 'getDevotionalSummary must be exported');
      assert.strictEqual(typeof service.getCachedDevotionalSummarySync, 'function', 'getCachedDevotionalSummarySync must be exported');
      assert.strictEqual(typeof service.getCachedSummarySync, 'function', 'getCachedSummarySync must be exported');
      assert.strictEqual(typeof service.getCachedSummary, 'function', 'getCachedSummary must be exported');
      assert.strictEqual(typeof service.computeDevotionalCacheKey, 'function', 'computeDevotionalCacheKey must be exported');
      assert.strictEqual(typeof service.computeVerseCacheKey, 'function', 'computeVerseCacheKey must be exported');
      assert.strictEqual(typeof service.computeQuoteCacheKey, 'function', 'computeQuoteCacheKey must be exported');
      assert.strictEqual(typeof service.computeTextHash, 'function', 'computeTextHash must be exported');

      // Verify Groq API configuration
      assert.strictEqual(service.GROQ_ENDPOINT, 'https://api.groq.com/openai/v1/chat/completions', 'Endpoint must match Groq chat completions');
      assert.strictEqual(service.GROQ_MODEL, 'qwen/qwen3.8-27b', 'Model must be qwen/qwen3.8-27b');
      assert.ok(typeof service.GROQ_DEFAULT_KEY === 'string' && service.GROQ_DEFAULT_KEY.startsWith('gsk_'), 'Default key must start with gsk_');
      assert.ok(typeof service.GROQ_API_KEY === 'string' && service.GROQ_API_KEY.length > 20, 'GROQ_API_KEY must resolve to valid string');

      // Verify storage key constants
      assert.strictEqual(service.LOCAL_STORAGE_BUFFER_KEY, 'vrindopnisad_summary_buffer_v1', 'LocalStorage buffer key constant');
      assert.strictEqual(service.INDEXEDDB_STORAGE_KEY, 'vrindopnisad_devotional_summaries_v1', 'IndexedDB storage key constant');
      assert.strictEqual(service.SYNC_CHANNEL_NAME, 'vrindopnisad_sync', 'Broadcast sync channel name');
      assert.strictEqual(service.SUMMARY_SYNC_EVENT, 'DEVOTIONAL_SUMMARY_CACHED', 'Sync event identifier');

      // Verify pre-bundled canonical reflections
      assert.ok(service.CANONICAL_DEVOTIONAL_SUMMARIES, 'Canonical summaries dictionary must be exported');
      assert.ok(service.CANONICAL_DEVOTIONAL_SUMMARIES['hit-chaurasi-01-1'], 'Hit Chaurasi Pad 01 stanza 1 pre-bundled');
      assert.ok(service.CANONICAL_DEVOTIONAL_SUMMARIES['quote-hit-chaurasi-0'], 'Hit Chaurasi quote 0 pre-bundled');
    });

    test('F19-02', 'Multi-tier caching dual-write (L1 memory Map, localStorage buffer, IndexedDB store)', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      const testKey = 'summary:verse:tier-test:pad-dual-write:1:abc123z';
      const testSummary = 'यह नित्य निकुंज रस का अनन्य पावन भाव सार है।';

      // 1. Stage in localStorage buffer
      const buffer = { [testKey]: testSummary };
      globalThis.localStorage.setItem('vrindopnisad_summary_buffer_v1', JSON.stringify(buffer));

      // 2. Calling getCachedSummarySync reads from localStorage buffer and pre-warms L1
      const initialPeek = service.getCachedSummarySync(testKey);
      assert.strictEqual(initialPeek, testSummary, 'Must read synchronously from localStorage buffer on initial hit');

      // 3. Clear localStorage buffer to prove L1 in-memory cache is populated (dual-read/warm)
      globalThis.localStorage.removeItem('vrindopnisad_summary_buffer_v1');
      const l1Peek = service.getCachedSummarySync(testKey);
      assert.strictEqual(l1Peek, testSummary, 'Must retrieve from L1 memory Map even after buffer is wiped');

      // 4. Verify source code enforces dual-write across tiers on resolution
      const source = readSource('src/services/devotionalSummaryService.ts');
      assert.ok(source.includes('setL1Cache(cacheKey, content)'), 'Must write to L1 memory Map');
      assert.ok(source.includes('updateLocalStorageBuffer(cacheKey, content)'), 'Must write to localStorage buffer');
      assert.ok(source.includes('persistToIndexedDB(cacheKey, content)'), 'Must write to IndexedDB asynchronously');
      assert.ok(source.includes('broadcastSummaryCached(cacheKey, content)'), 'Must broadcast to peer tabs');
    });

    test('F19-03', 'Deterministic 32-bit FNV-1a key formulation (pada/verse keys and quote keys)', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      // Test computeTextHash
      const text1 = 'जोई जोई प्यारो करे सोई मोहि भावै';
      const text2 = '  जोई जोई प्यारो करे सोई मोहि भावै\r\n ';
      const hash1 = service.computeTextHash(text1);
      const hash2 = service.computeTextHash(text2);
      assert.strictEqual(hash1, hash2, 'Hash must be deterministic and normalize whitespace/newlines');
      assert.ok(typeof hash1 === 'string' && hash1.length > 0, 'Hash must be non-empty base-36 string');

      // Test computeVerseCacheKey
      const verseKey1 = service.computeVerseCacheKey('hit-chaurasi', 'hit-chaurasi-01', 1, text1);
      const verseKey2 = service.computeVerseCacheKey('hit-chaurasi', 'hit-chaurasi-01', 1, text2);
      assert.strictEqual(verseKey1, verseKey2, 'Verse cache keys must match for normalized text');
      assert.strictEqual(
        verseKey1,
        `summary:verse:hit-chaurasi:hit-chaurasi-01:1:${hash1}`,
        'Verse cache key must adhere to summary:verse:${col}:${pad}:${stanza}:${hash}'
      );

      // Stanza differentiation
      const verseKeyStanza2 = service.computeVerseCacheKey('hit-chaurasi', 'hit-chaurasi-01', 2, text1);
      assert.ok(verseKey1 !== verseKeyStanza2, 'Different stanzas must yield different keys');

      // Test computeQuoteCacheKey
      const quoteKey1 = service.computeQuoteCacheKey('radha-sudha-nidhi', 3, text1);
      const quoteKey2 = service.computeQuoteCacheKey('radha-sudha-nidhi', 3, text2);
      assert.strictEqual(quoteKey1, quoteKey2, 'Quote cache keys must match for normalized text');
      assert.strictEqual(
        quoteKey1,
        `summary:quote:radha-sudha-nidhi:3:${hash1}`,
        'Quote cache key must adhere to summary:quote:${slug}:${idx}:${hash}'
      );

      // Test computeDevotionalCacheKey polymorphism
      const reqVerse = {
        id: 'hit-chaurasi-01-1',
        text: text1,
        type: 'verse',
        collectionId: 'hit-chaurasi',
        padId: 'hit-chaurasi-01',
        stanzaNumber: 1,
      };
      assert.strictEqual(service.computeDevotionalCacheKey(reqVerse), verseKey1, 'Request object must generate identical verse key');

      const reqQuote = {
        id: 'quote-radha-sudha-nidhi-3',
        text: text1,
        type: 'quote',
        sourceSlug: 'radha-sudha-nidhi',
        quoteIndex: 3,
      };
      assert.strictEqual(service.computeDevotionalCacheKey(reqQuote), quoteKey1, 'Request object must generate identical quote key');
    });

    test('F19-04', 'UI Devotional Labels Verification in PadavaliReader.tsx and DhyanaFocusModal.tsx', async () => {
      const readerSource = readSource('src/components/reader/PadavaliReader.tsx');
      const modalSource = readSource('src/components/focus/DhyanaFocusModal.tsx');

      // PadavaliReader checks
      assert.ok(readerSource.includes('भाव संक्षेप देखें'), 'PadavaliReader must contain "भाव संक्षेप देखें" label');
      assert.ok(readerSource.includes('दिव्य सार'), 'PadavaliReader must contain "दिव्य सार" mobile label');
      assert.ok(readerSource.includes('॥ दिव्य भाव संक्षेप'), 'PadavaliReader must contain sacred card header');
      assert.ok(readerSource.includes('getCachedDevotionalSummarySync'), 'PadavaliReader must import and call getCachedDevotionalSummarySync');
      assert.ok(readerSource.includes('getDevotionalSummary'), 'PadavaliReader must import and call getDevotionalSummary');

      // DhyanaFocusModal checks
      assert.ok(modalSource.includes('दिव्य सार'), 'DhyanaFocusModal must contain "दिव्य सार" action label');
      assert.ok(modalSource.includes('भाव संक्षेप देखें'), 'DhyanaFocusModal must contain "भाव संक्षेप देखें" tooltip/title');
      assert.ok(modalSource.includes('॥ दिव्य सार (Divine Essence) ॥'), 'DhyanaFocusModal must contain sacred quote essence header');
      assert.ok(modalSource.includes('getCachedDevotionalSummarySync'), 'DhyanaFocusModal must import and call getCachedDevotionalSummarySync');
      assert.ok(modalSource.includes('getDevotionalSummary'), 'DhyanaFocusModal must import and call getDevotionalSummary');

      // Invariants: Strictly NO "Grok" or "api.groq" in components
      assert.strictEqual(readerSource.includes('Grok'), false, 'PadavaliReader must NOT mention Grok');
      assert.strictEqual(modalSource.includes('Grok'), false, 'DhyanaFocusModal must NOT mention Grok');
      assert.strictEqual(readerSource.includes('api.groq'), false, 'PadavaliReader must NOT expose api.groq endpoint');
      assert.strictEqual(modalSource.includes('api.groq'), false, 'DhyanaFocusModal must NOT expose api.groq endpoint');
    });

    test('F19-05', 'Graceful devotional fallback reflection contract (network drop / offline mode returns serene devotional text)', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      // 1. Explicit fallbackText support on network failure / offline
      const customFallback = 'यह एक विशेष निकुंज भावार्थ है।';
      const origFetch = globalThis.fetch;
      try {
        globalThis.fetch = () => Promise.reject(new Error('Simulated offline / network drop'));
        const resCustom = await service.getDevotionalSummary({
          id: 'test-custom-fallback',
          text: 'अद्भुत रस',
          type: 'verse',
          fallbackText: customFallback,
        });
        assert.strictEqual(resCustom.summary, customFallback, 'Must honor explicit fallbackText on network drop');
        assert.strictEqual(resCustom.fromCache, false, 'Must flag fromCache: false');
        assert.strictEqual(resCustom.isFallback, true, 'Must flag isFallback: true');
      } finally {
        globalThis.fetch = origFetch;
      }

      // 2. Empty or whitespace input handling
      const resEmpty = await service.getDevotionalSummary({
        id: 'test-empty',
        text: '   ',
        type: 'verse',
      });
      assert.strictEqual(resEmpty.isFallback, true, 'Empty input must resolve to fallback');
      assert.ok(typeof resEmpty.summary === 'string' && resEmpty.summary.length > 20, 'Must return soothing default fallback');
      assert.ok(resEmpty.summary.includes('श्री राधा') || resEmpty.summary.includes('युगल'), 'Fallback must convey authentic Braj devotional mood');

      // 3. Pre-bundled canonical fallback for known IDs
      const canonicalReq = {
        id: 'hit-chaurasi-01-1',
        text: 'जोई जोई प्यारो करे सोई मोहि भावै',
        type: 'verse',
      };
      const resCanonical = await service.getDevotionalSummary(canonicalReq);
      assert.ok(typeof resCanonical.summary === 'string', 'Canonical summary must be a valid string');
      assert.ok(resCanonical.summary.length > 30, 'Canonical summary must be complete reflection');
    });

  });

  // ============================================================================
  // Feature 19: Devotional Summary Caching & Resilience Boundaries (Tier 2)
  // ============================================================================
  describe('Feature 19: Devotional Summary Caching & Resilience Boundaries', 'Tier 2', 'F19-Boundaries', () => {

    test('F19-B01', 'Synchronous peek latency benchmark (< 0.5ms on cache hit)', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      const req = {
        id: 'hit-chaurasi-01-1',
        text: 'जोई जोई प्यारो करे सोई मोहि भावै',
        type: 'verse',
      };

      // Warm up
      service.getCachedDevotionalSummarySync(req);

      // Measure 100 iterations of synchronous peek
      const iterations = 100;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const val = service.getCachedDevotionalSummarySync(req);
        if (!val) throw new Error('Cache hit expected in benchmark');
      }
      const totalElapsed = performance.now() - start;
      const avgLatencyMs = totalElapsed / iterations;

      assert.lessThanOrEqual(
        avgLatencyMs,
        0.5,
        `Synchronous peek latency (${avgLatencyMs.toFixed(4)}ms) must be < 0.5ms`
      );
    });

    test('F19-B02', 'Offline / simulated network error resilience without unhandled exceptions', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');
      const origFetch = globalThis.fetch;

      try {
        // Case A: Network connection dropped / rejected promise
        globalThis.fetch = () => Promise.reject(new Error('Network disconnected (offline)'));
        const resNetErr = await service.getDevotionalSummary({
          id: 'test-boundary-net-err',
          text: 'प्रिया चरण रस सिंधु',
          type: 'verse',
        });
        assert.ok(resNetErr, 'Must resolve without throwing on network disconnect');
        assert.strictEqual(resNetErr.isFallback, true, 'isFallback must be true on network failure');
        assert.ok(resNetErr.summary && resNetErr.summary.length > 0, 'Must provide devotional fallback string');

        // Case B: Simulated HTTP 500 Internal Server Error
        globalThis.fetch = () =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Simulated 500' }),
          });
        const res500 = await service.getDevotionalSummary({
          id: 'test-boundary-500-err',
          text: 'प्रिया चरण रस सिंधु',
          type: 'verse',
        });
        assert.ok(res500, 'Must resolve without throwing on HTTP 500');
        assert.strictEqual(res500.isFallback, true, 'isFallback must be true on HTTP 500');

        // Case C: Simulated HTTP 429 Rate Limit
        globalThis.fetch = () =>
          Promise.resolve({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            json: async () => ({ error: 'Rate limit exceeded' }),
          });
        const res429 = await service.getDevotionalSummary({
          id: 'test-boundary-429-err',
          text: 'प्रिया चरण रस सिंधु',
          type: 'quote',
        });
        assert.ok(res429, 'Must resolve without throwing on HTTP 429');
        assert.strictEqual(res429.isFallback, true, 'isFallback must be true on HTTP 429');
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    test('F19-B03', 'Storage corruption self-healing recovery', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      // Corrupt localStorage buffer with invalid JSON
      globalThis.localStorage.setItem('vrindopnisad_summary_buffer_v1', 'INVALID_JSON_CORRUPTED{{{@@@');

      let peekResult = null;
      let errorThrown = false;
      try {
        peekResult = service.getCachedSummarySync('random-uncached-key');
      } catch {
        errorThrown = true;
      }

      assert.strictEqual(errorThrown, false, 'Corrupted localStorage JSON must not throw syntax error');
      assert.strictEqual(peekResult, null, 'Must return null safely for missing key amidst corruption');

      // Corrupt with non-object JSON primitive
      globalThis.localStorage.setItem('vrindopnisad_summary_buffer_v1', '123456');
      assert.strictEqual(service.getCachedSummarySync('another-key'), null, 'Must handle non-object JSON gracefully');

      // Cleanup
      globalThis.localStorage.removeItem('vrindopnisad_summary_buffer_v1');
    });

    test('F19-B04', 'Multi-tab BroadcastChannel event sync simulation', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      const syncKey = 'summary:verse:cross-tab-sync:1:x7z8p';
      const syncSummary = 'श्री किशोरीजी के चरणारविन्दों का सहज अनुराग।';

      // Simulate incoming event from peer tab via storage bus
      const eventPayload = {
        type: service.SUMMARY_SYNC_EVENT,
        payload: { key: syncKey, summary: syncSummary },
        sourceTabId: 'peer_tab_instance_xyz',
        timestamp: Date.now(),
      };

      const storageEvent = {
        type: 'storage',
        key: 'vrindopnisad_sync_bus',
        newValue: JSON.stringify(eventPayload),
      };

      // 1. Post via peer BroadcastChannel
      const peerChannel = new defaultMockBroadcastChannel(service.SYNC_CHANNEL_NAME);
      peerChannel.postMessage(eventPayload);

      // 2. Dispatch to window storage listener bus
      if (typeof globalThis.window.dispatchEvent === 'function') {
        globalThis.window.dispatchEvent(storageEvent);
      }

      // Check if peer tab summary was absorbed into L1 memory cache
      const peekAfterSync = service.getCachedSummarySync(syncKey);
      assert.strictEqual(
        peekAfterSync,
        syncSummary,
        'Peer tab broadcast must populate receiving tab L1 memory cache'
      );
    });

    test('F19-B05', 'Deterministic key collision resistance', async () => {
      const service = await loadTSModule('src/services/devotionalSummaryService.ts');

      const generatedKeys = new Set();
      const count = 50;

      for (let i = 0; i < count; i++) {
        const text = `श्री युगल रस श्लोक पंक्ति ${i} — अनन्य प्रेम निकुंज विलास ${i * 7} ॥`;
        const key = service.computeVerseCacheKey('kelimal', `pad-${i}`, i + 1, text);
        generatedKeys.add(key);
      }

      assert.strictEqual(
        generatedKeys.size,
        count,
        `All ${count} distinct stanzas must generate ${count} unique collision-free keys`
      );

      // Verify that whitespace differences produce identical keys
      const baseKey = service.computeVerseCacheKey('kelimal', 'pad-0', 1, 'राधा प्यारी');
      const paddedKey = service.computeVerseCacheKey('kelimal', 'pad-0', 1, '  राधा प्यारी\r\n  ');
      assert.strictEqual(baseKey, paddedKey, 'Whitespace variants must hash to identical cache key');
    });

  });
}

// Auto-register if executed directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  registerDevotionalSummaryTests();
  (async () => {
    console.log('\n================================================================================');
    console.log('       VRINDOPNISAD 2.0 - DEVOTIONAL SUMMARY E2E TEST RUNNER (FEATURE 19)       ');
    console.log('================================================================================\n');
    const result = await registry.run({ search: 'F19' });
    const passed = result.results.filter(r => r.passed).length;
    console.log(`\nExecuted ${result.results.length} tests: ${passed} Passed, ${result.results.length - passed} Failed.`);
    for (const t of result.results) {
      console.log(`  ${t.passed ? '✓' : '✗'} [${t.tier}] ${t.id.padEnd(8)} ${t.title} (${t.durationMs}ms)`);
      if (t.error) console.error(`    Error: ${t.error}`);
    }
    process.exit(result.results.length === passed ? 0 : 1);
  })();
}
