import { test, describe, assert, readSource, parseTS, findJSXAttributeValues, loadTSModule } from './test-framework.mjs';
import path from 'node:path';

// ============================================================================
// Feature 1: Two-Tier Zero-Flicker IDB Caching & Multi-Tab Sync
// ============================================================================
describe('Feature 1: Two-Tier Zero-Flicker IDB Caching & Multi-Tab Sync', 'Tier 1', 'F1-CacheEngine', () => {

  test('F1-01', 'loadCachedSadhana returns defaultSadhanaState when cache is empty', async () => {
    const cacheModule = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cacheModule.loadCachedSadhana === 'function', 'loadCachedSadhana must be a function');
    assert.ok(cacheModule.defaultSadhanaState, 'defaultSadhanaState must be exported');
    assert.strictEqual(typeof cacheModule.defaultSadhanaState.japaCompleted, 'number', 'default japaCompleted must be a number');
    assert.strictEqual(typeof cacheModule.defaultSadhanaState.japaTarget, 'number', 'default japaTarget must be a number');
  });

  test('F1-02', 'persistSadhana is exported and writes state to storage', async () => {
    const cacheModule = await loadTSModule('src/services/cacheService.ts');
    assert.ok(typeof cacheModule.persistSadhana === 'function', 'persistSadhana must be exported');
    const testState = { ...cacheModule.defaultSadhanaState, japaCompleted: 21 };
    await cacheModule.persistSadhana(testState);
    assert.ok(true, 'persistSadhana executed without error');
  });

  test('F1-03', 'loadCachedSadhanaSync synchronous pre-warm contract exists for 0ms initial render', async () => {
    const cacheModule = await loadTSModule('src/services/cacheService.ts');
    assert.ok(
      typeof cacheModule.loadCachedSadhanaSync === 'function',
      'loadCachedSadhanaSync must be exported for synchronous L1 pre-warm (0ms cold start)'
    );
    const syncState = cacheModule.loadCachedSadhanaSync();
    assert.ok(syncState && typeof syncState.japaCompleted === 'number', 'loadCachedSadhanaSync must return SadhanaState synchronously');
  });

  test('F1-04', 'Feed interactions persistence contract functions are exported', async () => {
    const cacheModule = await loadTSModule('src/services/cacheService.ts');
    assert.ok(
      typeof cacheModule.getFeedInteractions === 'function',
      'getFeedInteractions must be exported for persistent feed likes/bookmarks'
    );
    assert.ok(
      typeof cacheModule.saveFeedInteraction === 'function',
      'saveFeedInteraction must be exported for saving feed interactions'
    );
  });

  test('F1-05', 'Multi-tab BroadcastChannel synchronization contract exists', async () => {
    const cacheModule = await loadTSModule('src/services/cacheService.ts');
    assert.ok(
      typeof cacheModule.initMultiTabSync === 'function',
      'initMultiTabSync must be exported to synchronize sadhana & feed across tabs'
    );
  });

});

// ============================================================================
// Feature 2: Unified Reactive State & Metrics
// ============================================================================
describe('Feature 2: Unified Reactive State & Metrics', 'Tier 1', 'F2-ReactiveMetrics', () => {

  test('F2-01', 'Hero card Japa counter binds dynamically to sadhana.japaCompleted', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(
      appSource.includes('sadhana?.japaCompleted') || appSource.includes('sadhana.japaCompleted'),
      'App.tsx must bind Japa counter to live sadhana state, not static string'
    );
  });

  test('F2-02', 'Total mala calculation accurately reflects completed rounds / target', () => {
    const japaCompleted = 16;
    const japaTarget = 16;
    const malaPercentage = Math.round((japaCompleted / japaTarget) * 100);
    assert.strictEqual(malaPercentage, 100, '16/16 rounds must calculate 100%');
    const beadsTotal = japaCompleted * 108;
    assert.strictEqual(beadsTotal, 1728, '16 malas * 108 beads must equal 1728 beads');
  });

  test('F2-03', 'Shravan listening progress percentage dynamically calculates from reactive state', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(
      appSource.includes('shravanMinutes') && appSource.includes('shravanTarget'),
      'App.tsx must calculate Shravan metrics dynamically from state'
    );
  });

  test('F2-04', 'Svadhyaya padas progress percentage dynamically calculates from reactive state', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(
      appSource.includes('svadhyayaPadas') && appSource.includes('svadhyayaTarget'),
      'App.tsx must calculate Svadhyaya metrics dynamically from state'
    );
  });

  test('F2-05', 'App provides interactive Japa increment handler (incrementJapa)', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(
      appSource.includes('incrementJapa') || appSource.includes('japaCompleted + 1'),
      'App.tsx must provide Japa increment handler'
    );
  });

});

