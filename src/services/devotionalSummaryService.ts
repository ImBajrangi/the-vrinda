import { get, set } from 'idb-keyval';

/**
 * Vrindopnisad 2.0 - Groq Devotional Summary Service
 *
 * Implements high-performance, resilient Groq-powered devotional summaries
 * capturing the deep esoteric and loving devotional essence (भाव सार / दिव्य रस)
 * with a multi-tier zero-flicker caching topology:
 *   - Tier 1: L1 In-Memory Map (0ms instant retrieval, LRU capped at 500)
 *   - Tier 2: Synchronous localStorage buffer ('vrindopnisad_summary_buffer_v1', 40 entries)
 *   - Tier 3: Persistent IndexedDB ('vrindopnisad_devotional_summaries_v1')
 *   - Multi-tab sync: BroadcastChannel('vrindopnisad_sync') emitting 'DEVOTIONAL_SUMMARY_CACHED'
 *
 * Invariant:
 *   - Strictly NO user-facing strings containing "Grok" or "API".
 *   - Zero hover translateY/scale.
 */

// ==========================================
// 1. SERVICE CONFIGURATION & CONSTANTS
// ==========================================

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'qwen/qwen3.8-27b';
export const GROQ_DEFAULT_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_GROQ_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_GROQ_API_KEY) ||
  'gsk_devotional_sanctuary_placeholder_key_val';

export const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta as Record<string, any>).env?.VITE_GROQ_API_KEY) ||
  GROQ_DEFAULT_KEY;

export const LOCAL_STORAGE_BUFFER_KEY = 'vrindopnisad_summary_buffer_v1';
export const INDEXEDDB_STORAGE_KEY = 'vrindopnisad_devotional_summaries_v1';
export const SYNC_CHANNEL_NAME = 'vrindopnisad_sync';
export const SYNC_STORAGE_BUS_KEY = 'vrindopnisad_sync_bus';
export const SUMMARY_SYNC_EVENT = 'DEVOTIONAL_SUMMARY_CACHED';

export const DEFAULT_DEVOTIONAL_FALLBACK =
  'श्री राधा-माधव युगल सरकार का यह दिव्य रस साधक के अंतःकरण में विशुद्ध प्रेम और असीम शांति का संचार करता है। युगल चरणारविन्दों के नित्य स्मरण से चित्त स्वतः स्थिर व आनंदित होता है।';

// ==========================================
// 2. INTERFACES & CONTRACTS
// ==========================================

export interface DevotionalSummaryRequest {
  id: string; // e.g. "hit-chaurasi-01-1" or "quote-hit-chaurasi-0"
  text: string; // Stanza or quote lines
  source?: string; // e.g. "श्री हित चौरासी"
  author?: string; // e.g. "श्री हित हरिवंश महाप्रभु"
  type: 'pad' | 'verse' | 'quote';
  fallbackText?: string;
  collectionId?: string;
  padId?: string;
  stanzaNumber?: number | string;
  sourceSlug?: string;
  quoteIndex?: number | string;
}

export interface DevotionalSummaryResult {
  summary: string;
  fromCache: boolean;
  isFallback?: boolean;
}

export interface DevotionalSummaryRecord {
  key: string;
  summary: string;
  timestamp: number;
}

// ==========================================
// 3. CANONICAL PRE-BUNDLED SUMMARIES
// ==========================================

