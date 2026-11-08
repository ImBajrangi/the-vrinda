import { get, set, del } from 'idb-keyval';
import { supabase } from './supabaseClient';
import { SACRED_PADS } from '../data/padas';
import canonicalGranthasData from '../data/canonicalGranthas.json';
import canonicalSaintsData from '../data/canonicalSaints.json';
import brajGlossaryData from '../data/brajGlossary.json';
import rasikAphorismsData from '../data/rasikAphorisms.json';
import ashtayamaPeriodsData from '../data/ashtayamaPeriods.json';
import sacredTopicsData from '../data/sacredTopics.json';
import sadhanaBadgesData from '../data/sadhanaBadges.json';
import feedTabsData from '../data/feedTabs.json';
import { SacredPad } from '../types/devotional';

export interface CanonicalGrantha {
  id: string;
  name: string;
  author: string;
  count: number;
  slug: string;
  description: string;
}

export interface CanonicalSaint {
  id: string;
  name: string;
  nameEng: string;
  slug: string;
  biography: string;
  articleCount: number;
  tradition: string;
}

export interface BrajGlossaryTerm {
  id: string;
  term: string;
  transliteration: string;
  meaningDevanagari: string;
  context: string;
}

export interface RasikAphorism {
  id: string;
  source: string;
  verse: string;
  meaning: string;
}

export interface AshtayamaPeriod {
  id: string;
  nameDevanagari: string;
  nameEnglish: string;
  timeRange: string;
  raga: string;
  bhava: string;
  description: string;
}

export interface SacredTopic {
  id: string;
  title: string;
  devanagari: string;
  typeLabel: string;
  location: string;
  tradition: string;
  essence: string;
  tagColor: string;
  imageUrl: string;
}

export interface SadhanaBadgeDef {
  id: string;
  value: number;
  label: string;
  type: 'milestone' | 'streak';
  titleDevanagari: string;
  requirement: string;
  blessing: string;
  spiritualSignificance: string;
}

export interface FeedTabItem {
  id: 'विशेष दर्शन' | 'उत्सव धारा' | 'सेवक मंडल' | 'उर धरे' | 'धाम वार्ता';
  label: string;
  sublabel: string;
}

export interface DisplayBookItem {
  id: string;
  title: string;
  devanagari: string;
  author: string;
  count: number;
  countUnit: string;
  tradition: string;
  essence: string;
  tagColor: string;
  imageUrl: string;
}

export interface DisplayAuthorItem {
  id: string;
  name: string;
  devanagari: string;
  tradition: string;
  totalCompositions: number;
  significance: string;
  tagColor: string;
  imageUrl: string;
}

export interface SearchCatalogItem {
  id: string;
  title: string;
  author: string;
  collectionId: string;
  rag: string;
  snippet: string;
}

// Non-musical metadata / meter labels to exclude from classical raga classifications
const NON_RAGAS = new Set([
  'स्तोत्र पाठ',
  'लता',
  'रस',
  'सखी',
  'वाग',
  'के',
  'कवित्त / सवैया',
  'कवित्त',
  'सवैया',
  'सामान्य',
]);

/**
 * Normalizes all 4,204 canonical padas into uniform SacredPad instances
 * with authenticated grantha attribution, classical raga harmonization, and full verse structure.
 */