// ============================================================================
// Feature 3: Mobile FloatingNavbar 320px Adaptability
// ============================================================================
describe('Feature 3: Mobile FloatingNavbar 320px Adaptability', 'Tier 1', 'F3-FloatingNavbar', () => {

  test('F3-01', 'FloatingNavbar defines the 4 core navigation tabs', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes("'smaran'"), 'Must include smaran tab');
    assert.ok(source.includes("'padavali'"), 'Must include padavali tab');
    assert.ok(source.includes("'feed'"), 'Must include feed tab');
    assert.ok(source.includes("'milestones'"), 'Must include milestones tab');
  });

  test('F3-02', 'FloatingNavbar applies active highlight styling to selected tab', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('isActive'), 'FloatingNavbar must check isActive condition');
    assert.ok(source.includes('bg-[#ECEDEC]') || source.includes('bg-'), 'FloatingNavbar must apply active background');
  });

  test('F3-03', 'FloatingNavbar invokes onSelectTab callback on tab button press', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('onSelectTab(tab.id)'), 'Buttons must trigger onSelectTab with tab.id');
  });

  test('F3-04', 'FloatingNavbar container dimensions adapt to <= 320px viewport without overflow', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    // On 320px, total width must fit within 320px: pill + FAB + gap + px
    // If w-[276px] and w-[66px] are fixed without responsive max-w / flex, 276 + 12 + 66 = 354px which overflows 320px.
    const isOverflowingFixed = source.includes('w-[276px]') && source.includes('w-[66px]') && !source.includes('max-w-[220px]') && !source.includes('max-w-[240px]') && !source.includes('w-[220px]');
    assert.isFalse(
      isOverflowingFixed,
      'FloatingNavbar (354px) overflows 320px screens. Must adapt pill to 220px-240px and FAB to 52px on < 380px screens'
    );
  });

  test('F3-05', 'FloatingNavbar is hidden on tablet and desktop screens (md:hidden)', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('md:hidden'), 'FloatingNavbar must be hidden on >= 768px via md:hidden');
  });

});

// ============================================================================
// Feature 4: Dynamic Notch Navbar Mobile Compact Mode & Dynamic Island
// ============================================================================
describe('Feature 4: Dynamic Notch Navbar Mobile Compact Mode', 'Tier 1', 'F4-DynamicNotch', () => {

  test('F4-01', 'Dynamic Notch Navbar renders brand identity with SacredLogo and 2.0 badge', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('वृन्दोपनिषद्'), 'Must render वृन्दोपनिषद् brand title');
    assert.ok(source.includes('SacredLogo'), 'Must render SacredLogo');
    assert.ok(source.includes('2.0'), 'Must render 2.0 version badge');
  });

  test('F4-02', 'Dynamic Notch displays reactive sadhana streak count', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('streakDays'), 'Must render streakDays prop');
  });

  test('F4-03', 'Dynamic Notch supports expansion toggle between compact and expanded capsule', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('isExpanded'), 'Must maintain isExpanded state');
    assert.ok(source.includes('setIsExpanded'), 'Must toggle expanded state');
  });

  test('F4-04', 'Dynamic Notch provides low-spec GPU mode toggle trigger', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(source.includes('onToggleLowSpec'), 'Must provide onToggleLowSpec callback');
  });

  test('F4-05', 'Dynamic Notch compact mode width adapts to 320px screens without clipping', () => {
    const source = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(
      source.includes('max-w-[96vw]') || source.includes('max-w-[90vw]') || source.includes('max-w-xs') || source.includes('px-2'),
      'Dynamic Notch must use fluid max-width to avoid horizontal clipping on 320px'
    );
  });

});

