import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
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

  // Lock body scroll and close on Escape while modal is active
  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDismiss();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isRendered]);

  const traditionRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [traditionPillStyle, setTraditionPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    if (!isRendered) return;
    const el = traditionRefs.current[selectedTradition];
    if (el) {
      setTraditionPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [selectedTradition, isRendered]);

  const handleDismiss = () => {
    if (isClosing) return;
    onClose();
  };

  if (!isRendered) return null;
  if (typeof document === 'undefined') return null;

  const allSaints = SacredDatabase.getAllSaints(selectedTradition);
  const filtered = query.trim()
    ? allSaints.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.nameEng.toLowerCase().includes(query.toLowerCase()) ||
          s.biography.toLowerCase().includes(query.toLowerCase())
      )
    : allSaints;

  const traditions = SacredDatabase.getTraditions();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/45 transition-opacity ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      <div
        className={`w-full max-w-3xl bg-white rounded-[32px] overflow-hidden flex flex-col max-h-[88vh] ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-800 block">
              RASIK PARAMPARA DIRECTORY
            </span>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B]">
              श्री वृन्दावन रसिक संत नामावली
            </h3>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-neutral-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tradition Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 space-y-3 bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-neutral-200/80">
            <Search className="w-4 h-4 text-[#71717A] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="संत का नाम या परंपरा खोजें..."
              className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-[#18181B] placeholder-neutral-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-[#71717A] hover:text-[#18181B] font-medium cursor-pointer"
              >
                साफ़ करें
              </button>
            )}
          </div>

          {/* Traditions Chips with Elastic Sliding Pill */}
          <div className="relative flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-[#FAF6EE] rounded-full">
            {traditionPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width]"
                style={{
                  transform: `translate3d(${traditionPillStyle.left}px, 0, 0)`,
                  width: `${traditionPillStyle.width}px`,
                  left: 0,
                }}
              />
            )}

            {traditions.map((t) => {
              const isActive = selectedTradition === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    traditionRefs.current[t.id] = el;
                  }}
                  type="button"
                  onClick={() => setSelectedTradition(t.id)}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'text-[#18181B] font-bold'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Saints Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((s) => {
              const isExpanded = expandedSaintId === s.id;
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-[22px] bg-[#FAF9F6] flex flex-col justify-between transition-colors hover:bg-[#FEFCE8]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
                        {s.tradition}
                      </span>
                      <span className="text-[10px] text-[#71717A] font-mono">
                        {s.articleCount} पद संकलित
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#18181B]">
                      {s.name}
                    </h4>
                    {s.nameEng && (
                      <span className="text-[10px] text-[#71717A] font-sans block mb-2">
                        {s.nameEng}
                      </span>
                    )}

                    <p
                      className={`text-xs text-[#52525B] leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {s.biography}
                    </p>

                    {s.biography && s.biography.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setExpandedSaintId(isExpanded ? null : s.id)}
                        className="text-[11px] font-semibold text-amber-800 mt-1 hover:underline block cursor-pointer"
                      >
                        {isExpanded ? 'कम दिखाएं' : 'चरित्र पढ़ें...'}
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-200/50 mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSaint(s);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>वाणी पद पढ़ें</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#71717A]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-[#FAF9F6] border-t border-neutral-100 flex items-center justify-between text-xs text-[#71717A]">
          <span>कुल {filtered.length} संत उपलब्ध</span>
          <span className="font-semibold text-amber-800">श्री हरिवंश • श्री हरिदास</span>
        </div>
      </div>
    </div>,
    document.body
  );
};