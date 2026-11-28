/**
 * Ultra-fast In-Memory & LocalStorage Cache System for Bot Assistants.
 * Ensures 0ms repeat response retrieval across low- to high-spec devices.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'vrind_bot_cache_';

class AssistantCacheService {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private maxMemoryItems = 60;
  private defaultTTLMs = 1000 * 60 * 60 * 24;

  constructor() {
    this.hydrateFromStorage();
  }

  private getKey(key: string): string {
    return `${CACHE_PREFIX}${key.toLowerCase().trim()}`;
  }

  private hydrateFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            if (Date.now() < entry.expiresAt) {
              this.memoryCache.set(key.slice(CACHE_PREFIX.length), entry);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {
      // Restricted browsing fallback
    }
  }

  public get<T>(key: string): T | null {
    const cleanKey = key.toLowerCase().trim();
    const entry = this.memoryCache.get(cleanKey);

    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return entry.data as T;
      }
      this.memoryCache.delete(cleanKey);
      try {
        localStorage.removeItem(this.getKey(cleanKey));
      } catch {}
    }
    return null;
  }

  public set<T>(key: string, data: T, ttlMs: number = this.defaultTTLMs): void {
    const cleanKey = key.toLowerCase().trim();
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(cleanKey, entry);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.getKey(cleanKey), JSON.stringify(entry));
      }
    } catch {}
  }

  public clear(): void {
    this.memoryCache.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const toDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            toDelete.push(key);
          }
        }
        toDelete.forEach((k) => localStorage.removeItem(k));
      }
    } catch {}
  }
}

export const assistantCache = new AssistantCacheService();
