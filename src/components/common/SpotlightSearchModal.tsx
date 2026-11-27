import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  BookOpen,
  Compass,
  Flame,
  MapPin,
  CornerDownLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  SacredDatabase,
  CanonicalSaint,
  CanonicalGrantha,
  cleanSacredString,
} from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';
import { getSaintPortrait, getBookCoverConfig } from '../../services/devotionalVisuals';
import { IOSSpinner, navigationProgress } from './IOSActivityIndicator';
import { CorrelationService } from '../../services/correlationService';
import {
  SEED_STORIES,
  SEED_PLACES,
  SEED_RITUALS,
} from '../../services/sacredSectionService';

export type SearchFilterType = 'all' | 'padas' | 'saints' | 'granthas';

// Lightweight Devanagari <-> Hinglish/ITRANS phonetic normalizer for bilingual search
const PHONETIC_DEV_MAP: Record<string, string> = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o',
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '', '़': '',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'k', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'j', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'ph',
};

function toPhoneticLatin(input: string): string {
  if (!input) return '';
  let out = '';
  const chars = Array.from(input.toLowerCase());
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const mapped = PHONETIC_DEV_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
      // Inherent schwa 'a' after Devanagari consonant when followed by another consonant or anusvara/visarga
      const isConsonant = ch >= 'क' && ch <= 'ह';
      const next = chars[i + 1];
      const nextTakesInherentA = next && ((next >= 'क' && next <= 'ह') || next === 'ं' || next === 'ँ' || next === 'ः');
      if (isConsonant && nextTakesInherentA) {
        out += 'a';
      }
    } else if (/[a-z0-9\s]/.test(ch)) {
      out += ch;
    } else {
      out += ' ';
    }
  }
  return out
    .replace(/aa+/g, 'a')
    .replace(/ee+|ii+/g, 'i')
    .replace(/oo+|uu+/g, 'u')
    .replace(/au/g, 'o')
    .replace(/ai/g, 'e')
    .replace(/w/g, 'v')
    .replace(/f/g, 'ph')
    .replace(/z/g, 'j')
    .replace(/ksh|x/g, 'ksh')
    .replace(/\b([a-z]{3,})a\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesBilingual(query: string, ...fields: (string | undefined)[]): boolean {
  const qRaw = query.trim().toLowerCase();
  if (!qRaw) return true;
  const qPhonetic = toPhoneticLatin(qRaw);
  const qTokens = qPhonetic ? qPhonetic.split(' ').filter(Boolean) : [];

  for (const field of fields) {
    if (!field) continue;
    const fLower = field.toLowerCase();
    if (fLower.includes(qRaw)) return true;
    if (qPhonetic.length >= 2) {
      const fPhonetic = toPhoneticLatin(fLower);
      if (fPhonetic.includes(qPhonetic)) return true;
      if (qTokens.length > 1 && qTokens.every((tok) => fPhonetic.includes(tok))) return true;
    }
  }
  return false;
}

type CombinedItem =
  | { type: 'grantha'; data: CanonicalGrantha }
  | { type: 'saint'; data: CanonicalSaint }
  | { type: 'pad'; data: SacredPad }
  | { type: 'place'; data: typeof SEED_PLACES[0] }
  | { type: 'ritual'; data: typeof SEED_RITUALS[0] }
  | { type: 'story'; data: typeof SEED_STORIES[0] };

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPad: (pad: SacredPad) => void;
  onSelectSaint?: (saint: CanonicalSaint) => void;
  onSelectGrantha?: (grantha: CanonicalGrantha) => void;
}

/**
 * Intelligent devotional title sanitizer:
 * Strips redundant metadata (e.g. "- श्री हित हरिवंश महाप्रभु, श्री हित चौरासी (पद 1) (विभास)")
 * and separates pure sacred mukhda from pad number and grantha hints.
 */