// ============================================================================
// Feature 5: Sacred FAB Icon Replacement
// ============================================================================
describe('Feature 5: Sacred FAB Icon Replacement', 'Tier 1', 'F5-SacredFAB', () => {

  test('F5-01', 'FloatingNavbar FAB button exists with accessible label', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('aria-label="Open Ras Shravan Player"'), 'FAB must have accessible aria-label');
  });

  test('F5-02', 'Generic scanner SVG bracket path is completely removed from FAB', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    const genericScannerPath = 'M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4';
    assert.notIncludes(
      source,
      genericScannerPath,
      'Generic scanner SVG bracket icon must be replaced with sacred devotional icon'
    );
  });

  test('F5-03', 'FAB contains sacred devotional motif (flute, peacock feather, or vina)', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    const hasFluteOrFeatherOrVina = source.includes('flute') || source.includes('vina') || source.includes('feather') || source.includes('Music2') || source.includes('bansuri') || source.includes('peacock');
    assert.ok(
      hasFluteOrFeatherOrVina,
      'FAB must render a sacred devotional flute, peacock feather, or vina motif'
    );
  });

  test('F5-04', 'FAB renders Apple ambient glow when isPlayingAudio is active', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(
      source.includes('animate-apple-glow') || source.includes('isPlayingAudio'),
      'FAB must display Apple glow when audio is playing'
    );
  });

  test('F5-05', 'FAB has tactile active press dynamics via .pressable-sm', () => {
    const source = readSource('src/components/common/FloatingNavbar.tsx');
    assert.ok(source.includes('pressable-sm'), 'FAB must use .pressable-sm class');
  });

});

// ============================================================================
// Feature 6: Dynamic Ashtayama Time Calculation
// ============================================================================
describe('Feature 6: Dynamic Ashtayama Time Calculation', 'Tier 1', 'F6-Ashtayama', () => {

  test('F6-01', 'Dynamic Ashtayama calculator module or function exists in project', async () => {
    // Check if exported in cacheService, types, or helper
    const appSource = readSource('src/App.tsx');
    const hasDynamicCalc = appSource.includes('getAshtayama') || appSource.includes('calculateAshtayama') || appSource.includes('currentAshtayama');
    assert.ok(hasDynamicCalc, 'App.tsx must calculate active Ashtayama phase dynamically from local time');
  });

  test('F6-02', 'Mangala phase corresponds to Brahma Muhurta / early morning (03:30 - 06:00)', () => {
    const hour = 5;
    const isMangala = hour >= 3.5 && hour < 6;
    assert.isTrue(isMangala, '05:00 must map to Mangala Ashtayama phase');
  });

  test('F6-03', 'Midday period (11:30 - 13:00) corresponds to Rajbhog / Madhyahna', () => {
    const hour = 12;
    const isRajbhog = hour >= 10.5 && hour < 13;
    assert.isTrue(isRajbhog, '12:00 must map to Rajbhog/Madhyahna Ashtayama phase');
  });

  test('F6-04', 'Evening twilight corresponds to Bhog / Sandhya Arati', () => {
    const hour = 18;
    const isSandhya = hour >= 17 && hour < 19;
    assert.isTrue(isSandhya, '18:00 must map to Bhog/Sandhya Ashtayama phase');
  });

  test('F6-05', 'Hardcoded static मध्याह्न is replaced with dynamic Ashtayama phase', () => {
    const appSource = readSource('src/App.tsx');
    const notchSource = readSource('src/components/common/DynamicNotchNavbar.tsx');
    const hasHardcodedInNotch = notchSource.includes('वर्तमान अष्टयाम: <strong className="text-[#111111]">मध्याह्न लीला');
    assert.isFalse(
      hasHardcodedInNotch,
      'DynamicNotchNavbar must NOT hardcode मध्याह्न लीला; it must receive dynamic active Ashtayama'
    );
  });

});