export const CANONICAL_DEVOTIONAL_SUMMARIES: Record<string, string> = {
  // Shri Hit Chaurasi - Pad 01
  'hit-chaurasi-01-1':
    'यह पद नित्य निकुंज के अहैतुक अनन्य प्रेम का मर्म है, जहाँ प्रिया-प्रियतम एक-दूसरे के सुख में ही अपना सर्वस्व सुख अनुभव करते हैं। युगल सरकार का यह परस्पर समर्पण चित्त को समस्त द्वंद्वों से मुक्त कर परमानंद में लीन करता है।',
  'hit-chaurasi-01-2':
    'प्राणप्यारे की सुखमयी वाणी और श्रीजी के मुखकमल का तेज ही निकुंज विलास का नित्य आधार है। इसमें स्वार्थ का लेश भी नहीं, केवल अगाध दिव्य प्रीति का अखंड प्रवाह है।',
  'hit-chaurasi-01-3':
    'श्री हित हरिवंश महाप्रभु रसिक शिरोमणि युगल किशोर के नित्य विहार रस-सिंधु की अनंतता का गान करते हैं। इस रस में निमग्न साधक का हृदय सहज ही संसार से विरक्त होकर नित्यधाम में प्रतिष्ठित होता है।',

  // Shri Radha Kripa Kataksha Stotram
  'radha-kripa-kataksha-1':
    'श्री वृषभानु नन्दिनी किशोरीजी के कृपा-कटाक्ष की यह पावन याचना साधक के तीनों लोकों के संताप को हरने वाली है। श्रीजी की करुणा दृष्टि प्राप्त होते ही अंतःकरण में विशुद्ध प्रेमरस का अमृत उमड़ पड़ता है।',
  'radha-kripa-kataksha-2':
    'अशोक कुंज मंडप में विराजित किशोरीजी के कोमल चरणकमलों की शरण ही समस्त दिव्य संपत्तियों की परम निधि है। उनके नित्य स्मरण से साधक को निर्भयता और शांत भाव का अनुभव होता है।',
  'shri-radha-kripa-kataksha-stotram-1':
    'श्री वृषभानु नन्दिनी किशोरीजी के कृपा-कटाक्ष की यह पावन याचना साधक के तीनों लोकों के संताप को हरने वाली है। श्रीजी की करुणा दृष्टि प्राप्त होते ही अंतःकरण में विशुद्ध प्रेमरस का अमृत उमड़ पड़ता है।',
  'shri-radha-kripa-kataksha-stotram-2':
    'अशोक कुंज मंडप में विराजित किशोरीजी के कोमल चरणकमलों की शरण ही समस्त दिव्य संपत्तियों की परम निधि है। उनके नित्य स्मरण से साधक को निर्भयता और शांत भाव का अनुभव होता है।',

  // Contemplative Quotes / Rasik Aphorisms
  'quote-hit-chaurasi-0':
    'प्रिया-प्रियतम की इच्छा में अपनी समस्त वृत्तियों को समर्पित कर देना ही रसिक मार्ग का गूढ़ रहस्य है। इस सहज समर्पण से मन के सारे विक्षेप विलीन होकर नित्य शांति का प्राकट्य होता है।',
  'quote-radha-sudha-nidhi-1':
    'श्रीजी के पावन वचनांचल की शीतल वायु मात्र से समस्त आधि-व्याधि व सांसारिक ताप शांत हो जाते हैं। यह युगल कृपा की अनिर्वचनीय महिमा है जो साधक को कृतार्थ करती है।',
  'quote-kelimal-2':
    'दिव्य निधिवन राज में सहज प्रकट हुई गौर-श्याम युगल किशोर की छवि अनुपम आनंद का सागर है। इस दिव्य रस में मन को स्थिर करना ही वास्तविक एकाग्रता और सहज समाधि है।',
};

// Canonical sample texts mapped to pre-bundled cache entries for immediate hash match
const CANONICAL_TEXT_MAPPINGS: Array<{
  id: string;
  type: 'pad' | 'verse' | 'quote';
  text: string;
  summary: string;
}> = [
  {
    id: 'hit-chaurasi-01-1',
    type: 'verse',
    text: 'जोई जोई प्यारो करे सोई मोहि भावै,\nभावै मोहि जोई सोई सोई करे प्यारे।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['hit-chaurasi-01-1'],
  },
  {
    id: 'hit-chaurasi-01-2',
    type: 'verse',
    text: 'मोको तो भावती एक प्राण प्यारे की बात,\nप्यारे को तो भावती मेरे मुख की उज्यारे।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['hit-chaurasi-01-2'],
  },
  {
    id: 'hit-chaurasi-01-3',
    type: 'verse',
    text: 'हित हरिवंश प्रभु रसिक शिरोमणि,\nनित्य विहार रस सिंधु अपारे।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['hit-chaurasi-01-3'],
  },
  {
    id: 'quote-hit-chaurasi-0',
    type: 'quote',
    text: 'जोई जोई प्यारो करे सोई मोहि भावै, मेरे भावे सोई सोई प्यारे करे।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['quote-hit-chaurasi-0'],
  },
  {
    id: 'quote-radha-sudha-nidhi-1',
    type: 'quote',
    text: 'यस्याः कदापि वसनाञ्चलखेलनोत्थधन्यातिधन्यपवनेन कृतार्थमानी।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['quote-radha-sudha-nidhi-1'],
  },
  {
    id: 'quote-kelimal-2',
    type: 'quote',
    text: 'माई री सहज जोरी प्रकट भई, जुग जुग जियौ गौर स्याम धन।',
    summary: CANONICAL_DEVOTIONAL_SUMMARIES['quote-kelimal-2'],
  },
];

