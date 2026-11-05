import { get, set } from 'idb-keyval';
import {
  SadhanaState,
  FeedInteractionData,
  ReaderState,
  UserPreferences,
  MultiTabSyncEvent,
  AshtayamaPhaseInfo,
  DhyanaSessionRecord,
  ContemplativeMetrics,
  SacredReflectionEntry,
  DhyanaImpactState,
  FlowStage,
} from '../types/devotional';

// Storage Keys
export const SADHANA_STORAGE_KEY = 'vrindopnisad_sadhana_v2';
export const CACHED_PADS_KEY = 'vrindopnisad_cached_pads_v2';
export const FEED_INTERACTIONS_KEY = 'vrindopnisad_feed_v2';
export const READER_STATE_KEY = 'vrindopnisad_padavali_v2';
export const PREFERENCES_KEY = 'vrindopnisad_preferences_v2';
export const DHYANA_IMPACT_STORAGE_KEY = 'vrindopnisad_dhyana_v2';
export const SYNC_CHANNEL_NAME = 'vrindopnisad_sync';
export const SYNC_STORAGE_BUS_KEY = 'vrindopnisad_sync_bus';

// Default Application States
export const defaultSadhanaState: SadhanaState = {
  japaCompleted: 16,
  japaTarget: 16,
  shravanMinutes: 45,
  shravanTarget: 60,
  svadhyayaPadas: 8,
  svadhyayaTarget: 10,
  currentStreakDays: 14,
  completedMilestones: ['1-mala', '5-mala', '10-mala', '3-niyam', '7-niyam', '14-niyam'],
  bookmarkedPads: ['hit-chaurasi-01', 'radha-kripa-kataksha'],
};

export const defaultReaderState: ReaderState = {
  lastPadId: 'hit-chaurasi-01',
  showTransliteration: true,
  bookmarkedPadIds: ['hit-chaurasi-01', 'radha-kripa-kataksha'],
  selectedTradition: 'all',
};

export const defaultUserPreferences: UserPreferences = {
  isLowSpecMode: false,
  audioVolume: 0.8,
  activeTab: 'smaran',
};

export const defaultDhyanaImpactState: DhyanaImpactState = {
  metrics: {
    totalDhyanaMinutes: 45,
    todayDhyanaMinutes: 15,
    currentFlowStage: 'shanta',
    averageStillnessScore: 82,
    manasiSewaLevel: 2,
    unbrokenFocusStreakDays: 7,
    lastSessionTimestamp: Date.now() - 3600000,
  },
  recentSessions: [],
  reflections: [
    {
      id: 'ref-1',
      dateISO: new Date().toISOString(),
      sentiment: 'shanti',
      note: 'चित्त में असीम शांति व युगल छवि का अनुभव।',
      dhyanaMinutes: 15,
      mantraCount: 108,
    },
  ],
  unlockedAntarangaBadges: ['15-dhyana', '7-manasi'],
};

// State Reconciliation Helpers (ensures backward compatibility & type safety)
function reconcileSadhana(parsed: unknown): SadhanaState {
  if (!parsed || typeof parsed !== 'object') {
    return { ...defaultSadhanaState };
  }
  const obj = parsed as Record<string, unknown>;
  return {
    japaCompleted: typeof obj.japaCompleted === 'number' ? obj.japaCompleted : defaultSadhanaState.japaCompleted,
    japaTarget: typeof obj.japaTarget === 'number' ? obj.japaTarget : defaultSadhanaState.japaTarget,
    shravanMinutes: typeof obj.shravanMinutes === 'number' ? obj.shravanMinutes : defaultSadhanaState.shravanMinutes,
    shravanTarget: typeof obj.shravanTarget === 'number' ? obj.shravanTarget : defaultSadhanaState.shravanTarget,
    svadhyayaPadas: typeof obj.svadhyayaPadas === 'number' ? obj.svadhyayaPadas : defaultSadhanaState.svadhyayaPadas,
    svadhyayaTarget: typeof obj.svadhyayaTarget === 'number' ? obj.svadhyayaTarget : defaultSadhanaState.svadhyayaTarget,
    currentStreakDays: typeof obj.currentStreakDays === 'number' ? obj.currentStreakDays : defaultSadhanaState.currentStreakDays,
    completedMilestones: Array.isArray(obj.completedMilestones)
      ? (obj.completedMilestones as string[])
      : [...defaultSadhanaState.completedMilestones],
    bookmarkedPads: Array.isArray(obj.bookmarkedPads)
      ? (obj.bookmarkedPads as string[])
      : [...defaultSadhanaState.bookmarkedPads],
    dhyanaMinutesCompleted: typeof obj.dhyanaMinutesCompleted === 'number' ? obj.dhyanaMinutesCompleted : (defaultSadhanaState.dhyanaMinutesCompleted ?? 0),
    dhyanaMinutesTarget: typeof obj.dhyanaMinutesTarget === 'number' ? obj.dhyanaMinutesTarget : 15,
    chittaShantiScore: typeof obj.chittaShantiScore === 'number' ? obj.chittaShantiScore : 82,
    manasiSewaMinutes: typeof obj.manasiSewaMinutes === 'number' ? obj.manasiSewaMinutes : 0,
    unbrokenFocusStreak: typeof obj.unbrokenFocusStreak === 'number' ? obj.unbrokenFocusStreak : (typeof obj.currentStreakDays === 'number' ? obj.currentStreakDays : 0),
  };
}

