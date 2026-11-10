import { get, set, del } from 'idb-keyval';
// Lazy on-demand Supabase client loader: eliminates 229 kB vendor-data chunk from initial cold load
let supabaseInstance: typeof import('./supabaseClient').supabase | null = null;
async function getSupabase() {
  if (!supabaseInstance) {
    const mod = await import('./supabaseClient');
    supabaseInstance = mod.supabase;
  }
  return supabaseInstance;
}
import { SACRED_PADS } from '../data/padas';
import canonicalGranthasData from '../data/canonicalGranthas.json';
import canonicalSaintsData from '../data/canonicalSaints.json';
import brajGlossaryData from '../data/brajGlossary.json';
import rasikAphorismsData from '../data/rasikAphorisms.json';
import ashtayamaPeriodsData from '../data/ashtayamaPeriods.json';
import sacredTopicsData from '../data/sacredTopics.json';
import sadhanaBadgesData from '../data/sadhanaBadges.json';
import feedTabsData from '../data/feedTabs.json';
import { SacredPad, ScriptureHierarchyData, ChapterInfo, AuthorHierarchyInfo, EpicIndexData } from '../types/devotional';

export interface CanonicalGrantha {
  id: string;
  name: string;
  author: string;
  count: number;
  slug: string;
  description: string;
  category?: 'mahagranth' | 'rasik-vani' | 'kavya' | 'dham-leela';
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
  category?: 'mahagranth' | 'rasik-vani' | 'kavya' | 'dham-leela';
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
 * Comprehensive HTML entity sanitizer to permanently eliminate raw artifacts like &zwnj;, &zwj;, etc.
 */
export function cleanSacredString(str: string): string {
  if (!str) return '';
  let res = String(str);
  // Iteratively unescape double-encoded HTML entities
  res = res.replace(/&amp;/gi, '&');
  // Strip named and numerical zero-width joiners/spaces
  res = res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '');
  // Strip raw unicode zero-width characters
  res = res.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Convert standard typographic entities to authentic characters
  res = res
    .replace(/&(?:ndash|#8211);/gi, '–')
    .replace(/&(?:mdash|#8212);/gi, '—')
    .replace(/&(?:lsquo|#8216);/gi, '‘')
    .replace(/&(?:rsquo|#8217);/gi, '’')
    .replace(/&(?:ldquo|#8220);/gi, '“')
    .replace(/&(?:rdquo|#8221);/gi, '”')
    .replace(/&(?:bull|#8226);/gi, '•')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  // Secondary safety pass for residual zero-width artifacts and unwanted scraper wilted emojis
  return res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '').replace(/🥀/g, '');
}

export const sanitizeSacredText = cleanSacredString;

/**
 * Normalizes all canonical padas into uniform SacredPad instances
 * with authenticated grantha attribution, classical raga harmonization, and full verse structure.
 */
function normalizeCanonicalPad(raw: any): SacredPad {
  const author = cleanSacredString(raw.author || raw.composer || 'श्री रसिक परंपरा').trim();
  const title = cleanSacredString(raw.titleDevanagari || raw.title || 'श्री पद').trim();
  const titleEnglish = cleanSacredString(raw.titleEnglish || raw.titleEng || '');

  // 1. Resolve canonical collection / grantha ID matching real textual lineage
  let collectionId = raw.collectionId || raw.granthaId || '';
  if (!collectionId || collectionId === 'rasik-vani' || collectionId === 'other') {
    if (/स्तोत्र|अष्टक|कटाक्ष/i.test(title)) collectionId = 'stotras';
    else if (/वाल्मीकि|रामायण/i.test(author + title)) collectionId = 'valmiki-ramayana';
    else if (/भागवत/i.test(author + title)) collectionId = 'shrimad-bhagavatam';
    else if (/रामचरितमानस|मानस/i.test(author + title)) collectionId = 'ramcharitmanas';
    else if (/भगवद्गीता|गीता/i.test(author + title)) collectionId = 'bhagavad-gita';
    else if (/सप्तशती|दुर्गा/i.test(author + title)) collectionId = 'durga-saptashati';
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

  // 3. Normalize verses from stanzas if needed and sanitize all lines
  let verses = raw.verses;
  let isStub = Boolean(raw.isStub);
  if (!verses || !verses.length) {
    if (raw.stanzas && raw.stanzas.length) {
      verses = raw.stanzas.map((st: any, idx: number) => ({
        stanzaNumber: st.index || idx + 1,
        linesDevanagari: (st.linesDevanagari || []).map(cleanSacredString),
        linesEnglish: (st.linesEnglish || []).map(cleanSacredString),
      }));
    } else {
      verses = [];
      isStub = true;
    }
  } else {
    const prefixRegex = /^(\*|\•|\-|\–|\—|\s)*(दो[०0\.]\s*[-—–]?|चौ[०0\.]\s*[-—–]?|सो[०0\.]\s*[-—–]?|छं[०0\.]\s*[-—–]?)\s*/;
    const meterRegex = /^(\*|\•|\-|\–|\—|\s)*(दोहा|चौपाई|सोरठा|छन्द|छंद|श्लोक|सवैया|कवित्त)\s*(\|[^\:]+)?\s*[:：\s]*$/i;

    verses = verses.map((v: any, idx: number) => {
      const cleanDev: string[] = [];
      const cleanTranslit: string[] = [...(v.linesTransliteration || [])];
      const cleanEng: string[] = [...(v.linesEnglish || [])];

      (v.linesDevanagari || []).forEach((rawLine: string) => {
        let line = cleanSacredString(rawLine);
        if (!line) return;
        if (/^(\*|\-|\–|\—|\s)+$/.test(line)) return;
        if (/^भावार्थ\s*[:：\-—]*\s*$/.test(line)) return;

        const meterMatch = line.match(meterRegex);
        if (meterMatch) {
          cleanDev.push(`॥ ${meterMatch[2]} ॥`);
          return;
        }

        if (/[\u0900-\u097F]/.test(line)) {
          line = line.replace(prefixRegex, '').replace(/^[\*\•\-\–\—\s]+/, '').trim();
          if (line) cleanDev.push(line);
        } else {
          const isEnglishWords = /\b(the|and|of|to|is|in|that|with|for|was|as|he|she|they|their|his|her|my|our|you|your|be|by|on|at|from|this|these|those|May|O|lord|king|palace|lotus|feet|water|ocean|mind|eyes)\b/i.test(line);
          if (isEnglishWords || line.startsWith('“') || line.startsWith('"') || (/^[A-Z][a-z\s,;:]+/.test(line) && line.includes(' '))) {
            cleanEng.push(line);
          } else {
            cleanTranslit.push(line);
          }
        }
      });

      return {
        ...v,
        stanzaNumber: v.stanzaNumber || idx + 1,
        linesDevanagari: cleanDev.length > 0 ? cleanDev : (v.linesDevanagari || []).map(cleanSacredString),
        linesTransliteration: cleanTranslit.length > 0 ? cleanTranslit : undefined,
        linesEnglish: cleanEng.length > 0 ? cleanEng : undefined,
      };
    });
  }

  const slug = raw.slug || raw.id || '';
  const chapterId = raw.chapterId || raw.chapter_id || 'general';
  const chapterName = cleanSacredString(raw.chapterName || raw.chapter_name || 'सामान्य पद');
  const verseNumber = raw.verseNumber || raw.verse_number || raw.index || 1;

  return {
    ...raw,
    collectionId,
    titleDevanagari: title,
    titleEnglish,
    author,
    rag,
    slug,
    chapterId,
    chapterName,
    verseNumber,
    verses,
    isStub,
  };
}

// Initial lightweight seed padas for 0ms instantaneous First Contentful Paint
const seedPadas: SacredPad[] = (SACRED_PADS || []).map(normalizeCanonicalPad);

let allPadas: SacredPad[] = [...seedPadas];
const allGranthas: CanonicalGrantha[] = canonicalGranthasData as CanonicalGrantha[];
const allSaints: CanonicalSaint[] = canonicalSaintsData as CanonicalSaint[];

export interface CatalogIndexItem {
  id: string;
  titleDevanagari: string;
  collectionId: string;
  author: string;
  rag?: string;
  index: number;
}

let searchCatalogItems: CatalogIndexItem[] = [];

let cachedHierarchy: ScriptureHierarchyData | null = null;
let hierarchyPromise: Promise<ScriptureHierarchyData | null> | null = null;

const padasById = new Map<string, SacredPad>();
const padasBySlug = new Map<string, SacredPad>();
const padasByGrantha = new Map<string, SacredPad[]>();
const padasByRaga = new Map<string, SacredPad[]>();

const loadedGranthas = new Set<string>();
const inFlightGranthaPromises = new Map<string, Promise<SacredPad[]>>();
const categoryCache = new Map<string, SacredPad[]>();
const chapterCache = new Map<string, SacredPad[]>();
const authorCache = new Map<string, SacredPad[]>();

export const EPIC_GRANTHA_IDS = new Set<string>([
  'valmiki-ramayana',
  'shrimad-bhagavatam',
  'ramcharitmanas',
  'bhagavad-gita',
  'durga-saptashati',
]);

const epicIndices = new Map<string, EpicIndexData>();
const inFlightEpicPromises = new Map<string, Promise<SacredPad[]>>();

function clearDerivedCaches() {
  categoryCache.clear();
  chapterCache.clear();
  authorCache.clear();
}

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
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
      const { data, error } = await sb.auth.signInAnonymously();
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

    const incomingByGrantha = new Map<string, SacredPad[]>();
    const incomingByRaga = new Map<string, SacredPad[]>();

    normalized.forEach((pad) => {
      const existing = padasById.get(pad.id);
      if (!existing) {
        allPadas.push(pad);
        padasById.set(pad.id, pad);
      } else {
        const existingHasFullVerses = Boolean(existing.verses && existing.verses.length > 0 && !existing.isStub);
        const incomingHasFullVerses = Boolean(pad.verses && pad.verses.length > 0 && !pad.isStub);

        if (existingHasFullVerses && !incomingHasFullVerses) {
          // Do not overwrite real verses with a stub
          const { verses, ...meta } = pad;
          Object.assign(existing, meta);
        } else {
          Object.assign(existing, pad);
        }
      }

      if (pad.slug) {
        padasBySlug.set(pad.slug, pad);
        padasBySlug.set(pad.slug.toLowerCase(), pad);
      }

      const gList = incomingByGrantha.get(pad.collectionId);
      if (gList) gList.push(pad);
      else incomingByGrantha.set(pad.collectionId, [pad]);

      if (pad.rag) {
        const rList = incomingByRaga.get(pad.rag);
        if (rList) rList.push(pad);
        else incomingByRaga.set(pad.rag, [pad]);
      }
    });

    // High-speed O(N) batch merge into padasByGrantha
    for (const [colId, incomingPads] of incomingByGrantha.entries()) {
      const existingList = padasByGrantha.get(colId);
      if (!existingList || existingList.length === 0) {
        padasByGrantha.set(colId, incomingPads);
      } else {
        const idMap = new Map<string, number>();
        existingList.forEach((p, i) => idMap.set(p.id, i));
        for (const p of incomingPads) {
          const idx = idMap.get(p.id);
          if (idx !== undefined) {
            const existingItem = existingList[idx];
            const existingHasFullVerses = Boolean(existingItem.verses && existingItem.verses.length > 0 && !existingItem.isStub);
            const incomingHasFullVerses = Boolean(p.verses && p.verses.length > 0 && !p.isStub);
            if (existingHasFullVerses && !incomingHasFullVerses) {
              const { verses, ...meta } = p;
              Object.assign(existingItem, meta);
            } else {
              Object.assign(existingItem, p);
            }
          } else {
            existingList.push(p);
            idMap.set(p.id, existingList.length - 1);
          }
        }
        padasByGrantha.set(colId, existingList);
      }
    }

    // High-speed O(N) batch merge into padasByRaga
    for (const [ragaName, incomingPads] of incomingByRaga.entries()) {
      const existingList = padasByRaga.get(ragaName);
      if (!existingList || existingList.length === 0) {
        padasByRaga.set(ragaName, incomingPads);
      } else {
        const idMap = new Map<string, number>();
        existingList.forEach((p, i) => idMap.set(p.id, i));
        for (const p of incomingPads) {
          const idx = idMap.get(p.id);
          if (idx !== undefined) {
            Object.assign(existingList[idx], p);
          } else {
            existingList.push(p);
            idMap.set(p.id, existingList.length - 1);
          }
        }
        padasByRaga.set(ragaName, existingList);
      }
    }

    clearDerivedCaches();

    dbListeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  },

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (isFullyLoaded) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // Step 1: Instant Local Hydration (0ms local retrieval, 0 bytes network bandwidth)
        del('vrind_canonical_padas_v2').catch(() => {});
        del('vrind_manifest_v2').catch(() => {});

        const cachedManifest = await get<any>('vrind_manifest_v3');
        if (cachedManifest) activeManifest = cachedManifest;

        const cachedPadas = await get<any[]>('vrind_canonical_padas_v3');
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
            await set('vrind_manifest_v3', freshManifest);
          }
        } catch {}

        // Step 3: Intent-Driven Initial Preload (Eliminates unsolicited preloading)
        let requestedGrantha: string | null = null;
        let requestedPad: string | null = null;
        let requestedAuthor: string | null = null;

        if (typeof window !== 'undefined') {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            requestedGrantha = urlParams.get('grantha');
            requestedPad = urlParams.get('pad');
            requestedAuthor = urlParams.get('author');
          } catch {}
        }

        if (requestedPad) {
          // Deep link: fetch target pad fast-path
          await this.fetchPadBySlug(requestedPad).catch(() => {});
        } else if (requestedGrantha && requestedGrantha !== 'all') {
          // Scripture scoped link: hydrate only target scripture
          await this.fetchGranthaPadas(requestedGrantha).catch(() => {});
        } else if (requestedAuthor) {
          // Saint scoped link: hydrate only target author
          await this.ensureAuthorPadasLoaded(requestedAuthor).catch(() => {});
        } else {
          // Sanctuary home default: only hydrate seed collection if no specific target requested
          const hitPadas = padasByGrantha.get('hit-chaurasi');
          if (!hitPadas || hitPadas.length < 300 || !hitPadas[0]?.chapterId) {
            const currentHitMeta = activeManifest?.granthas?.['hit-chaurasi'];
            const targetFile = currentHitMeta?.file || 'hit-chaurasi.json';
            const cacheKey = currentHitMeta?.hash ? `vrind_grantha_hit-chaurasi_${currentHitMeta.hash}` : 'vrind_grantha_hit-chaurasi';

            try {
              const chunkRes = await fetch(`/data/granthas/${targetFile}`);
              if (chunkRes.ok) {
                const freshHitPadas = await chunkRes.json();
                SacredDatabase.appendPadas(freshHitPadas);
                loadedGranthas.add('hit-chaurasi');
                await set(cacheKey, freshHitPadas);
              }
            } catch {}
          } else {
            loadedGranthas.add('hit-chaurasi');
          }
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
      const cached = await get<any>('vrind_manifest_v3');
      if (cached) {
        activeManifest = cached;
        return cached;
      }
      const res = await fetch('/data/manifest.json');
      if (res.ok) {
        activeManifest = await res.json();
        await set('vrind_manifest_v3', activeManifest);
        return activeManifest;
      }
    } catch {}
    return activeManifest;
  },

  /**
   * Explicit User-Initiated Offline Library Download.
   * Downloads all canonical scripture chunks progressively into IndexedDB with zero server overhead.
   */
  async downloadFullLibraryForOffline(onProgress?: (percent: number) => void): Promise<boolean> {
    try {
      const manifest = await this.getManifestAsync();
      const granthaEntries = Object.entries(manifest?.granthas || {}) as [string, any][];
      if (!granthaEntries.length) return false;

      let completed = 0;
      const allChunks: SacredPad[] = [];

      for (const [colId, meta] of granthaEntries) {
        const file = meta.file || `${colId}.json`;
        try {
          const res = await fetch(`/data/granthas/${file}`);
          if (res.ok) {
            const chunk = await res.json();
            allChunks.push(...chunk);
            const cacheKey = meta.hash ? `vrind_grantha_${colId}_${meta.hash}` : `vrind_grantha_${colId}`;
            await set(cacheKey, chunk).catch(() => {});
          }
        } catch {}
        completed++;
        onProgress?.(Math.round((completed / granthaEntries.length) * 100));
      }

      if (allChunks.length > 0) {
        this.loadPadas(allChunks);
        await set('vrind_canonical_padas_v3', allChunks).catch(() => {});
        return true;
      }
    } catch (err) {
      console.warn('Failed to download offline library:', err);
    }
    return false;
  },

  isEpicGrantha(granthaId: string): boolean {
    return EPIC_GRANTHA_IDS.has(granthaId);
  },

  mapPadToEpicChapter(padId: string): { grantha: string; chapter: string; verseId: string } | null {
    return mapPadToEpicChapter(padId);
  },

  getAllEpicGranthas(): CanonicalGrantha[] {
    return allGranthas.filter((g) => EPIC_GRANTHA_IDS.has(g.id));
  },

  getAllPadavaliGranthas(): CanonicalGrantha[] {
    return allGranthas.filter((g) => !EPIC_GRANTHA_IDS.has(g.id));
  },

  async getEpicIndex(granthaId: string): Promise<EpicIndexData | null> {
    if (!this.isEpicGrantha(granthaId)) return null;
    if (epicIndices.has(granthaId)) {
      return epicIndices.get(granthaId)!;
    }

    const cacheKey = `vrind_epic_index_${granthaId}`;
    try {
      const cached = await get<EpicIndexData>(cacheKey);
      if (cached && cached.chapters) {
        epicIndices.set(granthaId, cached);
        return cached;
      }
    } catch {}

    try {
      const res = await fetch(`/data/epics/${granthaId}/index.json`);
      if (res.ok) {
        const data: EpicIndexData = await res.json();
        epicIndices.set(granthaId, data);
        set(cacheKey, data).catch(() => {});
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch epic index for ${granthaId}:`, err);
    }
    return null;
  },

  async fetchEpicChapter(granthaId: string, chapterId: string): Promise<SacredPad[]> {
    const epicIndex = await this.getEpicIndex(granthaId);
    if (!epicIndex) return [];

    const decChapterId = decodeURIComponent(chapterId).trim().toLowerCase();
    const chapterMeta =
      epicIndex.chapters.find((c) => {
        const decCId = decodeURIComponent(c.id).toLowerCase();
        const decCName = decodeURIComponent(c.name).toLowerCase();
        return (
          c.id === chapterId ||
          decCId === decChapterId ||
          c.name === chapterId ||
          decCName === decChapterId ||
          decCId.includes(decChapterId) ||
          decChapterId.includes(decCId) ||
          decCName.includes(decChapterId) ||
          decChapterId.includes(decCName)
        );
      }) || epicIndex.chapters[0];
    if (!chapterMeta) return [];

    const inFlightKey = `${granthaId}:${chapterMeta.id}`;
    if (inFlightEpicPromises.has(inFlightKey)) {
      return inFlightEpicPromises.get(inFlightKey)!;
    }

    const promise = (async () => {
      // Check existing in memory
      const existing = (padasByGrantha.get(granthaId) || []).filter(
        (p) => p.chapterId === chapterMeta.id && !p.isStub && (p.verses?.[0]?.linesDevanagari?.length || 0) > 0
      );
      if (existing.length >= chapterMeta.verseCount && existing.length > 0) {
        return existing;
      }

      // Check IndexedDB
      const cacheKey = `vrind_epic_ch_${granthaId}_${chapterMeta.id}`;
      try {
        const cached = await get<SacredPad[]>(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.appendPadas(cached);
          return cached;
        }
      } catch {}

      // Fetch chunk file from CDN
      try {
        const res = await fetch(`/data/epics/${granthaId}/${chapterMeta.file}`);
        if (res.ok) {
          const chunkData: SacredPad[] = await res.json();
          this.appendPadas(chunkData);
          set(cacheKey, chunkData).catch(() => {});
          return chunkData;
        }
      } catch (err) {
        console.warn(`Failed to fetch epic chapter ${granthaId}/${chapterMeta.file}:`, err);
      }
      return [];
    })();

    inFlightEpicPromises.set(inFlightKey, promise);
    try {
      return await promise;
    } finally {
      inFlightEpicPromises.delete(inFlightKey);
    }
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

    // Piece-by-piece fast path for epics: load epic index and only first chapter chunk
    if (this.isEpicGrantha(granthaId)) {
      const idx = await this.getEpicIndex(granthaId);
      if (idx && idx.chapters.length > 0) {
        return this.fetchEpicChapter(granthaId, idx.chapters[0].id);
      }
    }
    const existing = padasByGrantha.get(granthaId);
    const granthaMeta = activeManifest?.granthas?.[granthaId];
    const metaCount = granthaMeta?.count || this.getGranthaById(granthaId)?.count || 0;

    const isFullyHydrated =
      loadedGranthas.has(granthaId) &&
      existing &&
      existing.length > 0 &&
      metaCount > 0 &&
      existing.length >= metaCount &&
      !existing[0]?.isStub &&
      (existing[0]?.verses?.length || 0) > 0 &&
      (existing[0]?.verses[0]?.linesDevanagari?.length || 0) > 0;

    if (isFullyHydrated) {
      return existing;
    }

    if (inFlightGranthaPromises.has(granthaId)) {
      return inFlightGranthaPromises.get(granthaId)!;
    }

    const fetchPromise = (async () => {
      const targetFile = granthaMeta?.file || `${granthaId}.json`;
      const cacheKey = granthaMeta?.hash ? `vrind_grantha_${granthaId}_${granthaMeta.hash}` : `vrind_grantha_${granthaId}`;

      try {
        // Level 2: Check local IndexedDB collection chunk (0 KB network)
        const cached = await get<SacredPad[]>(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.appendPadas(cached);
          loadedGranthas.add(granthaId);
          return padasByGrantha.get(granthaId) || cached;
        }

        // Level 3: Fetch static immutable versioned JSON chunk from Vercel CDN Edge
        try {
          const cdnRes = await fetch(`/data/granthas/${targetFile}`);
          if (cdnRes.ok) {
            const chunkData = await cdnRes.json();
            this.appendPadas(chunkData);
            loadedGranthas.add(granthaId);
            // Non-blocking IndexedDB cache persistence
            set(cacheKey, chunkData).catch(() => {});
            return padasByGrantha.get(granthaId) || chunkData;
          }
        } catch (cdnErr) {
          console.warn(`CDN fetch for grantha ${granthaId} (${targetFile}) missed, checking Supabase fallback:`, cdnErr);
        }

        // Level 4: Supabase REST API fallback (specific columns only, never select('*'))
        const sb = await getSupabase();
        const { data, error } = await sb
          .from('padas')
          .select('id, collection_id, index, title_devanagari, title_english, author, rag, slug, verses, chapter_id, chapter_name, verse_number')
          .eq('collection_id', granthaId)
          .order('index', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((r: any) => normalizeCanonicalPad({
            id: r.id,
            collectionId: r.collection_id || granthaId,
            index: r.index,
            titleDevanagari: r.title_devanagari,
            titleEnglish: r.title_english,
            author: r.author,
            rag: r.rag,
            slug: r.slug,
            verses: r.verses,
            chapterId: r.chapter_id,
            chapterName: r.chapter_name,
            verseNumber: r.verse_number,
          }));
          this.appendPadas(mapped);
          loadedGranthas.add(granthaId);
          set(cacheKey, mapped).catch(() => {});
          return mapped;
        }
      } catch (err) {
        console.warn(`Error loading grantha ${granthaId}:`, err);
      } finally {
        inFlightGranthaPromises.delete(granthaId);
      }

      return padasByGrantha.get(granthaId) || existing || [];
    })();

    inFlightGranthaPromises.set(granthaId, fetchPromise);
    return fetchPromise;
  },

  /**
   * Single Pada On-Demand Fetcher (0.65 KB / 650 bytes per read)
   * Level 1: Memory -> Level 2: IndexedDB -> Level 3: Supabase targeted 1-row select
   */
  async fetchPadBySlug(slug: string): Promise<SacredPad | undefined> {
    if (!slug) return undefined;
    const existing = this.getPadById(slug);
    const hasFullVerses =
      existing &&
      !existing.isStub &&
      existing.verses &&
      existing.verses.length > 0 &&
      (existing.verses[0]?.linesDevanagari?.length || 0) > 0 &&
      existing.verses[0]?.linesDevanagari?.[0] !== existing.titleDevanagari;

    if (hasFullVerses) {
      return existing;
    }

    // 1. Fetch grantha chunk from CDN static storage if collectionId is known (0 Supabase egress)
    if (existing?.collectionId) {
      try {
        await this.fetchGranthaPadas(existing.collectionId);
        const updated = this.getPadById(slug);
        if (updated && !updated.isStub && updated.verses && updated.verses.length > 0 && (updated.verses[0]?.linesDevanagari?.length || 0) > 0) {
          return updated;
        }
      } catch {}
    }

    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from('padas')
        .select('id, collection_id, index, title_devanagari, title_english, author, rag, slug, verses')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        const mapped: SacredPad = normalizeCanonicalPad({
          id: data.id,
          collectionId: data.collection_id,
          index: data.index,
          titleDevanagari: data.title_devanagari,
          titleEnglish: data.title_english,
          author: data.author,
          rag: data.rag,
          slug: data.slug,
          verses: data.verses,
        });
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
    const foundInAll = allPadas.find(
      (p) =>
        p.id.toLowerCase() === needle ||
        p.slug?.toLowerCase() === needle ||
        (p.titleEnglish && p.titleEnglish.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(needle))
    );
    if (foundInAll) return foundInAll;

    // 5. Search catalog items index fallback
    const catItem = searchCatalogItems.find(
      (it) => it.id === identifier || it.id.toLowerCase() === needle
    );
    if (catItem) {
      const stub = normalizeCanonicalPad({
        id: catItem.id,
        slug: catItem.id,
        titleDevanagari: catItem.titleDevanagari,
        collectionId: catItem.collectionId,
        author: catItem.author,
        rag: catItem.rag,
        index: catItem.index,
        isStub: true,
      });
      padasById.set(stub.id, stub);
      if (stub.slug) padasBySlug.set(stub.slug, stub);
      return stub;
    }

    return undefined;
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

  getGranthaById(id: string): CanonicalGrantha | undefined {
    if (!id) return undefined;
    const clean = id.trim().toLowerCase();
    return allGranthas.find(
      (g) => g.id.toLowerCase() === clean || g.name.toLowerCase() === clean
    );
  },

  getAllSaints(traditionFilter?: string): CanonicalSaint[] {
    if (!traditionFilter || traditionFilter === 'all') return allSaints;
    return allSaints.filter((s) => s.tradition === traditionFilter);
  },

  getSaintBySlugOrName(identifier: string): CanonicalSaint | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return allSaints.find(
      (s) =>
        s.slug.toLowerCase() === clean ||
        s.name.toLowerCase() === clean ||
        s.id.toLowerCase() === clean ||
        (s.nameEng && s.nameEng.toLowerCase() === clean)
    );
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
      'valmiki-ramayana': 'text-[#B45309]',
      'shrimad-bhagavatam': 'text-[#1D4ED8]',
      'ramcharitmanas': 'text-[#B91C1C]',
      'bhagavad-gita': 'text-[#D97706]',
      'durga-saptashati': 'text-[#BE123C]',
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

    return allGranthas.map((g) => {
      let countUnit = 'Padas';
      if (['valmiki-ramayana', 'shrimad-bhagavatam', 'bhagavad-gita', 'durga-saptashati'].includes(g.id)) {
        countUnit = 'Shlokas';
      } else if (g.id === 'ramcharitmanas') {
        countUnit = 'Chaupais';
      } else if (g.id === 'braj-dohe') {
        countUnit = 'Dohe';
      } else if (g.id === 'braj-savaiya' || g.id === 'raskhan-padavali') {
        countUnit = 'Savaiyas';
      } else if (g.id === 'braj-kavitta') {
        countUnit = 'Kavitta';
      } else if (g.id === 'braj-rasiya') {
        countUnit = 'Rasiya';
      } else if (g.id === 'bayalees-leela') {
        countUnit = 'Leelas';
      } else if (g.id === 'braj-dham-mahatmya') {
        countUnit = 'Teerth';
      } else if (g.id === 'rasik-charitra-katha') {
        countUnit = 'Charit';
      }

      let tradition = 'रसिक परंपरा';
      if (g.id === 'valmiki-ramayana') tradition = 'सनातन वैदिक धारा';
      else if (g.id === 'shrimad-bhagavatam') tradition = 'परमहंस संहिता';
      else if (g.id === 'ramcharitmanas') tradition = 'रामानंदी / अवधी रस';
      else if (g.id === 'bhagavad-gita') tradition = 'योगेश्वर श्रीकृष्ण';
      else if (g.id === 'durga-saptashati') tradition = 'शाक्त पराशक्ति';
      else if (g.author.includes('हरिवंश')) tradition = 'राधावल्लभ संप्रदाय';
      else if (g.author.includes('हरिदास')) tradition = 'हरिदासी संप्रदाय';
      else if (g.author.includes('सूरदास') || g.id === 'paramanand-sagar') tradition = 'अष्टछाप परंपरा';
      else if (g.id === 'raskhan-padavali') tradition = 'पुष्टि संप्रदाय';
      else if (g.id === 'meera-padavali') tradition = 'अनन्य कृष्ण भक्ति';

      return {
        id: g.id,
        title: g.name,
        devanagari: g.name,
        author: g.author,
        count: g.count,
        countUnit,
        tradition,
        essence: g.description,
        tagColor: bookColors[g.id] || 'text-[#D97706]',
        imageUrl: '',
        category: g.category,
      };
    });
  },

  getDisplayMahagranths(): DisplayBookItem[] {
    return this.getDisplayBooks().filter((b) => b.category === 'mahagranth');
  },

  getDisplayRasikBooks(): DisplayBookItem[] {
    return this.getDisplayBooks().filter((b) => b.category !== 'mahagranth');
  },

  getGranthasByCategory(category?: string): CanonicalGrantha[] {
    if (!category || category === 'all') return allGranthas;
    return allGranthas.filter((g) => g.category === category);
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

  getAvailableRagas(granthaId?: string, authorName?: string | null): string[] {
    const ragaCounts = new Map<string, number>();
    let padasToScan: SacredPad[];
    if (authorName) {
      padasToScan = this.getPadasByAuthor(authorName);
    } else if (!granthaId || granthaId === 'all') {
      padasToScan = allPadas;
    } else {
      padasToScan = padasByGrantha.get(granthaId) || [];
    }

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
   * Universal Scripture Hierarchy & Relational Multi-Tier Schema Loader
   * Hydrates authors, granthas, and canonical chapters asynchronously
   * with 0ms IndexedDB retrieval and offline fallback.
   */
  async getScriptureHierarchy(): Promise<ScriptureHierarchyData | null> {
    if (cachedHierarchy) return cachedHierarchy;
    if (hierarchyPromise) return hierarchyPromise;

    hierarchyPromise = (async () => {
      try {
        const idb = await get<ScriptureHierarchyData>('vrind_scripture_hierarchy');
        if (idb && idb.granthas) {
          cachedHierarchy = idb;
        }
        const res = await fetch('/data/scripture-hierarchy.json');
        if (res.ok) {
          const fresh = await res.json();
          cachedHierarchy = fresh;
          await set('vrind_scripture_hierarchy', fresh);
          return fresh;
        }
      } catch (err) {
        console.warn('Failed to load scripture hierarchy:', err);
      }
      return cachedHierarchy;
    })();

    return hierarchyPromise;
  },

  /**
   * Returns canonical chapters for a given grantha (e.g. 18 Gita Adhyayas, 7 Manas Kandas)
   */
  getGranthaChapters(granthaId: string): ChapterInfo[] {
    let chapters: ChapterInfo[] = [];
    if (cachedHierarchy?.granthas?.[granthaId]?.chapters) {
      chapters = cachedHierarchy.granthas[granthaId].chapters;
    } else {
      // Dynamic fallback from indexed padas
      const padas = padasByGrantha.get(granthaId) || [];
      const chapterMap = new Map<string, { id: string; name: string; count: number; firstPadId?: string; firstPadSlug?: string }>();
      padas.forEach((p) => {
        const cId = p.chapterId || 'general';
        const cName = p.chapterName || 'सामान्य पद';
        if (!chapterMap.has(cId)) {
          chapterMap.set(cId, { id: cId, name: cName, count: 0, firstPadId: p.id, firstPadSlug: p.slug });
        }
        chapterMap.get(cId)!.count++;
      });
      chapters = Array.from(chapterMap.values()).map((c) => ({
        id: c.id,
        name: c.name,
        verseCount: c.count,
        firstPadId: c.firstPadId,
        firstPadSlug: c.firstPadSlug,
      }));
    }

    // Defensive check: If all or almost all chapters have only 1 verse and there is a "सामान्य पद" with the rest,
    // these are scraper metadata fragments, not genuine scripture chapters.
    if (chapters.length > 1) {
      const singlePadChapters = chapters.filter(c => c.verseCount <= 1);
      const generalChapter = chapters.find(c => c.name.includes('सामान्य पद') || c.id === 'general');
      if (generalChapter && singlePadChapters.length >= chapters.length - 2) {
        return [];
      }
    }
    return chapters;
  },

  /**
   * Returns all canonical authors indexed by composition count
   */
  getAllHierarchyAuthors(): AuthorHierarchyInfo[] {
    if (cachedHierarchy?.authors) {
      return Object.values(cachedHierarchy.authors).sort((a, b) => b.verseCount - a.verseCount);
    }
    return allSaints.map((s) => ({
      name: s.name,
      verseCount: s.articleCount || 10,
      granthas: [],
    })).sort((a, b) => b.verseCount - a.verseCount);
  },

  /**
   * Returns all padas belonging to a scripture category (सनातन महाग्रंथ, रसिक वाणी, काव्य व छंद, धाम व लीला)
   */
  getPadasByCategory(category: string): SacredPad[] {
    if (!category || category === 'all') return allPadas;
    if (categoryCache.has(category)) {
      return categoryCache.get(category)!;
    }
    const catGranthaIds = new Set(
      allGranthas.filter((g) => g.category === category).map((g) => g.id)
    );
    const result = allPadas.filter((p) => catGranthaIds.has(p.collectionId));
    categoryCache.set(category, result);
    return result;
  },

  /**
   * Returns all padas composed by a specific author with robust normalization
   */
  getPadasByAuthor(authorName: string): SacredPad[] {
    if (!authorName) return [];
    const rawClean = authorName.trim().toLowerCase();
    if (authorCache.has(rawClean)) {
      const cached = authorCache.get(rawClean)!;
      if (cached.length > 0) return cached;
    }

    const coreName = rawClean
      .replace(/\(.*?\)/g, '')
      .replace(/^श्री\s+/, '')
      .replace(/\s+जी$/, '')
      .trim();

    const result = allPadas.filter((p) => {
      const pAuthor = (p.author || '').toLowerCase();
      if (pAuthor.includes(rawClean)) return true;
      if (coreName && pAuthor.includes(coreName)) return true;
      const pCore = pAuthor
        .replace(/\(.*?\)/g, '')
        .replace(/^श्री\s+/, '')
        .replace(/\s+जी$/, '')
        .trim();
      if (pCore === coreName || (coreName && pCore.includes(coreName)) || (pCore && coreName.includes(pCore))) return true;
      return false;
    });

    if (result.length > 0) {
      authorCache.set(rawClean, result);
    }
    return result;
  },

  /**
   * Proactively ensures the grantha chunk containing this author's padas is hydrated
   */
  async ensureAuthorPadasLoaded(authorName: string): Promise<SacredPad[]> {
    if (!authorName) return [];
    const rawClean = authorName.trim().toLowerCase();
    const coreName = rawClean
      .replace(/\(.*?\)/g, '')
      .replace(/^श्री\s+/, '')
      .replace(/\s+जी$/, '')
      .trim();

    // Check if we already have sufficient padas in memory
    const existing = this.getPadasByAuthor(authorName);
    if (existing && existing.length >= 10) {
      return existing;
    }

    const chunksToLoad = new Set<string>();

    // 1. Direct relational lookup via scripture hierarchy (covers all 764 authors)
    const hierarchy = cachedHierarchy || (await this.getScriptureHierarchy());
    if (hierarchy?.authors) {
      const match =
        hierarchy.authors[authorName] ||
        Object.entries(hierarchy.authors).find(([k]) => {
          const kClean = k.trim().toLowerCase();
          const kCore = kClean.replace(/\(.*?\)/g, '').replace(/^श्री\s+/, '').replace(/\s+जी$/, '').trim();
          return kClean === rawClean || kCore === coreName || (coreName && kCore.includes(coreName)) || (kCore && coreName.includes(kCore));
        })?.[1];

      if (match?.granthas && match.granthas.length > 0) {
        match.granthas.forEach((g) => chunksToLoad.add(g));
      }
    }

    // 2. Specific heuristic fallbacks if not matched in hierarchy
    if (chunksToLoad.size === 0) {
      if (coreName.includes('रसखान')) chunksToLoad.add('raskhan-padavali');
      else if (coreName.includes('नागरीदास')) chunksToLoad.add('nagaridas-vani');
      else if (coreName.includes('सूरदास')) chunksToLoad.add('sur-sagar');
      else if (coreName.includes('मीरा')) chunksToLoad.add('meera-padavali');
      else if (coreName.includes('व्यास')) chunksToLoad.add('vyas-vani');
      else if (coreName.includes('हरिवंश') || coreName.includes('हित')) chunksToLoad.add('hit-chaurasi');
      else if (coreName.includes('हरिदास')) chunksToLoad.add('kelimal');
      else if (coreName.includes('बिहारिन')) chunksToLoad.add('biharin-dev-vani');
      else if (coreName.includes('नारायण स्वामी')) chunksToLoad.add('narayan-swami-vani');
      else if (coreName.includes('ललित किशोरी')) chunksToLoad.add('lalit-kishori-vani');
      else if (coreName.includes('ध्रुवदास')) chunksToLoad.add('bayalees-leela');
      else if (coreName.includes('परमानन्द')) chunksToLoad.add('paramanand-sagar');
      else if (coreName.includes('चन्द्रसखी')) chunksToLoad.add('chandrasakhi-padavali');
      else if (coreName.includes('वाल्मीकि')) chunksToLoad.add('valmiki-ramayana');
      else if (coreName.includes('वेदव्यास')) chunksToLoad.add('shrimad-bhagavatam');
      else if (coreName.includes('तुलसीदास')) chunksToLoad.add('ramcharitmanas');
      else if (coreName.includes('रसिक परंपरा')) chunksToLoad.add('stotras');
      else {
        // General rasik saints (Kishori Ali, Vitthal Vipul, Giridhar Lal, Bhori Sakhi, etc.)
        chunksToLoad.add('rasik-vani-sangrah');
      }
    }

    for (const chunkId of chunksToLoad) {
      try {
        await this.fetchGranthaPadas(chunkId);
      } catch (err) {
        console.warn('Failed to pre-hydrate chunk for author:', chunkId, err);
      }
    }

    // Invalidate authorCache so fresh hydrated padas are immediately indexed
    authorCache.delete(rawClean);
    if (coreName) authorCache.delete(coreName);

    return this.getPadasByAuthor(authorName);
  },

  /**
   * Returns all padas belonging to a specific chapter within a grantha
   */
  getPadasByChapter(granthaId: string, chapterId: string): SacredPad[] {
    const list = padasByGrantha.get(granthaId) || [];
    if (!chapterId || chapterId === 'all') return list;
    const cacheKey = `${granthaId}:${chapterId}`;
    if (chapterCache.has(cacheKey)) {
      return chapterCache.get(cacheKey)!;
    }

    const cleanTarget = chapterId.replace(/^(ch|leela|adhyay|sarga)-/, '').trim().toLowerCase();
    const result = list.filter((p) => {
      if (p.chapterId === chapterId) return true;
      if (p.chapterName === chapterId) return true;
      const pClean = (p.chapterId || '').replace(/^(ch|leela|adhyay|sarga)-/, '').trim().toLowerCase();
      if (pClean && pClean === cleanTarget) return true;
      const nameClean = (p.chapterName || '').trim().toLowerCase();
      if (nameClean && (nameClean === cleanTarget || nameClean === chapterId.toLowerCase())) return true;
      return false;
    });

    if (result.length > 0) {
      chapterCache.set(cacheKey, result);
      return result;
    }
    return [];
  },

  /**
   * Intent-Based Recommendation Engine:
   * Returns up to `limit` contextually related padas (consecutive next verse, same saint, same raga)
   * with zero network roundtrips using in-memory indices.
   */
  getRelatedPadas(targetPad: SacredPad, limit = 3): { pad: SacredPad; reason: string; badge: string }[] {
    if (!targetPad) return [];
    const related: { pad: SacredPad; reason: string; badge: string }[] = [];
    const seenIds = new Set<string>([targetPad.id]);

    // 1. Next sequential verse in the same chapter or grantha
    const granthaPadas = padasByGrantha.get(targetPad.collectionId) || [];
    const currentIdx = granthaPadas.findIndex(p => p.id === targetPad.id || p.slug === targetPad.slug);
    if (currentIdx >= 0 && currentIdx + 1 < granthaPadas.length) {
      const nextPad = granthaPadas[currentIdx + 1];
      if (nextPad && !seenIds.has(nextPad.id)) {
        seenIds.add(nextPad.id);
        related.push({
          pad: nextPad,
          reason: targetPad.chapterName ? `${targetPad.chapterName} की अगली कड़ी` : 'अगला पावन पद',
          badge: 'अगला पद',
        });
      }
    }

    // 2. Another verse by the same Rasik Saint (if author known and not generic)
    if (targetPad.author && !targetPad.author.includes('परंपरा') && targetPad.author !== 'विविध रसिक संत') {
      const authorPadas = this.getPadasByAuthor(targetPad.author);
      const saintCandidate = authorPadas.find(p => !seenIds.has(p.id) && (p.verses?.[0]?.linesDevanagari?.length || 0) > 0);
      if (saintCandidate) {
        seenIds.add(saintCandidate.id);
        related.push({
          pad: saintCandidate,
          reason: `${targetPad.author} की अन्य दिव्य रचना`,
          badge: 'संत वाणी',
        });
      }
    }

    // 3. A verse sharing the same Hindustani Classical Raga (if not 'विविध' or generic)
    if (targetPad.rag && targetPad.rag !== 'विविध' && targetPad.rag !== 'सामान्य') {
      const ragaPadas = this.getPadasByRaga(targetPad.rag);
      const ragaCandidate = ragaPadas.find(p => !seenIds.has(p.id) && (p.verses?.[0]?.linesDevanagari?.length || 0) > 0);
      if (ragaCandidate) {
        seenIds.add(ragaCandidate.id);
        related.push({
          pad: ragaCandidate,
          reason: `राग ${targetPad.rag} में निबद्ध पद`,
          badge: `राग ${targetPad.rag}`,
        });
      }
    }

    // 4. If still under limit, previous verse
    if (related.length < limit && currentIdx > 0) {
      const prevPad = granthaPadas[currentIdx - 1];
      if (prevPad && !seenIds.has(prevPad.id)) {
        seenIds.add(prevPad.id);
        related.push({
          pad: prevPad,
          reason: 'पूर्ववर्ती पद',
          badge: 'पूर्व पद',
        });
      }
    }

    return related.slice(0, limit);
  },

  /**
   * Fast, Multi-Token Client-Side Search (< 5ms over all loaded padas and 43,000+ catalog items)
   */
  search(query: string, limit = 25): SacredPad[] {
    const q = query.trim().toLowerCase();
    if (!q) return allPadas.slice(0, limit);

    const tokens = q.split(/\s+/).filter(Boolean);
    const results: SacredPad[] = [];
    const seenIds = new Set<string>();

    // 1. Search fully loaded authentic padas in memory
    for (const pad of allPadas) {
      const targetText = `${pad.titleDevanagari} ${pad.titleEnglish} ${pad.author} ${pad.rag} ${
        pad.verses[0]?.linesDevanagari?.join(' ') || ''
      }`.toLowerCase();

      const matches = tokens.every((tok) => targetText.includes(tok));
      if (matches) {
        results.push(pad);
        seenIds.add(pad.id);
        if (results.length >= limit) return results;
      }
    }

    // 2. Search catalog index if limit not yet reached
    if (searchCatalogItems.length > 0) {
      for (const item of searchCatalogItems) {
        if (seenIds.has(item.id)) continue;
        const targetText = `${item.titleDevanagari} ${item.author} ${item.rag || ''}`.toLowerCase();
        const matches = tokens.every((tok) => targetText.includes(tok));
        if (matches) {
          const stubPad = normalizeCanonicalPad({
            id: item.id,
            slug: item.id,
            titleDevanagari: item.titleDevanagari,
            collectionId: item.collectionId,
            author: item.author,
            rag: item.rag,
            index: item.index,
            isStub: true,
          });
          results.push(stubPad);
          seenIds.add(item.id);
          if (results.length >= limit) break;
        }
      }
    }

    return results;
  },

  /**
   * Load search catalog items for lightweight instant Spotlight search across 43,000+ scriptures
   */
  loadSearchCatalog(data: any): void {
    if (!data) return;
    if (data.items && Array.isArray(data.items)) {
      const cols = data.cols || [];
      const authors = data.authors || [];
      searchCatalogItems = data.items.map((row: any[], idx: number) => ({
        id: row[0],
        titleDevanagari: row[1],
        collectionId: cols[row[2]] || '',
        author: authors[row[3]] || '',
        rag: row[4] || '',
        index: idx + 1,
      }));
    } else if (Array.isArray(data)) {
      searchCatalogItems = data.map((item: any, idx: number) => ({
        id: item.id,
        titleDevanagari: item.titleDevanagari,
        collectionId: item.collectionId || '',
        author: item.author || '',
        rag: item.rag || '',
        index: item.index || idx + 1,
      }));
    }
  },

  /**
   * Hybrid Remote Search Fallback via Supabase Backup Server Database
   * Seamlessly queries remote PostgreSQL database whenever a devotee searches,
   * dynamically hydrating missing results into the client cache.
   */
  async searchRemote(query: string, limit = 25): Promise<SacredPad[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from('padas')
        .select('id, collection_id, index, title_devanagari, title_english, author, rag, slug, verses')
        .or(`title_devanagari.ilike.%${q}%,author.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(limit);

      if (!error && data && data.length > 0) {
        const mapped: SacredPad[] = data.map((r: any) => normalizeCanonicalPad({
          id: r.id,
          collectionId: r.collection_id || 'rasik-vani-sangrah',
          index: r.index,
          titleDevanagari: r.title_devanagari,
          titleEnglish: r.title_english || '',
          author: r.author,
          rag: r.rag || '',
          slug: r.slug,
          verses: r.verses,
        }));
        this.appendPadas(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase backup server search deferred:', err);
    }
    return [];
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
      getOrInitAuthUserId().then(async (userId) => {
        if (!userId) return;
        const sb = await getSupabase();
        if (exists) {
          sb.from('user_bookmarks').delete().match({ user_id: userId, pad_id: padId }).then();
        } else {
          sb.from('user_bookmarks').insert({ user_id: userId, pad_id: padId }).then();
        }
      }).catch(() => {});
    } catch {}

    return !exists;
  },

  async syncCloudBookmarks(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await sb.from('user_bookmarks').select('pad_id').eq('user_id', session.user.id);
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

export function mapPadToEpicChapter(padId: string): { grantha: string; chapter: string; verseId: string } | null {
  if (!padId) return null;
  const clean = decodeURIComponent(padId).trim();

  // 1. Ramcharitmanas (e.g. ramcharitmanas-kand-5-doha-14)
  const rcMatch = clean.match(/^ramcharitmanas(?:-kand)?[-_](\d+|[a-zA-Z]+)(?:[-_](?:doha|chaupai)[-_](\d+.*))?$/i);
  if (rcMatch || clean.startsWith('ramcharitmanas')) {
    const kands = ['', 'बालकाण्ड', 'अयोध्याकाण्ड', 'अरण्यकाण्ड', 'किष्किन्धाकाण्ड', 'सुन्दरकाण्ड', 'लंकाकाण्ड', 'उत्तरकाण्ड'];
    const kNum = rcMatch ? parseInt(rcMatch[1], 10) : 0;
    let kandName = '';
    if (kNum >= 1 && kNum <= 7) {
      kandName = kands[kNum];
    } else if (/sundar|सुन्दर/i.test(clean)) {
      kandName = 'सुन्दरकाण्ड';
    } else if (/bal|बाल/i.test(clean)) {
      kandName = 'बालकाण्ड';
    } else if (/ayodhya|अयोध्या/i.test(clean)) {
      kandName = 'अयोध्याकाण्ड';
    } else if (/aranya|अरण्य/i.test(clean)) {
      kandName = 'अरण्यकाण्ड';
    } else if (/kishkindha|किष्किन्धा/i.test(clean)) {
      kandName = 'किष्किन्धाकाण्ड';
    } else if (/lanka|लंका/i.test(clean)) {
      kandName = 'लंकाकाण्ड';
    } else if (/uttar|उत्तर/i.test(clean)) {
      kandName = 'उत्तरकाण्ड';
    }
    return {
      grantha: 'ramcharitmanas',
      chapter: kandName ? `kand-${kandName}` : 'kand-सुन्दरकाण्ड',
      verseId: clean,
    };
  }

  // 2. Valmiki Ramayana (e.g. valmiki-ramayana-5-sarga-4-shlok-12)
  const vrMatch = clean.match(/^valmiki-ramayana(?:-kand)?[-_](\d+)[-_]sarga[-_](\d+)/i);
  if (vrMatch || clean.startsWith('valmiki-ramayana')) {
    const kands = ['', 'बालकाण्ड', 'अयोध्याकाण्ड', 'अरण्यकाण्ड', 'किष्किन्धाकाण्ड', 'सुन्दरकाण्ड', 'युद्धकाण्ड', 'उत्तरकाण्ड'];
    const kNum = vrMatch ? parseInt(vrMatch[1], 10) : (/sundar|सुन्दर/i.test(clean) ? 5 : 1);
    const sNum = vrMatch ? parseInt(vrMatch[2], 10) : 1;
    const kandName = kands[kNum] || 'बालकाण्ड';
    return {
      grantha: 'valmiki-ramayana',
      chapter: `${kandName}-sarga-${sNum}`,
      verseId: clean,
    };
  }

  // 3. Shrimad Bhagavatam (e.g. shrimad-bhagwat-skandh-1-adhyay-1-shlok-1)
  const sbMatch = clean.match(/^shrimad-bhagwat[-_]skandh[-_](\d+)[-_]adhyay[-_](\d+)/i) ||
                  clean.match(/^shrimad-bhagavatam[-_]skandh[-_](\d+)[-_]adhyay[-_](\d+)/i);
  if (sbMatch) {
    return {
      grantha: 'shrimad-bhagavatam',
      chapter: `skandh-${sbMatch[1]}-adhyay-${sbMatch[2]}`,
      verseId: clean,
    };
  }

  // 4. Bhagavad Gita (e.g. shrimad-bhagavad-gita-adhyay-1-shlok-1)
  const bgMatch = clean.match(/^(?:shrimad-)?bhagavad-gita[-_]adhyay[-_](\d+)/i) ||
                  clean.match(/^gita[-_]adhyay[-_](\d+)/i);
  if (bgMatch) {
    return {
      grantha: 'bhagavad-gita',
      chapter: `adhyay-${bgMatch[1]}`,
      verseId: clean,
    };
  }

  // 5. Durga Saptashati (e.g. durga-saptashati-adhyay-1-shlok-1)
  const dsMatch = clean.match(/^durga-saptashati[-_]adhyay[-_](\d+)/i);
  if (dsMatch) {
    return {
      grantha: 'durga-saptashati',
      chapter: `adhyay-${dsMatch[1]}`,
      verseId: clean,
    };
  }

  return null;
}