function extractPurePadaTitle(rawTitle: string): {
  title: string;
  padHint?: string;
  granthaHint?: string;
} {
  if (!rawTitle) return { title: '' };
  const cleaned = cleanSacredString(rawTitle);

  // Split only on dashes surrounded by spaces or starting after a space
  const parts = cleaned.split(/\s+[-–—]\s+|\s*[-–—]\s+/);
  let pureTitle = parts[0].trim();
  const trailingMeta = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';

  // Extract pad number if present
  let padHint: string | undefined;
  const padMatch = (trailingMeta + ' ' + cleaned).match(/पद\s*(\d+|[०-९]+)/);
  if (padMatch) {
    padHint = `पद ${padMatch[1]}`;
  }

  // Remove trailing parenthetical metadata (e.g. '(पद 1)' or '(विभास)') from pureTitle
  pureTitle = pureTitle.replace(/\s*\((?:पद\s*[\d०-९]+|राग\s*[^)]+|[^)]+)\)\s*$/g, '').trim();

  // Extract canonical grantha name if recognized
  let granthaHint: string | undefined;
  const combined = trailingMeta + ' ' + cleaned;
  if (combined.includes('हित चौरासी')) granthaHint = 'श्री हित चौरासी';
  else if (combined.includes('राधा सुधा निधि')) granthaHint = 'श्री राधा सुधा निधि';
  else if (combined.includes('केलिमाल')) granthaHint = 'श्री केलिमाल';
  else if (combined.includes('व्यास वाणी')) granthaHint = 'श्री व्यास वाणी';
  else if (combined.includes('स्फुट वाणी')) granthaHint = 'श्री स्फुट वाणी';
  else if (combined.includes('बयालीस लीला')) granthaHint = 'बयालीस लीला';
  else if (combined.includes('सूरसागर')) granthaHint = 'सूरसागर';
  else if (combined.includes('विनय पत्रिका')) granthaHint = 'विनय पत्रिका';

  return {
    title: pureTitle || cleaned,
    padHint,
    granthaHint,
  };
}

