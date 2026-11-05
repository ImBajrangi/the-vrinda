import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Music, Sparkles, ChevronRight, ArrowUpRight } from 'lucide-react';
import { SacredDatabase, CanonicalSaint, CanonicalGrantha } from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'padas' | 'saints' | 'granthas'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search Results
  const matchingPadas = (activeFilter === 'all' || activeFilter === 'padas')
    ? SacredDatabase.search(query, 12)
    : [];

  const allSaints = SacredDatabase.getAllSaints();
  const matchingSaints = (activeFilter === 'all' || activeFilter === 'saints')
    ? (query.trim()
        ? allSaints.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.nameEng.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
        : allSaints.slice(0, 6))
    : [];

  const allGranthas = SacredDatabase.getAllGranthas();
  const matchingGranthas = (activeFilter === 'all' || activeFilter === 'granthas')
    ? (query.trim()
        ? allGranthas.filter(g => g.name.toLowerCase().includes(query.toLowerCase()) || g.author.toLowerCase().includes(query.toLowerCase()))
        : allGranthas.slice(0, 4))
    : [];

  const totalResults = matchingPadas.length + matchingSaints.length + matchingGranthas.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 bg-black/40 backdrop-blur-md transition-all apple-view-enter"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.06)] rounded-[28px] overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-black/[0.06] dark:border-white/10">
          <Search className="w-5 h-5 text-[#B84A28] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="खोजें: पद, संत, ग्रन्थ, राग या भाव..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-[#111111] dark:text-white placeholder-[#888888] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#666666] pressable-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-400 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5">
            ESC
          </kbd>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'सभी' },
            { id: 'padas', label: `पद (${matchingPadas.length})` },
            { id: 'saints', label: `संत (${matchingSaints.length})` },
            { id: 'granthas', label: `ग्रन्थ (${matchingGranthas.length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all pressable ${
                activeFilter === f.id
                  ? 'bg-[#14213D] dark:bg-white text-white dark:text-[#14213D] shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.05] text-[#555555] dark:text-slate-300 hover:text-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scroll">
          {totalResults === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#D4A359] opacity-60" />
              <p className="text-sm font-medium">कोई परिणाम नहीं मिला।</p>
              <p className="text-xs text-slate-500 mt-1">कृपया कोई अन्य शब्द या संत का नाम खोजें।</p>
            </div>
          ) : (
            <>
              {/* Granthas Section */}
              {matchingGranthas.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B84A28] block mb-2">
                    पावन ग्रन्थ संग्रह
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingGranthas.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => {
                          onSelectGrantha?.(g);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/5 dark:border-white/5 cursor-pointer pressable"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#B84A28] shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#111111] dark:text-white truncate">
                              {g.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 truncate block">
                              {g.author} • {g.count} पद
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saints Section */}
              {matchingSaints.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#15803D] block mb-2">
                    रसिक संत परंपरा
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {matchingSaints.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectSaint?.(s);
                          onClose();
                        }}
                        className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/5 dark:border-white/5 cursor-pointer pressable"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#15803D] shrink-0 text-xs">
                          🪷
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#111111] dark:text-white truncate">
                            {s.name}
                          </h4>
                          <span className="text-[9px] text-slate-500 truncate block">
                            {s.tradition} • {s.articleCount} पद
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Padas Section */}
              {matchingPadas.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    पावन पदावली व स्तोत्र ({matchingPadas.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchingPadas.map((pad) => (
                      <div
                        key={pad.id}
                        onClick={() => {
                          onSelectPad(pad);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/5 dark:border-white/5 cursor-pointer pressable group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#14213D] text-white flex items-center justify-center shrink-0">
                            <Music className="w-3.5 h-3.5 text-[#B6FF2E]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#111111] dark:text-white truncate group-hover:text-[#B84A28] transition-colors">
                              {pad.titleDevanagari}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {pad.author} • <span className="text-[#B84A28] font-medium">{pad.rag}</span>
                              {pad.verses[0]?.linesDevanagari[0] && (
                                <span className="hidden sm:inline text-slate-400">
                                  {' — '}
                                  "{pad.verses[0].linesDevanagari[0]}"
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-xs font-semibold text-slate-500">
                          <span className="hidden sm:inline text-[11px]">पठन</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] border-t border-black/[0.05] dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span>{totalResults} परिणाम उपलब्ध</span>
          <span className="hidden sm:inline">वृन्दोपनिषद् 2.0 • अगाध निकुंज रस</span>
        </div>
      </div>
    </div>
  );
};
