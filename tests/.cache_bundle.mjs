// src/services/cacheService.ts
import { get, set } from "idb-keyval";
var SADHANA_STORAGE_KEY = "vrindopnisad_sadhana_v2";
var CACHED_PADS_KEY = "vrindopnisad_cached_pads_v2";
var FEED_INTERACTIONS_KEY = "vrindopnisad_feed_v2";
var READER_STATE_KEY = "vrindopnisad_padavali_v2";
var PREFERENCES_KEY = "vrindopnisad_preferences_v2";
var SYNC_CHANNEL_NAME = "vrindopnisad_sync";
var SYNC_STORAGE_BUS_KEY = "vrindopnisad_sync_bus";
var defaultSadhanaState = {
  japaCompleted: 16,
  japaTarget: 16,
  shravanMinutes: 45,
  shravanTarget: 60,
  svadhyayaPadas: 8,
  svadhyayaTarget: 10,
  currentStreakDays: 14,
  completedMilestones: ["1-mala", "5-mala", "10-mala", "3-niyam", "7-niyam", "14-niyam"],
  bookmarkedPads: ["hit-chaurasi-01", "radha-kripa-kataksha"]
};
var defaultReaderState = {
  lastPadId: "hit-chaurasi-01",
  showTransliteration: true,
  bookmarkedPadIds: ["hit-chaurasi-01", "radha-kripa-kataksha"],
  selectedTradition: "all"
};
var defaultUserPreferences = {
  isLowSpecMode: false,
  audioVolume: 0.8,
  activeTab: "smaran"
};
function reconcileSadhana(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { ...defaultSadhanaState };
  }
  const obj = parsed;
  return {
    japaCompleted: typeof obj.japaCompleted === "number" ? obj.japaCompleted : defaultSadhanaState.japaCompleted,
    japaTarget: typeof obj.japaTarget === "number" ? obj.japaTarget : defaultSadhanaState.japaTarget,
    shravanMinutes: typeof obj.shravanMinutes === "number" ? obj.shravanMinutes : defaultSadhanaState.shravanMinutes,
    shravanTarget: typeof obj.shravanTarget === "number" ? obj.shravanTarget : defaultSadhanaState.shravanTarget,
    svadhyayaPadas: typeof obj.svadhyayaPadas === "number" ? obj.svadhyayaPadas : defaultSadhanaState.svadhyayaPadas,
    svadhyayaTarget: typeof obj.svadhyayaTarget === "number" ? obj.svadhyayaTarget : defaultSadhanaState.svadhyayaTarget,
    currentStreakDays: typeof obj.currentStreakDays === "number" ? obj.currentStreakDays : defaultSadhanaState.currentStreakDays,
    completedMilestones: Array.isArray(obj.completedMilestones) ? obj.completedMilestones : [...defaultSadhanaState.completedMilestones],
    bookmarkedPads: Array.isArray(obj.bookmarkedPads) ? obj.bookmarkedPads : [...defaultSadhanaState.bookmarkedPads]
  };
}
function reconcileReaderState(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { ...defaultReaderState };
  }
  const obj = parsed;
  return {
    lastPadId: typeof obj.lastPadId === "string" ? obj.lastPadId : defaultReaderState.lastPadId,
    showTransliteration: typeof obj.showTransliteration === "boolean" ? obj.showTransliteration : defaultReaderState.showTransliteration,
    bookmarkedPadIds: Array.isArray(obj.bookmarkedPadIds) ? obj.bookmarkedPadIds : [...defaultReaderState.bookmarkedPadIds || []],
    selectedTradition: typeof obj.selectedTradition === "string" ? obj.selectedTradition : defaultReaderState.selectedTradition
  };
}
function reconcileUserPreferences(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { ...defaultUserPreferences };
  }
  const obj = parsed;
  return {
    isLowSpecMode: typeof obj.isLowSpecMode === "boolean" ? obj.isLowSpecMode : defaultUserPreferences.isLowSpecMode,
    audioVolume: typeof obj.audioVolume === "number" ? obj.audioVolume : defaultUserPreferences.audioVolume,
    activeTab: typeof obj.activeTab === "string" ? obj.activeTab : defaultUserPreferences.activeTab
  };
}
function safeLocalStorageGet(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
  }
  return null;
}
function safeLocalStorageSet(key, value) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
  }
}
var memorySadhana = null;
var memoryFeedInteractions = null;
var memoryReaderState = null;
var memoryPreferences = null;
var TAB_INSTANCE_ID = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
var broadcastChannelInstance = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannelInstance = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    broadcastChannelInstance = null;
  }
}
function broadcastSync(type, payload) {
  const event = {
    type,
    payload,
    sourceTabId: TAB_INSTANCE_ID,
    timestamp: Date.now()
  };
  if (broadcastChannelInstance) {
    try {
      broadcastChannelInstance.postMessage(event);
    } catch {
    }
  }
  safeLocalStorageSet(
    SYNC_STORAGE_BUS_KEY,
    JSON.stringify({ ...event, _nonce: Math.random() })
  );
}
function loadCachedSadhanaSync() {
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
    }
  }
  memorySadhana = { ...defaultSadhanaState };
  return { ...memorySadhana };
}
async function loadCachedSadhana() {
  try {
    const data = await get(SADHANA_STORAGE_KEY);
    if (data) {
      const reconciled = reconcileSadhana(data);
      memorySadhana = reconciled;
      safeLocalStorageSet(SADHANA_STORAGE_KEY, JSON.stringify(reconciled));
      return { ...reconciled };
    }
  } catch (err) {
    console.warn("IndexedDB unavailable or read failed, falling back to L1 cache:", err);
  }
  const l1State = loadCachedSadhanaSync();
  try {
    await set(SADHANA_STORAGE_KEY, l1State);
  } catch {
  }
  return l1State;
}
async function persistSadhana(state) {
  const cloned = { ...state };
  memorySadhana = cloned;
  safeLocalStorageSet(SADHANA_STORAGE_KEY, JSON.stringify(cloned));
  try {
    await set(SADHANA_STORAGE_KEY, cloned);
  } catch {
  }
  broadcastSync("SADHANA_UPDATED", cloned);
}
function getFeedInteractionsSync() {
  if (memoryFeedInteractions) {
    return { ...memoryFeedInteractions };
  }
  const raw = safeLocalStorageGet(FEED_INTERACTIONS_KEY);
  if (raw) {
    try {
      memoryFeedInteractions = JSON.parse(raw);
      return { ...memoryFeedInteractions || {} };
    } catch {
    }
  }
  memoryFeedInteractions = {};
  return {};
}
async function getFeedInteractions() {
  try {
    const data = await get(FEED_INTERACTIONS_KEY);
    if (data && typeof data === "object") {
      memoryFeedInteractions = data;
      safeLocalStorageSet(FEED_INTERACTIONS_KEY, JSON.stringify(data));
      return { ...data };
    }
  } catch (err) {
    console.warn("IndexedDB feed interactions read failed:", err);
  }
  return getFeedInteractionsSync();
}
async function saveFeedInteraction(postId, data) {
  const current = getFeedInteractionsSync();
  const prev = current[postId] || {
    isLiked: false,
    isBookmarked: false,
    isFollowing: false,
    likes: 0
  };
  const updated = {
    isLiked: data.isLiked !== void 0 ? data.isLiked : prev.isLiked,
    isBookmarked: data.isBookmarked !== void 0 ? data.isBookmarked : prev.isBookmarked,
    isFollowing: data.isFollowing !== void 0 ? data.isFollowing : prev.isFollowing,
    likes: data.likes !== void 0 ? data.likes : prev.likes
  };
  current[postId] = updated;
  memoryFeedInteractions = current;
  safeLocalStorageSet(FEED_INTERACTIONS_KEY, JSON.stringify(current));
  try {
    await set(FEED_INTERACTIONS_KEY, current);
  } catch {
  }
  broadcastSync("FEED_INTERACTION_UPDATED", { postId, interaction: updated });
}
function getReaderStateSync() {
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
    }
  }
  memoryReaderState = { ...defaultReaderState };
  return { ...memoryReaderState };
}
async function getReaderState() {
  try {
    const data = await get(READER_STATE_KEY);
    if (data) {
      const merged = reconcileReaderState(data);
      memoryReaderState = merged;
      safeLocalStorageSet(READER_STATE_KEY, JSON.stringify(merged));
      return { ...merged };
    }
  } catch (err) {
    console.warn("IndexedDB reader state read failed:", err);
  }
  return getReaderStateSync();
}
async function saveReaderState(data) {
  const current = getReaderStateSync();
  const updated = reconcileReaderState({
    ...current,
    ...data
  });
  memoryReaderState = updated;
  safeLocalStorageSet(READER_STATE_KEY, JSON.stringify(updated));
  try {
    await set(READER_STATE_KEY, updated);
  } catch {
  }
  broadcastSync("READER_STATE_UPDATED", updated);
}
function getUserPreferencesSync() {
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
    }
  }
  memoryPreferences = { ...defaultUserPreferences };
  return { ...memoryPreferences };
}
async function getUserPreferences() {
  try {
    const data = await get(PREFERENCES_KEY);
    if (data) {
      const merged = reconcileUserPreferences(data);
      memoryPreferences = merged;
      safeLocalStorageSet(PREFERENCES_KEY, JSON.stringify(merged));
      return { ...merged };
    }
  } catch (err) {
    console.warn("IndexedDB user preferences read failed:", err);
  }
  return getUserPreferencesSync();
}
async function saveUserPreferences(data) {
  const current = getUserPreferencesSync();
  const updated = reconcileUserPreferences({
    ...current,
    ...data
  });
  memoryPreferences = updated;
  safeLocalStorageSet(PREFERENCES_KEY, JSON.stringify(updated));
  try {
    await set(PREFERENCES_KEY, updated);
  } catch {
  }
  broadcastSync("USER_PREFERENCES_UPDATED", updated);
}
async function getCachedBookmarks() {
  try {
    const bookmarks = await get(CACHED_PADS_KEY);
    if (bookmarks && Array.isArray(bookmarks)) {
      return bookmarks;
    }
  } catch {
  }
  const reader = getReaderStateSync();
  return reader.bookmarkedPadIds || defaultSadhanaState.bookmarkedPads;
}
async function saveCachedBookmarks(bookmarks) {
  try {
    await set(CACHED_PADS_KEY, bookmarks);
  } catch {
  }
  await saveReaderState({ bookmarkedPadIds: bookmarks });
  const currentSadhana = loadCachedSadhanaSync();
  await persistSadhana({ ...currentSadhana, bookmarkedPads: bookmarks });
  broadcastSync("BOOKMARKS_UPDATED", bookmarks);
}
function initMultiTabSync(onSync) {
  const handleIncomingEvent = (evt) => {
    if (!evt || evt.sourceTabId === TAB_INSTANCE_ID) {
      return;
    }
    switch (evt.type) {
      case "SADHANA_UPDATED":
        if (evt.payload) {
          memorySadhana = evt.payload;
        }
        break;
      case "FEED_INTERACTION_UPDATED": {
        const payload = evt.payload;
        if (payload?.postId && payload?.interaction) {
          if (!memoryFeedInteractions) {
            memoryFeedInteractions = getFeedInteractionsSync();
          }
          memoryFeedInteractions[payload.postId] = payload.interaction;
        }
        break;
      }
      case "READER_STATE_UPDATED":
        if (evt.payload) {
          memoryReaderState = evt.payload;
        }
        break;
      case "USER_PREFERENCES_UPDATED":
        if (evt.payload) {
          memoryPreferences = evt.payload;
        }
        break;
      case "BOOKMARKS_UPDATED":
        if (Array.isArray(evt.payload)) {
          if (memoryReaderState) {
            memoryReaderState.bookmarkedPadIds = evt.payload;
          }
          if (memorySadhana) {
            memorySadhana.bookmarkedPads = evt.payload;
          }
        }
        break;
    }
    onSync({ type: evt.type, payload: evt.payload });
  };
  const onBcMessage = (e) => {
    if (e.data && typeof e.data === "object" && "type" in e.data) {
      handleIncomingEvent(e.data);
    }
  };
  if (broadcastChannelInstance) {
    broadcastChannelInstance.addEventListener("message", onBcMessage);
  }
  const onStorage = (e) => {
    if (e.key === SYNC_STORAGE_BUS_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && typeof parsed === "object" && "type" in parsed) {
          handleIncomingEvent(parsed);
        }
      } catch {
      }
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    if (broadcastChannelInstance) {
      broadcastChannelInstance.removeEventListener("message", onBcMessage);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
var DEVANAGARI_DIGITS = ["\u0966", "\u0967", "\u0968", "\u0969", "\u096A", "\u096B", "\u096C", "\u096D", "\u096E", "\u096F"];
function formatDevanagariNumerals(num) {
  if (isNaN(num)) return "\u0966";
  return num.toLocaleString("en-IN").replace(/[0-9]/g, (digit) => DEVANAGARI_DIGITS[Number(digit)] || digit);
}
function computeMantraCount(sadhana) {
  const malas = sadhana?.japaCompleted ?? 0;
  return Math.max(0, malas * 108);
}
function computeProgressPercent(current, target) {
  if (!target || target <= 0) return 0;
  const pct = Math.round(current / target * 100);
  return Math.min(100, Math.max(0, pct));
}
function computeStreakStatus(sadhana) {
  const count = Math.max(0, sadhana?.currentStreakDays ?? 0);
  const hasActivityToday = Boolean(
    sadhana && ((sadhana.japaCompleted ?? 0) > 0 || (sadhana.shravanMinutes ?? 0) > 0 || (sadhana.svadhyayaPadas ?? 0) > 0)
  );
  return {
    count,
    active: hasActivityToday,
    labelDevanagari: `${formatDevanagariNumerals(count)} \u0926\u093F\u0935\u0938 \u0905\u0916\u0923\u094D\u0921 \u0928\u093F\u092F\u092E`
  };
}
function computeSadhanaSummary(sadhana) {
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
  const isDailyGoalMet = japaPercent >= 100 && shravanPercent >= 100 && svadhyayaPercent >= 100;
  const totalPercent = Math.round((japaPercent + shravanPercent + svadhyayaPercent) / 3);
  return {
    mantraCount,
    mantraCountFormatted: mantraCount.toLocaleString("en-IN"),
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
    completionRatePercent: totalPercent
  };
}
function computeAshtayamaPhase(date = /* @__PURE__ */ new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  if (timeInMinutes >= 210 && timeInMinutes < 360) {
    return {
      nameDevanagari: "\u092E\u0902\u0917\u0932\u093E",
      nameEnglish: "Mangala",
      timeRange: "03:30 - 06:00",
      descriptionDevanagari: "\u092A\u094D\u0930\u092D\u093E\u0924 \u091C\u093E\u0917\u0930\u0923 \u090F\u0935\u0902 \u092E\u0927\u0941\u0930 \u0935\u0947\u0923\u0941 \u0935\u093E\u0926\u0928",
      bhava: "\u091C\u093E\u0917\u0930\u0923 \u092D\u093E\u0935",
      isActive: true
    };
  }
  if (timeInMinutes >= 360 && timeInMinutes < 510) {
    return {
      nameDevanagari: "\u0936\u0943\u0902\u0917\u093E\u0930",
      nameEnglish: "Shringar",
      timeRange: "06:00 - 08:30",
      descriptionDevanagari: "\u0938\u0916\u0940 \u092D\u093E\u0935 \u0938\u0947 \u0926\u093F\u0935\u094D\u092F \u092D\u0942\u0937\u0923 \u090F\u0935\u0902 \u092A\u0941\u0937\u094D\u092A \u0936\u0943\u0902\u0917\u093E\u0930",
      bhava: "\u0938\u0916\u0940 \u0936\u0943\u0902\u0917\u093E\u0930",
      isActive: true
    };
  }
  if (timeInMinutes >= 510 && timeInMinutes < 630) {
    return {
      nameDevanagari: "\u0917\u094D\u0935\u093E\u0932",
      nameEnglish: "Gwal",
      timeRange: "08:30 - 10:30",
      descriptionDevanagari: "\u0917\u094B\u091A\u093E\u0930\u0923 \u090F\u0935\u0902 \u0938\u0916\u093E \u0938\u0902\u0917 \u092E\u0927\u0941\u0930 \u0932\u0940\u0932\u093E",
      bhava: "\u0938\u0916\u094D\u092F \u092D\u093E\u0935",
      isActive: true
    };
  }
  if (timeInMinutes >= 630 && timeInMinutes < 780) {
    return {
      nameDevanagari: "\u0930\u093E\u091C\u092D\u094B\u0917",
      nameEnglish: "Rajbhog",
      timeRange: "10:30 - 13:00",
      descriptionDevanagari: "\u092E\u0927\u094D\u092F\u093E\u0939\u094D\u0928 \u0926\u093F\u0935\u094D\u092F \u0935\u094D\u092F\u0902\u091C\u0928 \u0938\u092E\u0930\u094D\u092A\u0923 \u090F\u0935\u0902 \u0928\u093F\u0915\u0941\u0902\u091C \u092D\u094B\u0917",
      bhava: "\u092E\u093E\u0927\u0941\u0930\u094D\u092F \u092D\u094B\u0917",
      isActive: true
    };
  }
  if (timeInMinutes >= 930 && timeInMinutes < 1020) {
    return {
      nameDevanagari: "\u0909\u0924\u094D\u0925\u093E\u092A\u0928",
      nameEnglish: "Utthapan",
      timeRange: "15:30 - 17:00",
      descriptionDevanagari: "\u0905\u092A\u0930\u093E\u0939\u094D\u0928 \u0938\u0941\u0916\u0926 \u091C\u093E\u0917\u0930\u0923 \u090F\u0935\u0902 \u0935\u0947\u0923\u0941 \u0927\u094D\u0935\u0928\u093F",
      bhava: "\u091C\u093E\u0917\u0930\u0923 \u092D\u093E\u0935",
      isActive: true
    };
  }
  if (timeInMinutes >= 1020 && timeInMinutes < 1110) {
    return {
      nameDevanagari: "\u092D\u094B\u0917",
      nameEnglish: "Bhog",
      timeRange: "17:00 - 18:30",
      descriptionDevanagari: "\u0938\u0928\u094D\u0927\u094D\u092F\u093E\u0915\u093E\u0932\u0940\u0928 \u092B\u0932-\u092E\u093F\u0937\u094D\u0920\u093E\u0928\u094D\u0928 \u0938\u092E\u0930\u094D\u092A\u0923",
      bhava: "\u0935\u093E\u0924\u094D\u0938\u0932\u094D\u092F-\u092E\u093E\u0927\u0941\u0930\u094D\u092F",
      isActive: true
    };
  }
  if (timeInMinutes >= 1110 && timeInMinutes < 1230) {
    return {
      nameDevanagari: "\u0938\u0928\u094D\u0927\u094D\u092F\u093E \u0906\u0930\u0924\u0940",
      nameEnglish: "Sandhya Aarti",
      timeRange: "18:30 - 20:30",
      descriptionDevanagari: "\u0926\u0940\u092A\u0926\u093E\u0928, \u0915\u0930\u094D\u092A\u0942\u0930 \u0906\u0930\u0924\u0940 \u090F\u0935\u0902 \u0939\u0930\u093F\u0928\u093E\u092E \u0938\u0902\u0915\u0940\u0930\u094D\u0924\u0928",
      bhava: "\u0926\u0940\u092A\u093E\u0935\u0932\u0940 \u092D\u093E\u0935",
      isActive: true
    };
  }
  return {
    nameDevanagari: "\u0936\u092F\u0928",
    nameEnglish: "Shayan",
    timeRange: "20:30 - 03:30",
    descriptionDevanagari: "\u0928\u093F\u0924\u094D\u092F \u0928\u093F\u0915\u0941\u0902\u091C \u0935\u093F\u0939\u093E\u0930 \u090F\u0935\u0902 \u0938\u0941\u0916\u0926 \u0936\u092F\u0928",
    bhava: "\u0930\u0938\u0935\u093F\u0939\u093E\u0930 \u092D\u093E\u0935",
    isActive: true
  };
}
export {
  CACHED_PADS_KEY,
  FEED_INTERACTIONS_KEY,
  PREFERENCES_KEY,
  READER_STATE_KEY,
  SADHANA_STORAGE_KEY,
  SYNC_CHANNEL_NAME,
  SYNC_STORAGE_BUS_KEY,
  computeAshtayamaPhase,
  computeMantraCount,
  computeProgressPercent,
  computeSadhanaSummary,
  computeStreakStatus,
  defaultReaderState,
  defaultSadhanaState,
  defaultUserPreferences,
  formatDevanagariNumerals,
  getCachedBookmarks,
  getFeedInteractions,
  getFeedInteractionsSync,
  getReaderState,
  getReaderStateSync,
  getUserPreferences,
  getUserPreferencesSync,
  initMultiTabSync,
  loadCachedSadhana,
  loadCachedSadhanaSync,
  persistSadhana,
  saveCachedBookmarks,
  saveFeedInteraction,
  saveReaderState,
  saveUserPreferences
};
