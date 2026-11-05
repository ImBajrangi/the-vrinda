/**
 * Adversarial Cache Resilience & State Transition Stress Test Harness
 * 
 * Target: Vrindopnisad 2.0 Data Architecture & State Engine
 * Tests:
 *  1. Cold Start Resilience (< 10ms & Zero Layout Shift)
 *  2. High-Frequency Rapid-Click Dynamics (+1 Mala) & 108 Beads/Mala Precision
 *  3. Multi-Tab Synchronization & BroadcastChannel Loopback Suppression
 *  4. Tab Switching & State Survival Across Component Unmounting
 *  5. Corrupted Data & Edge Case Storage Self-Healing
 */

import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Import test framework utilities
import { loadTSModule, readSource, assert } from './test-framework.mjs';

// Global mock environment for DOM / Web APIs if not present in Node
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// Polyfill window & localStorage for adversarial node simulation
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
const windowEventListeners = new Map();
if (!globalThis.window.addEventListener) {
  globalThis.window.addEventListener = (event, handler) => {
    if (!windowEventListeners.has(event)) windowEventListeners.set(event, new Set());
    windowEventListeners.get(event).add(handler);
  };
}
if (!globalThis.window.removeEventListener) {
  globalThis.window.removeEventListener = (event, handler) => {
    if (windowEventListeners.has(event)) {
      windowEventListeners.get(event).delete(handler);
    }
  };
}
if (!globalThis.localStorage) {
  globalThis.localStorage = new MockLocalStorage();
}

let totalStressTests = 0;
let passedStressTests = 0;
let failedStressTests = 0;

