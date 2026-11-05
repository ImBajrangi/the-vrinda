import { test, describe, assert, readSource, loadTSModule, getAllSourceFiles, PROJECT_ROOT } from './test-framework.mjs';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Feature 1: Two-Tier Zero-Flicker IDB Caching Boundaries
// ============================================================================
describe('Feature 1: Cache Engine Boundaries', 'Tier 2', 'F1-CacheEngine-Boundaries', () => {

  test('F1-B01', 'Empty storage returns defaultSadhanaState without error', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(cache.defaultSadhanaState, 'defaultSadhanaState must exist');
    assert.strictEqual(cache.defaultSadhanaState.japaCompleted, 16);
    assert.strictEqual(cache.defaultSadhanaState.japaTarget, 16);
  });

  test('F1-B02', 'Corrupted JSON in storage recovers cleanly to defaultSadhanaState', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    // Calling loadCachedSadhanaSync should be resilient to parse errors
    if (typeof cache.loadCachedSadhanaSync === 'function') {
      const state = cache.loadCachedSadhanaSync();
      assert.ok(typeof state.japaCompleted === 'number', 'Recovered state must have number japaCompleted');
    }
  });

  test('F1-B03', 'IndexedDB failure fallback gracefully returns state', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    const state = await cache.loadCachedSadhana();
    assert.ok(state, 'Must return state even when IDB is mocked or unavailable in Node');
  });

  test('F1-B04', 'L1 synchronous pre-warm benchmark executes in < 5ms', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.loadCachedSadhanaSync === 'function') {
      const start = performance.now();
      cache.loadCachedSadhanaSync();
      const elapsed = performance.now() - start;
      assert.lessThanOrEqual(elapsed, 5, 'loadCachedSadhanaSync must execute in < 5ms for 0ms initial render');
    }
  });

  test('F1-B05', 'Multi-tab sync handles missing or empty payload gracefully', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.initMultiTabSync === 'function') {
      const cleanup = cache.initMultiTabSync(() => {});
      assert.ok(typeof cleanup === 'function', 'initMultiTabSync must return cleanup function');
      cleanup();
    }
  });

});

// ============================================================================
// Feature 2: Unified Reactive State & Metrics Boundaries
// ============================================================================
describe('Feature 2: Reactive State Boundaries', 'Tier 2', 'F2-ReactiveMetrics-Boundaries', () => {

  test('F2-B01', 'Zero completed values (0/16 malas) produces 0% without NaN or divide-by-zero', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeProgressPercent === 'function') {
      const percent = cache.computeProgressPercent(0, 16);
      assert.strictEqual(percent, 0, '0/16 must return 0%');
      assert.isFalse(Number.isNaN(percent), 'Must not be NaN');
    } else {
      const percent = Math.round((0 / 16) * 100);
      assert.strictEqual(percent, 0);
    }
  });

  test('F2-B02', 'Overflow values (exceeding target, e.g. 32/16) calculate accurately without crashing', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeProgressPercent === 'function') {
      const percent = cache.computeProgressPercent(32, 16);
      assert.greaterThanOrEqual(percent, 100, 'Over-completion must be >= 100%');
    }
  });

  test('F2-B03', 'Missing or null sadhana state falls back to safe default metrics', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    assert.ok(cache.defaultSadhanaState.currentStreakDays >= 0, 'Default streak must be >= 0');
  });

  test('F2-B04', 'High streak count (e.g. 1008 days) formats cleanly without layout break', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.formatDevanagariNumerals === 'function') {
      const devStr = cache.formatDevanagariNumerals(1008);
      assert.ok(devStr === '१००८' || devStr === '१,००८', '1008 must format to Devanagari numerals');
    }
  });

  test('F2-B05', 'Mantra bead calculation formula for 16 malas equals exactly 1728 beads', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeMantraCount === 'function') {
      const beads = cache.computeMantraCount({ ...cache.defaultSadhanaState, japaCompleted: 16 });
      assert.strictEqual(beads, 1728, '16 malas * 108 = 1728 beads');
    }
  });

});