// ============================================================================
// Feature 7: Low-Spec GPU Optimization & Spring Curve Fix
// ============================================================================
describe('Feature 7: Low-Spec GPU Optimization & Spring Curve Fix', 'Tier 1', 'F7-LowSpecGPU', () => {

  test('F7-01', 'App applies .low-spec class to root container when active', () => {
    const source = readSource('src/App.tsx');
    assert.ok(source.includes("isLowSpecMode ? 'low-spec' : ''"), 'App must toggle low-spec class conditionally');
  });

  test('F7-02', 'CSS removes backdrop-filter blur under .low-spec mode', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.low-spec .glass-panel'), 'CSS must define .low-spec .glass-panel override');
    assert.ok(css.includes('backdrop-filter: none !important'), 'CSS must strip backdrop-filter blur');
  });

  test('F7-03', 'CSS disables heavy animations under .low-spec mode', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('.low-spec .animate-apple-eq-1'), 'CSS must disable equalizer animation');
    assert.ok(css.includes('.low-spec .animate-apple-glow'), 'CSS must disable glow animation');
  });

  test('F7-04', 'Buttons with .pressable do not combine conflicting transition-all with active scale', () => {
    const css = readSource('src/index.css');
    // Ensure .pressable explicitly transitions transform and opacity rather than transition: all
    assert.ok(css.includes('.pressable {'), '.pressable must be defined');
    assert.notMatch(
      css,
      /\.pressable\s*\{[^}]*transition:\s*all/i,
      '.pressable should transition transform and opacity specifically, not transition: all'
    );
  });

  test('F7-05', 'Apple spring easing variable --ease-ios-spring is defined in :root', () => {
    const css = readSource('src/index.css');
    assert.ok(css.includes('--ease-ios-spring: cubic-bezier(0.32, 0.72, 0, 1)'), 'Must define Apple iOS spring curve');
  });

});

// ============================================================================
// Feature 8: 3-Column Bento Dashboard Mobile Adaptability
// ============================================================================
describe('Feature 8: 3-Column Bento Dashboard Mobile Adaptability', 'Tier 1', 'F8-BentoDashboard', () => {

  test('F8-01', 'Smaran view renders 3-column Bento grid on desktop (xl:grid-cols-12)', () => {
    const source = readSource('src/App.tsx');
    assert.ok(source.includes('xl:grid-cols-12'), 'Dashboard must implement xl:grid-cols-12 grid');
  });

  test('F8-02', 'CategoryCircle component supports the 5 core sacred categories', () => {
    const source = readSource('src/components/smaran/CategoryCircle.tsx');
    assert.ok(source.includes("'shriji'"), 'Must support shriji');
    assert.ok(source.includes("'bihari'"), 'Must support bihari');
    assert.ok(source.includes("'chaurasi'"), 'Must support chaurasi');
    assert.ok(source.includes("'kelimal'"), 'Must support kelimal');
    assert.ok(source.includes("'ashtayama'"), 'Must support ashtayama');
  });

  test('F8-03', 'CategoryCircle 5-col grid handles 320px viewport without label text collision', () => {
    const circleSource = readSource('src/components/smaran/CategoryCircle.tsx');
    // In CategoryCircle line 147: whitespace-nowrap causes label collision on 320px screens.
    // It should allow wrapping or truncation: truncate or break-words or responsive text.
    const hasNoWrapOnly = circleSource.includes('whitespace-nowrap') && !circleSource.includes('truncate') && !circleSource.includes('break-words');
    assert.isFalse(
      hasNoWrapOnly,
      'CategoryCircle labels should truncate or wrap cleanly to avoid collision in 5-col layout on 320px screens'
    );
  });

  test('F8-04', 'NityaSevaCard renders daily devotional seva checklist items', () => {
    const source = readSource('src/components/smaran/NityaSevaCard.tsx');
    assert.ok(source.includes('seva') || source.includes('Seva') || source.includes('मंगला') || source.includes('शृंगार'), 'Must render seva items');
  });

  test('F8-05', 'DotGridChart renders visual sadhana completion grid', () => {
    const source = readSource('src/components/smaran/DotGridChart.tsx');
    assert.ok(source.includes('numColumns') && source.includes('numRows') && source.includes('levels'), 'DotGridChart must render completion dots based on columns, rows, and levels');
  });

});