// ==========================================
// 4. STORAGE HELPERS & SYNC BUS
// ==========================================

const MAX_L1_CAPACITY = 500;
const BUFFER_CAPACITY = 40;

// Unique tab instance identifier to suppress loopback reflections
const TAB_INSTANCE_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

// L1 Memory Map (0ms instant access)
const l1Cache = new Map<string, string>();

// Request deduplication: in-flight Promises map
const pendingRequests = new Map<string, Promise<DevotionalSummaryResult>>();

// BroadcastChannel singleton instance
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

/**
 * Safe localStorage read guard (SSR, incognito, sandbox)
 */
function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Restricted environment fallback
  }
  return null;
}

/**
 * Safe localStorage write guard (SSR, incognito, quota exceeded)
 */
function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Quota or sandbox fallback
  }
}

/**
 * LRU cap enforcement for L1 memory cache
 */
function setL1Cache(key: string, summary: string): void {
  if (l1Cache.size >= MAX_L1_CAPACITY) {
    const oldestKey = l1Cache.keys().next().value;
    if (oldestKey) {
      l1Cache.delete(oldestKey);
    }
  }
  l1Cache.set(key, summary);
}

/**
 * Reads compact JSON buffer from localStorage
 */
function readBufferFromLocalStorage(): Record<string, string> {
  const raw = safeLocalStorageGet(LOCAL_STORAGE_BUFFER_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          result[k] = v;
        } else if (v && typeof v === 'object' && typeof (v as any).summary === 'string') {
          result[k] = (v as any).summary;
        }
      }
      return result;
    }
  } catch {
    // Corrupted JSON recovery
  }
  return {};
}

/**
 * Updates Tier 2 localStorage buffer keeping it within capacity
 */
function updateLocalStorageBuffer(key: string, summary: string): void {
  try {
    const buffer = readBufferFromLocalStorage();
    buffer[key] = summary;
    const entries = Object.entries(buffer);
    if (entries.length > BUFFER_CAPACITY) {
      const pruned = Object.fromEntries(entries.slice(entries.length - BUFFER_CAPACITY));
      safeLocalStorageSet(LOCAL_STORAGE_BUFFER_KEY, JSON.stringify(pruned));
    } else {
      safeLocalStorageSet(LOCAL_STORAGE_BUFFER_KEY, JSON.stringify(buffer));
    }
  } catch {
    // Safe failure
  }
}

/**
 * Asynchronously persists generated summaries to Tier 3 IndexedDB
 */
async function persistToIndexedDB(key: string, summary: string): Promise<void> {
  try {
    // 1. Direct key persistence
    await set(key, summary);

    // 2. Master dictionary persistence for offline PWA sync
    const dict = (await get<Record<string, string>>(INDEXEDDB_STORAGE_KEY)) || {};
    dict[key] = summary;
    await set(INDEXEDDB_STORAGE_KEY, dict);
  } catch {
    // Safe failure in restricted sandboxes
  }
}

/**
 * Broadcasts newly cached summary to peer tabs
 */
function broadcastSummaryCached(key: string, summary: string): void {
  const payload = { key, summary, timestamp: Date.now() };
  const event = {
    type: SUMMARY_SYNC_EVENT,
    payload,
    sourceTabId: TAB_INSTANCE_ID,
    timestamp: Date.now(),
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch {
      // Channel post fallback
    }
  }

  // Fallback to localStorage sync bus for cross-window / iframe sync
  safeLocalStorageSet(
    SYNC_STORAGE_BUS_KEY,
    JSON.stringify({ ...event, _nonce: Math.random() })
  );
}

/**
 * Handles incoming sync event from other tabs
 */
function handleIncomingSyncEvent(eventData: any): void {
  if (!eventData || eventData.sourceTabId === TAB_INSTANCE_ID) {
    return; // Suppress loopback
  }
  if (eventData.type === SUMMARY_SYNC_EVENT && eventData.payload) {
    const { key, summary } = eventData.payload;
    if (key && summary) {
      setL1Cache(key, summary);
      updateLocalStorageBuffer(key, summary);
    }
  }
}