function stressAssert(name, condition, details = '') {
  totalStressTests++;
  if (condition) {
    passedStressTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    failedStressTests++;
    console.error(`  ✗ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
  }
}

async function runAdversarialStressSuite() {
  console.log('\n================================================================================');
  console.log('       VRINDOPNISAD 2.0 - ADVERSARIAL CACHE & DATA ENGINE STRESS HARNESS        ');
  console.log('================================================================================\n');

  const cache = await loadTSModule('src/services/cacheService.ts');

  // ============================================================================
  // SUITE 1: Cold Start Resilience & Synchronous L1 Return (< 10ms, Zero Layout Shift)
  // ============================================================================
  console.log('--- SUITE 1: Cold Start & Synchronous Fallback (< 10ms & Zero Shift) ---');
  {
    // Clear storage to simulate absolute cold start on first app install
    globalThis.localStorage.clear();

    const start = performance.now();
    const coldState = cache.loadCachedSadhanaSync();
    const duration = performance.now() - start;

    stressAssert(
      'Cold start returns valid non-null state when storage is empty',
      coldState !== null && typeof coldState === 'object'
    );

    stressAssert(
      `Cold start returns in < 10ms (Actual: ${duration.toFixed(3)}ms)`,
      duration < 10.0
    );

    // Verify all critical dashboard fields are present with non-null numbers
    // (Missing fields cause React NaN / undefined layout flicker)
    stressAssert(
      'Sadhana state contains non-null japaCompleted & japaTarget',
      typeof coldState.japaCompleted === 'number' && typeof coldState.japaTarget === 'number'
    );

    stressAssert(
      'Sadhana state contains non-null shravanMinutes & shravanTarget',
      typeof coldState.shravanMinutes === 'number' && typeof coldState.shravanTarget === 'number'
    );

    stressAssert(
      'Sadhana state contains non-null svadhyayaPadas & svadhyayaTarget',
      typeof coldState.svadhyayaPadas === 'number' && typeof coldState.svadhyayaTarget === 'number'
    );

    stressAssert(
      'Sadhana state contains valid arrays for milestones and bookmarks',
      Array.isArray(coldState.completedMilestones) && Array.isArray(coldState.bookmarkedPads)
    );

    // Stress test 1,000 cold invocations to measure latency distribution
    let maxLatency = 0;
    let sumLatency = 0;
    const ITERATIONS = 1000;
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      cache.loadCachedSadhanaSync();
      const dt = performance.now() - t0;
      if (dt > maxLatency) maxLatency = dt;
      sumLatency += dt;
    }
    const avgLatency = sumLatency / ITERATIONS;
    stressAssert(
      `1,000 rapid calls p100 < 5ms (Max: ${maxLatency.toFixed(3)}ms, Avg: ${avgLatency.toFixed(4)}ms)`,
      maxLatency < 5.0
    );

    // Adversarial: Corrupted Storage Injection
    globalThis.localStorage.setItem('vrindopnisad_sadhana_v2', '{ corrupt: [NaN, "broken"');
    const recoveredState = cache.loadCachedSadhanaSync();
    stressAssert(
      'Malformed JSON string in storage recovers safely without throwing or returning null',
      recoveredState && typeof recoveredState.japaCompleted === 'number'
    );

    // Adversarial: Malformed Type Injection (strings instead of numbers)
    globalThis.localStorage.setItem(
      'vrindopnisad_sadhana_v2',
      JSON.stringify({ japaCompleted: 'NOT_A_NUMBER', shravanMinutes: null })
    );
    const sanitizedState = cache.loadCachedSadhanaSync();
    stressAssert(
      'Reconciliation coerces invalid types to safe fallback defaults',
      typeof sanitizedState.japaCompleted === 'number' &&
      typeof sanitizedState.shravanMinutes === 'number'
    );
  }

  // ============================================================================
  // SUITE 2: Dynamic Count Integrity (+1 Mala Rapid Clicks & 108 Beads/Mala)
  // ============================================================================
  console.log('\n--- SUITE 2: High-Frequency +1 Mala Dynamics & 108 Beads Precision ---');
  {
    // Test base formula: 1 mala = 108 beads
    const testCases = [
      { malas: 0, expectedMantras: 0 },
      { malas: 1, expectedMantras: 108 },
      { malas: 2, expectedMantras: 216 },
      { malas: 16, expectedMantras: 1728 },
      { malas: 32, expectedMantras: 3456 },
      { malas: 64, expectedMantras: 6912 },
      { malas: 108, expectedMantras: 11664 },
      { malas: 1000, expectedMantras: 108000 },
    ];

    let allFormulasMatch = true;
    for (const tc of testCases) {
      const count = cache.computeMantraCount({ japaCompleted: tc.malas });
      if (count !== tc.expectedMantras) {
        allFormulasMatch = false;
        console.error(`Mismatch for ${tc.malas} malas: expected ${tc.expectedMantras}, got ${count}`);
      }
    }
    stressAssert('All standard mala increments strictly multiply by 108 with zero drift', allFormulasMatch);

    // Boundary case: negative or undefined malas
    stressAssert(
      'Negative malas clamped to 0 mantras without arithmetic overflow',
      cache.computeMantraCount({ japaCompleted: -5 }) === 0
    );
    stressAssert(
      'Undefined malas default to 0 mantras without throwing',
      cache.computeMantraCount({}) === 0
    );

    // Simulate 108 consecutive +1 माला rapid clicks
    let liveState = { ...cache.defaultSadhanaState, japaCompleted: 16 };
    const initialBeads = cache.computeMantraCount(liveState); // 16 * 108 = 1728
    stressAssert('Initial baseline: 16 malas = 1728 mantras', initialBeads === 1728);

    for (let click = 1; click <= 108; click++) {
      liveState = {
        ...liveState,
        japaCompleted: liveState.japaCompleted + 1,
      };
      const currentBeads = cache.computeMantraCount(liveState);
      const expected = (16 + click) * 108;
      if (currentBeads !== expected) {
        throw new Error(`Drift detected at click ${click}: expected ${expected}, got ${currentBeads}`);
      }
    }
    stressAssert(
      '108 rapid +1 clicks maintain exact linear bead multiplication: 124 malas = 13,392 mantras',
      liveState.japaCompleted === 124 && cache.computeMantraCount(liveState) === 13392
    );

    // Verify Devanagari numerals representation for large numbers
    const formatted13392 = cache.formatDevanagariNumerals(13392);
    stressAssert(
      'Devanagari formatting converts 13,392 correctly: १३,३९२',
      formatted13392 === '१३,३९२'
    );
    const formatted108000 = cache.formatDevanagariNumerals(108000);
    stressAssert(
      'Devanagari formatting converts 108,000 correctly: १,०८,०००',
      formatted108000 === '१,०८,०००'
    );
  }

  // ============================================================================
  // SUITE 3: Multi-Tab Synchronization & BroadcastChannel
  // ============================================================================
  console.log('\n--- SUITE 3: Multi-Tab Synchronization & BroadcastChannel Events ---');
  {
    // In a multi-tab browser, Tab B is an independent browsing context with its own BroadcastChannel
    const tabBChannel = new BroadcastChannel('vrindopnisad_sync');
    let tabBEvents = [];
    tabBChannel.addEventListener('message', (e) => {
      tabBEvents.push(e.data);
    });

    let tabAEvents = [];
    const cleanupTabA = cache.initMultiTabSync((event) => {
      tabAEvents.push(event);
    });

    const waitAsync = (ms = 25) => new Promise((r) => setTimeout(r, ms));

    // --- TEST 3.1: Tab A -> Tab B Broadcast ---
    const updatedSadhana = {
      ...cache.defaultSadhanaState,
      japaCompleted: 25,
      shravanMinutes: 60,
    };

    await cache.persistSadhana(updatedSadhana);
    await waitAsync();

    stressAssert(
      'Tab B receives SADHANA_UPDATED event when Tab A persists sadhana',
      tabBEvents.some((e) => e.type === 'SADHANA_UPDATED' && e.payload?.japaCompleted === 25)
    );

    // Verify Tab B receives feed interaction broadcast from Tab A
    await cache.saveFeedInteraction('post-test-1', {
      isLiked: true,
      likes: 108,
      isBookmarked: true,
    });
    await waitAsync();

    stressAssert(
      'Tab B receives FEED_INTERACTION_UPDATED event when Tab A updates feed',
      tabBEvents.some(
        (e) => e.type === 'FEED_INTERACTION_UPDATED' && e.payload?.postId === 'post-test-1'
      )
    );

    // Verify Tab B receives pad reader state broadcast from Tab A
    await cache.saveReaderState({
      lastPadId: 'hit-chaurasi-05',
      showTransliteration: false,
    });
    await waitAsync();

    stressAssert(
      'Tab B receives READER_STATE_UPDATED event when Tab A updates reader',
      tabBEvents.some(
        (e) => e.type === 'READER_STATE_UPDATED' && e.payload?.lastPadId === 'hit-chaurasi-05'
      )
    );

    // --- TEST 3.2: Tab B -> Tab A Inbound Sync ---
    // Tab B broadcasts an update to Tab A
    const tabBSadhanaPayload = {
      ...cache.defaultSadhanaState,
      japaCompleted: 42,
      shravanMinutes: 90,
    };
    tabBChannel.postMessage({
      type: 'SADHANA_UPDATED',
      payload: tabBSadhanaPayload,
      sourceTabId: 'external_tab_b_999',
      timestamp: Date.now(),
    });
    await waitAsync();

    stressAssert(
      'Tab A receives SADHANA_UPDATED event from Tab B',
      tabAEvents.some((e) => e.type === 'SADHANA_UPDATED' && e.payload?.japaCompleted === 42)
    );

    // Verify Tab A internal memory was refreshed
    const tabAMemoryState = cache.loadCachedSadhanaSync();
    stressAssert(
      'Tab A in-memory cache automatically synchronizes with Tab B update (japaCompleted = 42)',
      tabAMemoryState.japaCompleted === 42
    );

    // --- TEST 3.3: Loopback Suppression ---
    // If a message arrives with Tab A's own sourceTabId, it MUST be suppressed
    const preCount = tabAEvents.length;
    // Inspect the sourceTabId sent by Tab A in tabBEvents
    const tabAId = tabBEvents[0]?.sourceTabId;
    stressAssert(
      'Tab A attaches unique sourceTabId to outgoing events',
      typeof tabAId === 'string' && tabAId.length > 0
    );

    tabBChannel.postMessage({
      type: 'SADHANA_UPDATED',
      payload: { ...cache.defaultSadhanaState, japaCompleted: 999 },
      sourceTabId: tabAId, // Reflection of Tab A's own ID
      timestamp: Date.now(),
    });
    await waitAsync();

    stressAssert(
      'Tab A suppresses loopback reflection from its own sourceTabId (does not process duplicate)',
      tabAEvents.length === preCount && cache.loadCachedSadhanaSync().japaCompleted === 42
    );

    cleanupTabA();
    tabBChannel.close();
  }

  // ============================================================================
  // SUITE 4: Tab Switching & Component Unmounting State Survival
  // ============================================================================
  console.log('\n--- SUITE 4: Tab Switching & State Survival Across Unmounting ---');
  {
    // Step 1: User visits Feed Tab and interacts with cards
    const testPostId = 'post-darshan-bihari-01';
    await cache.saveFeedInteraction(testPostId, {
      isLiked: true,
      likes: 541,
      isBookmarked: true,
      isFollowing: true,
    });

    // Step 2: User switches from Feed to Padavali (Feed unmounts)
    await cache.saveReaderState({
      lastPadId: 'kelimal-08',
      showTransliteration: false,
      bookmarkedPadIds: ['kelimal-08', 'hit-chaurasi-01'],
    });

    // Step 3: User switches to Smaran (Padavali unmounts) and clicks +1 mala
    const smaranState = cache.loadCachedSadhanaSync();
    await cache.persistSadhana({
      ...smaranState,
      japaCompleted: 18,
    });

    // Step 4: User switches BACK to Feed (Feed mounts again)
    // Simulated mount: calls getFeedInteractionsSync()
    const feedInteractionsOnMount = cache.getFeedInteractionsSync();
    const restoredPost = feedInteractionsOnMount[testPostId];

    stressAssert(
      'Feed post like state survived unmounting and tab switching',
      restoredPost?.isLiked === true && restoredPost?.likes === 541
    );

    stressAssert(
      'Feed post bookmark survived unmounting and tab switching',
      restoredPost?.isBookmarked === true
    );

    stressAssert(
      'Feed post follow status survived unmounting and tab switching',
      restoredPost?.isFollowing === true
    );

    // Step 5: User switches BACK to Padavali (Padavali mounts again)
    // Simulated mount: calls getReaderStateSync()
    const readerStateOnMount = cache.getReaderStateSync();

    stressAssert(
      'Padavali reader lastPadId survived unmounting (restored kelimal-08)',
      readerStateOnMount.lastPadId === 'kelimal-08'
    );

    stressAssert(
      'Padavali reader transliteration preference survived unmounting (restored false)',
      readerStateOnMount.showTransliteration === false
    );

    stressAssert(
      'Padavali reader bookmarks array survived unmounting',
      readerStateOnMount.bookmarkedPadIds?.includes('kelimal-08') &&
      readerStateOnMount.bookmarkedPadIds?.includes('hit-chaurasi-01')
    );

    // Step 6: User switches BACK to Smaran
    const finalSmaran = cache.loadCachedSadhanaSync();
    stressAssert(
      'Smaran sadhana state survived multi-tab round trip (japaCompleted = 18)',
      finalSmaran.japaCompleted === 18
    );
  }

  // ============================================================================
  // SUITE 5: Static Architectural Inspection & Zero-Flicker Layout Guarantees
  // ============================================================================
  console.log('\n--- SUITE 5: Static Architectural Inspection & Zero-Flicker Guarantees ---');
  {
    const appSource = readSource('src/App.tsx');
    const feedSource = readSource('src/components/feed/FeedCard.tsx');
    const readerSource = readSource('src/components/reader/PadavaliReader.tsx');

    // Verify App.tsx uses lazy state initializer with loadCachedSadhanaSync
    const hasLazySadhanaInit = appSource.includes('useState<SadhanaState>(() => loadCachedSadhanaSync())') ||
                               appSource.includes('useState(() => loadCachedSadhanaSync())');
    stressAssert(
      'App.tsx initializes sadhana state with synchronous pre-warm callback () => loadCachedSadhanaSync()',
      hasLazySadhanaInit
    );

    // Verify FeedCard initializes state synchronously with getFeedInteractionsSync
    const hasFeedSyncInit = feedSource.includes('getFeedInteractionsSync()');
    stressAssert(
      'FeedCard.tsx initializes likes/bookmarks from getFeedInteractionsSync() for zero-flicker mount',
      hasFeedSyncInit
    );

    // Verify PadavaliReader initializes state synchronously with getReaderStateSync
    const hasReaderSyncInit = readerSource.includes('getReaderStateSync()');
    stressAssert(
      'PadavaliReader.tsx initializes pad & transliteration from getReaderStateSync() for zero-flicker mount',
      hasReaderSyncInit
    );

    // Verify dynamic +1 Mala click handler persists to cacheService
    const hasIncrementHandler = appSource.includes('persistSadhana(updated)') &&
                                appSource.includes('japaCompleted + 1');
    stressAssert(
      'App.tsx incrementJapa calls persistSadhana to write through cache immediately',
      hasIncrementHandler
    );

    // Verify Ashtayama calculation is dynamic
    const hasDynamicAshtayama = appSource.includes('computeAshtayamaPhase()');
    stressAssert(
      'App.tsx binds current Ashtayama phase dynamically from computeAshtayamaPhase()',
      hasDynamicAshtayama
    );
  }

  console.log('\n================================================================================');
  console.log(` ADVERSARIAL STRESS TEST SUMMARY: ${passedStressTests} / ${totalStressTests} PASSED`);
  if (failedStressTests === 0) {
    console.log(' ALL DATA ARCHITECTURE & CACHE RESILIENCE CRITERIA CONFIRMED SOLID.');
  } else {
    console.error(` ${failedStressTests} STRESS TEST(S) FAILED.`);
  }
  console.log('================================================================================\n');

  if (failedStressTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialStressSuite().catch((err) => {
  console.error('Fatal stress test failure:', err);
  process.exit(1);
});