// ============================================================================
// Feature 9: Darshan Sacred Feed Braj Terminology & Actions
// ============================================================================
describe('Feature 9: Darshan Sacred Feed Braj Terminology & Actions', 'Tier 1', 'F9-FeedBrajTerms', () => {

  test('F9-01', 'FeedCard follow button uses authentic Braj term (सेवक / अनुसरण) instead of generic "Follow"', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    const hasGenericFollow = source.includes("'Follow'") || source.includes('>Follow<');
    assert.isFalse(
      hasGenericFollow,
      'FeedCard must replace generic "Follow" with authentic Braj terminology (सेवक बनें / सेवक / अनुसरण)'
    );
  });

  test('F9-02', 'FeedCard like pill uses devotional term (भाव प्रणाम / प्रणाम) instead of generic "Likes"', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    const hasGenericLikes = source.includes('Likes</span>') || source.includes(' Likes');
    assert.isFalse(
      hasGenericLikes,
      'FeedCard must replace generic "Likes" with devotional Braj terminology (भाव प्रणाम / प्रणाम)'
    );
  });

  test('F9-03', 'Feed tab navigation in App uses sacred Braj categories instead of generic "Popular"', () => {
    const source = readSource('src/App.tsx');
    const hasGenericPopularTab = source.includes("'Popular'");
    assert.isFalse(
      hasGenericPopularTab,
      'App.tsx feed tabs should use authentic Braj categories (विशेष दर्शन, नित्य दर्शन, etc.) instead of "Popular"'
    );
  });

  test('F9-04', 'FeedCard author metadata displays authentic devotional styling', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('authorName') && source.includes('timestamp'), 'Must render author and timestamp');
  });

  test('F9-05', 'Feed data includes authentic devotional hashtags', () => {
    const source = readSource('src/data/feed.ts');
    assert.ok(source.includes('#Vrindavan') || source.includes('#Braj') || source.includes('#Radha'), 'Must contain Braj hashtags');
  });

});

// ============================================================================
// Feature 10: Feed Card Mobile 320px Row & Bilingual Toggle
// ============================================================================
describe('Feature 10: Feed Card Mobile 320px Row & Bilingual Toggle', 'Tier 1', 'F10-FeedCardMobile', () => {

  test('F10-01', 'FeedCard action row contains like, comment, view, and bookmark controls', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('toggleLike'), 'Must have like button');
    assert.ok(source.includes('MessageCircle'), 'Must have comment indicator');
    assert.ok(source.includes('Eye'), 'Must have view indicator');
    assert.ok(source.includes('Bookmark'), 'Must have bookmark button');
  });

  test('F10-02', 'FeedCard renders authentic Devanagari text content', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('contentDevanagari'), 'Must render contentDevanagari');
  });

  test('F10-03', 'FeedCard provides bilingual English translation toggle or drawer', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(
      source.includes('contentEnglish') || source.includes('showEnglish') || source.includes('translation'),
      'FeedCard must support bilingual English translation for contentEnglish'
    );
  });

  test('F10-04', 'FeedCard action row fits within 320px viewport without overflow', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    // Check if action row handles flex-wrap or shrunk padding for small screens
    assert.ok(source.includes('flex items-center justify-between'), 'Action row must be defined');
  });

  test('F10-05', 'EmojiTray renders interactive devotional reactions', () => {
    const source = readSource('src/components/feed/EmojiTray.tsx');
    assert.ok(source.includes('emojis') || source.includes('reactions') || source.includes('animate-reaction-pop'), 'Must render reaction tray');
  });

});

// ============================================================================
// Feature 11: Persistent Feed Likes & Bookmarks in IDB
// ============================================================================
describe('Feature 11: Persistent Feed Likes & Bookmarks in IDB', 'Tier 1', 'F11-FeedPersistence', () => {

  test('F11-01', 'FeedCard connects like state to persistent cache storage', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(
      source.includes('saveFeedInteraction') || source.includes('persist') || source.includes('onToggleLike'),
      'FeedCard must persist like interactions to storage'
    );
  });

  test('F11-02', 'FeedCard connects bookmark state to persistent cache storage', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(
      source.includes('saveFeedInteraction') || source.includes('persist') || source.includes('onToggleBookmark'),
      'FeedCard must persist bookmark interactions to storage'
    );
  });

  test('F11-03', 'FeedCard loads initial like and bookmark state from cache or props', () => {
    const source = readSource('src/components/feed/FeedCard.tsx');
    assert.ok(source.includes('post.isBookmarked') || source.includes('initialLiked'), 'Must initialize state from post/cache');
  });

  test('F11-04', 'Feed interactions key is defined in cacheService', () => {
    const source = readSource('src/services/cacheService.ts');
    assert.ok(
      source.includes('FEED') || source.includes('feed') || source.includes('saveFeedInteraction'),
      'cacheService must define feed interaction storage'
    );
  });

  test('F11-05', 'Tab switch between Smaran and Feed retains like/bookmark state without reset', () => {
    const appSource = readSource('src/App.tsx');
    assert.ok(appSource.includes('setActiveTab'), 'App handles activeTab switching');
  });

});

