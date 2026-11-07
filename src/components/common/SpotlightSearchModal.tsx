import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, BookOpen, Music } from 'lucide-react';
import { SacredDatabase, CanonicalSaint, CanonicalGrantha } from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';

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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
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

  // Update Sliding Pill Position with Elastic Spring Transition
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
      className={`fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/50 backdrop-blur-sm transition-opacity select-none ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      <div
        className={`w-full max-w-2xl bg-white border border-neutral-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden flex flex-col max-h-[80vh] ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Minimalist Search Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-neutral-100 bg-white">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें: पद, संत, ग्रन्थ, राग या भाव..."
            className="flex-1 bg-transparent text-sm sm:text-base font-normal text-[#18181B] placeholder-neutral-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              title="साफ़ करें"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* 2. Balanced High-Impact Scope Filter Bar with Elastic Sliding Pill */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-neutral-150 bg-[#FAF9F6] flex items-center justify-between gap-3">
          {/* Left: Tactile Segmented Scope Track */}
          <div className="relative inline-flex items-center p-1 bg-neutral-200/70 rounded-full border border-neutral-300/40">
            {filterPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-sm pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
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
                  className={`relative z-10 px-3 sm:px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive ? 'text-white font-bold' : 'text-neutral-700 hover:text-[#18181B]'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full leading-none transition-colors ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Contextual Result Counter & Keyboard Guide */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-bold text-[#18181B] font-mono">
              {totalResults} परिणाम
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 bg-white border border-neutral-200/80 px-2 py-0.5 rounded-full shadow-2xs select-none">
              <kbd className="font-bold text-[10px] text-[#18181B]">Tab ⇥</kbd> फ़िल्टर
            </span>
          </div>
        </div>

        {/* 3. Zen Minimalist Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scroll">
          {totalResults === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-sm font-medium text-neutral-600">कोई परिणाम नहीं मिला</p>
              <p className="text-xs text-neutral-400 mt-1">कृपया कोई अन्य शब्द या संत खोजें</p>
            </div>
          ) : (
            <>
              {/* SECTION: Granthas */}
              {matchingGranthas.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    ग्रन्थ ({matchingGranthas.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {matchingGranthas.map((g, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <div
                          key={g.id}
                          onClick={() => {
                            onSelectGrantha?.(g);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-neutral-100 text-[#18181B]' : 'hover:bg-neutral-50 text-[#18181B]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 text-neutral-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold truncate">
                                {g.name}
                              </h4>
                              <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                                {g.count} पद
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {g.author}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Saints */}
              {matchingSaints.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    रसिक संत ({matchingSaints.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
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
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-neutral-100 text-[#18181B]' : 'hover:bg-neutral-50 text-[#18181B]'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 text-[11px] font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold truncate">
                              {s.name}
                            </h4>
                            <span className="text-[10px] text-neutral-400 truncate block">
                              {s.tradition} • {s.articleCount} पद
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: Sacred Verses */}
              {matchingPadas.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    पदावली व स्तोत्र ({matchingPadas.length})
                  </div>
                  <div className="space-y-0.5">
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
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-neutral-100 text-[#18181B]' : 'hover:bg-neutral-50 text-[#18181B]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <Music className="w-4 h-4 text-neutral-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-semibold truncate">
                                  {pad.titleDevanagari}
                                </h4>
                                {pad.rag && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium shrink-0">
                                    {pad.rag}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                <span>{pad.author}</span>
                                {pad.verses[0]?.linesDevanagari[0] && (
                                  <span className="italic text-neutral-400 ml-1">
                                    — "{pad.verses[0].linesDevanagari[0]}"
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-neutral-400 shrink-0 hidden sm:inline">
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

        {/* 4. Zen Minimalist Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#FAF9F6] border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 select-none">
          <span className="text-[11px] text-neutral-400">वृन्दोपनिषद् 2.0 • अगाध निकुंज रस</span>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <span>↑↓ चयन</span>
            <span>•</span>
            <span>↵ खोलें</span>
            <span>•</span>
            <span>ESC बंद</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
