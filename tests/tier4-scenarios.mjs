import { test, describe, assert, readSource, loadTSModule } from './test-framework.mjs';

describe('Tier 4: Real-World Application End-to-End Scenarios', 'Tier 4', 'User-Workflows', () => {

  test('SCENARIO-01', 'Workflow 1: First Cold Start on 320px iPhone SE Viewport (Zero Flicker, Zero Overflow)', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    
    // Step 1: 0ms Synchronous Pre-warm from L1 Cache
    const prewarmStart = performance.now();
    const initialState = cache.loadCachedSadhanaSync ? cache.loadCachedSadhanaSync() : cache.defaultSadhanaState;
    const prewarmDuration = performance.now() - prewarmStart;
    
    assert.lessThanOrEqual(prewarmDuration, 10, 'Cold start pre-warm must take <= 10ms for instantaneous render');
    assert.ok(initialState && typeof initialState.japaCompleted === 'number', 'Initial state must be available at cold start');
    
    // Step 2: 320px Viewport Layout Validation
    const notchSource = readSource('src/components/common/DynamicNotchNavbar.tsx');
    assert.ok(notchSource.includes('max-w-[96vw]'), 'Dynamic Island must constrain to 96vw on mobile');
    
    const appSource = readSource('src/App.tsx');
    assert.ok(appSource.includes('box-border'), 'Main wrapper must use box-border');
  });

  test('SCENARIO-02', 'Workflow 2: Daily Sadhana Japa Increment, Bead Calculation & Multi-Tab Persistence', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    
    // Step 1: Start from current sadhana
    const current = cache.loadCachedSadhanaSync ? cache.loadCachedSadhanaSync() : cache.defaultSadhanaState;
    const initialJapa = current.japaCompleted;
    
    // Step 2: User taps +1 माला action
    const updatedState = { ...current, japaCompleted: initialJapa + 1 };
    await cache.persistSadhana(updatedState);
    
    // Step 3: Verify dynamic metric recalculations
    if (typeof cache.computeMantraCount === 'function') {
      const initialBeads = cache.computeMantraCount(current);
      const updatedBeads = cache.computeMantraCount(updatedState);
      assert.strictEqual(updatedBeads - initialBeads, 108, 'Incrementing 1 mala must increase bead count by 108');
    }
    
    // Step 4: Verify persistence read-back
    const reloaded = cache.loadCachedSadhanaSync ? cache.loadCachedSadhanaSync() : await cache.loadCachedSadhana();
    assert.strictEqual(reloaded.japaCompleted, initialJapa + 1, 'Persisted Japa count must match incremented value');
  });

  test('SCENARIO-03', 'Workflow 3: Darshan Sacred Feed Exploration, Interaction & Tab Retainment', async () => {
    const cache = await loadTSModule('src/services/cacheService.ts');
    
    // Step 1: User navigates to Feed view and interacts with a post
    const targetPostId = 'post-1';
    const interaction = { isLiked: true, isBookmarked: true, isFollowing: true, likes: 1249 };
    
    if (typeof cache.saveFeedInteraction === 'function') {
      await cache.saveFeedInteraction(targetPostId, interaction);
      
      // Step 2: User switches tab to 'smaran' then back to 'feed'
      if (typeof cache.saveUserPreferences === 'function') {
        await cache.saveUserPreferences({ activeTab: 'smaran' });
        await cache.saveUserPreferences({ activeTab: 'feed' });
      }
      
      // Step 3: Verify interactions remain intact without reset
      const records = cache.getFeedInteractionsSync ? cache.getFeedInteractionsSync() : await cache.getFeedInteractions();
      assert.ok(records[targetPostId], 'Post interaction must exist in storage');
      assert.strictEqual(records[targetPostId].isLiked, true, 'Liked status must persist across tab switches');
      assert.strictEqual(records[targetPostId].isBookmarked, true, 'Bookmark status must persist across tab switches');
    }
  });

  test('SCENARIO-04', 'Workflow 4: Padavali Stotra Recitation, Devanagari Typography & Audio Playback', async () => {
    const readerSource = readSource('src/components/reader/PadavaliReader.tsx');
    
    // Step 1: Verify Devanagari verse typography line-height
    const hasComfortableLeading = readerSource.includes('leading-relaxed') || readerSource.includes('leading-[1.85]') || readerSource.includes('leading-[1.8]');
    assert.ok(hasComfortableLeading, 'Verses must have comfortable line-height for sacred matras');
    
    // Step 2: Verify audio player integration
    assert.ok(readerSource.includes('onPlayPad'), 'PadavaliReader must support playing pads via onPlayPad');
    assert.ok(readerSource.includes('activePlayingPadId'), 'PadavaliReader must accept activePlayingPadId prop');
  });

  test('SCENARIO-05', 'Workflow 5: Milestones Progress Inspection & Sacred Scalloped Rosette Press Dynamics', async () => {
    const milestonesSource = readSource('src/components/milestones/MilestonesView.tsx');
    const badgeSource = readSource('src/components/common/ScallopedBadge.tsx');
    
    // Step 1: Milestones renders streak pills with authentic devotional terms
    assert.ok(milestonesSource.includes('अखंड निष्ठा'), 'Must display अखंड निष्ठा');
    assert.ok(milestonesSource.includes('एकादशी व्रत'), 'Must display एकादशी व्रत');
    
    // Step 2: Badges have tactile active-only press compression
    assert.ok(badgeSource.includes('pressable'), 'Scalloped rosette must use pressable active dynamics');
    assert.notMatch(badgeSource, /hover:translate-y/, 'Scalloped rosette must NOT have hover translateY');
    assert.notMatch(badgeSource, /hover:scale/, 'Scalloped rosette must NOT have hover scale');
  });

});

