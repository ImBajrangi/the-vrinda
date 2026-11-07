import { get, set } from 'idb-keyval';
import canonicalPadasData from '../data/canonicalPadas.json';
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
    else if (/राधा सुधा निधि|सुधानिधि/i.test(title + author)) collectionId = 'radha-sudha-nidhi';
    else if (/हरिदास|केलिमाल/i.test(author + title)) collectionId = 'kelimal';
    else if (/ध्रुवदास/i.test(author)) collectionId = 'bayalees-leela';
    else if (/सूरदास/i.test(author)) collectionId = 'sur-sagar';
    else if (/रसखान/i.test(author)) collectionId = 'raskhan-padavali';
    else if (/लाल बलबीर/i.test(author)) collectionId = 'braj-binod';
    else if (/कृपालु/i.test(author)) collectionId = 'bhakti-shatak';
    else if (/सेवक|दामोदरदास/i.test(author)) collectionId = 'sevak-vani';
    else if (/व्यास/i.test(author)) collectionId = 'vyas-vani';
    else if (/ललित किशोरी|ललित मोहिनी/i.test(author)) collectionId = 'lalit-kishori-vani';
    else if (/बिहारिन|भगवत रसिक/i.test(author)) collectionId = 'biharin-dev-vani';
    else if (/नारायण स्वामी/i.test(author)) collectionId = 'narayan-swami-vani';
    else if (/हरिव्यास/i.test(author)) collectionId = 'harivyas-dev-vani';
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
        bhavarth: st.bhavarth || '',
      }));
    } else {
      verses = [{ stanzaNumber: 1, linesDevanagari: [title], linesEnglish: [], bhavarth: '' }];
    }
  }

  return {
    ...raw,
    collectionId,
    titleDevanagari: title,
    titleEnglish: raw.titleEnglish || raw.titleEng || '',
    author,
    rag,
    duration: raw.duration || '05:20',
    verses,
  };
}

// In-Memory Synchronous Pre-warmed Indexes for 0ms Rendering
const allPadas: SacredPad[] = (canonicalPadasData as any[]).map(normalizeCanonicalPad);
const allGranthas: CanonicalGrantha[] = canonicalGranthasData as CanonicalGrantha[];
const allSaints: CanonicalSaint[] = canonicalSaintsData as CanonicalSaint[];

const padasById = new Map<string, SacredPad>();
const padasByGrantha = new Map<string, SacredPad[]>();
const padasByRaga = new Map<string, SacredPad[]>();

// Build fast indexes synchronously at import time
allPadas.forEach((pad) => {
  padasById.set(pad.id, pad);

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

/**
 * High-Performance Sacred Database API
 */
export const SacredDatabase = {
  // Synchronous Read Methods (0ms Cold Render)
  getAllPadas(): SacredPad[] {
    return allPadas;
  },

  getPadById(id: string): SacredPad | undefined {
    return padasById.get(id);
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

  // Asynchronous Persistent Operations via IndexedDB
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

    return !exists;
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