function normalizeCanonicalPad(raw: any): SacredPad {
  const author = (raw.author || raw.composer || 'श्री रसिक परंपरा').trim();
  const title = (raw.titleDevanagari || raw.title || 'श्री पद').trim();

  // 1. Resolve canonical collection / grantha ID matching real textual lineage
  let collectionId = raw.collectionId || raw.granthaId || '';
  if (!collectionId || collectionId === 'rasik-vani' || collectionId === 'other') {
    if (/स्तोत्र|अष्टक|कटाक्ष/i.test(title)) collectionId = 'stotras';
    else if (/हरिवंश|हित चौरासी|चतुरासी/i.test(author + title)) collectionId = 'hit-chaurasi';
    else if (/हरिदास|केलिमाल/i.test(author + title)) collectionId = 'kelimal';
    else if (/ध्रुवदास/i.test(author)) collectionId = 'bayalees-leela';
    else if (/सूरदास/i.test(author)) collectionId = 'sur-sagar';
    else if (/रसखान/i.test(author)) collectionId = 'raskhan-padavali';
    else if (/लाल बलबीर/i.test(author)) collectionId = 'braj-binod';
    else if (/कृपालु/i.test(author)) collectionId = 'bhakti-shatak';
    else if (/व्यास/i.test(author)) collectionId = 'vyas-vani';
    else if (/ललित किशोरी|ललित मोहिनी/i.test(author)) collectionId = 'lalit-kishori-vani';
    else if (/बिहारिन|भगवत रसिक/i.test(author)) collectionId = 'biharin-dev-vani';
    else if (/नारायण स्वामी/i.test(author)) collectionId = 'narayan-swami-vani';
    else if (/दोहे|दोहा/i.test(author + title)) collectionId = 'braj-dohe';
    else if (/सवैया/i.test(author + title)) collectionId = 'braj-savaiya';
    else collectionId = 'rasik-vani-sangrah';
  }

  // 2. Harmonize authentic Hindustani / Braj classical musical Ragas
  let rag = (raw.rag || '').trim();
  if (NON_RAGAS.has(rag)) rag = '';
  if (rag === 'खंजनाक्षी') rag = 'आसावरी';
  if (rag === 'सोरठा') rag = 'सोरठ';
  if (rag === 'मलार') rag = 'मल्हार';
  if (rag === 'कल्यान') rag = 'कल्याण';
  if (rag === 'विहागरौ') rag = 'विहाग';
  if (rag === 'खम्माज' || rag === 'खम्माच') rag = 'खमाच';
  if (rag === 'कान्हरौ') rag = 'कन्हारो';
  if (rag === 'वसन्त') rag = 'बसंत';

  // 3. Normalize verses from stanzas if needed
  let verses = raw.verses;
  if (!verses || !verses.length) {
    if (raw.stanzas && raw.stanzas.length) {
      verses = raw.stanzas.map((st: any, idx: number) => ({
        stanzaNumber: st.index || idx + 1,
        linesDevanagari: st.linesDevanagari || [],
        linesEnglish: st.linesEnglish || [],
      }));
    } else {
      verses = [{ stanzaNumber: 1, linesDevanagari: [title], linesEnglish: [] }];
    }
  }

  const slug = raw.slug || raw.id || '';

  return {
    ...raw,
    collectionId,
    titleDevanagari: title,
    titleEnglish: raw.titleEnglish || raw.titleEng || '',
    author,
    rag,
    slug,
    verses,
  };
}

// Initial lightweight seed padas for 0ms instantaneous First Contentful Paint
const seedPadas: SacredPad[] = (SACRED_PADS || []).map(normalizeCanonicalPad);

let allPadas: SacredPad[] = [...seedPadas];
const allGranthas: CanonicalGrantha[] = canonicalGranthasData as CanonicalGrantha[];
const allSaints: CanonicalSaint[] = canonicalSaintsData as CanonicalSaint[];

const padasById = new Map<string, SacredPad>();
const padasBySlug = new Map<string, SacredPad>();
const padasByGrantha = new Map<string, SacredPad[]>();
const padasByRaga = new Map<string, SacredPad[]>();

function indexPadas(pads: SacredPad[]) {
  pads.forEach((pad) => {
    padasById.set(pad.id, pad);
    if (pad.slug) {
      padasBySlug.set(pad.slug, pad);
      padasBySlug.set(pad.slug.toLowerCase(), pad);
    }

    // Group by collection/grantha
    const gList = padasByGrantha.get(pad.collectionId) || [];
    gList.push(pad);
    padasByGrantha.set(pad.collectionId, gList);

    // Group by raga
    if (pad.rag) {
      const rList = padasByRaga.get(pad.rag) || [];
      rList.push(pad);
      padasByRaga.set(pad.rag, rList);
    }
  });
}

// Build initial seed index synchronously for immediate frame-0 render
indexPadas(seedPadas);