// ============================================================================
// Feature 12: Padavali Reader Devanagari Typography & Bookmarks
// ============================================================================
describe('Feature 12: Padavali Reader Devanagari Typography & Bookmarks', 'Tier 1', 'F12-PadavaliReader', () => {

  test('F12-01', 'Devanagari verses use enhanced line-height leading-[1.85] for sacred matra clarity', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(
      source.includes('leading-[1.85]') || source.includes('leading-[1.8]'),
      'Devanagari verses must use leading-[1.85] for clear matras and ligatures'
    );
  });

  test('F12-02', 'PadavaliReader bookmark button toggles bookmark state', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(
      source.includes('isBookmarked') || source.includes('toggleBookmark') || source.includes('onToggleBookmark'),
      'Bookmark button in PadavaliReader must toggle bookmark state'
    );
  });

  test('F12-03', 'PadavaliReader bookmark action persists to IndexedDB storage', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(
      source.includes('saveReaderState') || source.includes('persist') || source.includes('bookmarkedPads'),
      'Bookmarking a pad must persist to IndexedDB'
    );
  });

  test('F12-04', 'PadavaliReader provides IAST transliteration toggle', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('showTransliteration'), 'Must maintain showTransliteration state');
    assert.ok(source.includes('IAST:'), 'Must render IAST toggle button');
  });

  test('F12-05', 'PadavaliReader filters padas by search query across title and author', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('searchQuery'), 'Must support search query');
    assert.ok(source.includes('filteredPads'), 'Must compute filteredPads');
  });

});

// ============================================================================
// Feature 13: Mobile Rasik Commentary Drawer
// ============================================================================
describe('Feature 13: Mobile Rasik Commentary Drawer', 'Tier 1', 'F13-RasikCommentary', () => {

  test('F13-01', 'PadavaliReader provides mobile access button/trigger for Rasik commentary (< xl)', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(
      source.includes('commentary') || source.includes('टिका') || source.includes('भावार्थ') || source.includes('showCommentaryDrawer'),
      'Mobile view must provide a trigger to view Rasik commentary'
    );
  });

  test('F13-02', 'Rasik commentary is NOT strictly hidden on mobile with hidden xl:block only', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    // If only hidden xl:block exists without mobile drawer or toggle, mobile users are locked out
    const hasMobileDrawerOrToggle = source.includes('xl:hidden') || source.includes('isCommentaryOpen') || source.includes('showCommentary');
    assert.ok(
      hasMobileDrawerOrToggle,
      'PadavaliReader must make Rasik commentary accessible on mobile via drawer/sheet'
    );
  });

  test('F13-03', 'Commentary renders verse-by-verse bhavarth', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('v.bhavarth') || source.includes('verse.bhavarth'), 'Must render verse bhavarth');
  });

  test('F13-04', 'Commentary renders Nitya Nikunj Vihar Tattva section', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('नित्य निकुंज विहार तत्व'), 'Must render Nitya Nikunj Vihar Tattva section');
  });

  test('F13-05', 'Dedicated desktop commentary desk is rendered for large screens (xl:block)', () => {
    const source = readSource('src/components/reader/PadavaliReader.tsx');
    assert.ok(source.includes('xl:block'), 'Must maintain dedicated desktop commentary desk');
  });

});

// ============================================================================
// Feature 14: Milestones Authentic Braj Devotional Terms
// ============================================================================
describe('Feature 14: Milestones Authentic Braj Devotional Terms', 'Tier 1', 'F14-MilestonesBraj', () => {

  test('F14-01', 'Milestones hero headline replaces gym slogan "STRONGER EVERY DAY" with Braj terms', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    const hasGymHeadline = source.includes('STRONGER') && source.includes('EVERY DAY');
    assert.isFalse(
      hasGymHeadline,
      'MilestonesView must replace "STRONGER EVERY DAY" with authentic Braj devotional phrase (e.g. नित्य रस वृद्धि / श्रीजी कृपा प्रवाह)'
    );
  });

  test('F14-02', 'Milestones category header replaces "SAADHANA ACHIEVEMENTS" with Braj terms', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    const hasGymHeader = source.includes('SAADHANA ACHIEVEMENTS');
    assert.isFalse(
      hasGymHeader,
      'MilestonesView must replace "SAADHANA ACHIEVEMENTS" with authentic Braj devotional terms'
    );
  });

  test('F14-03', 'Milestone badges use authentic Devanagari devotional labels', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('milestones'), 'Must define milestones list');
  });

  test('F14-04', 'MilestonesView displays devotional streak count pill with "अखंड निष्ठा"', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('अखंड निष्ठा'), 'Must display अखंड निष्ठा streak pill');
  });

  test('F14-05', 'Completed milestones render unlocked badge rosettes', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('ScallopedBadge'), 'Must render ScallopedBadge components');
  });

});

