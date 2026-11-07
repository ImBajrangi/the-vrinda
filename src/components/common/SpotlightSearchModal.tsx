import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, BookOpen, Music, Sparkles, ChevronRight, ArrowUpRight } from 'lucide-react';
import { SacredDatabase, CanonicalSaint, CanonicalGrantha } from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';

/**
 * Authentic Devotional Sacred Lotus Icon for Rasik Parampara
 */
const SacredLotusIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 3C12 3 8 9 8 14C8 17.5 10 20 12 21C14 20 16 17.5 16 14C16 9 12 3 12 3Z"
      fill="#A855F7"
      fillOpacity="0.25"
      stroke="#7C3AED"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12 21C8 20 4 16 4 12C4 9.5 6 7 8 7C8 10 10 15 12 21Z"
      fill="#EC4899"
      fillOpacity="0.2"
      stroke="#DB2777"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M12 21C16 20 20 16 20 12C20 9.5 18 7 16 7C16 10 14 15 12 21Z"
      fill="#EC4899"
      fillOpacity="0.2"
      stroke="#DB2777"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="14" r="1.5" fill="#F59E0B" />
  </svg>
);

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
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Filter Indicator Pill State with Elastic Spring Physics
  const filterRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [filterPillStyle, setFilterPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  // Modal Lifecycle & Focus
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
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

  // Compute Search Results
  const matchingPadas = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'padas') return [];
    return SacredDatabase.search(query, 12);
  }, [query, activeFilter]);

  const matchingSaints = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'saints') return [];
    const allSaints = SacredDatabase.getAllSaints();
    if (!query.trim()) return allSaints.slice(0, 6);
    const q = query.toLowerCase();
    return allSaints
      .filter((s) => s.name.toLowerCase().includes(q) || s.nameEng.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, activeFilter]);

  const matchingGranthas = useMemo(() => {
    if (activeFilter !== 'all' && activeFilter !== 'granthas') return [];
    const allGranthas = SacredDatabase.getAllGranthas();
    if (!query.trim()) return allGranthas.slice(0, 4);
    const q = query.toLowerCase();
    return allGranthas
      .filter((g) => g.name.toLowerCase().includes(q) || g.author.toLowerCase().includes(q))
      .slice(0, 4);
  }, [query, activeFilter]);

  const totalResults = matchingGranthas.length + matchingSaints.length + matchingPadas.length;

  // Flattened items list for index-based keyboard navigation
  const combinedResults = useMemo<CombinedItem[]>(() => {
    return [
      ...matchingGranthas.map((g) => ({ type: 'grantha' as const, data: g })),
      ...matchingSaints.map((s) => ({ type: 'saint' as const, data: s })),
      ...matchingPadas.map((p) => ({ type: 'pad' as const, data: p })),
    ];
  }, [matchingGranthas, matchingSaints, matchingPadas]);

  // Reset keyboard selected index when query or filter changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [query, activeFilter]);

  // Global Keyboard Navigation (Esc, Up/Down, Enter, Tab)
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
            if (target.type === 'grantha') {
              onSelectGrantha?.(target.data);
            } else if (target.type === 'saint') {
              onSelectSaint?.(target.data);
            } else if (target.type === 'pad') {
              onSelectPad(target.data);
            }
            onClose();
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

  // Synchronize Elastic Sliding Pill on Filter Track
  useEffect(() => {
    if (!isRendered) return;
    const el = filterRefs.current[activeFilter];
    if (el) {
      setFilterPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [activeFilter, isRendered, matchingPadas.length, matchingSaints.length, matchingGranthas.length]);

  if (!isRendered || typeof document === 'undefined') return null;

  const filterTabs: { id: SearchFilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'सभी' },
    { id: 'padas', label: 'पद', count: matchingPadas.length },
    { id: 'saints', label: 'संत', count: matchingSaints.length },
    { id: 'granthas', label: 'ग्रन्थ', count: matchingGranthas.length },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/65 backdrop-blur-md transition-opacity select-none ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      <div
        className={`w-full max-w-2xl bg-white border border-neutral-200/90 shadow-[0_24px_70px_rgba(0,0,0,0.22)] rounded-[28px] overflow-hidden flex flex-col max-h-[82vh] ring-1 ring-black/5 ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 bg-white">
          <div className="w-8 h-8 rounded-full bg-purple-50/80 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
            <Search className="w-4 h-4 stroke-[2.2]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें: पद, संत, ग्रन्थ, राग या भाव..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-[#18181B] placeholder-[#A1A1AA] outline-none tracking-tight"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
              title="खोज साफ़ करें"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[#71717A] bg-neutral-100 border border-neutral-200/80 shadow-2xs select-none">
            ESC
          </kbd>
        </div>

        {/* 2. Porcelain Segmented Filter Track with Elastic Bouncy Pill */}
        <div className="px-5 py-2.5 bg-[#FAF9F6] border-b border-neutral-150 flex items-center justify-between gap-3 select-none overflow-x-auto no-scrollbar">
          <div className="relative inline-flex items-center p-1 bg-[#F0EFEB] rounded-full border border-neutral-200/80 shadow-2xs">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            {filterPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                style={{
                  transform: `translateX(${filterPillStyle.left}px)`,
                  width: `${filterPillStyle.width}px`,
                  left: 0,
                }}
              />
            )}

            {filterTabs.map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  ref={(el) => {
                    filterRefs.current[f.id] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setActiveFilter(f.id);
                    setSelectedIdx(0);
                  }}
                  className={`relative z-10 px-3.5 py-1 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200/80 text-[#71717A]'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scope Cycle Shortcut Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#A1A1AA] font-mono shrink-0">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 text-[10px] text-[#71717A] shadow-2xs font-semibold">
              Tab ⇥
            </kbd>
            <span>फ़िल्टर</span>
          </div>
        </div>

        {/* 3. Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scroll">
          {totalResults === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Sparkles className="w-9 h-9 mx-auto mb-2 text-[#D4A359] opacity-75" />
              <p className="text-sm font-semibold text-[#18181B]">कोई परिणाम नहीं मिला।</p>
              <p className="text-xs text-[#71717A] mt-1">
                कृपया कोई अन्य पद, संत का नाम या राग खोजें।
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: Sacred Granthas */}
              {matchingGranthas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[11px] font-bold text-[#18181B] uppercase tracking-wider font-mono">
                        पावन ग्रन्थ संग्रह
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A1AA] bg-neutral-100 px-2 py-0.5 rounded-full">
                      {matchingGranthas.length} ग्रन्थ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchingGranthas.map((g, idx) => {
                      const globalIdx = idx;
                      const isSelected = selectedIdx === globalIdx;
                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            onSelectGrantha?.(g);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer group select-none ${
                            isSelected
                              ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-400/40'
                              : 'bg-[#FAF9F6] hover:bg-white border-neutral-200/70 hover:border-neutral-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                              <BookOpen className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-[13px] font-bold text-[#18181B] group-hover:text-amber-800 transition-colors truncate">
                                {g.name}
                              </h4>
                              <span className="text-[10px] sm:text-[11px] text-[#71717A] truncate block mt-0.5">
                                {g.author} • <span className="font-mono">{g.count} पद</span>
                              </span>
                            </div>
                          </div>

                          <span
                            className={`w-7 h-7 rounded-xl border flex items-center justify-center shadow-2xs transition-all shrink-0 ${
                              isSelected
                                ? 'bg-[#18181B] border-[#18181B] text-white'
                                : 'bg-white border-neutral-200/80 text-[#71717A] group-hover:bg-[#18181B] group-hover:border-[#18181B] group-hover:text-white'
                            }`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Rasik Saints */}
              {matchingSaints.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-[11px] font-bold text-[#18181B] uppercase tracking-wider font-mono">
                        रसिक संत परंपरा
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A1AA] bg-neutral-100 px-2 py-0.5 rounded-full">
                      {matchingSaints.length} संत
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {matchingSaints.map((s, idx) => {
                      const globalIdx = matchingGranthas.length + idx;
                      const isSelected = selectedIdx === globalIdx;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSelectSaint?.(s);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-colors cursor-pointer group select-none ${
                            isSelected
                              ? 'bg-purple-50/70 border-purple-300 shadow-xs ring-1 ring-purple-400/40'
                              : 'bg-[#FAF9F6] hover:bg-white border-neutral-200/70 hover:border-neutral-300 shadow-2xs'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                            <SacredLotusIcon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-[13px] font-bold text-[#18181B] group-hover:text-purple-700 transition-colors truncate">
                              {s.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[9px] font-semibold text-purple-700 bg-purple-50/80 px-1.5 py-0.2 rounded-md">
                                {s.tradition}
                              </span>
                              <span className="text-[9px] text-[#71717A] font-mono">
                                • {s.articleCount} पद
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: Sacred Verses & Padas */}
              {matchingPadas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[11px] font-bold text-[#18181B] uppercase tracking-wider font-mono">
                        पावन पदावली व स्तोत्र
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A1A1AA] bg-neutral-100 px-2 py-0.5 rounded-full">
                      {matchingPadas.length} पद
                    </span>
                  </div>

                  <div className="space-y-2">
                    {matchingPadas.map((pad, idx) => {
                      const globalIdx = matchingGranthas.length + matchingSaints.length + idx;
                      const isSelected = selectedIdx === globalIdx;
                      return (
                        <div
                          key={pad.id}
                          onClick={() => {
                            onSelectPad(pad);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer group select-none ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-300 shadow-xs ring-1 ring-emerald-400/40'
                              : 'bg-[#FAF9F6] hover:bg-white border-neutral-200/70 hover:border-neutral-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
                              <Music className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#18181B] group-hover:text-purple-700 transition-colors truncate">
                                {pad.titleDevanagari}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#71717A] mt-0.5 truncate">
                                <span className="truncate max-w-[180px] sm:max-w-xs font-medium">
                                  {pad.author}
                                </span>
                                {pad.rag && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 font-semibold shrink-0">
                                    {pad.rag}
                                  </span>
                                )}
                                {pad.verses[0]?.linesDevanagari[0] && (
                                  <span className="hidden sm:inline italic text-neutral-400 truncate font-serif">
                                    — "{pad.verses[0].linesDevanagari[0]}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs transition-all shrink-0 ${
                              isSelected
                                ? 'bg-[#18181B] border-[#18181B] text-white'
                                : 'bg-white border-neutral-200/80 text-[#71717A] group-hover:bg-[#18181B] group-hover:border-[#18181B] group-hover:text-white'
                            }`}
                          >
                            <span>पठन</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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

        {/* 4. Modal Footer with Keyboard Cheatsheet */}
        <div className="px-5 py-2.5 bg-[#FAF9F6] border-t border-neutral-150 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-[#18181B]">{totalResults} परिणाम उपलब्ध</span>
            <span className="text-neutral-300">•</span>
            <span className="text-[#71717A] hidden sm:inline">वृन्दोपनिषद् 2.0 • अगाध निकुंज रस</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#71717A]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 shadow-2xs font-bold text-[9px] text-[#18181B]">
                ↑↓
              </kbd>{' '}
              नेविगेट
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 shadow-2xs font-bold text-[9px] text-[#18181B]">
                ↵
              </kbd>{' '}
              खोलें
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 shadow-2xs font-bold text-[9px] text-[#18181B]">
                Tab
              </kbd>{' '}
              फ़िल्टर
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 shadow-2xs font-bold text-[9px] text-[#18181B]">
                ESC
              </kbd>{' '}
              बंद
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