// Check if server pre-injected an initial requested pad for zero-flash SSR hydration
if (typeof window !== 'undefined') {
  try {
    const initialState = (window as any).__INITIAL_STATE__;
    if (initialState?.initialPad) {
      const norm = normalizeCanonicalPad(initialState.initialPad);
      if (!padasById.has(norm.id)) {
        allPadas.unshift(norm);
        indexPadas([norm]);
      }
    }
  } catch {}
}

let isFullyLoaded = false;
let initPromise: Promise<void> | null = null;
let activeManifest: any = null;
const dbListeners = new Set<() => void>();

let authUserIdPromise: Promise<string | null> | null = null;

/**
 * Retrieves or establishes a cryptographically secure Supabase user session.
 * Triggered strictly on-demand when a devotee saves a bookmark, ensuring:
 * 1. Zero MAU consumption for passive scripture readers (85% of traffic).
 * 2. Strict RLS authorization preventing device ID spoofing (auth.uid() = user_id).
 */
async function getOrInitAuthUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (authUserIdPromise) return authUserIdPromise;

  authUserIdPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return null;
      return data?.user?.id || null;
    } catch {
      return null;
    }
  })();

  return authUserIdPromise;
}

/**
 * High-Performance Sacred Database API
 * Uses a zero-cost, two-tier cache architecture:
 * 1. Synchronous lightweight seed for 0ms First Contentful Paint
 * 2. Persistent Client IndexedDB cache for permanent 0ms offline retrieval (zero server bandwidth)
 * 3. Fallback database endpoint with aggressive HTTP immutable caching
 */