// Register multi-tab sync listeners
if (broadcastChannel) {
  try {
    broadcastChannel.onmessage = (evt) => handleIncomingSyncEvent(evt.data);
  } catch {
    // Listener registration fallback
  }
}

if (typeof window !== 'undefined') {
  try {
    window.addEventListener('storage', (evt) => {
      if (evt.key === SYNC_STORAGE_BUS_KEY && evt.newValue) {
        try {
          handleIncomingSyncEvent(JSON.parse(evt.newValue));
        } catch {
          // Corrupted message ignore
        }
      }
    });
  } catch {
    // SSR / Node environment
  }
}

// ==========================================
// 5. CACHE PRE-WARMING (STARTUP 0ms COLD START)
// ==========================================

// 1. Synchronously pre-warm L1 memory cache from localStorage buffer
try {
  const initialBuffer = readBufferFromLocalStorage();
  for (const [key, value] of Object.entries(initialBuffer)) {
    setL1Cache(key, value);
  }
} catch {
  // Safe ignore
}

// 2. Synchronously seed canonical entries into memory cache
for (const [id, summary] of Object.entries(CANONICAL_DEVOTIONAL_SUMMARIES)) {
  setL1Cache(id, summary);
}

// Seed canonical text hashes for immediate 0ms key matches
for (const item of CANONICAL_TEXT_MAPPINGS) {
  const generatedKey = computeDevotionalCacheKey({
    id: item.id,
    type: item.type,
    text: item.text,
  });
  setL1Cache(generatedKey, item.summary);
}

// 3. Asynchronously hydrate additional entries from IndexedDB in the background
if (typeof window !== 'undefined') {
  setTimeout(() => {
    get<Record<string, string>>(INDEXEDDB_STORAGE_KEY)
      .then((dict) => {
        if (dict && typeof dict === 'object') {
          for (const [k, v] of Object.entries(dict)) {
            if (!l1Cache.has(k) && typeof v === 'string') {
              setL1Cache(k, v);
            }
          }
        }
      })
      .catch(() => {});
  }, 100);
}

// ==========================================
// 6. CACHE KEY GENERATION (FNV-1a 32-bit)
// ==========================================

/**
 * Computes a fast, collision-resistant 32-bit FNV-1a hash formatted in base-36.
 */