function reconcileDhyanaImpact(parsed: unknown): DhyanaImpactState {
  if (!parsed || typeof parsed !== 'object') {
    return {
      metrics: { ...defaultDhyanaImpactState.metrics },
      recentSessions: [...defaultDhyanaImpactState.recentSessions],
      reflections: [...defaultDhyanaImpactState.reflections],
      unlockedAntarangaBadges: [...defaultDhyanaImpactState.unlockedAntarangaBadges],
    };
  }
  const obj = parsed as Record<string, unknown>;
  const rawMetrics = (obj.metrics && typeof obj.metrics === 'object') ? (obj.metrics as Record<string, unknown>) : {};
  const metrics: ContemplativeMetrics = {
    totalDhyanaMinutes: typeof rawMetrics.totalDhyanaMinutes === 'number' ? rawMetrics.totalDhyanaMinutes : defaultDhyanaImpactState.metrics.totalDhyanaMinutes,
    todayDhyanaMinutes: typeof rawMetrics.todayDhyanaMinutes === 'number' ? rawMetrics.todayDhyanaMinutes : defaultDhyanaImpactState.metrics.todayDhyanaMinutes,
    currentFlowStage: (rawMetrics.currentFlowStage as FlowStage) || defaultDhyanaImpactState.metrics.currentFlowStage,
    averageStillnessScore: typeof rawMetrics.averageStillnessScore === 'number' ? rawMetrics.averageStillnessScore : defaultDhyanaImpactState.metrics.averageStillnessScore,
    manasiSewaLevel: typeof rawMetrics.manasiSewaLevel === 'number' ? rawMetrics.manasiSewaLevel : defaultDhyanaImpactState.metrics.manasiSewaLevel,
    unbrokenFocusStreakDays: typeof rawMetrics.unbrokenFocusStreakDays === 'number' ? rawMetrics.unbrokenFocusStreakDays : defaultDhyanaImpactState.metrics.unbrokenFocusStreakDays,
    lastSessionTimestamp: typeof rawMetrics.lastSessionTimestamp === 'number' ? rawMetrics.lastSessionTimestamp : defaultDhyanaImpactState.metrics.lastSessionTimestamp,
  };

  return {
    metrics,
    recentSessions: Array.isArray(obj.recentSessions) ? (obj.recentSessions as DhyanaSessionRecord[]) : [...defaultDhyanaImpactState.recentSessions],
    reflections: Array.isArray(obj.reflections) ? (obj.reflections as SacredReflectionEntry[]) : [...defaultDhyanaImpactState.reflections],
    unlockedAntarangaBadges: Array.isArray(obj.unlockedAntarangaBadges) ? (obj.unlockedAntarangaBadges as string[]) : [...defaultDhyanaImpactState.unlockedAntarangaBadges],
  };
}

function reconcileReaderState(parsed: unknown): ReaderState {
  if (!parsed || typeof parsed !== 'object') {
    return { ...defaultReaderState };
  }
  const obj = parsed as Record<string, unknown>;
  return {
    lastPadId: typeof obj.lastPadId === 'string' ? obj.lastPadId : defaultReaderState.lastPadId,
    showTransliteration:
      typeof obj.showTransliteration === 'boolean'
        ? obj.showTransliteration
        : defaultReaderState.showTransliteration,
    bookmarkedPadIds: Array.isArray(obj.bookmarkedPadIds)
      ? (obj.bookmarkedPadIds as string[])
      : [...(defaultReaderState.bookmarkedPadIds || [])],
    selectedTradition:
      typeof obj.selectedTradition === 'string'
        ? obj.selectedTradition
        : defaultReaderState.selectedTradition,
  };
}

function reconcileUserPreferences(parsed: unknown): UserPreferences {
  if (!parsed || typeof parsed !== 'object') {
    return { ...defaultUserPreferences };
  }
  const obj = parsed as Record<string, unknown>;
  return {
    isLowSpecMode:
      typeof obj.isLowSpecMode === 'boolean'
        ? obj.isLowSpecMode
        : defaultUserPreferences.isLowSpecMode,
    audioVolume:
      typeof obj.audioVolume === 'number'
        ? obj.audioVolume
        : defaultUserPreferences.audioVolume,
    activeTab:
      typeof obj.activeTab === 'string'
        ? obj.activeTab
        : defaultUserPreferences.activeTab,
  };
}


// Safe localStorage Helpers (guards for SSR, private browsing, quota limits)
function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Quota, incognito, or security sandbox restrictions
  }
  return null;
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Quota, incognito, or security sandbox restrictions
  }
}

