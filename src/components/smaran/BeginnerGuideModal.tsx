import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Music2, BookOpen, Clock, Sparkles, ArrowRight, Compass } from 'lucide-react';

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChanting: () => void;
  onOpenPlayer?: () => void;
  onOpenReader?: () => void;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({
  isOpen,
  onClose,
  onStartChanting,
  onOpenPlayer,
  onOpenReader,
}) => {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSelectPillar = (type: 'japa' | 'shravan' | 'svadhyaya') => {
    onClose();
    if (type === 'japa') {
      onStartChanting();
    } else if (type === 'shravan') {
      if (onOpenPlayer) onOpenPlayer();
      else onStartChanting();
    } else if (type === 'svadhyaya') {
      if (onOpenReader) onOpenReader();
      else onStartChanting();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto no-scrollbar apple-sheet-enter text-[#18181B]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block font-mono">
                DAILY SADHANA PROTOCOL • नव साधक विधि
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#18181B] leading-tight">
                Beginner’s Guide to Daily Sanctuary
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#18181B] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Philosophy Banner */}
        <div className="p-4 sm:p-5 rounded-[22px] bg-[#FAF9F6] border border-neutral-200/70 mb-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5 text-amber-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#18181B]">
              सहज प्रेम उपासना — Simple, Loving & Consistent
            </h4>
            <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
              Vrindopnisad 2.0 is crafted for modern contemplative life — calm, focused, and distraction-free. You don’t need exhausting rituals: heartfelt daily chanting, sacred listening, and quiet canonical reading are all that matter.
            </p>
          </div>
        </div>

        {/* The 3 Pillars Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
            THE THREE SACRED PILLARS • नित्य साधन त्रिवेणी
          </span>
          <span className="text-[11px] text-amber-800 font-semibold font-mono">
            3 Daily Practices
          </span>
        </div>

        {/* The 3 Pillar Porcelain Cards */}
        <div className="space-y-3 mb-5">
          {/* Pillar 1: Naam Japa */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectPillar('japa')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectPillar('japa')}
            className="group w-full p-4 sm:p-5 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none text-left"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-[18px] bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-600 mt-0.5 sm:mt-0">
                <Flame className="w-5 h-5 fill-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono border border-amber-200/60">
                    PILLAR 01
                  </span>
                  <span className="text-xs font-semibold text-[#71717A] font-mono">
                    1 to 16 Malas Daily (१०८ मनके)
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#18181B] leading-snug">
                  1. नाम जप (Holy Name Meditation)
                </h4>
                <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                  Chant the sacred names of Priya-Priyatam. Use the interactive 108-bead counter on your dashboard for tactile focus and mental stillness.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 text-xs font-bold font-mono border border-amber-200/80 group-hover:bg-amber-100 transition-colors">
                Start Japa →
              </span>
            </div>
          </div>

          {/* Pillar 2: Pad Shravan */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectPillar('shravan')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectPillar('shravan')}
            className="group w-full p-4 sm:p-5 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none text-left"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-[18px] bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-700 mt-0.5 sm:mt-0">
                <Music2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono border border-amber-200/60">
                    PILLAR 02
                  </span>
                  <span className="text-xs font-semibold text-[#71717A] font-mono">
                    15 to 30 Mins Daily (अष्टयाम राग)
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#18181B] leading-snug">
                  2. पद श्रवण (Sacred Audio Listening)
                </h4>
                <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                  Listen to authentic Braj Dhrupad poetry set in classical morning, midday, and twilight ragas that quiet sensory agitation.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 text-xs font-bold font-mono border border-amber-200/80 group-hover:bg-amber-100 transition-colors">
                Listen Audio →
              </span>
            </div>
          </div>

          {/* Pillar 3: Grantha Svadhyaya */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectPillar('svadhyaya')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectPillar('svadhyaya')}
            className="group w-full p-4 sm:p-5 rounded-[22px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none text-left"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-[18px] bg-rose-50 border border-rose-200/60 flex items-center justify-center shrink-0 text-rose-600 mt-0.5 sm:mt-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full font-mono border border-rose-200/60">
                    PILLAR 03
                  </span>
                  <span className="text-xs font-semibold text-[#71717A] font-mono">
                    1 to 5 Verses Daily (वाणी अनुशीलन)
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#18181B] leading-snug">
                  3. ग्रंथ स्वाध्याय (Scripture Contemplation)
                </h4>
                <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                  Read canonical verses from Hit Chaurasi, Kelimal, and Radha Sudhanidhi with authenticated word-by-word purports.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-900 text-xs font-bold font-mono border border-rose-200/80 group-hover:bg-rose-100 transition-colors">
                Read Verses →
              </span>
            </div>
          </div>
        </div>

        {/* Daily Ashtayama Synchronization Note */}
        <div className="p-4 rounded-[20px] bg-[#FAF9F6] border border-neutral-200/70 flex items-start sm:items-center gap-3.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 text-amber-700">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs text-[#52525B] leading-relaxed">
            <strong className="text-[#18181B] font-bold">अष्टयाम समय-चक्र (8-Watch Daily Flow): </strong>
            Synchronize your day with Braj’s 8 contemplative watches (Dawn Mangala, Midday Rajbhog, Sunset Bhog, Night Shayana) for continuous serenity.
          </div>
        </div>

        {/* Primary Bottom Action */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartChanting();
          }}
          className="w-full py-4 px-6 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
        >
          <span>साधना प्रारंभ करें • Begin Daily Sadhana</span>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </button>
      </div>
    </div>,
    document.body
  );
};