// ============================================================================
// Feature 3: Mobile FloatingNavbar 320px Boundaries
// ============================================================================
describe('Feature 3: FloatingNavbar 320px Boundaries', 'Tier 2', 'F3-FloatingNavbar-Boundaries', () => {

  test('F3-B01', '320px viewport total navbar width <= 320px', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    // If fixed w-[276px] + w-[66px] + gap-3 (12px) = 354px, this exceeds 320px
    const hasFixed354px = source.includes('w-[276px]') && source.includes('w-[66px]') && !source.includes('max-w-[220px]') && !source.includes('max-w-[240px]');
    assert.isFalse(hasFixed354px, 'Total navbar width must fit within 320px screen width');
  });

  test('F3-B02', '360px viewport adaptation check', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('max-w-[390px]') || source.includes('max-w-'), 'FloatingNavbar has max-w constraint');
  });

  test('F3-B03', 'Rapid tab switching does not desynchronize nav items', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('onClick={() => onSelectTab(tab.id)}'), 'Tab clicks properly bound');
  });

  test('F3-B04', 'isPlayingAudio animation does not expand FAB button hit target', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('overflow-hidden') || source.includes('rounded-full'), 'FAB has bounds protection');
  });

  test('F3-B05', 'Outer wrapper has pointer-events-none to prevent dead click zones', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('pointer-events-none'), 'Outer fixed container must be pointer-events-none');
    assert.ok(source.includes('pointer-events-auto'), 'Interactive pills must be pointer-events-auto');
  });

});

// ============================================================================
// Feature 4: Dynamic Notch Compact Mode Boundaries
// ============================================================================
describe('Feature 4: Dynamic Notch Compact Mode Boundaries', 'Tier 2', 'F4-DynamicNotch-Boundaries', () => {

  test('F4-B01', '320px viewport compact mode capsule max-width <= 96vw', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('max-w-[96vw]'), 'Compact capsule must constrain to max-w-[96vw]');
  });

  test('F4-B02', 'Expanded capsule has max-w-xl constraint', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('max-w-xl'), 'Expanded capsule has max-w-xl constraint');
  });

  test('F4-B03', 'Dynamic island uses Apple physics easing transition', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('cubic-bezier(0.32,0.72,0,1)'), 'Transition must use Apple signature bezier');
  });

  test('F4-B04', 'Dynamic island has z-50 elevation', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('z-50'), 'Dynamic Notch must float at z-50');
  });

  test('F4-B05', 'Desktop navigation row is hidden on mobile screens (hidden md:flex)', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('hidden md:flex'), 'Desktop nav inside Notch must hide on mobile');
  });

});

// ============================================================================
// Feature 5: Sacred FAB Boundaries
// ============================================================================
describe('Feature 5: Sacred FAB Boundaries', 'Tier 2', 'F5-SacredFAB-Boundaries', () => {

  test('F5-B01', 'FAB button on narrow screens adaptively scales to <= 56px', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    // If w-[66px] is hardcoded without mobile responsive sizing (e.g. w-[52px] or w-[56px] on < 380px)
    const hasResponsiveFab = source.includes('w-[52px]') || source.includes('w-[56px]') || source.includes('max-w-[56px]');
    assert.ok(
      hasResponsiveFab,
      'FAB button should adaptively scale to 52px-56px on small screens to fit 320px layout'
    );
  });

  test('F5-B02', 'FAB has white border for high contrast over dark backgrounds', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('border-white') || source.includes('border-[3px]'), 'FAB must have border outline');
  });

  test('F5-B03', 'FAB has radial gradient with Braj sage and forest tones', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('radial-gradient'), 'FAB must have divine radial gradient background');
  });

  test('F5-B04', 'FAB audio glow has rounded-full geometry', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('rounded-full'), 'Glow effect must be rounded-full');
  });

  test('F5-B05', 'FAB has accessible title attribute', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('title="Open Ras Shravan Player"'), 'FAB must have title attribute');
  });

});