// In-Memory L1 Cache (0ms instant access)
let memorySadhana: SadhanaState | null = null;
let memoryFeedInteractions: Record<string, FeedInteractionData> | null = null;
let memoryReaderState: ReaderState | null = null;
let memoryPreferences: UserPreferences | null = null;
let memoryDhyanaImpact: DhyanaImpactState | null = null;

// Unique Tab Identifier for Loopback Suppression in Multi-Tab Sync
const TAB_INSTANCE_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

// BroadcastChannel singleton instance
let broadcastChannelInstance: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannelInstance = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    broadcastChannelInstance = null;
  }
}

/**
 * Dispatches an event to all other open tabs/windows via BroadcastChannel
 * and falls back to window 'storage' event bus.
 */
function broadcastSync(type: string, payload: unknown): void {
  const event: MultiTabSyncEvent = {
    type,
    payload,
    sourceTabId: TAB_INSTANCE_ID,
    timestamp: Date.now(),
  };

  if (broadcastChannelInstance) {
    try {
      broadcastChannelInstance.postMessage(event);
    } catch {
      // BroadcastChannel post error fallback
    }
  }

  // Dual-dispatch to localStorage bus for cross-origin/non-BroadcastChannel environments
  safeLocalStorageSet(
    SYNC_STORAGE_BUS_KEY,
    JSON.stringify({ ...event, _nonce: Math.random() })
  );
}

// ==========================================
// 1. TWO-TIER ZERO-FLICKER SADHANA CACHE
// ==========================================

/**
 * Synchronous L1 Cache Reader (In-Memory + synchronous localStorage pre-warm)
 * Guarantees instantaneous 0ms return at initial paint with zero layout shift or null flashes.
 */
export function loadCachedSadhanaSync(): SadhanaState {
  if (memorySadhana) {
    return { ...memorySadhana };
  }

  const raw = safeLocalStorageGet(SADHANA_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      memorySadhana = reconcileSadhana(parsed);
      return { ...memorySadhana };
    } catch {
      // Corrupt payload fallback
    }
  }

  memorySadhana = { ...defaultSadhanaState };
  return { ...memorySadhana };
}

/**
 * Asynchronous L2 Cache Reader (IndexedDB via idb-keyval + L1 reconcile)
 * Reads persistent store, reconciles missing schema fields, updates L1, and returns.
 */
export async function loadCachedSadhana(): Promise<SadhanaState> {
  try {
    const data = await get<SadhanaState>(SADHANA_STORAGE_KEY);
    if (data) {
      const reconciled = reconcileSadhana(data);
      memorySadhana = reconciled;
      safeLocalStorageSet(SADHANA_STORAGE_KEY, JSON.stringify(reconciled));
      return { ...reconciled };
    }
  } catch (err) {
    console.warn('IndexedDB unavailable or read failed, falling back to L1 cache:', err);
  }


  // Fallback to L1
  const l1State = loadCachedSadhanaSync();
  // Self-heal L2 in background if possible
  try {
    await set(SADHANA_STORAGE_KEY, l1State);
  } catch {
    // Silent fallback
  }

  return l1State;
}

/**
 * Dual-Write Sadhana Persistence
 * Updates L1 in-memory immediately, writes synchronously to localStorage,
 * writes asynchronously to IndexedDB L2, and broadcasts update across tabs.
 */
export async function persistSadhana(state: SadhanaState): Promise<void> {
  const cloned: SadhanaState = { ...state };
  memorySadhana = cloned;
  safeLocalStorageSet(SADHANA_STORAGE_KEY, JSON.stringify(cloned));

  try {
    await set(SADHANA_STORAGE_KEY, cloned);
  } catch {
    // IDB error fallback
  }

  broadcastSync('SADHANA_UPDATED', cloned);
}

// ==========================================
// 2. COMPREHENSIVE INDEXEDDB STORES
// ==========================================

// --- FEED INTERACTIONS STORE ---

export function getFeedInteractionsSync(): Record<string, FeedInteractionData> {
  if (memoryFeedInteractions) {
    return { ...memoryFeedInteractions };
  }

  const raw = safeLocalStorageGet(FEED_INTERACTIONS_KEY);
  if (raw) {
    try {
      memoryFeedInteractions = JSON.parse(raw);
      return { ...(memoryFeedInteractions || {}) };
    } catch {
      // Corrupt JSON fallback
    }
  }

  memoryFeedInteractions = {};
  return {};
}

export async function getFeedInteractions(): Promise<Record<string, FeedInteractionData>> {
  try {
    const data = await get<Record<string, FeedInteractionData>>(FEED_INTERACTIONS_KEY);
    if (data && typeof data === 'object') {
      memoryFeedInteractions = data;
      safeLocalStorageSet(FEED_INTERACTIONS_KEY, JSON.stringify(data));
      return { ...data };
    }
  } catch (err) {
    console.warn('IndexedDB feed interactions read failed:', err);
  }

  return getFeedInteractionsSync();
}

