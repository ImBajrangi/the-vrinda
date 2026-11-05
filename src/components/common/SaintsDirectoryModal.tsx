import React, { useState } from 'react';
import { X, Search, BookOpen, ChevronRight } from 'lucide-react';
import { SacredDatabase, CanonicalSaint } from '../../services/sacredDatabase';

interface SaintsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSaint: (saint: CanonicalSaint) => void;
}

export const SaintsDirectoryModal: React.FC<SaintsDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSaint,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('all');
  const [expandedSaintId, setExpandedSaintId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allSaints = SacredDatabase.getAllSaints(selectedTradition);
  const filtered = query.trim()
    ? allSaints.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.nameEng.toLowerCase().includes(query.toLowerCase()) ||
          s.biography.toLowerCase().includes(query.toLowerCase())
      )
    : allSaints;

  const traditions = [
    { id: 'all', label: 'सभी संत (131)' },
    { id: 'राधावल्लभ', label: 'राधावल्लभ संप्रदाय' },
    { id: 'हरिदासी', label: 'स्वामी हरिदासी' },
    { id: 'अष्टछाप', label: 'अष्टछाप महाकवि' },
    { id: 'निम्बार्क', label: 'निम्बार्क परंपरा' },
    { id: 'रसिक परम्परा', label: 'अन्य रसिक' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-md transition-all apple-view-enter"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.18)] rounded-[32px] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-black/[0.06] dark:border-white/10">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B84A28] block">
              RASIK PARAMPARA DIRECTORY
            </span>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#111111] dark:text-white">
              श्री वृन्दावन रसिक संत नामावली
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#555555] hover:text-black dark:text-slate-300 dark:hover:text-white pressable"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tradition Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/5 space-y-3 bg-black/[0.01]">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="संत का नाम या परंपरा खोजें..."
              className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-[#111111] dark:text-white placeholder-slate-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                साफ़ करें
              </button>
            )}
          </div>

          {/* Traditions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {traditions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTradition(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all pressable ${
                  selectedTradition === t.id
                    ? 'bg-[#14213D] dark:bg-white text-white dark:text-[#14213D] shadow-xs'
                    : 'bg-black/[0.04] dark:bg-white/[0.05] text-[#555555] dark:text-slate-300 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Saints Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((s) => {
              const isExpanded = expandedSaintId === s.id;
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-[22px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#15803D] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {s.tradition}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.articleCount} पद संकलित
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#111111] dark:text-white">
                      {s.name}
                    </h4>
                    {s.nameEng && (
                      <span className="text-[10px] text-slate-400 font-sans block mb-2">
                        {s.nameEng}
                      </span>
                    )}

                    <p
                      className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {s.biography}
                    </p>

                    {s.biography && s.biography.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setExpandedSaintId(isExpanded ? null : s.id)}
                        className="text-[11px] font-semibold text-[#B84A28] mt-1 hover:underline block"
                      >
                        {isExpanded ? 'कम दिखाएं' : 'चरित्र पढ़ें...'}
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSaint(s);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-full bg-[#14213D] dark:bg-white text-white dark:text-[#14213D] text-[11px] font-bold pressable flex items-center gap-1 shadow-xs"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>वाणी पद पढ़ें</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-black/[0.03] dark:bg-white/[0.03] border-t border-black/[0.05] dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>कुल {filtered.length} संत उपलब्ध</span>
          <span className="font-semibold text-[#B84A28]">श्री हरिवंश • श्री हरिदास</span>
        </div>
      </div>
    </div>
  );
};