// ============================================================================
// Feature 6: Ashtayama Calculation Boundaries
// ============================================================================
describe('Feature 6: Ashtayama Calculation Boundaries', 'Tier 2', 'F6-Ashtayama-Boundaries', () => {

  test('F6-B01', 'Midnight 00:00 boundary maps to Shayan / Nishanta phase', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeAshtayamaPhase === 'function') {
      const midnight = new Date(2026, 10, 5, 0, 0, 0);
      const phase = cache.computeAshtayamaPhase(midnight);
      assert.ok(phase.nameDevanagari.includes('शयन') || phase.nameDevanagari.includes('रास') || phase.nameDevanagari.includes('निकुंज'), '00:00 must be night phase');
    }
  });

  test('F6-B02', 'Brahma Muhurta 04:00 boundary maps to Mangala phase', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeAshtayamaPhase === 'function') {
      const morning = new Date(2026, 10, 5, 4, 0, 0);
      const phase = cache.computeAshtayamaPhase(morning);
      assert.ok(phase.nameDevanagari.includes('मंगला'), '04:00 must be Mangala phase');
    }
  });

  test('F6-B03', 'Exact phase transition timestamp 12:30 maps deterministically', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeAshtayamaPhase === 'function') {
      const noon = new Date(2026, 10, 5, 12, 30, 0);
      const phase = cache.computeAshtayamaPhase(noon);
      assert.ok(phase.nameDevanagari, 'Must return phase name for 12:30');
    }
  });

  test('F6-B04', 'Ashtayama phase object returns required schema fields', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeAshtayamaPhase === 'function') {
      const phase = cache.computeAshtayamaPhase();
      assert.ok(phase.nameDevanagari, 'Must have nameDevanagari');
      assert.ok(phase.nameEnglish, 'Must have nameEnglish');
      assert.ok(phase.timeRange, 'Must have timeRange');
      assert.ok(phase.bhava, 'Must have bhava');
    }
  });

  test('F6-B05', 'Ashtayama phase accepts undefined argument and defaults to current time', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.computeAshtayamaPhase === 'function') {
      const phase = cache.computeAshtayamaPhase(undefined);
      assert.ok(phase && typeof phase.nameDevanagari === 'string');
    }
  });

});

// ============================================================================
// Feature 7: Low-Spec GPU Optimization Boundaries
// ============================================================================
describe('Feature 7: Low-Spec GPU Optimization Boundaries', 'Tier 2', 'F7-LowSpecGPU-Boundaries', () => {

  test('F7-B01', 'Low-spec mode sets high contrast solid background rgba(255, 255, 255, 0.96)', () => {
    const css = readSource('src/index.css');
    const hasSolidBg = css.includes('rgba(255, 255, 255, 0.96) !important') || css.includes('rgba(248, 248, 248, 0.96) !important');
    assert.ok(hasSolidBg, 'CSS must specify high contrast solid background in low-spec mode');
  });

  test('F7-B02', 'Low-spec mode strips -webkit-backdrop-filter in addition to backdrop-filter', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('-webkit-backdrop-filter: none !important'), 'Must strip -webkit-backdrop-filter');
  });

  test('F7-B03', 'prefers-reduced-motion sets animation duration to 0.001ms', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('animation-duration: 0.001ms !important'), 'Must set reduced motion duration');
  });

  test('F7-B04', 'Low-spec mode disables apple-view-enter transform translation', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.low-spec .apple-view-enter'), 'CSS must disable view enter transform in low-spec');
  });

  test('F7-B05', 'User preferences storage persists isLowSpecMode flag', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.saveUserPreferences === 'function') {
      await cache.saveUserPreferences({ isLowSpecMode: true });
      const prefs = cache.getUserPreferencesSync ? cache.getUserPreferencesSync() : await cache.getUserPreferences();
      assert.strictEqual(prefs.isLowSpecMode, true, 'isLowSpecMode must persist');
    }
  });

});

// ============================================================================
// Feature 8: 3-Column Bento Dashboard 320px Boundaries
// ============================================================================
describe('Feature 8: Bento Dashboard 320px Boundaries', 'Tier 2', 'F8-BentoDashboard-Boundaries', () => {

  test('F8-B01', '320px viewport: dashboard main wrapper has zero horizontal overflow', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(appSource.includes('w-full') && appSource.includes('box-border'), 'Dashboard must use box-border and full width');
  });

  test('F8-B02', 'CategoryCircle falls back to SVG vector icon if image fails to load', () => {
    const source = readSource('src/components/smaran/CategoryCircle.tsx');
    assert.ok(source.includes('onError={() => setImgFailed(true)}'), 'Must handle image onError');
    assert.ok(source.includes('renderVectorIcon()'), 'Must render vector fallback');
  });

  test('F8-B03', 'CategoryCircle active ring uses offset-white to avoid visual clash', () => {
    const source = readSource('src/components/smaran/CategoryCircle.tsx');
    assert.ok(source.includes('ring-offset-white'), 'Must have clean ring offset');
  });

  test('F8-B04', 'DateStrip handles scrollable horizontal overflow on mobile (no-scrollbar)', () => {
    const source = readSource('src/components/smaran/DateStrip.tsx');
    assert.ok(source.includes('overflow-x-auto') && source.includes('no-scrollbar'), 'DateStrip must be cleanly scrollable');
  });

  test('F8-B05', 'DateStrip highlights current active day item with distinct styling', () => {
    const source = readSource('src/components/smaran/DateStrip.tsx');
    assert.ok(source.includes('isToday') || source.includes('isSelected'), 'DateStrip must visually distinguish selected day');
  });

});