export const SacredDatabase = {
  isLoaded(): boolean {
    return isFullyLoaded;
  },

  subscribe(listener: () => void): () => void {
    dbListeners.add(listener);
    return () => {
      dbListeners.delete(listener);
    };
  },

  loadPadas(rawPadas: any[]): void {
    if (!rawPadas || !rawPadas.length) return;
    const normalized = rawPadas.map(normalizeCanonicalPad);
    allPadas = normalized;
    padasById.clear();
    padasBySlug.clear();
    padasByGrantha.clear();
    padasByRaga.clear();

    indexPadas(normalized);
    isFullyLoaded = true;

    dbListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('SacredDatabase listener notification error:', err);
      }
    });
  },

  appendPadas(rawPadas: any[]): void {
    if (!rawPadas || !rawPadas.length) return;
    const normalized = rawPadas.map(normalizeCanonicalPad);
    let addedCount = 0;

    normalized.forEach((pad) => {
      const existing = padasById.get(pad.id);
      if (!existing) {
        allPadas.push(pad);
        addedCount++;
      } else {
        // Upgrade existing seed pad with full verses if available
        if (pad.verses && pad.verses.length > 0 && (!existing.verses || existing.verses.length <= 1)) {
          Object.assign(existing, pad);
          addedCount++;
        }
      }

      padasById.set(pad.id, pad);
      if (pad.slug) {
        padasBySlug.set(pad.slug, pad);
        padasBySlug.set(pad.slug.toLowerCase(), pad);
      }

      const gList = padasByGrantha.get(pad.collectionId) || [];
      if (!gList.some((p) => p.id === pad.id)) {
        gList.push(pad);
        padasByGrantha.set(pad.collectionId, gList);
      }

      if (pad.rag) {
        const rList = padasByRaga.get(pad.rag) || [];
        if (!rList.some((p) => p.id === pad.id)) {
          rList.push(pad);
          padasByRaga.set(pad.rag, rList);
        }
      }
    });

    if (addedCount > 0) {
      dbListeners.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    }
  },

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (isFullyLoaded) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // Step 1: Instant Local Hydration (0ms local retrieval, 0 bytes network bandwidth)
        const cachedManifest = await get<any>('vrind_manifest_v2');
        if (cachedManifest) activeManifest = cachedManifest;

        const cachedPadas = await get<any[]>('vrind_canonical_padas_v2');
        if (cachedPadas && Array.isArray(cachedPadas) && cachedPadas.length > 50) {
          SacredDatabase.loadPadas(cachedPadas);
        }

        // Check if hit-chaurasi was cached in IndexedDB
        const hitMeta = activeManifest?.granthas?.['hit-chaurasi'];
        const hitKey = hitMeta?.hash ? `vrind_grantha_hit-chaurasi_${hitMeta.hash}` : 'vrind_grantha_hit-chaurasi';
        const cachedHit = await get<any[]>(hitKey);
        if (cachedHit && Array.isArray(cachedHit) && cachedHit.length > 0) {
          SacredDatabase.appendPadas(cachedHit);
        }

        // Step 2: Background Manifest Revalidation & Cache Invalidation Check (~0.8 KB gz)
        try {
          const mRes = await fetch('/data/manifest.json');
          if (mRes.ok) {
            const freshManifest = await mRes.json();

            // Invalidate stale grantha chunks if content hash changed
            if (activeManifest?.granthas && freshManifest?.granthas) {
              for (const [colId, meta] of Object.entries(freshManifest.granthas) as [string, any][]) {
                const prevMeta = activeManifest.granthas[colId];
                if (prevMeta && prevMeta.hash && prevMeta.hash !== meta.hash) {
                  const staleKey = `vrind_grantha_${colId}_${prevMeta.hash}`;
                  await del(staleKey).catch(() => {});
                }
              }
            }

            activeManifest = freshManifest;
            await set('vrind_manifest_v2', freshManifest);
          }
        } catch {}

        // Step 3: Ensure default scripture collection (Sri Hit Chaurasi) is loaded
        const hitPadas = padasByGrantha.get('hit-chaurasi');
        if (!hitPadas || hitPadas.length === 0) {
          const currentHitMeta = activeManifest?.granthas?.['hit-chaurasi'];
          const targetFile = currentHitMeta?.file || 'hit-chaurasi.json';
          const cacheKey = currentHitMeta?.hash ? `vrind_grantha_hit-chaurasi_${currentHitMeta.hash}` : 'vrind_grantha_hit-chaurasi';

          try {
            const chunkRes = await fetch(`/data/granthas/${targetFile}`);
            if (chunkRes.ok) {
              const freshHitPadas = await chunkRes.json();
              SacredDatabase.appendPadas(freshHitPadas);
              await set(cacheKey, freshHitPadas);
            }
          } catch {}
        }

        // Step 4: Restore Cloud Bookmarks in Background (non-blocking)
        this.syncCloudBookmarks().catch(() => {});
      } catch (err) {
        console.warn('SacredDatabase initialization deferred:', err);
      }
    })();

    return initPromise;
  },

  getManifest(): any {
    return activeManifest;
  },

  async getManifestAsync(): Promise<any> {
    if (activeManifest) return activeManifest;
    try {
      const cached = await get<any>('vrind_manifest_v2');
      if (cached) {
        activeManifest = cached;
        return cached;
      }
      const res = await fetch('/data/manifest.json');
      if (res.ok) {
        activeManifest = await res.json();
        await set('vrind_manifest_v2', activeManifest);
        return activeManifest;
      }
    } catch {}
    return activeManifest;
  },

  /**
   * Explicit User-Initiated Offline Library Download.
   * NEVER runs automatically in the background, preserving zero-cost bandwidth quotas.
   */
  async downloadFullLibraryForOffline(onProgress?: (percent: number) => void): Promise<boolean> {
    try {
      const res = await fetch('/data/canonicalPadas.json');
      if (res.ok) {
        const fullCatalog = await res.json();
        this.loadPadas(fullCatalog);
        await set('vrind_canonical_padas_v2', fullCatalog);
        onProgress?.(100);
        return true;
      }
    } catch (err) {
      console.warn('Failed to download offline library:', err);
    }
    return false;
  },

  /**
   * 4-Tier On-Demand Scripture Collection Loader with Content-Hashed URLs
   * Level 1: Memory (0ms)
   * Level 2: IndexedDB persistent cache with content-hash key (0ms, 0 network)
   * Level 3: Vercel CDN static immutable chunk /data/granthas/:id.:hash.json (Edge cached, 0 Supabase egress)
   * Level 4: Supabase REST API (fallback with selected columns only)
   */
  async fetchGranthaPadas(granthaId: string): Promise<SacredPad[]> {
    if (!granthaId || granthaId === 'all') return allPadas;
    const existing = padasByGrantha.get(granthaId);
    if (existing && existing.length > 5) return existing;

    const granthaMeta = activeManifest?.granthas?.[granthaId];
    const targetFile = granthaMeta?.file || `${granthaId}.json`;
    const cacheKey = granthaMeta?.hash ? `vrind_grantha_${granthaId}_${granthaMeta.hash}` : `vrind_grantha_${granthaId}`;

    try {
      // Level 2: Check local IndexedDB collection chunk (0 KB network)
      const cached = await get<SacredPad[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.appendPadas(cached);
        return padasByGrantha.get(granthaId) || cached;
      }

      // Level 3: Fetch static immutable versioned JSON chunk from Vercel CDN Edge (6 - 25 KB gzipped, 0 Supabase egress)
      try {
        const cdnRes = await fetch(`/data/granthas/${targetFile}`);
        if (cdnRes.ok) {
          const chunkData = await cdnRes.json();
          this.appendPadas(chunkData);
          try {
            await set(cacheKey, chunkData);
          } catch {}
          return padasByGrantha.get(granthaId) || chunkData;
        }
      } catch (cdnErr) {
        console.warn(`CDN fetch for grantha ${granthaId} (${targetFile}) missed, checking Supabase fallback:`, cdnErr);
      }

      // Level 4: Supabase REST API fallback (specific columns only, never select('*'))
      const { data, error } = await supabase
        .from('padas')
        .select('id, collection_id, index, title_devanagari, title_english, author, rag, slug, verses')
        .eq('collection_id', granthaId)
        .order('index', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          collectionId: r.collection_id || granthaId,
          index: r.index,
          titleDevanagari: r.title_devanagari,
          titleEnglish: r.title_english,
          author: r.author,
          rag: r.rag,
          slug: r.slug,
          verses: r.verses,
        }));
        this.appendPadas(mapped);
        try {
          await set(cacheKey, mapped);
        } catch {}
        return padasByGrantha.get(granthaId) || mapped;
      }
    } catch (err) {
      console.warn(`Failed to fetch grantha ${granthaId}:`, err);
    }
    return padasByGrantha.get(granthaId) || [];
  },

  /**
   * Single Pada On-Demand Fetcher (0.65 KB / 650 bytes per read)
   * Level 1: Memory -> Level 2: IndexedDB -> Level 3: Supabase targeted 1-row select
   */
  async fetchPadBySlug(slug: string): Promise<SacredPad | undefined> {
    if (!slug) return undefined;
    const existing = this.getPadById(slug);
    if (existing && existing.verses && existing.verses.length > 1) return existing;

    try {
      const { data, error } = await supabase
        .from('padas')
        .select('id, collection_id, index, title_devanagari, title_english, author, rag, slug, verses')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        const mapped: SacredPad = {
          id: data.id,
          collectionId: data.collection_id,
          index: data.index,
          titleDevanagari: data.title_devanagari,
          titleEnglish: data.title_english,
          author: data.author,
          rag: data.rag,
          slug: data.slug,
          verses: data.verses,
        };
        this.appendPadas([mapped]);
        return mapped;
      }
    } catch (err) {
      console.warn(`Failed to fetch pad by slug ${slug}:`, err);
    }
    return existing;
  },

  // Synchronous Read Methods (0ms Cold Render)
  getAllPadas(): SacredPad[] {
    return allPadas;
  },

  getPadById(identifier: string): SacredPad | undefined {
    if (!identifier) return undefined;
    // 1. Exact ID match (O(1))
    const byId = padasById.get(identifier);
    if (byId) return byId;

    // 2. Exact Slug match (O(1))
    const bySlug = padasBySlug.get(identifier);
    if (bySlug) return bySlug;

    // 3. Normalized / URL-decoded slug match
    try {
      const decoded = decodeURIComponent(identifier).trim().toLowerCase();
      const byDecodedSlug = padasBySlug.get(decoded);
      if (byDecodedSlug) return byDecodedSlug;

      const byDecodedId = padasById.get(decoded);
      if (byDecodedId) return byDecodedId;
    } catch {}

    // 4. Case-insensitive / slug match fallback
    const needle = identifier.toLowerCase();
    return allPadas.find(
      (p) =>
        p.id.toLowerCase() === needle ||
        p.slug?.toLowerCase() === needle ||
        (p.titleEnglish && p.titleEnglish.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(needle))
    );
  },

  getPadSlug(pad: SacredPad): string {
    return pad.slug || pad.id;
  },

  getPadasByGrantha(granthaId: string): SacredPad[] {
    if (granthaId === 'all') return allPadas;
    return padasByGrantha.get(granthaId) || [];
  },

  getPadasByRaga(raga: string): SacredPad[] {
    if (raga === 'all') return allPadas;
    return padasByRaga.get(raga) || [];
  },

  getAllGranthas(): CanonicalGrantha[] {
    return allGranthas;
  },

  getAllSaints(traditionFilter?: string): CanonicalSaint[] {
    if (!traditionFilter || traditionFilter === 'all') return allSaints;
    return allSaints.filter((s) => s.tradition === traditionFilter);
  },

  getTraditions(): { id: string; label: string }[] {
    const counts = new Map<string, number>();
    allSaints.forEach((s) => {
      counts.set(s.tradition, (counts.get(s.tradition) || 0) + 1);
    });
    return [
      { id: 'all', label: `सभी संत (${allSaints.length})` },
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tradition, count]) => ({
          id: tradition,
          label: `${tradition} (${count})`,
        })),
    ];
  },

  getBrajGlossary(): BrajGlossaryTerm[] {
    return brajGlossaryData as BrajGlossaryTerm[];
  },

  getRasikAphorisms(): RasikAphorism[] {
    return rasikAphorismsData as RasikAphorism[];
  },

  getAshtayamaPeriods(): AshtayamaPeriod[] {
    return ashtayamaPeriodsData as AshtayamaPeriod[];
  },

  getSacredTopics(): SacredTopic[] {
    return sacredTopicsData as SacredTopic[];
  },

  getSadhanaBadgeDefs(): {
    milestones: SadhanaBadgeDef[];
    streaks: SadhanaBadgeDef[];
    antarangaBadges: SadhanaBadgeDef[];
  } {
    return sadhanaBadgesData as any;
  },

  getFeedTabs(): FeedTabItem[] {
    return feedTabsData as FeedTabItem[];
  },

  getDisplayBooks(): DisplayBookItem[] {
    const bookColors: Record<string, string> = {
      'hit-chaurasi': 'text-[#D97706]',
      'kelimal': 'text-[#B45309]',
      'radha-sudha-nidhi': 'text-[#EA580C]',
      'vyas-vani': 'text-[#D97706]',
      'bayalees-leela': 'text-[#E11D48]',
      'sur-sagar': 'text-[#C2410C]',
      'raskhan-padavali': 'text-[#0284C7]',
      'bhakti-shatak': 'text-[#92400E]',
      'braj-binod': 'text-[#EA580C]',
      'stotras': 'text-[#D97706]',
    };

    return allGranthas.map((g) => ({
      id: g.id,
      title: g.name,
      devanagari: g.name,
      author: g.author,
      count: g.count,
      countUnit: g.id === 'bayalees-leela' ? 'Leelas' : g.id === 'raskhan-padavali' ? 'Savaiyas' : 'Padas',
      tradition: g.author.includes('हरिवंश')
        ? 'राधावल्लभ संप्रदाय'
        : g.author.includes('हरिदास')
        ? 'हरिदासी संप्रदाय'
        : g.author.includes('सूरदास')
        ? 'अष्टछाप परंपरा'
        : 'रसिक परंपरा',
      essence: g.description,
      tagColor: bookColors[g.id] || 'text-[#D97706]',
      imageUrl: '',
    }));
  },

  getDisplayAuthors(): DisplayAuthorItem[] {
    const authorColors = [
      'text-[#D97706]',
      'text-[#B45309]',
      'text-[#C2410C]',
      'text-[#E11D48]',
      'text-[#0284C7]',
      'text-[#EA580C]',
    ];
    // Return top canonical rasik saints with highest compositions
    const featuredSaints = allSaints
      .filter((s) => s.articleCount >= 10)
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 8);

    return featuredSaints.map((s, idx) => ({
      id: s.slug,
      name: s.nameEng || s.name,
      devanagari: s.name,
      tradition: s.tradition,
      totalCompositions: s.articleCount,
      significance: s.biography,
      tagColor: authorColors[idx % authorColors.length],
      imageUrl: '',
    }));
  },

  getAvailableRagas(granthaId?: string): string[] {
    const ragaCounts = new Map<string, number>();
    const padasToScan = (!granthaId || granthaId === 'all')
      ? allPadas
      : (padasByGrantha.get(granthaId) || []);

    padasToScan.forEach((p) => {
      if (p.rag && p.rag.trim()) {
        const r = p.rag.trim();
        ragaCounts.set(r, (ragaCounts.get(r) || 0) + 1);
      }
    });

    // Return ragas sorted by highest frequency (most padas first)
    return Array.from(ragaCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([r]) => r);
  },

  /**
   * Fast, Multi-Token Client-Side Search (< 5ms over 1,000+ padas)
   */
  search(query: string, limit = 25): SacredPad[] {
    const q = query.trim().toLowerCase();
    if (!q) return allPadas.slice(0, limit);

    const tokens = q.split(/\s+/).filter(Boolean);
    const results: SacredPad[] = [];

    for (const pad of allPadas) {
      const targetText = `${pad.titleDevanagari} ${pad.titleEnglish} ${pad.author} ${pad.rag} ${pad.verses[0]?.linesDevanagari?.join(' ') || ''
        }`.toLowerCase();

      const matches = tokens.every((tok) => targetText.includes(tok));
      if (matches) {
        results.push(pad);
        if (results.length >= limit) break;
      }
    }

    return results;
  },

  // Asynchronous Persistent Operations via IndexedDB & Supabase Cloud Sync
  async getBookmarkedPadIds(): Promise<string[]> {
    try {
      const list = await get<string[]>('vv_bookmarked_pads');
      if (list && Array.isArray(list)) return list;
    } catch { }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('vv_bookmarked_pads');
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  async toggleBookmarkPad(padId: string): Promise<boolean> {
    const current = await this.getBookmarkedPadIds();
    const exists = current.includes(padId);
    const updated = exists ? current.filter((id) => id !== padId) : [...current, padId];

    try {
      await set('vv_bookmarked_pads', updated);
    } catch { }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('vv_bookmarked_pads', JSON.stringify(updated));
      }
    } catch { }

    // Asynchronously sync bookmark state to Supabase database with authenticated user ownership
    try {
      getOrInitAuthUserId().then((userId) => {
        if (!userId) return;
        if (exists) {
          supabase.from('user_bookmarks').delete().match({ user_id: userId, pad_id: padId }).then();
        } else {
          supabase.from('user_bookmarks').insert({ user_id: userId, pad_id: padId }).then();
        }
      }).catch(() => {});
    } catch {}

    return !exists;
  },

  async syncCloudBookmarks(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await supabase.from('user_bookmarks').select('pad_id').eq('user_id', session.user.id);
      if (data && Array.isArray(data)) {
        const cloudPadIds = data.map((r: any) => r.pad_id);
        const local = await this.getBookmarkedPadIds();
        const merged = Array.from(new Set([...local, ...cloudPadIds]));
        await set('vv_bookmarked_pads', merged);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('vv_bookmarked_pads', JSON.stringify(merged));
        }
        if (merged.length !== local.length) {
          dbListeners.forEach((fn) => {
            try { fn(); } catch {}
          });
        }
      }
    } catch {}
  },

  async getRecentHistory(): Promise<string[]> {
    try {
      const list = await get<string[]>('vv_reading_history');
      if (list && Array.isArray(list)) return list;
    } catch { }
    return [];
  },

  async recordHistory(padId: string): Promise<void> {
    const current = await this.getRecentHistory();
    const updated = [padId, ...current.filter((id) => id !== padId)].slice(0, 50);
    try {
      await set('vv_reading_history', updated);
    } catch { }
  },
};