export async function saveFeedInteraction(
  postId: string,
  data: { isLiked?: boolean; isBookmarked?: boolean; isFollowing?: boolean; likes?: number }
): Promise<void> {
  const current = getFeedInteractionsSync();
  const prev = current[postId] || {
    isLiked: false,
    isBookmarked: false,
    isFollowing: false,
    likes: 0,
  };

  const updated: FeedInteractionData = {
    isLiked: data.isLiked !== undefined ? data.isLiked : prev.isLiked,
    isBookmarked: data.isBookmarked !== undefined ? data.isBookmarked : prev.isBookmarked,
    isFollowing: data.isFollowing !== undefined ? data.isFollowing : prev.isFollowing,
    likes: data.likes !== undefined ? data.likes : prev.likes,
  };

  current[postId] = updated;
  memoryFeedInteractions = current;
  safeLocalStorageSet(FEED_INTERACTIONS_KEY, JSON.stringify(current));

  try {
    await set(FEED_INTERACTIONS_KEY, current);
  } catch {
    // IDB error fallback
  }

  broadcastSync('FEED_INTERACTION_UPDATED', { postId, interaction: updated });
}

// --- PADAVALI READER STATE STORE ---

export function getReaderStateSync(): ReaderState {
  if (memoryReaderState) {
    return { ...memoryReaderState };
  }

  const raw = safeLocalStorageGet(READER_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      memoryReaderState = reconcileReaderState(parsed);
      return { ...memoryReaderState };
    } catch {
      // Fallback
    }
  }

  memoryReaderState = { ...defaultReaderState };
  return { ...memoryReaderState };
}

export async function getReaderState(): Promise<ReaderState> {
  try {
    const data = await get<ReaderState>(READER_STATE_KEY);
    if (data) {
      const merged = reconcileReaderState(data);
      memoryReaderState = merged;
      safeLocalStorageSet(READER_STATE_KEY, JSON.stringify(merged));
      return { ...merged };
    }
  } catch (err) {
    console.warn('IndexedDB reader state read failed:', err);
  }

  return getReaderStateSync();
}

export async function saveReaderState(data: Partial<ReaderState>): Promise<void> {
  const current = getReaderStateSync();
  const updated = reconcileReaderState({
    ...current,
    ...data,
  });

  memoryReaderState = updated;
  safeLocalStorageSet(READER_STATE_KEY, JSON.stringify(updated));

  try {
    await set(READER_STATE_KEY, updated);
  } catch {
    // IDB error fallback
  }

  broadcastSync('READER_STATE_UPDATED', updated);
}

// --- USER PREFERENCES STORE ---

export function getUserPreferencesSync(): UserPreferences {
  if (memoryPreferences) {
    return { ...memoryPreferences };
  }

  const raw = safeLocalStorageGet(PREFERENCES_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      memoryPreferences = reconcileUserPreferences(parsed);
      return { ...memoryPreferences };
    } catch {
      // Fallback
    }
  }

  memoryPreferences = { ...defaultUserPreferences };
  return { ...memoryPreferences };
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await get<UserPreferences>(PREFERENCES_KEY);
    if (data) {
      const merged = reconcileUserPreferences(data);
      memoryPreferences = merged;
      safeLocalStorageSet(PREFERENCES_KEY, JSON.stringify(merged));
      return { ...merged };
    }
  } catch (err) {
    console.warn('IndexedDB user preferences read failed:', err);
  }

  return getUserPreferencesSync();
}

export async function saveUserPreferences(data: Partial<UserPreferences>): Promise<void> {
  const current = getUserPreferencesSync();
  const updated = reconcileUserPreferences({
    ...current,
    ...data,
  });

  memoryPreferences = updated;
  safeLocalStorageSet(PREFERENCES_KEY, JSON.stringify(updated));

  try {
    await set(PREFERENCES_KEY, updated);
  } catch {
    // IDB error fallback
  }

  broadcastSync('USER_PREFERENCES_UPDATED', updated);
}


// --- CACHED BOOKMARKS STORE ---

export async function getCachedBookmarks(): Promise<string[]> {
  try {
    const bookmarks = await get<string[]>(CACHED_PADS_KEY);
    if (bookmarks && Array.isArray(bookmarks)) {
      return bookmarks;
    }
  } catch {
    // Fallback
  }

  const reader = getReaderStateSync();
  return reader.bookmarkedPadIds || defaultSadhanaState.bookmarkedPads;
}

export async function saveCachedBookmarks(bookmarks: string[]): Promise<void> {
  try {
    await set(CACHED_PADS_KEY, bookmarks);
  } catch {
    // IDB error fallback
  }

  // Also sync with reader state and sadhana state for cross-component harmony
  await saveReaderState({ bookmarkedPadIds: bookmarks });
  const currentSadhana = loadCachedSadhanaSync();
  await persistSadhana({ ...currentSadhana, bookmarkedPads: bookmarks });

  broadcastSync('BOOKMARKS_UPDATED', bookmarks);
}

// ==========================================
// 3. MULTI-TAB SYNCHRONIZATION ENGINE
// ==========================================

/**
 * Initializes real-time synchronization across browser tabs using BroadcastChannel
 * with a storage-event fallback for compatibility across webviews and older browsers.
 *
 * @param onSync Callback invoked when an event arrives from another tab.
 * @returns Cleanup function to unregister listeners.
 */