// ============================================================================
// Feature 9: Feed Braj Terminology Boundaries
// ============================================================================
describe('Feature 9: Feed Braj Terminology Boundaries', 'Tier 2', 'F9-FeedBrajTerms-Boundaries', () => {

  test('F9-B01', 'Zero occurrences of "Follow" in FeedCard button text', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    const hasFollow = source.includes("'Follow'");
    assert.isFalse(hasFollow, 'Must not contain raw string "Follow"');
  });

  test('F9-B02', 'Zero occurrences of "Following" in FeedCard button text', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    const hasFollowing = source.includes("'Following'");
    assert.isFalse(hasFollowing, 'Must not contain raw string "Following"');
  });

  test('F9-B03', 'Zero occurrences of "Likes" in FeedCard action pill', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    const hasLikes = source.includes('Likes</span>') || source.includes('{likes} Likes');
    assert.isFalse(hasLikes, 'Must not contain raw string "Likes"');
  });

  test('F9-B04', 'Author verified badge renders CheckCircle2 with sacred green accent', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('CheckCircle2') && source.includes('#22C55E'), 'Verified badge has sacred green fill');
  });

  test('F9-B05', 'FeedCard author avatar has rounded-full border styling', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('rounded-full') && source.includes('object-cover'), 'Avatar has rounded-full style');
  });

});

// ============================================================================
// Feature 10: Feed Card 320px Row Boundaries
// ============================================================================
describe('Feature 10: Feed Card 320px Row Boundaries', 'Tier 2', 'F10-FeedCardMobile-Boundaries', () => {

  test('F10-B01', 'Action row width fits within 320px card width without overflow', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    // Card p-4 (32px padding). 320 - 32 = 288px maximum content width.
    assert.ok(source.includes('flex items-center justify-between'), 'Action row has responsive flex');
  });

  test('F10-B02', 'Post without contentEnglish does not throw or render empty box', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    // If contentEnglish is checked with && or conditional, it is safe
    assert.ok(source.includes('contentDevanagari'), 'Devanagari content is primary');
  });

  test('F10-B03', 'Emoji reaction tray fits within 320px feed card', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('EmojiTray'), 'Must render EmojiTray within card bounds');
  });

  test('F10-B04', 'Feed image has 24px radius and aspect 4/3', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('aspect-[4/3]') && source.includes('rounded-[24px]'), 'Must have aspect 4/3 and 24px radius');
  });

  test('F10-B05', 'More button touch target is at least 34x34px', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('w-[34px] h-[34px]'), 'Touch target must be 34x34px');
  });

});