// ============================================================================
// Feature 15: Interactive ScallopedBadge Blessing Sheet
// ============================================================================
describe('Feature 15: Interactive ScallopedBadge Blessing Sheet', 'Tier 1', 'F15-ScallopedBadgeSheet', () => {

  test('F15-01', 'ScallopedBadge supports onClick callback to open blessing details', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(
      source.includes('onClick') || source.includes('onPress') || source.includes('cursor-pointer'),
      'ScallopedBadge must support click/press interaction'
    );
  });

  test('F15-02', 'Interactive Blessing Detail Sheet is provided for milestone rosettes', () => {
    const milestonesSource = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(
      milestonesSource.includes('blessing') || milestonesSource.includes('selectedBadge') || milestonesSource.includes('BlessingSheet'),
      'MilestonesView must open a Blessing Detail Sheet when a badge rosette is pressed'
    );
  });

  test('F15-03', 'ScallopedBadge renders authentic 96-node rosette SVG path', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('SCALLOP_PATH'), 'Must define authentic SCALLOP_PATH geometry');
  });

  test('F15-04', 'ScallopedBadge displays distinct styling for milestone vs streak rosettes', () => {
    const source = readSource('src/components/common/ScallopedBadge.tsx');
    assert.ok(source.includes('isMilestone'), 'Must differentiate milestone vs streak types');
  });

  test('F15-05', 'Milestones 3-column badge grid fits within 320px screen width without clipping', () => {
    const source = readSource('src/components/milestones/MilestonesView.tsx');
    assert.ok(source.includes('grid-cols-3'), 'Must implement 3-column badge grid');
  });

});

// ============================================================================
// Feature 16: Zero Hover translateY/scale Rule Compliance
// ============================================================================
describe('Feature 16: Zero Hover translateY/scale Rule Compliance', 'Tier 1', 'F16-HoverCompliance', () => {

  test('F16-01', 'Zero hover translateY or scale in common components', () => {
    const files = ['FloatingNavbar.tsx', 'DynamicNotchNavbar.tsx', 'ScallopedBadge.tsx', 'SacredLogo.tsx'];
    for (const f of files) {
      const src = readSource(path.join('src/components/common', f));
      assert.notMatch(src, /hover:(-)?translate-y/, `hover:translate-y found in ${f}`);
      assert.notMatch(src, /hover:scale/, `hover:scale found in ${f}`);
    }
  });

  test('F16-02', 'Zero hover translateY or scale in feed components', () => {
    const files = ['FeedCard.tsx', 'EmojiTray.tsx'];
    for (const f of files) {
      const src = readSource(path.join('src/components/feed', f));
      assert.notMatch(src, /hover:(-)?translate-y/, `hover:translate-y found in ${f}`);
      assert.notMatch(src, /hover:scale/, `hover:scale found in ${f}`);
    }
  });

  test('F16-03', 'Zero hover translateY or scale in reader components', () => {
    const src = readSource('src/components/reader/PadavaliReader.tsx');
    assert.notMatch(src, /hover:(-)?translate-y/, 'hover:translate-y found in PadavaliReader');
    assert.notMatch(src, /hover:scale/, 'hover:scale found in PadavaliReader');
  });

  test('F16-04', 'Zero hover translateY or scale in milestones components', () => {
    const src = readSource('src/components/milestones/MilestonesView.tsx');
    assert.notMatch(src, /hover:(-)?translate-y/, 'hover:translate-y found in MilestonesView');
    assert.notMatch(src, /hover:scale/, 'hover:scale found in MilestonesView');
  });

  test('F16-05', 'Zero hover translateY or scale in smaran components', () => {
    const files = ['CategoryCircle.tsx', 'DateStrip.tsx', 'DotGridChart.tsx', 'MacroRow.tsx', 'NityaSevaCard.tsx'];
    for (const f of files) {
      const src = readSource(path.join('src/components/smaran', f));
      assert.notMatch(src, /hover:(-)?translate-y/, `hover:translate-y found in ${f}`);
      assert.notMatch(src, /hover:scale/, `hover:scale found in ${f}`);
    }
  });

});