export function initMultiTabSync(
  onSync: (event: { type: string; payload: unknown }) => void
): () => void {
  const handleIncomingEvent = (evt: MultiTabSyncEvent) => {
    if (!evt || evt.sourceTabId === TAB_INSTANCE_ID) {
      // Suppress loopback reflections from self
      return;
    }

    // Refresh internal in-memory caches immediately
    switch (evt.type) {
      case 'SADHANA_UPDATED':
        if (evt.payload) {
          memorySadhana = evt.payload as SadhanaState;
        }
        break;
      case 'FEED_INTERACTION_UPDATED': {
        const payload = evt.payload as {
          postId: string;
          interaction: FeedInteractionData;
        };
        if (payload?.postId && payload?.interaction) {
          if (!memoryFeedInteractions) {
            memoryFeedInteractions = getFeedInteractionsSync();
          }
          memoryFeedInteractions[payload.postId] = payload.interaction;
        }
        break;
      }
      case 'READER_STATE_UPDATED':
        if (evt.payload) {
          memoryReaderState = evt.payload as ReaderState;
        }
        break;
      case 'USER_PREFERENCES_UPDATED':
        if (evt.payload) {
          memoryPreferences = evt.payload as UserPreferences;
        }
        break;
      case 'BOOKMARKS_UPDATED':
        if (Array.isArray(evt.payload)) {
          if (memoryReaderState) {
            memoryReaderState.bookmarkedPadIds = evt.payload as string[];
          }
          if (memorySadhana) {
            memorySadhana.bookmarkedPads = evt.payload as string[];
          }
        }
        break;
      case 'DHYANA_SESSION_COMPLETED':
        if (evt.payload) {
          memoryDhyanaImpact = reconcileDhyanaImpact(evt.payload);
        }
        break;
    }

    onSync({ type: evt.type, payload: evt.payload });
  };

  // BroadcastChannel Listener
  const onBcMessage = (e: MessageEvent) => {
    if (e.data && typeof e.data === 'object' && 'type' in e.data) {
      handleIncomingEvent(e.data as MultiTabSyncEvent);
    }
  };

  if (broadcastChannelInstance) {
    broadcastChannelInstance.addEventListener('message', onBcMessage);
  }

  // Window Storage Event Listener (fallback)
  const onStorage = (e: StorageEvent) => {
    if (e.key === SYNC_STORAGE_BUS_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && typeof parsed === 'object' && 'type' in parsed) {
          handleIncomingEvent(parsed as MultiTabSyncEvent);
        }
      } catch {
        // Ignore parse error
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  // Cleanup handler
  return () => {
    if (broadcastChannelInstance) {
      broadcastChannelInstance.removeEventListener('message', onBcMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

// ==========================================
// 4. DYNAMIC SADHANA & METRIC HELPERS
// ==========================================

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Converts numeric digits to authentic Devanagari numerals with locale separators.
 * e.g., 2580 -> "२,५८०", 16 -> "१६"
 */
export function formatDevanagariNumerals(num: number): string {
  if (isNaN(num)) return '०';
  return num
    .toLocaleString('en-IN')
    .replace(/[0-9]/g, (digit) => DEVANAGARI_DIGITS[Number(digit)] || digit);
}

/**
 * Computes the total mantra count from malas completed.
 * Standard Braj tradition: 1 mala = 108 sacred mantra repetitions.
 */
export function computeMantraCount(sadhana: SadhanaState): number {
  const malas = sadhana?.japaCompleted ?? 0;
  return Math.max(0, malas * 108);
}

/**
 * Computes a clamped progress percentage from 0 to 100.
 */
export function computeProgressPercent(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  const pct = Math.round((current / target) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * Computes live streak status and formatted Braj Devanagari label.
 */
export function computeStreakStatus(sadhana: SadhanaState): {
  count: number;
  active: boolean;
  labelDevanagari: string;
} {
  const count = Math.max(0, sadhana?.currentStreakDays ?? 0);
  const hasActivityToday = Boolean(
    sadhana &&
      ((sadhana.japaCompleted ?? 0) > 0 ||
        (sadhana.shravanMinutes ?? 0) > 0 ||
        (sadhana.svadhyayaPadas ?? 0) > 0)
  );

  return {
    count,
    active: hasActivityToday,
    labelDevanagari: `${formatDevanagariNumerals(count)} दिवस अखण्ड नियम`,
  };
}

export interface SadhanaSummaryMetrics {
  mantraCount: number;
  mantraCountFormatted: string;
  mantraCountDevanagari: string;
  malaCompleted: number;
  malaTarget: number;
  japaPercent: number;
  shravanMinutes: number;
  shravanTarget: number;
  shravanPercent: number;
  svadhyayaPadas: number;
  svadhyayaTarget: number;
  svadhyayaPercent: number;
  streakDays: number;
  streakActive: boolean;
  streakLabelDevanagari: string;
  isDailyGoalMet: boolean;
  completionRatePercent: number;
}

/**
 * Computes aggregate dynamic metrics for the 3-Column Bento Dashboard.
 * Replaces all static strings and hardcoded progress bar widths with live values.
 */
export function computeSadhanaSummary(sadhana: SadhanaState): SadhanaSummaryMetrics {
  const activeSadhana = sadhana || defaultSadhanaState;
  const mantraCount = computeMantraCount(activeSadhana);
  const japaPercent = computeProgressPercent(
    activeSadhana.japaCompleted,
    activeSadhana.japaTarget
  );
  const shravanPercent = computeProgressPercent(
    activeSadhana.shravanMinutes,
    activeSadhana.shravanTarget
  );
  const svadhyayaPercent = computeProgressPercent(
    activeSadhana.svadhyayaPadas,
    activeSadhana.svadhyayaTarget
  );
  const streak = computeStreakStatus(activeSadhana);

  const isDailyGoalMet =
    japaPercent >= 100 && shravanPercent >= 100 && svadhyayaPercent >= 100;

  const totalPercent = Math.round((japaPercent + shravanPercent + svadhyayaPercent) / 3);

  return {
    mantraCount,
    mantraCountFormatted: mantraCount.toLocaleString('en-IN'),
    mantraCountDevanagari: formatDevanagariNumerals(mantraCount),
    malaCompleted: activeSadhana.japaCompleted,
    malaTarget: activeSadhana.japaTarget,
    japaPercent,
    shravanMinutes: activeSadhana.shravanMinutes,
    shravanTarget: activeSadhana.shravanTarget,
    shravanPercent,
    svadhyayaPadas: activeSadhana.svadhyayaPadas,
    svadhyayaTarget: activeSadhana.svadhyayaTarget,
    svadhyayaPercent,
    streakDays: streak.count,
    streakActive: streak.active,
    streakLabelDevanagari: streak.labelDevanagari,
    isDailyGoalMet,
    completionRatePercent: totalPercent,
  };
}

/**
 * Computes the active sacred Ashtayama phase dynamically according to current time.
 * Follows authentic Braj tradition (8 sacred watches of Shri Radha Vallabh / Banke Bihari).
 */
export function computeAshtayamaPhase(date: Date = new Date()): AshtayamaPhaseInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 1. Mangala (मंगला): 03:30 - 06:00 (210 - 360)
  if (timeInMinutes >= 210 && timeInMinutes < 360) {
    return {
      nameDevanagari: 'मंगला',
      nameEnglish: 'Mangala',
      timeRange: '03:30 - 06:00',
      descriptionDevanagari: 'प्रभात जागरण एवं मधुर वेणु वादन',
      bhava: 'जागरण भाव',
      isActive: true,
    };
  }

  // 2. Shringar (शृंगार): 06:00 - 08:30 (360 - 510)
  if (timeInMinutes >= 360 && timeInMinutes < 510) {
    return {
      nameDevanagari: 'शृंगार',
      nameEnglish: 'Shringar',
      timeRange: '06:00 - 08:30',
      descriptionDevanagari: 'सखी भाव से दिव्य भूषण एवं पुष्प शृंगार',
      bhava: 'सखी शृंगार',
      isActive: true,
    };
  }

  // 3. Gwal (ग्वाल): 08:30 - 10:30 (510 - 630)
  if (timeInMinutes >= 510 && timeInMinutes < 630) {
    return {
      nameDevanagari: 'ग्वाल',
      nameEnglish: 'Gwal',
      timeRange: '08:30 - 10:30',
      descriptionDevanagari: 'गोचारण एवं सखा संग मधुर लीला',
      bhava: 'सख्य भाव',
      isActive: true,
    };
  }

  // 4. Rajbhog (राजभोग): 10:30 - 13:00 (630 - 780)
  if (timeInMinutes >= 630 && timeInMinutes < 780) {
    return {
      nameDevanagari: 'राजभोग',
      nameEnglish: 'Rajbhog',
      timeRange: '10:30 - 13:00',
      descriptionDevanagari: 'मध्याह्न दिव्य व्यंजन समर्पण एवं निकुंज भोग',
      bhava: 'माधुर्य भोग',
      isActive: true,
    };
  }

  // 5. Utthapan (उत्थापन): 15:30 - 17:00 (930 - 1020)
  if (timeInMinutes >= 930 && timeInMinutes < 1020) {
    return {
      nameDevanagari: 'उत्थापन',
      nameEnglish: 'Utthapan',
      timeRange: '15:30 - 17:00',
      descriptionDevanagari: 'अपराह्न सुखद जागरण एवं वेणु ध्वनि',
      bhava: 'जागरण भाव',
      isActive: true,
    };
  }

  // 6. Bhog (भोग): 17:00 - 18:30 (1020 - 1110)
  if (timeInMinutes >= 1020 && timeInMinutes < 1110) {
    return {
      nameDevanagari: 'भोग',
      nameEnglish: 'Bhog',
      timeRange: '17:00 - 18:30',
      descriptionDevanagari: 'सन्ध्याकालीन फल-मिष्ठान्न समर्पण',
      bhava: 'वात्सल्य-माधुर्य',
      isActive: true,
    };
  }

  // 7. Sandhya Aarti (सन्ध्या आरती): 18:30 - 20:30 (1110 - 1230)
  if (timeInMinutes >= 1110 && timeInMinutes < 1230) {
    return {
      nameDevanagari: 'सन्ध्या आरती',
      nameEnglish: 'Sandhya Aarti',
      timeRange: '18:30 - 20:30',
      descriptionDevanagari: 'दीपदान, कर्पूर आरती एवं हरिनाम संकीर्तन',
      bhava: 'दीपावली भाव',
      isActive: true,
    };
  }

  // 8. Shayan / Nikunj Vihar (शयन / निकुंज विहार): 20:30 - 03:30 (1230 - 1440 or 0 - 210)
  return {
    nameDevanagari: 'शयन',
    nameEnglish: 'Shayan',
    timeRange: '20:30 - 03:30',
    descriptionDevanagari: 'नित्य निकुंज विहार एवं सुखद शयन',
    bhava: 'रसविहार भाव',
    isActive: true,
  };
}

// ==========================================
// 5. TWO-TIER ZERO-FLICKER DHYANA IMPACT CACHE
// ==========================================

/**
 * Synchronous L1 Cache Reader for Contemplative Dhyana & Cognitive Impact.
 * Returns immediately from memory or pre-warms from localStorage without flicker (0ms).
 */
export function loadDhyanaImpactSync(): DhyanaImpactState {
  if (memoryDhyanaImpact) {
    return { ...memoryDhyanaImpact };
  }

  const raw = safeLocalStorageGet(DHYANA_IMPACT_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      memoryDhyanaImpact = reconcileDhyanaImpact(parsed);
      return { ...memoryDhyanaImpact };
    } catch {
      // Corrupt JSON fallback
    }
  }

  memoryDhyanaImpact = reconcileDhyanaImpact(defaultDhyanaImpactState);
  return { ...memoryDhyanaImpact };
}

export const loadCachedDhyanaImpactSync = loadDhyanaImpactSync;

/**
 * Asynchronous L2 Cache Reader for Contemplative Dhyana (IndexedDB via idb-keyval).
 * Reconciles persistent store with L1 memory cache.
 */
export async function loadDhyanaImpact(): Promise<DhyanaImpactState> {
  try {
    const data = await get<DhyanaImpactState>(DHYANA_IMPACT_STORAGE_KEY);
    if (data) {
      const reconciled = reconcileDhyanaImpact(data);
      memoryDhyanaImpact = reconciled;
      safeLocalStorageSet(DHYANA_IMPACT_STORAGE_KEY, JSON.stringify(reconciled));
      return { ...reconciled };
    }
  } catch (err) {
    console.warn('IndexedDB dhyana impact read failed, falling back to L1 cache:', err);
  }

  const l1State = loadDhyanaImpactSync();
  try {
    await set(DHYANA_IMPACT_STORAGE_KEY, l1State);
  } catch {
    // Silent fallback
  }

  return l1State;
}

export const loadCachedDhyanaImpact = loadDhyanaImpact;
export const loadDhyanaHistory = loadDhyanaImpact;

/**
 * Calculates current meditative flow stage according to duration in seconds.
 * Dharana (0-5m) -> Shanta (5-15m) -> Dhara (15-30m) -> Samadhi (30m+)
 */
export function computeDhyanaFlowStage(durationSeconds: number): FlowStage {
  const mins = Math.max(0, durationSeconds) / 60;
  if (mins >= 30) return 'samadhi';
  if (mins >= 15) return 'dhara';
  if (mins >= 5) return 'shanta';
  return 'dharana';
}

/**
 * Calculates Chitta Shanti (mental stillness) score clamped between 20 and 100%.
 */
export function computeChittaShantiScore(durationSeconds: number, japaCount: number): number {
  const mins = Math.max(0, Math.floor(durationSeconds / 60));
  const score = 20 + mins * 6 + Math.round((Math.max(0, japaCount) / 108) * 12);
  return Math.min(100, Math.max(20, Math.round(score)));
}

/**
 * Provides Devanagari titles, spiritual descriptions, and theme colors for flow stages.
 */
export function formatFlowStageDevanagari(stage: FlowStage): {
  title: string;
  subtitle: string;
  color: string;
} {
  switch (stage) {
    case 'samadhi':
      return {
        title: 'नित्य रस समाधि',
        subtitle: 'युगल छवि में अनन्य तन्मयता एवं दिव्य रस का साक्षात्कार',
        color: '#EAB308',
      };
    case 'dhara':
      return {
        title: 'अखंड ध्यान धारा',
        subtitle: 'तैलधारामिव सतत स्मरण, विक्षेपों का पूर्ण शमन',
        color: '#22C55E',
      };
    case 'shanta':
      return {
        title: 'प्रशांत चित्त उपस्थिति',
        subtitle: 'मानसिक चंचलता का शमन एवं अंतर्मुखी शांति',
        color: '#3B82F6',
      };
    case 'dharana':
    default:
      return {
        title: 'आरम्भिक एकाग्रता',
        subtitle: 'संसार से मन का प्रत्याहार एवं नाम में स्थिति',
        color: '#F59E0B',
      };
  }
}

/**
 * Records completed focus session to L1 memory, synchronous localStorage,
 * asynchronous IndexedDB, and broadcasts sync across all open tabs.
 */
export async function recordDhyanaSession(
  sessionInput: Omit<DhyanaSessionRecord, 'id' | 'timestamp'> | DhyanaSessionRecord
): Promise<DhyanaImpactState> {
  const current = loadDhyanaImpactSync();
  const sessionDurationSec = sessionInput.durationSeconds || 0;
  const sessionMins = Math.round(sessionDurationSec / 60);

  const newSession: DhyanaSessionRecord = {
    id: ('id' in sessionInput && sessionInput.id)
      ? sessionInput.id
      : `dhyana_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: ('timestamp' in sessionInput && sessionInput.timestamp)
      ? sessionInput.timestamp
      : Date.now(),
    durationSeconds: sessionDurationSec,
    japaCount: sessionInput.japaCount || 0,
    stillnessScore: sessionInput.stillnessScore || computeChittaShantiScore(sessionDurationSec, sessionInput.japaCount || 0),
    coherenceScore: sessionInput.coherenceScore || Math.min(100, Math.max(50, Math.round(75 + sessionMins * 2))),
    flowStageReached: sessionInput.flowStageReached || computeDhyanaFlowStage(sessionDurationSec),
    reflectionNote: sessionInput.reflectionNote,
    reflectionSentiment: sessionInput.reflectionSentiment,
  };

  const updatedSessions = [newSession, ...(current.recentSessions || [])].slice(0, 50);
  const totalMins = (current.metrics.totalDhyanaMinutes || 0) + sessionMins;
  const todayMins = (current.metrics.todayDhyanaMinutes || 0) + sessionMins;

  // Compute Antaranga badges unlocked
  const unlocked = new Set(current.unlockedAntarangaBadges || []);
  if (sessionMins >= 15 || totalMins >= 15) unlocked.add('15-dhyana');
  if (sessionMins >= 30 || totalMins >= 30) unlocked.add('30-dhyana');
  if (current.metrics.unbrokenFocusStreakDays >= 7) unlocked.add('7-manasi');
  if (updatedSessions.length >= 108) unlocked.add('108-shanti');

  const updatedMetrics: ContemplativeMetrics = {
    totalDhyanaMinutes: totalMins,
    todayDhyanaMinutes: todayMins,
    currentFlowStage: computeDhyanaFlowStage(sessionDurationSec),
    averageStillnessScore: Math.round(
      ((current.metrics.averageStillnessScore || 80) + newSession.stillnessScore) / 2
    ),
    manasiSewaLevel: Math.min(5, Math.max(1, Math.floor(totalMins / 60) + 1)),
    unbrokenFocusStreakDays: current.metrics.unbrokenFocusStreakDays || 1,
    lastSessionTimestamp: newSession.timestamp,
  };

  const nextState: DhyanaImpactState = {
    metrics: updatedMetrics,
    recentSessions: updatedSessions,
    reflections: current.reflections || [],
    unlockedAntarangaBadges: Array.from(unlocked),
  };

  memoryDhyanaImpact = nextState;
  safeLocalStorageSet(DHYANA_IMPACT_STORAGE_KEY, JSON.stringify(nextState));

  try {
    await set(DHYANA_IMPACT_STORAGE_KEY, nextState);
  } catch {
    // IDB error fallback
  }

  broadcastSync('DHYANA_SESSION_COMPLETED', nextState);
  return nextState;
}

export const saveDhyanaSession = recordDhyanaSession;

/**
 * Persists a sacred reflection entry to L1/L2 storage and broadcasts to open tabs.
 */
export async function saveSacredReflection(
  entryInput: SacredReflectionEntry | Omit<SacredReflectionEntry, 'id' | 'dateISO'>
): Promise<void> {
  const current = loadDhyanaImpactSync();
  const entry: SacredReflectionEntry = {
    id: ('id' in entryInput && entryInput.id)
      ? entryInput.id
      : `refl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    dateISO: ('dateISO' in entryInput && entryInput.dateISO)
      ? entryInput.dateISO
      : new Date().toISOString(),
    sentiment: entryInput.sentiment,
    note: entryInput.note,
    dhyanaMinutes: entryInput.dhyanaMinutes || 0,
    mantraCount: entryInput.mantraCount || 0,
  };

  const updatedReflections = [entry, ...(current.reflections || [])].slice(0, 100);
  const nextState: DhyanaImpactState = {
    ...current,
    reflections: updatedReflections,
  };

  memoryDhyanaImpact = nextState;
  safeLocalStorageSet(DHYANA_IMPACT_STORAGE_KEY, JSON.stringify(nextState));

  try {
    await set(DHYANA_IMPACT_STORAGE_KEY, nextState);
  } catch {
    // IDB error fallback
  }

  broadcastSync('DHYANA_SESSION_COMPLETED', nextState);
}

export const saveContemplativeReflection = saveSacredReflection;