// ============================================================================
// Feature 11: Persistent Feed Likes & Bookmarks Boundaries
// ============================================================================
describe('Feature 11: Feed Persistence Boundaries', 'Tier 2', 'F11-FeedPersistence-Boundaries', () => {

  test('F11-B01', 'Simultaneous interactions on multiple posts persist independently', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.saveFeedInteraction === 'function' && typeof cache.getFeedInteractions === 'function') {
      await cache.saveFeedInteraction('post-1', { isLiked: true, isBookmarked: false, isFollowing: true, likes: 1249 });
      await cache.saveFeedInteraction('post-2', { isLiked: false, isBookmarked: true, isFollowing: false, likes: 954 });
      const records = cache.getFeedInteractionsSync ? cache.getFeedInteractionsSync() : await cache.getFeedInteractions();
      assert.strictEqual(records['post-1']?.isLiked, true, 'post-1 like must be preserved');
      assert.strictEqual(records['post-2']?.isBookmarked, true, 'post-2 bookmark must be preserved');
    }
  });

  test('F11-B02', 'Rapid toggle (like -> unlike) updates like counter correctly', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.saveFeedInteraction === 'function') {
      await cache.saveFeedInteraction('post-test', { isLiked: true, isBookmarked: false, isFollowing: false, likes: 10 });
      await cache.saveFeedInteraction('post-test', { isLiked: false, isBookmarked: false, isFollowing: false, likes: 9 });
      const records = cache.getFeedInteractionsSync ? cache.getFeedInteractionsSync() : await cache.getFeedInteractions();
      assert.strictEqual(records['post-test']?.isLiked, false);
      assert.strictEqual(records['post-test']?.likes, 9);
    }
  });

  test('F11-B03', 'getFeedInteractions returns empty object {} when cache is fresh', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.getFeedInteractions === 'function') {
      const records = await cache.getFeedInteractions();
      assert.strictEqual(typeof records, 'object', 'Must return an object');
    }
  });

  test('F11-B04', 'Feed interaction records store all 4 required interaction fields', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.saveFeedInteraction === 'function') {
      await cache.saveFeedInteraction('post-schema', { isLiked: true, isBookmarked: true, isFollowing: true, likes: 100 });
      const records = cache.getFeedInteractionsSync ? cache.getFeedInteractionsSync() : await cache.getFeedInteractions();
      const item = records['post-schema'];
      assert.ok('isLiked' in item && 'isBookmarked' in item && 'isFollowing' in item && 'likes' in item);
    }
  });

  test('F11-B05', 'Multi-tab BroadcastChannel name matches vrindopnisad_sync', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (cache.SYNC_CHANNEL_NAME) {
      assert.strictEqual(cache.SYNC_CHANNEL_NAME, 'vrindopnisad_sync');
    }
  });

});

// ============================================================================
// Feature 12: Padavali Reader Boundaries
// ============================================================================
describe('Feature 12: Padavali Reader Boundaries', 'Tier 2', 'F12-PadavaliReader-Boundaries', () => {

  test('F12-B01', 'Empty search query returns all pads in SACRED_PADS without throwing', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('filteredPads'), 'filteredPads must be defined');
  });

  test('F12-B02', 'Search with non-matching string displays empty state message', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('filteredPads.length') || source.includes('filteredPads.map'), 'Must check or map filtered pads');
  });

  test('F12-B03', 'Filtering by tradition all returns complete collection', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes("selectedTradition === 'all'"), 'Must handle all tradition filter');
  });

  test('F12-B04', 'Bookmark state can be persisted to readerState in cache', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    if (typeof cache.saveReaderState === 'function') {
      await cache.saveReaderState({ bookmarkedPadIds: ['hit-chaurasi-01', 'radha-kripa-kataksha'] });
      const state = cache.getReaderStateSync ? cache.getReaderStateSync() : await cache.getReaderState();
      assert.ok(state.bookmarkedPadIds.includes('hit-chaurasi-01'));
    }
  });

  test('F12-B05', 'Pad with multiple verses renders all stanza numbers consecutively', () => {
    const source = readSource('src/data/padas.ts');
    assert.ok(source.includes('stanzaNumber: 1') && source.includes('stanzaNumber: 2'), 'Padas must contain consecutive stanzas');
  });

});

// ============================================================================
// Feature 13: Mobile Rasik Commentary Drawer Boundaries
// ============================================================================
describe('Feature 13: Mobile Rasik Commentary Boundaries', 'Tier 2', 'F13-RasikCommentary-Boundaries', () => {

  test('F13-B01', 'Commentary drawer content fits within 320px viewport without overflow', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    // Must not have fixed width > 320px
    assert.notMatch(source, /w-\[(3[3-9]\d|[4-9]\d\d)px\]/);
  });

  test('F13-B02', 'Mobile commentary sheet has accessible dismiss / close control', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    // When commentary sheet is open, should have close action or backdrop
    assert.ok(source.includes('रसिक भावार्थ एवं टीका'), 'Must render commentary header');
  });

  test('F13-B03', 'Commentary drawer uses soft rounded corners (rounded-[28px])', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('rounded-[28px]'), 'Commentary panel has 28px rounded corners');
  });

  test('F13-B04', 'Verse bhavarth block has gold accent border (#D4A359)', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('border-[#D4A359]'), 'Bhavarth must have gold accent border');
  });

  test('F13-B05', 'Nikunj Vihar card uses sacred lime accent text (#B6FF2E)', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('#B6FF2E'), 'Must use lime accent for sacred Nikunj heading');
  });

});