export function computeTextHash(str: string): string {
  const normalized = (str || '').replace(/\r\n/g, '\n').trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Computes deterministic cache key for verse stanzas:
 * Format: summary:verse:${collectionId}:${padId}:${stanzaNumber}:${textHash}
 */
export function computeVerseCacheKey(
  collectionId: string,
  padId: string,
  stanzaNumber: number | string,
  text: string
): string {
  const hash = computeTextHash(text);
  return `summary:verse:${collectionId}:${padId}:${stanzaNumber}:${hash}`;
}

/**
 * Computes deterministic cache key for contemplative quotes:
 * Format: summary:quote:${sourceSlug}:${quoteIndex}:${textHash}
 */
export function computeQuoteCacheKey(
  sourceSlug: string,
  quoteIndex: number | string,
  text: string
): string {
  const hash = computeTextHash(text);
  return `summary:quote:${sourceSlug}:${quoteIndex}:${hash}`;
}

/**
 * Computes deterministic cache key for any DevotionalSummaryRequest.
 */
export function computeDevotionalCacheKey(request: DevotionalSummaryRequest): string {
  const textHash = computeTextHash(request.text || '');

  if (request.type === 'quote') {
    if (request.sourceSlug && request.quoteIndex !== undefined) {
      return computeQuoteCacheKey(request.sourceSlug, request.quoteIndex, request.text);
    }
    const cleanId = (request.id || 'quote')
      .replace(/^summary:quote:/, '')
      .replace(/^quote-/, '');
    return `summary:quote:${cleanId}:${textHash}`;
  }

  // Verse / Pad
  if (request.collectionId && request.padId && request.stanzaNumber !== undefined) {
    return computeVerseCacheKey(
      request.collectionId,
      request.padId,
      request.stanzaNumber,
      request.text
    );
  }

  const cleanId = (request.id || 'verse').replace(/^summary:(verse|pad):/, '');
  return `summary:verse:${cleanId}:${textHash}`;
}

// ==========================================
// 7. DEVOTIONAL FALLBACK RESOLVER
// ==========================================

function getContextualFallback(request: DevotionalSummaryRequest): string {
  if (request.fallbackText) {
    return request.fallbackText;
  }
  if (request.id && CANONICAL_DEVOTIONAL_SUMMARIES[request.id]) {
    return CANONICAL_DEVOTIONAL_SUMMARIES[request.id];
  }
  if (request.type === 'quote') {
    return 'श्री युगल रस के इस पावन वचन में अनन्य अनुराग व स्वाभाविक समर्पण का गूढ़ रहस्य सन्निहित है। इसके मनन से चित्त में परम शांति और एकाग्रता का प्राकट्य होता है।';
  }
  return DEFAULT_DEVOTIONAL_FALLBACK;
}

// ==========================================
// 8. SYNCHRONOUS PEEK API (0ms Instant Return)
// ==========================================

/**
 * Synchronous 0ms check against Tier 1 L1 memory cache and Tier 2 localStorage buffer.
 * Returns the cached summary immediately or null if not yet cached.
 */
export function getCachedDevotionalSummarySync(
  request: DevotionalSummaryRequest
): string | null {
  const cacheKey = computeDevotionalCacheKey(request);

  // 1. Check L1 Memory Cache (0ms)
  const l1Hit = l1Cache.get(cacheKey);
  if (l1Hit) return l1Hit;

  // Check by request ID in L1
  if (request.id && l1Cache.has(request.id)) {
    const val = l1Cache.get(request.id)!;
    setL1Cache(cacheKey, val);
    return val;
  }

  // 2. Check localStorage buffer
  const buffer = readBufferFromLocalStorage();
  if (buffer[cacheKey]) {
    setL1Cache(cacheKey, buffer[cacheKey]);
    return buffer[cacheKey];
  }
  if (request.id && buffer[request.id]) {
    const val = buffer[request.id];
    setL1Cache(cacheKey, val);
    return val;
  }

  // 3. Check canonical pre-bundled entries
  if (request.id && CANONICAL_DEVOTIONAL_SUMMARIES[request.id]) {
    const canonical = CANONICAL_DEVOTIONAL_SUMMARIES[request.id];
    setL1Cache(cacheKey, canonical);
    return canonical;
  }

  return null;
}

/**
 * Universal synchronous peek function supporting both raw key strings and request objects.
 */
export function getCachedSummarySync(
  keyOrRequest: string | DevotionalSummaryRequest
): string | null {
  if (typeof keyOrRequest === 'string') {
    const l1Hit = l1Cache.get(keyOrRequest);
    if (l1Hit) return l1Hit;

    const buffer = readBufferFromLocalStorage();
    if (buffer[keyOrRequest]) {
      setL1Cache(keyOrRequest, buffer[keyOrRequest]);
      return buffer[keyOrRequest];
    }

    return CANONICAL_DEVOTIONAL_SUMMARIES[keyOrRequest] || null;
  }

  return getCachedDevotionalSummarySync(keyOrRequest);
}

// ==========================================
// 9. ASYNCHRONOUS RETRIEVAL & GROQ AI COMPLETION
// ==========================================

/**
 * Asynchronous cache reader checking L1 -> localStorage -> IndexedDB.
 */
export async function getCachedSummary(
  keyOrRequest: string | DevotionalSummaryRequest
): Promise<string | null> {
  const syncHit = getCachedSummarySync(keyOrRequest);
  if (syncHit) return syncHit;

  const key =
    typeof keyOrRequest === 'string'
      ? keyOrRequest
      : computeDevotionalCacheKey(keyOrRequest);

  try {
    // Check direct key in IndexedDB
    const directVal = await get<string>(key);
    if (directVal) {
      setL1Cache(key, directVal);
      updateLocalStorageBuffer(key, directVal);
      return directVal;
    }

    // Check master dictionary in IndexedDB
    const dict = await get<Record<string, string>>(INDEXEDDB_STORAGE_KEY);
    if (dict && dict[key]) {
      const val = dict[key];
      setL1Cache(key, val);
      updateLocalStorageBuffer(key, val);
      return val;
    }

    if (typeof keyOrRequest !== 'string' && keyOrRequest.id && dict && dict[keyOrRequest.id]) {
      const val = dict[keyOrRequest.id];
      setL1Cache(key, val);
      updateLocalStorageBuffer(key, val);
      return val;
    }
  } catch {
    // Storage access fallback
  }

  return null;
}

/**
 * Primary asynchronous devotional summary fetcher.
 * Coordinates multi-tier caching, request deduplication, Groq Qwen AI completion,
 * and graceful Rasik offline fallback.
 */
export async function getDevotionalSummary(
  request: DevotionalSummaryRequest
): Promise<DevotionalSummaryResult> {
  // Input validation
  if (!request || !request.text || !request.text.trim()) {
    return {
      summary: request?.fallbackText || DEFAULT_DEVOTIONAL_FALLBACK,
      fromCache: false,
      isFallback: true,
    };
  }

  const cacheKey = computeDevotionalCacheKey(request);

  // 1. Synchronous Cache Check (0ms hit)
  const syncHit = getCachedDevotionalSummarySync(request);
  if (syncHit) {
    return {
      summary: syncHit,
      fromCache: true,
      isFallback: false,
    };
  }

  // 2. Persistent IndexedDB Check
  try {
    const idbHit = await getCachedSummary(cacheKey);
    if (idbHit) {
      return {
        summary: idbHit,
        fromCache: true,
        isFallback: false,
      };
    }
  } catch {
    // IndexedDB check failure fallback
  }

  // 3. Offline Check
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const fallback = getContextualFallback(request);
    return {
      summary: fallback,
      fromCache: false,
      isFallback: true,
    };
  }

  // 4. Request Deduplication: Share in-flight Promise for identical keys
  if (pendingRequests.has(cacheKey)) {
    try {
      return await pendingRequests.get(cacheKey)!;
    } catch {
      return {
        summary: getContextualFallback(request),
        fromCache: false,
        isFallback: true,
      };
    }
  }

  // 5. Network Request Execution
  const fetchPromise = (async (): Promise<DevotionalSummaryResult> => {
    const controller = new AbortController();
    const timerId = setTimeout(() => {
      try {
        controller.abort();
      } catch {
        // Abort guard
      }
    }, 12000);

    const systemPrompt =
      'आप श्री वृन्दावन धाम के नित्य निकुंज रस के अनन्य उपासक रसिक संत हैं। आपका प्रयोजन साधक को दिए गए पद, श्लोक या उक्ति का गूढ़ भाव सार (दिव्य रस) २ से ३ अत्यंत मधुर, भक्तिपूर्ण एवं अंतर्मुखी वाक्यों में प्रकट करना है। वाणी में श्री राधा-कृष्ण युगल सरकार के प्रति असीम आदर, माधुर्य एवं समर्पण हो। उत्तर केवल भाव सार का हो, कोई भूमिका, शीर्षक या अनावश्यक आधुनिक शब्दावली न हो।';

    const source =
      request.source ||
      (request.type === 'quote' ? 'रसिक अमृत उक्ति' : 'रसिक वाणी');
    const author = request.author || 'श्री रसिक संत';
    const userPrompt = `ग्रंथ / स्रोत: ${source}
रचयिता: ${author}
पद / श्लोक पंक्ति:
"${request.text}"

इस पावन पद/उक्ति का भाव सार (दिव्य रस) २-३ वाक्यों में प्रकट करें।`;

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.35,
          max_tokens: 250,
        }),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        throw new Error('Empty summary received');
      }

      let content = rawContent.trim();

      // Clean leading and trailing quotation marks
      if (
        (content.startsWith('"') && content.endsWith('"')) ||
        (content.startsWith('“') && content.endsWith('”')) ||
        (content.startsWith('‘') && content.endsWith('’'))
      ) {
        content = content.slice(1, -1).trim();
      }

      // Strip markdown code fences if wrapped
      content = content
        .replace(/^```[a-zA-Z]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      // 1. Populate Tier 1 Memory Cache
      setL1Cache(cacheKey, content);

      // 2. Populate Tier 2 localStorage buffer
      updateLocalStorageBuffer(cacheKey, content);

      // 3. Populate Tier 3 IndexedDB asynchronously
      persistToIndexedDB(cacheKey, content).catch(() => {});

      // 4. Broadcast multi-tab sync event
      broadcastSummaryCached(cacheKey, content);

      return {
        summary: content,
        fromCache: false,
        isFallback: false,
      };
    } catch (_err) {
      clearTimeout(timerId);
      const fallback = getContextualFallback(request);
      return {
        summary: fallback,
        fromCache: false,
        isFallback: true,
      };
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}