// Curated Trending Devotional Search Pills for instant emotional connection
const TRENDING_SEARCH_PROMPTS = [
  { label: 'श्री राधा कृपा कटाक्ष', query: 'राधा कृपा कटाक्ष', icon: '✨' },
  { label: 'श्री हनुमान चालीसा', query: 'हनुमान चालीसा', icon: '🪔' },
  { label: 'आरती कुंजबिहारी की', query: 'आरती कुंजबिहारी की', icon: '🌸' },
  { label: 'मधुराष्टकम', query: 'मधुराष्टकम', icon: '🍯' },
  { label: 'हित चौरासी (पद १)', query: 'जोई जोई प्यारो करे', icon: '🎶' },
  { label: 'गिरिराज गोवर्धन', query: 'गोवर्धन', icon: '⛰️' },
  { label: 'स्वामी हरिदास केलिमाल', query: 'केलिमाल', icon: '🪷' },
  { label: 'शिव ताण्डव स्तोत्रम्', query: 'शिव ताण्डव', icon: '🔱' },
];

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPad,
  onSelectSaint,
  onSelectGrantha,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time Ashtayama Prahar context for divine relatability
  const prahar = useMemo(() => {
    return CorrelationService.getCurrentPrahar();
  }, []);

  // 250ms Debounce to prevent unnecessary filtering operations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Query Supabase remote backup server database in background for complete coverage
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      SacredDatabase.searchRemote(debouncedQuery).catch(() => {});
    }
  }, [debouncedQuery]);

  // Lazy-load complete search catalog on first modal open
  useEffect(() => {
    if (isOpen) {
      SacredDatabase.getManifestAsync()
        .then((manifest) => {
          const catalogFile = manifest?.catalog?.file || 'catalog.json';
          return fetch(`/data/${catalogFile}`);
        })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          SacredDatabase.loadSearchCatalog(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal Lifecycle & Focus
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (isRendered) {
      setIsClosing(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, 280);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    if (isClosing) return;
    onClose();
  };

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRendered]);

  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    return SacredDatabase.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
  }, []);

  // 1. Searched Padas with Intelligent Deduplication + Bilingual Hinglish/Phonetic Matching
  const searchedPadas = useMemo(() => {
    const q = debouncedQuery.trim();
    const raw = SacredDatabase.search(debouncedQuery, q ? 50 : 28);
    const seenIds = new Set(raw.map((p) => p.id));
    const combinedRaw = [...raw];

    if (q && /[a-zA-Z]/.test(q) && combinedRaw.length < 30) {
      const allPadas = SacredDatabase.getAllPadas();
      for (const p of allPadas) {
        if (seenIds.has(p.id)) continue;
        const firstVerse = p.verses?.[0]?.linesDevanagari?.slice(0, 2).join(' ') || '';
        if (matchesBilingual(q, p.titleDevanagari, p.titleEnglish, p.author, firstVerse)) {
          combinedRaw.push(p);
          seenIds.add(p.id);
          if (combinedRaw.length >= 40) break;
        }
      }
    }

    const seenTitles = new Set<string>();
    const deduped: SacredPad[] = [];

    for (const p of combinedRaw) {
      const { title } = extractPurePadaTitle(p.titleDevanagari);
      const normalized = title.replace(/\s+/g, '').replace(/[-–—]/g, '');
      if (seenTitles.has(normalized)) continue;
      seenTitles.add(normalized);
      deduped.push(p);
    }
    return deduped;
  }, [debouncedQuery, dbVersion]);

  // 2. Searched Saints
  const searchedSaints = useMemo(() => {
    const allSaints = SacredDatabase.getAllSaints();
    const q = debouncedQuery.trim();
    if (!q) return allSaints.slice(0, 8);
    return allSaints.filter((s) => matchesBilingual(q, s.name, s.nameEng, s.tradition));
  }, [debouncedQuery]);

  // 3. Searched Granthas
  const searchedGranthas = useMemo(() => {
    const allGranthas = SacredDatabase.getAllGranthas();
    const q = debouncedQuery.trim();
    if (!q) return allGranthas.slice(0, 6);
    return allGranthas.filter((g) => matchesBilingual(q, g.name, g.id, g.author));
  }, [debouncedQuery]);

  // 4. Searched Sacred Sections (Places, Rituals, Stories)
  const searchedSacredSections = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return [];

    const matchedPlaces = SEED_PLACES.filter((p) =>
      matchesBilingual(q, p.nameDevanagari, p.name, p.regionNameHindi, ...(p.tags || []))
    ).slice(0, 2);

    const matchedRituals = SEED_RITUALS.filter((r) =>
      matchesBilingual(q, r.titleDevanagari, r.title, r.categoryHindi, r.deityDevanagari)
    ).slice(0, 2);

    const matchedStories = SEED_STORIES.filter((s) =>
      matchesBilingual(q, s.titleDevanagari, s.title, s.categoryHindi, ...(s.tags || []))
    ).slice(0, 2);

    return [
      ...matchedPlaces.map((p) => ({ type: 'place' as const, data: p })),
      ...matchedRituals.map((r) => ({ type: 'ritual' as const, data: r })),
      ...matchedStories.map((s) => ({ type: 'story' as const, data: s })),
    ];
  }, [debouncedQuery]);

  const totalResults =
    searchedGranthas.length + searchedSaints.length + searchedPadas.length + searchedSacredSections.length;

  // Displayed items strictly filtered by the selected tab
  const displayedGranthas = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'granthas') return [];
    return activeFilter === 'all' ? searchedGranthas.slice(0, 4) : searchedGranthas;
  }, [activeFilter, searchedGranthas]);

  const displayedSaints = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'saints') return [];
    return activeFilter === 'all' ? searchedSaints.slice(0, 6) : searchedSaints;
  }, [activeFilter, searchedSaints]);

  const displayedPadas = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'padas') return [];
    return activeFilter === 'all' ? searchedPadas.slice(0, 12) : searchedPadas;
  }, [activeFilter, searchedPadas]);

  // Combined items list for keyboard navigation
  const combinedResults = useMemo<CombinedItem[]>(() => {
    const list: CombinedItem[] = [];
    if (activeFilter === 'all') {
      for (const sec of searchedSacredSections) list.push(sec);
      for (const s of displayedSaints) list.push({ type: 'saint', data: s });
      for (const g of displayedGranthas) list.push({ type: 'grantha', data: g });
      for (const p of displayedPadas) list.push({ type: 'pad', data: p });
    } else if (activeFilter === 'padas') {
      for (const p of displayedPadas) list.push({ type: 'pad', data: p });
    } else if (activeFilter === 'saints') {
      for (const s of displayedSaints) list.push({ type: 'saint', data: s });
    } else if (activeFilter === 'granthas') {
      for (const g of displayedGranthas) list.push({ type: 'grantha', data: g });
    }
    return list;
  }, [displayedSaints, displayedGranthas, displayedPadas, searchedSacredSections, activeFilter]);

  // Reset keyboard index on query/filter change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query, activeFilter]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (combinedResults.length > 0) {
          setSelectedIdx((prev) => (prev + 1) % combinedResults.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (combinedResults.length > 0) {
          setSelectedIdx((prev) => (prev - 1 + combinedResults.length) % combinedResults.length);
        }
      } else if (e.key === 'Enter') {
        if (combinedResults.length > 0) {
          e.preventDefault();
          const target = combinedResults[selectedIdx] || combinedResults[0];
          if (target) {
            navigationProgress.start();
            if (target.type === 'grantha') {
              onSelectGrantha?.(target.data);
              onClose();
            } else if (target.type === 'saint') {
              onSelectSaint?.(target.data);
              onClose();
            } else if (target.type === 'pad') {
              onSelectPad(target.data);
              onClose();
            } else if (target.type === 'place') {
              window.location.href = `/place/${target.data.slug}`;
            } else if (target.type === 'ritual') {
              window.location.href = `/ritual/${target.data.slug}`;
            } else if (target.type === 'story') {
              window.location.href = `/story/${target.data.slug}`;
            }
            requestAnimationFrame(() => navigationProgress.done());
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const filters: SearchFilterType[] = ['all', 'padas', 'saints', 'granthas'];
        const currentIdx = filters.indexOf(activeFilter);
        const nextFilter = filters[(currentIdx + 1) % filters.length];
        setActiveFilter(nextFilter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedResults, selectedIdx, activeFilter]);

  if (!isRendered || typeof document === 'undefined') return null;

  const filterOrder: SearchFilterType[] = ['all', 'padas', 'saints', 'granthas'];
  const activeFilterIdx = Math.max(0, filterOrder.indexOf(activeFilter));

  const filterTabs: { id: SearchFilterType; label: string; count: number }[] = [
    { id: 'all', label: 'समस्त नेक्सस', count: totalResults },
    { id: 'padas', label: 'पदावली', count: searchedPadas.length },
    { id: 'saints', label: 'रसिक संत', count: searchedSaints.length },
    { id: 'granthas', label: 'पावन ग्रन्थ', count: searchedGranthas.length },
  ];

  const isQueryEmpty = !query.trim();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex items-end sm:items-start justify-center p-0 sm:pt-10 sm:px-4 bg-black/55 backdrop-blur-[5px] transition-opacity select-none ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      {/* 
        Majestic, Spacious Spotlight Discovery Hub
        Expanded from narrow max-w-3xl (768px) to broad, comfortable max-w-4xl lg:max-w-5xl (1000px+)
      */}
      <div
        className={`w-full max-w-4xl lg:max-w-5xl xl:max-w-[1020px] bg-white dark:bg-[#1A1816] rounded-t-[32px] sm:rounded-[28px] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border-t sm:border border-stone-200/90 dark:border-stone-800 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.30)] ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Tactile Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* 1. Command-K Search Input Header (Spacious & Prominent) */}
        <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-8 py-4 sm:py-4.5 bg-white dark:bg-[#1A1816] border-b border-stone-100 dark:border-stone-800/80 min-h-[56px] sm:min-h-[64px] shrink-0">
          <Search className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें: पावन पद, रसिक संत, महाग्रन्थ, तीर्थ, राग या भाव..."
            className="flex-1 bg-transparent text-[16px] sm:text-[18px] font-sans font-normal text-stone-850 dark:text-stone-100 placeholder:text-stone-400 placeholder:font-normal outline-none"
          />
          {query !== debouncedQuery && (
            <IOSSpinner size="xs" theme="amber" className="shrink-0" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer shrink-0"
              title="साफ़ करें"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] font-mono font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-[5px] border border-stone-200/60 dark:border-stone-700 shrink-0">
            ESC
          </kbd>
        </div>

        {/* 2. Apple / macOS Style Segmented Scope Filter Bar (Generous Height) */}
        {/* Outer 14px -> Padding 4px -> Inner 10px (Concentric Radius: 14 - 4 = 10px) */}
        <div className="px-4 sm:px-8 pt-2.5 pb-3 bg-stone-50/60 dark:bg-[#161412] border-b border-stone-100 dark:border-stone-800/60 shrink-0">
          <div className="relative w-full grid grid-cols-4 p-1.5 bg-stone-200/70 dark:bg-stone-800/80 rounded-[14px] border border-stone-200/40">
            {/* Smooth Elastic Pill */}
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 rounded-[10px] bg-white dark:bg-stone-900 shadow-[0_1.5px_4px_rgba(0,0,0,0.08)] border border-stone-200/50 dark:border-stone-700/60 pointer-events-none transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                width: 'calc((100% - 12px) / 4)',
                left: '6px',
                transform: `translate3d(${activeFilterIdx * 100}%, 0, 0)`,
              }}
            />

            {filterTabs.map((f) => {
              const isActive = activeFilter === f.id;
              const shortLabel =
                f.id === 'all'
                  ? 'सभी'
                  : f.id === 'padas'
                  ? 'पद'
                  : f.id === 'saints'
                  ? 'संत'
                  : 'ग्रन्थ';
              const fullLabel = f.label;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(f.id);
                    setSelectedIdx(0);
                  }}
                  className={`relative z-10 py-2 sm:py-1.5 px-1.5 sm:px-3 rounded-[10px] text-[12.5px] sm:text-[14px] transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none min-h-[38px] sm:min-h-[36px] ${
                    isActive
                      ? 'text-stone-900 dark:text-stone-100 font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-normal'
                  }`}
                >
                  <span className="sm:hidden truncate">{shortLabel}</span>
                  <span className="hidden sm:inline truncate">{fullLabel}</span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono ${
                      isActive
                        ? 'text-amber-800 dark:text-amber-300 font-bold'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    ({f.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Body: Spacious Discovery Sanctuary OR Scope-Filtered Results */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-5 space-y-6 custom-scroll bg-white dark:bg-[#1A1816] pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))]">
          {isQueryEmpty && activeFilter === 'all' ? (
            /* ========================================================================= */
            /* WELCOME SANCTUARY: Majestic, Spacious, Deeply Engaging Discovery Hub     */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* A. Real-Time Ashtayama Prahar Hero Card (Generously Sized) */}
              {/* Outer 20px -> Padding 14px -> Inner 6px */}
              <div className="p-4 sm:p-5 rounded-[20px] bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.04] to-transparent dark:from-amber-400/[0.10] border border-amber-300/50 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[8px] bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-medium uppercase tracking-wider text-amber-900/90 dark:text-amber-300">
                      <span>वृन्दावन अष्टयाम सेवा चक्र</span>
                      <span className="opacity-40">•</span>
                      <span>प्रहर {prahar.praharIndex}/८</span>
                    </div>
                    <h3 className="text-[15px] sm:text-[17px] font-serif font-bold text-stone-850 dark:text-stone-100 mt-0.5">
                      {prahar.nameHindi} ({prahar.timeRange})
                    </h3>
                    <p className="text-xs sm:text-[13.5px] text-stone-600 dark:text-stone-400 font-sans mt-0.5 line-clamp-1">
                      {prahar.bhava} • मुख्य राग:{' '}
                      <span className="font-semibold text-amber-850 dark:text-amber-300">
                        {prahar.ragaText}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuery(prahar.activeRagas[0] || 'विभास')}
                  className="w-full sm:w-auto text-center justify-center px-4 py-2.5 sm:py-2 rounded-[8px] text-[13px] sm:text-xs font-serif font-semibold bg-white dark:bg-stone-800 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700 shadow-2xs hover:bg-amber-50/90 cursor-pointer transition-colors shrink-0"
                >
                  इस प्रहर के पद देखें →
                </button>
              </div>

              {/* B. Trending & Most Revered Sacred Quick Pills (Spacious Chips) */}
              <div>
                <div className="flex items-center gap-2 px-1 mb-2.5 text-xs sm:text-[13px] font-mono font-medium uppercase tracking-wider text-amber-900/80 dark:text-amber-400/80">
                  <TrendingUp className="w-4 h-4" />
                  <span>भक्तों द्वारा सर्वाधिक खोजे गए पावन प्रसंग</span>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {TRENDING_SEARCH_PROMPTS.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setQuery(p.query)}
                      className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-[9px] bg-stone-100/90 dark:bg-stone-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-750 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-200 border border-stone-200/60 dark:border-stone-700/70 text-xs sm:text-[13px] font-serif transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* C. Revered Saints Cards (Prominent Portraits & Lineage) */}
              <div>
                <div className="flex items-center justify-between px-1 mb-2.5">
                  <span className="text-xs sm:text-[13px] font-mono font-medium uppercase tracking-wider text-amber-900/80 dark:text-amber-400/80">
                    रसिक संत व आचार्य
                  </span>
                  <span className="text-xs text-stone-400 font-sans">वाणी व चरित्र दर्शन</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchedSaints.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        navigationProgress.start();
                        onSelectSaint?.(s);
                        onClose();
                        requestAnimationFrame(() => navigationProgress.done());
                      }}
                      className="group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[14px] bg-stone-50/70 dark:bg-stone-850/60 hover:bg-amber-500/[0.06] border border-stone-200/60 dark:border-stone-800 transition-all duration-150 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-amber-200/60 shadow-xs">
                          <img
                            src={getSaintPortrait(s)}
                            alt={s.name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif font-medium text-[14.5px] sm:text-[15.5px] text-stone-850 dark:text-stone-100 truncate group-hover:text-amber-900 transition-colors leading-snug">
                            {s.name}
                          </div>
                          <div className="text-xs sm:text-[12.5px] text-stone-500 truncate font-sans mt-0.5">
                            {s.tradition}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] sm:text-xs font-serif text-stone-400 group-hover:text-amber-800 transition-colors shrink-0 flex items-center gap-0.5">
                        <span>दर्शन</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* D. Principal Scriptures (Rich Leather Pothi Covers) */}
              <div>
                <div className="flex items-center justify-between px-1 mb-2.5">
                  <span className="text-xs sm:text-[13px] font-mono font-medium uppercase tracking-wider text-amber-900/80 dark:text-amber-400/80">
                    अमर पावन ग्रन्थ
                  </span>
                  <span className="text-xs text-stone-400 font-sans">मूल पाठ संग्रह</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchedGranthas.slice(0, 4).map((g) => {
                    const cover = getBookCoverConfig(g.id, g.name);
                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          navigationProgress.start();
                          onSelectGrantha?.(g);
                          onClose();
                          requestAnimationFrame(() => navigationProgress.done());
                        }}
                        className="group flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-[14px] bg-stone-50/70 dark:bg-stone-850/60 hover:bg-amber-500/[0.06] border border-stone-200/60 dark:border-stone-800 transition-all duration-150 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className="w-9 h-12 sm:w-10 sm:h-13 rounded-[4px] text-white flex items-center justify-center shrink-0 shadow-xs"
                            style={{ background: cover.bg }}
                          >
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200/90" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-serif font-medium text-[15px] sm:text-[16px] text-stone-850 dark:text-stone-100 truncate group-hover:text-amber-900 transition-colors leading-snug">
                              {g.name}
                            </div>
                            <div className="text-xs sm:text-[12.5px] text-stone-500 truncate font-sans mt-0.5">
                              {g.author} • {g.count} पद
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-serif text-stone-400 group-hover:text-amber-800 transition-colors shrink-0 flex items-center gap-0.5">
                          <span>पठन</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* E. Curated Divine Padas of the Day */}
              <div>
                <div className="flex items-center justify-between px-1 mb-2.5">
                  <span className="text-xs sm:text-[13px] font-mono font-medium uppercase tracking-wider text-amber-900/80 dark:text-amber-400/80">
                    पावन पदावली दर्शन
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('padas')}
                    className="text-xs sm:text-[13px] text-amber-800 hover:text-amber-950 dark:text-amber-300 font-serif font-medium cursor-pointer transition-colors"
                  >
                    सभी पद देखें →
                  </button>
                </div>

                <div className="space-y-1.5">
                  {searchedPadas.slice(0, 5).map((pad) => {
                    const { title: cleanTitle, padHint, granthaHint } = extractPurePadaTitle(pad.titleDevanagari);
                    const portrait = getSaintPortrait({ name: pad.author });

                    return (
                      <div
                        key={pad.id}
                        onClick={() => {
                          navigationProgress.start();
                          onSelectPad(pad);
                          onClose();
                          requestAnimationFrame(() => navigationProgress.done());
                        }}
                        className="group flex items-center justify-between gap-3.5 px-4 py-3 rounded-[12px] bg-stone-50/60 dark:bg-stone-850/40 hover:bg-amber-500/[0.06] border border-stone-200/50 dark:border-stone-800 transition-all duration-120 cursor-pointer select-none min-h-[56px]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-amber-200/60 shadow-2xs">
                            <img
                              src={portrait}
                              alt={pad.author}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-serif font-medium text-[14.5px] sm:text-[16px] text-stone-850 dark:text-stone-100 truncate leading-snug group-hover:text-amber-900 transition-colors">
                              {cleanTitle}
                            </h4>
                            <div className="flex items-center gap-2 text-xs sm:text-[12.5px] text-stone-500 font-sans leading-none mt-1 truncate">
                              <span className="font-medium text-stone-600 dark:text-stone-300">
                                {cleanSacredString(pad.author)}
                              </span>
                              {(granthaHint || padHint) && (
                                <>
                                  <span className="text-stone-300 dark:text-stone-600">•</span>
                                  <span className="text-stone-500 dark:text-stone-400">
                                    {[granthaHint, padHint].filter(Boolean).join(' ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {pad.rag && (
                            <span className="text-xs font-serif text-amber-850 dark:text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40">
                              राग {cleanSacredString(pad.rag)}
                            </span>
                          )}
                          <span className="text-xs font-serif text-stone-400 group-hover:text-amber-800 transition-colors flex items-center gap-0.5">
                            <span>पठन</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* SEARCH RESULTS / TAB VIEW: Spacious, High-Resonance Card Architecture     */
            /* ========================================================================= */
            <>
              {totalResults === 0 && (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 opacity-60" />
                  </div>
                  <h3 className="font-serif font-medium text-base text-stone-850 dark:text-stone-200">
                    कोई पावन प्रसंग नहीं मिला
                  </h3>
                  <p className="text-[13px] text-stone-500 dark:text-stone-400 font-sans max-w-sm mx-auto">
                    कृपया अन्य शब्द, संत का नाम (उदा. 'हरिदास', 'तुलसी', 'सूर') या राग खोजें।
                  </p>
                </div>
              )}

              {/* 1. Cross-Domain Sacred Sections (Dhams, Rituals, Stories) */}
              {activeFilter === 'all' && searchedSacredSections.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 pb-0.5">
                    <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="text-xs sm:text-[13px] font-mono font-medium tracking-wider text-amber-900/80 dark:text-amber-400/80 uppercase">
                      पावन तीर्थ, उपासना व लीला कथाएँ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {searchedSacredSections.map((sec, secIdx) => {
                      const isPlace = sec.type === 'place';
                      const isRitual = sec.type === 'ritual';
                      const targetUrl = isPlace
                        ? `/place/${sec.data.slug}`
                        : isRitual
                        ? `/ritual/${sec.data.slug}`
                        : `/story/${sec.data.slug}`;

                      return (
                        <a
                          key={secIdx}
                          href={targetUrl}
                          className="group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[14px] bg-stone-50/70 dark:bg-stone-850/60 hover:bg-amber-500/[0.06] border border-stone-200/60 dark:border-stone-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-[8px] bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                              {isPlace ? (
                                <MapPin className="w-4 h-4 text-emerald-600" />
                              ) : isRitual ? (
                                <Flame className="w-4 h-4 text-amber-600" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-rose-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-medium text-[14.5px] sm:text-[15.5px] text-stone-850 dark:text-stone-100 group-hover:text-amber-900 truncate leading-snug">
                                {isPlace ? sec.data.nameDevanagari : sec.data.titleDevanagari}
                              </h4>
                              <p className="text-xs text-stone-500 font-sans truncate mt-0.5">
                                {isPlace
                                  ? `${sec.data.regionNameHindi} • पावन तीर्थ`
                                  : isRitual
                                  ? `${sec.data.categoryHindi} • ${sec.data.deityDevanagari}`
                                  : `${sec.data.categoryHindi} • दिव्य लीला कथा`}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-stone-400 group-hover:text-amber-700 shrink-0 flex items-center gap-0.5">
                            <span>दर्शन</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Saints Section (Spacious Grid) */}
              {displayedSaints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 pb-0.5">
                    <span className="text-xs sm:text-[13px] font-mono font-medium tracking-wider text-amber-900/80 dark:text-amber-400/80 uppercase">
                      रसिक संत ({activeFilter === 'all' ? displayedSaints.length : searchedSaints.length})
                    </span>
                    {activeFilter === 'all' && searchedSaints.length > displayedSaints.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('saints');
                          setSelectedIdx(0);
                        }}
                        className="text-xs sm:text-[13px] text-amber-800 hover:text-amber-950 dark:text-amber-400 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedSaints.length} संत देखें →
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    {displayedSaints.map((s, idx) => {
                      const globalIdx = searchedSacredSections.length + idx;
                      const isSelected = selectedIdx === globalIdx;
                      const portrait = getSaintPortrait(s);

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            navigationProgress.start();
                            onSelectSaint?.(s);
                            onClose();
                            requestAnimationFrame(() => navigationProgress.done());
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[14px] transition-all duration-120 cursor-pointer select-none border ${
                            isSelected
                              ? 'bg-amber-500/[0.08] dark:bg-amber-400/[0.10] border-amber-400/80 dark:border-amber-500/70 text-stone-900 dark:text-stone-100 shadow-2xs'
                              : 'bg-stone-50/70 dark:bg-stone-850/60 border-stone-200/50 dark:border-stone-800 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full overflow-hidden shadow-2xs bg-amber-100/50 border border-amber-200/50">
                              <img
                                src={portrait}
                                alt={s.name}
                                className="w-full h-full object-cover object-top"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-medium text-[14.5px] sm:text-[15.5px] text-stone-850 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors truncate leading-tight">
                                {s.name}
                              </h4>
                              <div className="text-xs sm:text-[12.5px] text-stone-500 dark:text-stone-400 font-sans leading-none mt-1 truncate">
                                {s.tradition} • {s.articleCount} पद
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] sm:text-xs font-serif text-stone-400 dark:text-stone-500 group-hover:text-amber-800 dark:group-hover:text-amber-300 shrink-0 flex items-center gap-0.5">
                            <span>दर्शन</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Granthas Section (Spacious Grid) */}
              {displayedGranthas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 pb-0.5">
                    <span className="text-xs sm:text-[13px] font-mono font-medium tracking-wider text-amber-900/80 dark:text-amber-400/80 uppercase">
                      पावन ग्रन्थ ({activeFilter === 'all' ? displayedGranthas.length : searchedGranthas.length})
                    </span>
                    {activeFilter === 'all' && searchedGranthas.length > displayedGranthas.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('granthas');
                          setSelectedIdx(0);
                        }}
                        className="text-xs sm:text-[13px] text-amber-800 hover:text-amber-950 dark:text-amber-400 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedGranthas.length} ग्रन्थ देखें →
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {displayedGranthas.map((g, idx) => {
                      const globalIdx = searchedSacredSections.length + displayedSaints.length + idx;
                      const isSelected = selectedIdx === globalIdx;
                      const cover = getBookCoverConfig(g.id, g.name);

                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            navigationProgress.start();
                            onSelectGrantha?.(g);
                            onClose();
                            requestAnimationFrame(() => navigationProgress.done());
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`group flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-[14px] transition-all duration-120 cursor-pointer select-none border ${
                            isSelected
                              ? 'bg-amber-500/[0.08] dark:bg-amber-400/[0.10] border-amber-400/80 dark:border-amber-500/70 text-stone-900 dark:text-stone-100 shadow-2xs'
                              : 'bg-stone-50/70 dark:bg-stone-850/60 border-stone-200/50 dark:border-stone-800 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className="w-9 h-12 sm:w-10 sm:h-13 rounded-[4px] text-white flex items-center justify-center shrink-0 shadow-xs"
                              style={{ background: cover.bg }}
                            >
                              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200/90" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-medium text-[15px] sm:text-[16px] text-stone-850 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors truncate leading-tight">
                                {g.name}
                              </h4>
                              <div className="text-xs sm:text-[12.5px] text-stone-500 dark:text-stone-400 font-sans leading-none mt-1 truncate">
                                {g.author} • {g.count} पद
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] sm:text-xs font-serif text-stone-400 dark:text-stone-500 group-hover:text-amber-800 dark:group-hover:text-amber-300 shrink-0 flex items-center gap-0.5">
                            <span>पठन</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Sacred Verses (पदावली व स्तोत्र - Spacious Rows) */}
              {displayedPadas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 pb-0.5">
                    <span className="text-xs sm:text-[13px] font-mono font-medium tracking-wider text-amber-900/80 dark:text-amber-400/80 uppercase">
                      पदावली व स्तोत्र ({activeFilter === 'all' ? displayedPadas.length : searchedPadas.length})
                    </span>
                    {activeFilter === 'all' && searchedPadas.length > displayedPadas.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('padas');
                          setSelectedIdx(0);
                        }}
                        className="text-xs sm:text-[13px] text-amber-800 hover:text-amber-950 dark:text-amber-400 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedPadas.length} पद देखें →
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {displayedPadas.map((pad, idx) => {
                      const globalIdx =
                        searchedSacredSections.length +
                        displayedSaints.length +
                        displayedGranthas.length +
                        idx;
                      const isSelected = selectedIdx === globalIdx;
                      const { title: cleanTitle, padHint, granthaHint } = extractPurePadaTitle(pad.titleDevanagari);
                      const portrait = getSaintPortrait({ name: pad.author });

                      return (
                        <div
                          key={pad.id}
                          onClick={() => {
                            navigationProgress.start();
                            onSelectPad(pad);
                            onClose();
                            requestAnimationFrame(() => navigationProgress.done());
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`group flex items-center justify-between gap-3.5 px-4 py-3 rounded-[12px] transition-all duration-120 cursor-pointer select-none border min-h-[58px] sm:min-h-[62px] ${
                            isSelected
                              ? 'bg-amber-500/[0.08] dark:bg-amber-400/[0.10] border-amber-400/80 dark:border-amber-500/70 text-stone-900 dark:text-stone-100 shadow-2xs'
                              : 'bg-transparent border-transparent hover:bg-stone-50 dark:hover:bg-stone-850/60 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-amber-200/50 shadow-2xs bg-amber-50 flex items-center justify-center">
                              <img
                                src={portrait}
                                alt={pad.author}
                                className="w-full h-full object-cover object-top"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-medium text-[15px] sm:text-[16.5px] text-stone-850 dark:text-stone-100 truncate leading-snug group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                                {cleanTitle}
                              </h4>
                              <div className="flex items-center gap-2 text-xs sm:text-[13px] text-stone-500 dark:text-stone-400 font-sans leading-none mt-1 truncate">
                                <span className="font-medium text-stone-600 dark:text-stone-300">
                                  {cleanSacredString(pad.author)}
                                </span>
                                {(granthaHint || padHint) && (
                                  <>
                                    <span className="text-stone-300 dark:text-stone-600">•</span>
                                    <span className="text-stone-500 dark:text-stone-400 font-serif">
                                      {[granthaHint, padHint].filter(Boolean).join(' ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {pad.rag && (
                              <span className="text-xs sm:text-[12.5px] font-serif text-amber-850 dark:text-amber-300 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/40 dark:border-amber-800/40">
                                राग {cleanSacredString(pad.rag)}
                              </span>
                            )}

                            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-serif text-stone-400 dark:text-stone-500 group-hover:text-amber-800 dark:group-hover:text-amber-300 px-2.5 py-1 rounded-[6px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-700 transition-colors">
                              <span>पठन</span>
                              <CornerDownLeft className="w-3 h-3 opacity-60" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Minimalist Command-K Footer (Spacious & Refined) */}
        <div className="px-5 sm:px-8 py-3 sm:py-3.5 bg-stone-50/80 dark:bg-[#161412] border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs sm:text-[12.5px] text-stone-400 dark:text-stone-500 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] shrink-0">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="font-mono bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 px-1.5 py-0.5 rounded text-[11px] text-stone-600 dark:text-stone-400">↑↓</kbd>
              नेविगेट
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="font-mono bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 px-2 py-0.5 rounded text-[11px] text-stone-600 dark:text-stone-400">↵</kbd>
              चयन
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="font-mono bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 px-2 py-0.5 rounded text-[11px] text-stone-600 dark:text-stone-400">Tab</kbd>
              दायरा बदलें
            </span>
          </div>

          <span className="sm:hidden text-xs text-stone-400 dark:text-stone-500">
            टैप कर पद पढ़ें
          </span>

          <div className="flex items-center gap-2 font-serif text-xs sm:text-[13px] text-amber-900/70 dark:text-amber-400/70 ml-auto font-medium">
            <span>श्री राधा • श्री हरिवंश</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
