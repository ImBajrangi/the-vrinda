import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Music } from 'lucide-react';
import { SacredDatabase, CanonicalSaint, CanonicalGrantha, cleanSacredString } from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';
import { getSaintPortrait, getBookCoverConfig } from '../../services/devotionalVisuals';
import { IOSSpinner, navigationProgress } from './IOSActivityIndicator';

export type SearchFilterType = 'all' | 'padas' | 'saints' | 'granthas';

type CombinedItem =
  | { type: 'grantha'; data: CanonicalGrantha }
  | { type: 'saint'; data: CanonicalSaint }
  | { type: 'pad'; data: SacredPad };

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPad: (pad: SacredPad) => void;
  onSelectSaint?: (saint: CanonicalSaint) => void;
  onSelectGrantha?: (grantha: CanonicalGrantha) => void;
}

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

  // 300ms Debounce to prevent unnecessary filtering operations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Query Supabase remote backup server database in background for complete coverage
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      SacredDatabase.searchRemote(debouncedQuery).catch(() => {});
    }
  }, [debouncedQuery]);

  // Lazy-load complete search catalog on first modal open using immutable content-hashed URL
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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (isRendered) {
      setIsClosing(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, 240);
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

  // Stable Query-Level Search Results (Facet counts depend ONLY on query & DB, NEVER on activeFilter)
  const searchedPadas = useMemo(() => {
    return SacredDatabase.search(debouncedQuery, debouncedQuery.trim() ? 50 : 24);
  }, [debouncedQuery, dbVersion]);

  const searchedSaints = useMemo(() => {
    const allSaints = SacredDatabase.getAllSaints();
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allSaints.slice(0, 24);
    return allSaints.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.nameEng && s.nameEng.toLowerCase().includes(q))
    );
  }, [debouncedQuery]);

  const searchedGranthas = useMemo(() => {
    const allGranthas = SacredDatabase.getAllGranthas();
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allGranthas;
    return allGranthas.filter(
      (g) => g.name.toLowerCase().includes(q) || (g.author && g.author.toLowerCase().includes(q))
    );
  }, [debouncedQuery]);

  const totalResults = searchedGranthas.length + searchedSaints.length + searchedPadas.length;

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

  // Flattened items list for index-based keyboard navigation matching visual order:
  // Visual order: Saints -> Granthas -> Padas
  const combinedResults = useMemo<CombinedItem[]>(() => {
    return [
      ...displayedSaints.map((s) => ({ type: 'saint' as const, data: s })),
      ...displayedGranthas.map((g) => ({ type: 'grantha' as const, data: g })),
      ...displayedPadas.map((p) => ({ type: 'pad' as const, data: p })),
    ];
  }, [displayedSaints, displayedGranthas, displayedPadas]);

  // Reset keyboard index on query/filter change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query, activeFilter]);

  // Keyboard Shortcuts (Esc, ArrowDown, ArrowUp, Enter, Tab)
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
            } else if (target.type === 'saint') {
              onSelectSaint?.(target.data);
            } else if (target.type === 'pad') {
              onSelectPad(target.data);
            }
            onClose();
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

  const filterTabs: { id: SearchFilterType; label: string; mobileLabel: string; count: number }[] = [
    { id: 'all', label: 'सभी', mobileLabel: 'सभी', count: totalResults },
    { id: 'padas', label: 'पदावली', mobileLabel: 'पद', count: searchedPadas.length },
    { id: 'saints', label: 'रसिक संत', mobileLabel: 'संत', count: searchedSaints.length },
    { id: 'granthas', label: 'पावन ग्रन्थ', mobileLabel: 'ग्रन्थ', count: searchedGranthas.length },
  ];

  const hasVisibleResults = displayedSaints.length > 0 || displayedGranthas.length > 0 || displayedPadas.length > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 bg-black/40 transition-opacity select-none ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      <div
        className={`w-full max-w-3xl bg-white rounded-[28px] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.28)] ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Minimalist Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 pb-2 bg-white">
          <Search className="w-5 h-5 text-amber-700/80 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें: पद, संत, ग्रन्थ, राग या भाव..."
            className="flex-1 bg-transparent text-sm sm:text-base font-normal text-[#18181B] placeholder-neutral-400 outline-none"
          />
          {query !== debouncedQuery && (
            <IOSSpinner size="xs" theme="amber" className="shrink-0" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              title="साफ़ करें"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* 2. Full-Width Segmented Scope Bar (Clean, Outline-Free) */}
        <div className="px-4 sm:px-6 pt-1 pb-3 bg-white">
          <div className="relative w-full grid grid-cols-4 p-1 bg-[#F5F2EB] rounded-full">
            {/* Dynamic Elastic Sliding Pill */}
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] shadow-xs pointer-events-none transition-transform duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
              style={{
                width: 'calc((100% - 8px) / 4)',
                left: '4px',
                transform: `translate3d(${activeFilterIdx * 100}%, 0, 0)`,
              }}
            />

            {filterTabs.map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(f.id);
                    setSelectedIdx(0);
                  }}
                  className={`relative z-10 py-1.5 px-1.5 sm:px-2 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1 select-none ${
                    isActive ? 'text-[#18181B] font-bold' : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  <span className="hidden sm:inline truncate">{f.label}</span>
                  <span className="sm:hidden truncate">{f.mobileLabel}</span>
                  <span className="text-[11px] font-mono opacity-55">
                    ({f.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Picture-Focused Scrollable Results Grid (Outline-Free & Tag-Free) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-6 custom-scroll bg-white">
          {!hasVisibleResults ? (
            <div className="text-center py-14 text-neutral-400">
              <p className="text-base font-serif font-semibold text-neutral-700">कोई परिणाम नहीं मिला</p>
              <p className="text-xs text-neutral-400 mt-1">कृपया कोई अन्य शब्द, संत या ग्रन्थ का नाम खोजें</p>
            </div>
          ) : (
            <>
              {/* SECTION: Saints (रसिक संत) - Elevated Circular Medallion Portraits */}
              {displayedSaints.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-amber-900 uppercase">
                      रसिक संत ({activeFilter === 'all' ? displayedSaints.length : searchedSaints.length})
                    </span>
                    {activeFilter === 'all' && searchedSaints.length > displayedSaints.length ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('saints');
                          setSelectedIdx(0);
                        }}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedSaints.length} संत देखें →
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-serif hidden sm:inline">
                        श्री वृन्दावन रसिक परंपरा
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {displayedSaints.map((s, idx) => {
                      const globalIdx = idx;
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
                          className={`group flex items-center gap-3.5 p-3 rounded-[20px] transition-colors duration-150 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#EFEAE0] text-[#18181B]'
                              : 'bg-[#F8F6F1] hover:bg-[#EFEAE0] text-[#18181B]'
                          }`}
                        >
                          {/* Elevated Circular Portrait Medallion (Unobstructed & Revered) */}
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-amber-100/50">
                            <img
                              src={portrait}
                              alt={s.name}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          </div>

                          {/* Clean, Direct Typography Stack (No Pill Tags) */}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] text-amber-800 font-medium leading-none mb-1">
                              {s.tradition} • {s.articleCount} पद
                            </div>
                            <h4 className="font-serif font-bold text-sm sm:text-[15px] text-[#18181B] group-hover:text-amber-950 transition-colors truncate leading-tight">
                              {s.name}
                            </h4>
                            {s.nameEng && (
                              <p className="text-[11px] text-neutral-400 font-sans truncate mt-0.5 capitalize">
                                {s.nameEng}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Granthas (पावन ग्रन्थ) - Proportional 3D Pothi Book Covers */}
              {displayedGranthas.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-amber-900 uppercase">
                      पावन ग्रन्थ ({activeFilter === 'all' ? displayedGranthas.length : searchedGranthas.length})
                    </span>
                    {activeFilter === 'all' && searchedGranthas.length > displayedGranthas.length ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('granthas');
                          setSelectedIdx(0);
                        }}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedGranthas.length} ग्रन्थ देखें →
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-serif hidden sm:inline">
                        मूल वाणी संग्रह
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedGranthas.map((g, idx) => {
                      const globalIdx = displayedSaints.length + idx;
                      const isSelected = selectedIdx === globalIdx;
                      const cover = getBookCoverConfig(g.id, g.name);
                      const shortTitle = g.name
                        .replace(/जी की वाणी/g, '')
                        .replace(/वाणी/g, '')
                        .replace(/ग्रन्थ/g, '')
                        .trim();

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
                          className={`group flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-[22px] transition-colors duration-150 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#EFEAE0] text-[#18181B]'
                              : 'bg-[#F8F6F1] hover:bg-[#EFEAE0] text-[#18181B]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Proportional 3D Sacred Pothi Book Cover */}
                            <div className="shrink-0 select-none">
                              <div
                                className="sacred-book-pothi w-[60px] h-[86px] text-white"
                                style={{ background: cover.bg, borderRadius: '4px 9px 9px 4px' }}
                              >
                                <div className="spine-groove" />

                                {cover.style === 'pure-leather' ? (
                                  <div className="book-pure-leather-inner">
                                    <div className="text-[7.5px] text-amber-300/70 font-bold leading-none tracking-widest flex items-center gap-1 shrink-0">
                                      <span className="w-1.5 h-px bg-amber-300/30" />
                                      <span>ॐ</span>
                                      <span className="w-1.5 h-px bg-amber-300/30" />
                                    </div>
                                    <div className="flex-1 flex items-center justify-center w-full my-0.5 min-h-0">
                                      <span className="font-rozha text-[10px] sm:text-[10.5px] font-bold line-clamp-3 text-center leading-[1.15] tracking-wide px-0.5 gold-foil-title">
                                        {shortTitle}
                                      </span>
                                    </div>
                                    <div className="px-1.5 py-0.5 rounded-full bg-black/40 text-[7px] font-mono font-bold text-amber-200 tracking-wider whitespace-nowrap leading-none shrink-0 inline-flex items-center justify-center">
                                      {g.count} पद
                                    </div>
                                  </div>
                                ) : (
                                  <div className="book-gold-filigree" style={{ borderRadius: '2px 4px 4px 2px' }}>
                                    <div className="text-[7.5px] text-amber-200/70 font-bold leading-none tracking-widest flex items-center gap-1 shrink-0">
                                      <span className="w-1.5 h-px bg-amber-200/30" />
                                      <span>ॐ</span>
                                      <span className="w-1.5 h-px bg-amber-200/30" />
                                    </div>
                                    <div className="flex-1 flex items-center justify-center w-full my-0.5 min-h-0">
                                      <span className="font-rozha text-[10px] sm:text-[10.5px] font-bold line-clamp-3 text-center leading-[1.15] tracking-wide px-0.5 gold-foil-title">
                                        {shortTitle}
                                      </span>
                                    </div>
                                    <span className="text-[7.5px] font-mono font-bold text-amber-300/90 tracking-wider whitespace-nowrap leading-none shrink-0">
                                      {g.count} पद
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Grantha Info (Direct Typography with Spiritual Essence) */}
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] text-amber-800 font-medium leading-none mb-1 truncate">
                                {g.author}
                              </div>
                              <h4 className="font-serif font-bold text-sm sm:text-base text-[#18181B] group-hover:text-amber-950 transition-colors truncate leading-tight">
                                {g.name}
                              </h4>
                              {g.description && (
                                <p className="text-[11px] text-neutral-500 font-sans line-clamp-1 mt-1 leading-snug">
                                  {g.description}
                                </p>
                              )}
                              <div className="text-[10.5px] font-mono text-neutral-400 mt-1">
                                {g.count} पद संकलित • मूल वाणी
                              </div>
                            </div>
                          </div>

                          {/* Right Affordance */}
                          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-800/80 group-hover:text-amber-950 transition-colors shrink-0 pl-1">
                            <span>वाणी पाठ</span>
                            <span className="text-sm leading-none">→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Sacred Verses (पदावली व स्तोत्र) - Outline-Free */}
              {displayedPadas.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-amber-900 uppercase">
                      पदावली व स्तोत्र ({activeFilter === 'all' ? displayedPadas.length : searchedPadas.length})
                    </span>
                    {activeFilter === 'all' && searchedPadas.length > displayedPadas.length ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('padas');
                          setSelectedIdx(0);
                        }}
                        className="text-[11px] text-amber-800 hover:text-amber-950 font-medium cursor-pointer transition-colors"
                      >
                        सभी {searchedPadas.length} पद देखें →
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-serif hidden sm:inline">
                        राग एवं भाव संगीत
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {displayedPadas.map((pad, idx) => {
                      const globalIdx = displayedSaints.length + displayedGranthas.length + idx;
                      const isSelected = selectedIdx === globalIdx;

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
                          className={`group flex items-center justify-between gap-3 p-3 rounded-[18px] transition-colors duration-150 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#EFEAE0] text-[#18181B]'
                              : 'bg-[#F8F6F1] hover:bg-[#EFEAE0] text-[#18181B]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-amber-200/60 flex items-center justify-center text-amber-900 shrink-0">
                              <Music className="w-4 h-4 text-amber-900" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <h4 className="font-serif font-bold text-sm text-[#18181B] truncate leading-tight group-hover:text-amber-950">
                                  {cleanSacredString(pad.titleDevanagari)}
                                </h4>
                                {pad.rag && (
                                  <span className="text-[11px] font-serif font-medium text-amber-800 shrink-0">
                                    राग {cleanSacredString(pad.rag)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11.5px] text-neutral-500 truncate mt-0.5 leading-snug">
                                <span className="font-medium text-neutral-700">{cleanSacredString(pad.author)}</span>
                                {pad.verses[0]?.linesDevanagari[0] && (
                                  <span className="italic text-neutral-400 ml-1.5">
                                    — "{cleanSacredString(pad.verses[0].linesDevanagari[0])}"
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11.5px] font-semibold text-amber-900 bg-amber-200/70 group-hover:bg-amber-300/80 px-3 py-1 rounded-full shrink-0 hidden sm:inline-flex items-center gap-1 transition-colors">
                            पढ़ें ↵
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Modal Footer (Outline-Free) */}
        <div className="px-4 sm:px-6 py-2.5 bg-white flex items-center justify-between text-[11px] text-neutral-400">
          <div className="hidden sm:flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-neutral-500 mr-1">↑</kbd>
              <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-neutral-500 mr-1">↓</kbd>
              नेविगेट
            </span>
            <span>
              <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-neutral-500 mr-1">↵</kbd>
              चुनें
            </span>
            <span>
              <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] text-neutral-500 mr-1">Tab</kbd>
              फ़िल्टर
            </span>
          </div>
          <span className="sm:hidden text-[11px] text-amber-800/80 font-medium">टैप कर वाणी पाठ करें</span>
          <span className="font-serif text-amber-900 font-semibold ml-auto">श्री राधा • श्री हरिवंश</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
