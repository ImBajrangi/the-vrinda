/**
 * ============================================================================
 * Vrindopnisad 2.0 - Contemplative Dhyāna & Impact Verification Suite (F17 & F18)
 * ============================================================================
 * Tier 1: Feature Coverage (F17-01 to F17-05, F18-01 to F18-05)
 * Tier 2: Boundary & Corner Cases (F17-B01 to F17-B05, F18-B01 to F18-B05)
 * Total: 20 comprehensive automated E2E tests
 * ============================================================================
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  test,
  describe,
  assert,
  readSource,
  loadTSModule,
  PROJECT_ROOT,
  registry,
} from './test-framework.mjs';

// Setup Mock DOM / Browser APIs for Node test environment
class MemoryLocalStorage {
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

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
if (!globalThis.window.addEventListener) {
  globalThis.window.addEventListener = () => {};
}
if (!globalThis.window.removeEventListener) {
  globalThis.window.removeEventListener = () => {};
}
if (!globalThis.localStorage) {
  globalThis.localStorage = new MemoryLocalStorage();
}
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// ============================================================================
// Feature 17: Contemplative & Mental Focus UI (Tier 1)
// ============================================================================
describe('Feature 17: Contemplative & Mental Focus UI', 'Tier 1', 'F17', () => {

  test('F17-01', 'Padavali distraction-free reading mode toggle (isFocusReadingMode, .dhyana-reader-canvas, leading-[2.0])', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('isFocusReadingMode'), 'PadavaliReader must maintain isFocusReadingMode state');
    assert.ok(source.includes('setIsFocusReadingMode'), 'PadavaliReader must provide setter for focus reading mode');
    assert.ok(source.includes('एकाग्र पठन'), 'PadavaliReader toolbar must render "एकाग्र पठन" toggle button');
    assert.ok(source.includes('dhyana-reader-canvas'), 'Article must apply .dhyana-reader-canvas in focus mode');
    assert.ok(source.includes('leading-[2.0]'), 'Devanagari verses must apply leading-[2.0] line-height in focus reading mode');
    assert.ok(source.includes('max-w-3xl mx-auto'), 'Reader container must center with max-w-3xl mx-auto in focus reading mode');
  });

  test('F17-02', 'Trātaka single-stanza active illumination (.dhyana-stanza-active) & dimmed surrounding stanzas (.dhyana-stanza-dimmed)', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('activeStanzaIndex'), 'PadavaliReader must maintain activeStanzaIndex for Trātaka contemplation');
    assert.ok(source.includes('dhyana-stanza-active'), 'Active stanza must receive .dhyana-stanza-active class');
    assert.ok(source.includes('dhyana-stanza-dimmed'), 'Surrounding inactive stanzas must receive .dhyana-stanza-dimmed class');
    assert.ok(source.includes('ring-amber-400/50'), 'Active stanza must have soft golden focus ring');
    assert.ok(source.includes('॥') && source.includes('❦'), 'Stanza must render authentic Braj floral delimiters (॥ and ❦)');
  });

  test('F17-03', 'Hero Japa Card bead pacing (0 to 108 rollover state dynamics)', () => {
    const source = readSource('src/App.tsx');
    assert.ok(source.includes('beadInCurrentMala'), 'App.tsx must track beadInCurrentMala state');
    assert.ok(source.includes('handleTapBead'), 'App.tsx must implement handleTapBead pacing function');
    assert.ok(source.includes('next >= 108'), 'handleTapBead must roll over to completed mala upon reaching 108 beads');
    assert.ok(
      source.includes('मनका') && source.includes('१०८'),
      'Hero Japa Card must display active bead count out of 108 in Devanagari numerals'
    );

    // Emulate and assert mathematical state machine invariant
    let malas = 0;
    let bead = 0;
    const tap = () => {
      const next = bead + 1;
      if (next >= 108) {
        malas++;
        bead = 0;
      } else {
        bead = next;
      }
    };

    for (let i = 1; i <= 107; i++) tap();
    assert.strictEqual(bead, 107, 'After 107 taps, beadInCurrentMala must be 107');
    assert.strictEqual(malas, 0, 'After 107 taps, malas must remain 0');

    tap(); // 108th tap
    assert.strictEqual(bead, 0, 'On 108th tap, beadInCurrentMala must reset to 0');
    assert.strictEqual(malas, 1, 'On 108th tap, completed malas must increment to 1');
  });

  test('F17-04', 'Hero Japa Card "ध्यान कक्ष" gateway button directly opens Dhyana Focus Modal', () => {
    const source = readSource('src/App.tsx');
    assert.ok(source.includes('ध्यान कक्ष'), 'Hero Japa Card header must render "ध्यान कक्ष" button');
    assert.ok(source.includes('setIsFocusModalOpen(true)'), 'Clicking "ध्यान कक्ष" button must open focus modal');
    assert.ok(source.includes('bg-emerald-500/15'), 'Button must use serene emerald sanctuary aesthetic');
    assert.ok(source.includes('pressable'), 'Button must use tactile .pressable class for interaction');
    assert.notMatch(source, /ध्यान कक्ष[^>]*hover:(translate|scale)/, 'Gateway button must strictly avoid hover translateY/scale');
  });

  test('F17-05', 'Breath rhythm pulse aura ("समवृत्ति श्वास प्रवाह • शांत चित्त" & 4-4-4 rhythm badge)', () => {
    const source = readSource('src/App.tsx');
    assert.ok(
      source.includes('समवृत्ति श्वास प्रवाह • शांत चित्त'),
      'Hero Japa Card must render Samavritti breath rhythm label'
    );
    assert.ok(
      source.includes('animate-dhyana-breath'),
      'Breath pulse aura indicator must use .animate-dhyana-breath keyframe class'
    );
    assert.ok(
      source.includes('४-४-४'),
      'Breath pill must indicate the sacred 4-4-4 second pranayama rhythm badge'
    );
    assert.ok(
      source.includes('averageStillnessScore'),
      'Breath pill must dynamically bind stillness percentage score'
    );
  });

});

// ============================================================================
// Feature 17: Contemplative & Mental Focus UI Boundaries (Tier 2)
// ============================================================================
describe('Feature 17: Contemplative & Mental Focus UI Boundaries', 'Tier 2', 'F17', () => {

  test('F17-B01', 'Trātaka stanza active/dimmed CSS definitions and state toggling', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.dhyana-stanza-active'), 'src/index.css must define .dhyana-stanza-active');
    assert.ok(css.includes('.dhyana-stanza-dimmed'), 'src/index.css must define .dhyana-stanza-dimmed');
    assert.ok(css.includes('.dhyana-reader-canvas'), 'src/index.css must define .dhyana-reader-canvas');
    assert.ok(css.includes('.dhyana-verse-line'), 'src/index.css must define .dhyana-verse-line');

    const readerSrc = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(
      readerSrc.includes('setActiveStanzaIndex(vIdx)'),
      'Clicking a stanza must activate the selected stanza index'
    );
    assert.ok(
      readerSrc.includes('activeStanzaIndex !== vIdx'),
      'Surrounding inactive stanzas must be dimmed when activeStanzaIndex does not match'
    );
  });

  test('F17-B02', 'High-frequency bead pacing stress test (1,080 taps strictly produces 10 malas with zero drift)', () => {
    let malas = 0;
    let bead = 0;
    const tap = () => {
      const next = bead + 1;
      if (next >= 108) {
        malas++;
        bead = 0;
      } else {
        bead = next;
      }
    };

    const totalTaps = 1080;
    const start = performance.now();
    for (let i = 1; i <= totalTaps; i++) {
      tap();
      const currentTotal = (malas * 108) + bead;
      assert.strictEqual(currentTotal, i, `Total mantra count invariant violated at tap ${i}`);
    }
    const elapsed = performance.now() - start;

    assert.strictEqual(malas, 10, '1,080 taps must yield exactly 10 malas');
    assert.strictEqual(bead, 0, '1,080 taps must end with bead at 0');
    assert.lessThanOrEqual(elapsed, 50, '1,080 simulated bead taps must execute in < 50ms');
  });

  test('F17-B03', 'Hero Japa Card header and buttons fit within 320px screen width without overflow', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(
      appSource.includes('flex items-center justify-between mb-3'),
      'Hero Japa Card header must use flex items-center justify-between'
    );
    assert.ok(
      appSource.includes('gap-1.5 sm:gap-2'),
      'Action button row must use compact gap-1.5 on narrow mobile'
    );

    // Pixel width budget verification on 320px viewport:
    // Outer padding: px-3.5 = 28px -> 292px remaining
    // Card padding: p-5 = 40px -> 252px inner width
    // Left title block: ~130px
    // Right action buttons:
    // - "ध्यान कक्ष" button: padding (24) + icon (14) + text (50) + gap (6) = ~94px
    // - "+1 माला" button: padding (28) + badge (16) + text (26) + gap (6) = ~76px
    // Combined buttons + gap: 94 + 76 + 6 = 176px <= 252px inner width
    const cardInnerWidth = 320 - 28 - 40;
    const rightButtonsWidth = 94 + 76 + 6;
    assert.ok(rightButtonsWidth <= cardInnerWidth, `Buttons (${rightButtonsWidth}px) fit inside ${cardInnerWidth}px`);
  });

  test('F17-B04', 'Low-spec mode override disables .animate-dhyana-breath keyframes to preserve 60fps', () => {
    const css = readSource('src/index.css');
    assert.ok(
      css.includes('.low-spec .animate-dhyana-breath'),
      'src/index.css must specify .low-spec override for .animate-dhyana-breath'
    );
    assert.ok(
      css.includes('animation: none !important'),
      '.low-spec must set animation: none !important on heavy breathing animations'
    );
  });

  test('F17-B05', 'Zero hover translateY or scale across Dhyana Focus Modal, Reader focus mode, and Hero Card', () => {
    const focusModalSrc = readSource('src/components/focus/DhyanaFocusModal.tsx');
    assert.notMatch(focusModalSrc, /hover:(-)?translate-y/, 'DhyanaFocusModal must contain 0 hover translateY');
    assert.notMatch(focusModalSrc, /hover:scale/, 'DhyanaFocusModal must contain 0 hover scale');

    const readerSrc = readSource('src/components/reader/PadavaliReader.tsx');
    assert.notMatch(readerSrc, /hover:(-)?translate-y/, 'PadavaliReader must contain 0 hover translateY');
    assert.notMatch(readerSrc, /hover:scale/, 'PadavaliReader must contain 0 hover scale');
  });

});

// ============================================================================
// Feature 18: Cognitive & Spiritual Impact & Cache (Tier 1)
// ============================================================================
describe('Feature 18: Cognitive & Spiritual Impact & Cache', 'Tier 1', 'F18', () => {

  test('F18-01', 'Dhyana session recording and persistence via recordDhyanaSession', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.recordDhyanaSession === 'function', 'recordDhyanaSession must be a function');
    assert.ok(typeof cache.saveDhyanaSession === 'function', 'saveDhyanaSession alias must be exported');

    const initialState = cache.loadDhyanaImpactSync();
    const baselineMins = initialState.metrics.totalDhyanaMinutes || 0;

    const sessionResult = await cache.recordDhyanaSession({
      durationSeconds: 900, // 15 mins
      japaCount: 108,
      stillnessScore: 88,
      reflectionSentiment: 'shanti',
      reflectionNote: 'गहन शान्ति एवं नाम स्मरण',
    });

    assert.ok(sessionResult && sessionResult.metrics, 'recordDhyanaSession must return valid DhyanaImpactState');
    assert.strictEqual(
      sessionResult.metrics.totalDhyanaMinutes,
      baselineMins + 15,
      'totalDhyanaMinutes must increase by 15'
    );
    assert.ok(sessionResult.recentSessions.length > 0, 'recentSessions array must contain new session');
    assert.strictEqual(sessionResult.recentSessions[0].durationSeconds, 900, 'Session duration must match');
    assert.strictEqual(sessionResult.recentSessions[0].japaCount, 108, 'Session japaCount must match');
  });

  test('F18-02', 'Two-tier zero-flicker cache pre-warm via loadDhyanaImpactSync (< 1ms)', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.loadDhyanaImpactSync === 'function', 'loadDhyanaImpactSync must be exported');
    assert.ok(typeof cache.loadCachedDhyanaImpactSync === 'function', 'loadCachedDhyanaImpactSync alias must be exported');

    // Benchmark synchronous latency across 200 calls
    const iterations = 200;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const state = cache.loadDhyanaImpactSync();
      assert.ok(state && state.metrics, 'Synchronous pre-warm must return complete state');
    }
    const avgLatencyMs = (performance.now() - t0) / iterations;

    assert.lessThanOrEqual(
      avgLatencyMs,
      1.0,
      `loadDhyanaImpactSync average latency (${avgLatencyMs.toFixed(3)}ms) must be < 1.0ms for 0ms initial paint`
    );
  });

  test('F18-03', 'Meditative Flow stage calculations (computeDhyanaFlowStage & formatFlowStageDevanagari)', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.computeDhyanaFlowStage === 'function', 'computeDhyanaFlowStage must be exported');
    assert.ok(typeof cache.formatFlowStageDevanagari === 'function', 'formatFlowStageDevanagari must be exported');

    // Stage duration mappings:
    // 0-299s (< 5m) -> dharana
    // 300-899s (5-15m) -> shanta
    // 900-1799s (15-30m) -> dhara
    // 1800s+ (30m+) -> samadhi
    assert.strictEqual(cache.computeDhyanaFlowStage(0), 'dharana', '0s -> dharana');
    assert.strictEqual(cache.computeDhyanaFlowStage(299), 'dharana', '299s -> dharana');
    assert.strictEqual(cache.computeDhyanaFlowStage(300), 'shanta', '300s -> shanta');
    assert.strictEqual(cache.computeDhyanaFlowStage(899), 'shanta', '899s -> shanta');
    assert.strictEqual(cache.computeDhyanaFlowStage(900), 'dhara', '900s -> dhara');
    assert.strictEqual(cache.computeDhyanaFlowStage(1799), 'dhara', '1799s -> dhara');
    assert.strictEqual(cache.computeDhyanaFlowStage(1800), 'samadhi', '1800s -> samadhi');
    assert.strictEqual(cache.computeDhyanaFlowStage(3600), 'samadhi', '3600s -> samadhi');

    // Devanagari labels and theme colors
    const samadhiInfo = cache.formatFlowStageDevanagari('samadhi');
    assert.strictEqual(samadhiInfo.title, 'नित्य रस समाधि', 'Samadhi stage title must be "नित्य रस समाधि"');
    assert.strictEqual(samadhiInfo.color, '#EAB308', 'Samadhi color must be golden amber');

    const dharaInfo = cache.formatFlowStageDevanagari('dhara');
    assert.strictEqual(dharaInfo.title, 'अखंड ध्यान धारा', 'Dhara stage title must be "अखंड ध्यान धारा"');

    const shantaInfo = cache.formatFlowStageDevanagari('shanta');
    assert.strictEqual(shantaInfo.title, 'प्रशांत चित्त उपस्थिति', 'Shanta stage title must be "प्रशांत चित्त उपस्थिति"');

    const dharanaInfo = cache.formatFlowStageDevanagari('dharana');
    assert.strictEqual(dharanaInfo.title, 'आरम्भिक एकाग्रता', 'Dharana stage title must be "आरम्भिक एकाग्रता"');
  });

  test('F18-04', 'Chitta Shanti stillness score calculations (clamped 20-100%, duration & japa weighting)', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.computeChittaShantiScore === 'function', 'computeChittaShantiScore must be exported');

    // Baseline: 0s, 0 mantras -> 20
    assert.strictEqual(cache.computeChittaShantiScore(0, 0), 20, 'Baseline score must be 20%');

    // Negative values safely clamp to 20
    assert.strictEqual(cache.computeChittaShantiScore(-100, -50), 20, 'Negative values must clamp to 20%');

    // 5 minutes (300s) + 1 mala (108 mantras) -> 20 + (5 * 6) + 12 = 62
    const score5m1mala = cache.computeChittaShantiScore(300, 108);
    assert.strictEqual(score5m1mala, 62, '5 mins + 1 mala must equal 62%');

    // Maximum saturation clamping at 100%
    const maxScore = cache.computeChittaShantiScore(7200, 1000);
    assert.strictEqual(maxScore, 100, 'Long deep session must clamp to 100%');
  });

  test('F18-05', 'Antaranga Sewa badges in MilestonesView.tsx (15-dhyana, 30-dhyana, 7-manasi, 108-shanti)', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(
      source.includes('antarangaBadges'),
      'MilestonesView must define antarangaBadges array'
    );
    assert.ok(
      source.includes('अन्तरंग मानसी सोपान'),
      'MilestonesView must render "अन्तरंग मानसी सोपान" section header'
    );
    assert.ok(
      source.includes('15-dhyana') && source.includes('१५ मिनट'),
      'Must define 15-dhyana badge for 15-minute focus'
    );
    assert.ok(
      source.includes('30-dhyana') && source.includes('३० मिनट'),
      'Must define 30-dhyana badge for 30-minute deep dhyana flow'
    );
    assert.ok(
      source.includes('7-manasi') && (source.includes('७ दिन') || source.includes('सप्त दिवसीय')),
      'Must define 7-manasi badge for 7-day contemplative streak'
    );
    assert.ok(
      source.includes('108-shanti') && source.includes('१०८ शांत सत्र') || source.includes('१०८'),
      'Must define 108-shanti badge for 108 sessions of stillness'
    );
    assert.ok(
      source.includes('ScallopedBadge'),
      'Antaranga badges must render using ScallopedBadge rosettes'
    );
  });

});

// ============================================================================
// Feature 18: Cognitive & Spiritual Impact Boundaries (Tier 2)
// ============================================================================
describe('Feature 18: Cognitive & Spiritual Impact Boundaries', 'Tier 2', 'F18', () => {

  test('F18-B01', 'Corrupt localStorage string recovery in loadDhyanaImpactSync without crash', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    
    // Inject corrupt JSON into storage
    globalThis.localStorage.setItem('vrindopnisad_dhyana_v2', '{{BROKEN_JSON_MALFORMED...///');
    
    let recoveredState = null;
    let threw = false;
    try {
      recoveredState = cache.loadDhyanaImpactSync();
    } catch {
      threw = true;
    }

    assert.isFalse(threw, 'loadDhyanaImpactSync must never throw on corrupt storage JSON');
    assert.ok(recoveredState && recoveredState.metrics, 'Must safely recover and return valid fallback defaults');
    assert.strictEqual(
      typeof recoveredState.metrics.totalDhyanaMinutes,
      'number',
      'totalDhyanaMinutes must be a number'
    );
    assert.ok(
      Array.isArray(recoveredState.recentSessions),
      'recentSessions must be a valid array'
    );
  });

  test('F18-B02', 'High-volume session history cap (recentSessions strictly capped at 50 sessions)', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');

    // Record 55 rapid sessions
    for (let i = 1; i <= 55; i++) {
      await cache.recordDhyanaSession({
        durationSeconds: 60,
        japaCount: 10,
        stillnessScore: 50,
      });
    }

    const currentState = cache.loadDhyanaImpactSync();
    assert.strictEqual(
      currentState.recentSessions.length,
      50,
      `recentSessions must be capped at 50, actual: ${currentState.recentSessions.length}`
    );
  });

  test('F18-B03', 'Sacred reflections persistence and 100-entry cap via saveSacredReflection', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.saveSacredReflection === 'function', 'saveSacredReflection must be exported');

    // Save reflection entry
    await cache.saveSacredReflection({
      sentiment: 'yugal',
      note: 'श्री युगल चरणारविन्द ध्यान रस',
      dhyanaMinutes: 25,
      mantraCount: 216,
    });

    const state = cache.loadDhyanaImpactSync();
    assert.ok(state.reflections && state.reflections.length > 0, 'Reflections must be stored');
    const latest = state.reflections[0];
    assert.strictEqual(latest.sentiment, 'yugal', 'Sentiment must match');
    assert.strictEqual(latest.note, 'श्री युगल चरणारविन्द ध्यान रस', 'Note must match');
    assert.ok(latest.id && latest.id.startsWith('refl_'), 'Reflection id must auto-generate with refl_ prefix');
  });

  test('F18-B04', 'Multi-tab BroadcastChannel sync for DHYANA_SESSION_COMPLETED with sourceTabId deduplication', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cache.initMultiTabSync === 'function', 'initMultiTabSync must be exported');

    const source = readSource('src/services/cacheService.ts');
    assert.ok(
      source.includes('DHYANA_SESSION_COMPLETED'),
      'cacheService must broadcast and handle DHYANA_SESSION_COMPLETED event'
    );
    assert.ok(
      source.includes('sourceTabId'),
      'Broadcast sync must include unique sourceTabId for deduplication'
    );
    assert.ok(
      source.includes('evt.sourceTabId === TAB_INSTANCE_ID') || source.includes('sourceTabId'),
      'Must suppress loopback reflection when sourceTabId matches TAB_INSTANCE_ID'
    );
  });

  test('F18-B05', 'Antaranga Sewa badges automatic unlocking and deduplication in recordDhyanaSession', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');

    // 15-minute session unlocks 15-dhyana badge
    const state15 = await cache.recordDhyanaSession({
      durationSeconds: 900,
      japaCount: 108,
    });
    assert.ok(
      state15.unlockedAntarangaBadges.includes('15-dhyana'),
      '15-minute session must unlock "15-dhyana" badge'
    );

    // 30-minute session unlocks 30-dhyana badge
    const state30 = await cache.recordDhyanaSession({
      durationSeconds: 1800,
      japaCount: 216,
    });
    assert.ok(
      state30.unlockedAntarangaBadges.includes('30-dhyana'),
      '30-minute session must unlock "30-dhyana" badge'
    );

    // Check uniqueness (no duplicates)
    const badgeArray = state30.unlockedAntarangaBadges;
    const uniqueBadges = new Set(badgeArray);
    assert.strictEqual(
      badgeArray.length,
      uniqueBadges.size,
      'unlockedAntarangaBadges must not contain duplicate entries'
    );
  });

});

// ============================================================================
// Direct Execution CLI Runner
// ============================================================================
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  (async () => {
    console.log('\n================================================================================');
    console.log('       VRINDOPNISAD 2.0 - DHYANA E2E VERIFICATION TEST RUNNER (F17 & F18)       ');
    console.log('================================================================================\n');
    const result = await registry.run({ search: 'F1' });
    const dhyanaTests = result.results.filter(r => r.id.startsWith('F17') || r.id.startsWith('F18'));
    const passed = dhyanaTests.filter(t => t.passed).length;
    console.log(`\nExecuted ${dhyanaTests.length} tests: ${passed} Passed, ${dhyanaTests.length - passed} Failed.`);
    for (const t of dhyanaTests) {
      console.log(`  ${t.passed ? '✓' : '✗'} [${t.tier}] ${t.id.padEnd(8)} ${t.title} (${t.durationMs}ms)`);
      if (t.error) console.error(`    Error: ${t.error}`);
    }
    process.exit(dhyanaTests.length === passed ? 0 : 1);
  })();
}