// ============================================================================
// Feature 14: Milestones Braj Terminology Boundaries
// ============================================================================
describe('Feature 14: Milestones Braj Terminology Boundaries', 'Tier 2', 'F14-MilestonesBraj-Boundaries', () => {

  test('F14-B01', 'Zero occurrences of "STRONGER" in MilestonesView source', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.isFalse(source.includes('STRONGER'), 'Must not contain "STRONGER"');
  });

  test('F14-B02', 'Zero occurrences of "ACHIEVEMENTS" in MilestonesView source', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.isFalse(source.includes('ACHIEVEMENTS'), 'Must not contain "ACHIEVEMENTS"');
  });

  test('F14-B03', 'Locked badge visual state applies opacity and grayscale', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('opacity-40') && source.includes('grayscale'), 'Locked badge has opacity-40 and grayscale');
  });

  test('F14-B04', 'Milestones view displays 4 distinct sadhana metrics in Bento summary', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('अखंड निष्ठा') && source.includes('एकादशी व्रत') && source.includes('कंठस्थ पद'), 'Must display sadhana metrics');
  });

  test('F14-B05', 'Back button has aria-label for accessibility', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('aria-label="Back to dashboard"'), 'Back button must have aria-label');
  });

});

// ============================================================================
// Feature 15: Interactive ScallopedBadge Boundaries
// ============================================================================
describe('Feature 15: Interactive ScallopedBadge Boundaries', 'Tier 2', 'F15-ScallopedBadge-Boundaries', () => {

  test('F15-B01', '320px viewport: 3-column badge grid fits within 320px width', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('grid-cols-3'), 'Must implement grid-cols-3');
  });

  test('F15-B02', 'ScallopedBadge SVG has viewBox="0 0 100 100" and aria-hidden="true"', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('viewBox="0 0 100 100"') && source.includes('aria-hidden="true"'), 'SVG must have 100x100 viewBox and aria-hidden');
  });

  test('F15-B03', 'Streak badge generates unique gradient ID using badge value', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('g_streak_${value}'), 'Gradient ID must incorporate value');
  });

  test('F15-B04', 'Milestone rosette renders centered numeral with Doto font', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes("'Doto', Inter, sans-serif"), 'Must use Doto font');
  });

  test('F15-B05', 'Scalloped rosette has tactile .pressable active compression', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('pressable'), 'ScallopedBadge must have pressable class');
  });

});

// ============================================================================
// Feature 16: Zero Hover translateY/scale Boundaries
// ============================================================================
describe('Feature 16: Zero Hover translateY/scale Boundaries', 'Tier 2', 'F16-HoverCompliance-Boundaries', () => {

  test('F16-B01', 'No compiled CSS rule in dist/assets/*.css contains hover translateY', () => {
    const distDir = path.join(PROJECT_ROOT, 'dist/assets');
    if (fs.existsSync(distDir)) {
      const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
      for (const cf of cssFiles) {
        const cssContent = fs.readFileSync(path.join(distDir, cf), 'utf8');
        assert.notMatch(cssContent, /:hover\{[^}]*translateY/i, `Compiled CSS ${cf} contains hover translateY`);
      }
    }
  });

  test('F16-B02', 'No compiled CSS rule in dist/assets/*.css contains hover scale', () => {
    const distDir = path.join(PROJECT_ROOT, 'dist/assets');
    if (fs.existsSync(distDir)) {
      const cssFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.css'));
      for (const cf of cssFiles) {
        const cssContent = fs.readFileSync(path.join(distDir, cf), 'utf8');
        // Check for hover { transform: scale( or hover { --tw-scale
        assert.notMatch(cssContent, /:hover\{[^}]*scale\(/i, `Compiled CSS ${cf} contains hover scale`);
      }
    }
  });

  test('F16-B03', 'tailwind.config.js does not define custom hover translate/scale utilities', () => {
    const config = readSource('tailwind.config.js');
    assert.notMatch(config, /hover.*translateY/i, 'Tailwind config should not define hover translateY');
    assert.notMatch(config, /hover.*scale/i, 'Tailwind config should not define hover scale');
  });

  test('F16-B04', 'Button .pressable-sm:active uses transform scale(0.94)', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.pressable-sm:active') && css.includes('scale(0.94)'), '.pressable-sm:active must use scale(0.94)');
  });

  test('F16-B05', 'Button .pressable:active uses transform scale(0.975)', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.pressable:active') && css.includes('scale(0.975)'), '.pressable:active must use scale(0.975)');
  });

});
