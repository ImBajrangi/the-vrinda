import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Music2, BookOpen, Clock, Sparkles, ArrowRight } from 'lucide-react';

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChanting: () => void;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({
  isOpen,
  onClose,
  onStartChanting,
}) => {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-white/90 max-h-[90vh] overflow-y-auto no-scrollbar apple-sheet-enter text-[#18181B]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[#7C3AED]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block font-mono">
                QUICK START GUIDE • नव साधक
              </span>
              <h3 className="font-serif font-bold text-lg text-[#18181B]">
                Beginner's Guide to Daily Sadhana
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#71717A] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Introduction */}
        <div className="p-4 rounded-2xl bg-purple-50/50 mb-5">
          <h4 className="font-serif font-bold text-sm text-[#18181B] mb-1">
            Welcome to Vrindopnisad 2.0
          </h4>
          <p className="text-xs text-[#52525B] leading-relaxed">
            This digital sanctuary is thoughtfully crafted for modern life — calm, focused, and distraction-free. You don't need complex rituals: steady daily practice, love, and quiet consistency are all that matter.
          </p>
        </div>

        {/* The 3 Pillars Section */}
        <div className="space-y-3 mb-5">
          <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block font-mono">
            The 3 Daily Sacred Pillars:
          </span>

          {/* Pillar 1: Naam Japa */}
          <div className="p-3.5 rounded-2xl bg-amber-50/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100/70 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-4.5 h-4.5 text-amber-600 fill-amber-600" />
            </div>
            <div className="min-w-0">
              <h5 className="font-serif font-bold text-xs sm:text-sm text-[#18181B] flex items-center gap-1.5">
                <span>1. Naam Japa (Holy Name Meditation)</span>
                <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">Pillar 1</span>
              </h5>
              <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                Chant the sacred names of the Divine Couple. Tap the live bead counter on your dashboard for tactile bead-by-bead counting (108 per mala), or quickly add +1 mala to log your daily rounds.
              </p>
            </div>
          </div>

          {/* Pillar 2: Pad Shravan */}
          <div className="p-3.5 rounded-2xl bg-purple-50/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100/70 flex items-center justify-center shrink-0 mt-0.5">
              <Music2 className="w-4.5 h-4.5 text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <h5 className="font-serif font-bold text-xs sm:text-sm text-[#18181B] flex items-center gap-1.5">
                <span>2. Sacred Listening (Pad Shravan)</span>
                <span className="text-[10px] text-purple-800 font-mono font-bold bg-purple-100/80 px-2 py-0.5 rounded-full">Pillar 2</span>
              </h5>
              <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                Listen to classical Braj devotional poetry and katha set in timeless morning, afternoon, and twilight ragas. Listening soothes the nervous system and deepens contemplation.
              </p>
            </div>
          </div>

          {/* Pillar 3: Grantha Svadhyaya */}
          <div className="p-3.5 rounded-2xl bg-orange-50/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100/70 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4.5 h-4.5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h5 className="font-serif font-bold text-xs sm:text-sm text-[#18181B] flex items-center gap-1.5">
                <span>3. Scripture Reading (Grantha Svadhyaya)</span>
                <span className="text-[10px] text-orange-800 font-mono font-bold bg-orange-100/80 px-2 py-0.5 rounded-full">Pillar 3</span>
              </h5>
              <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                Read at least 1 verse daily from sacred canonical texts like Hit Chaurasi or Kelimal. Full word-by-word meanings and commentaries are always open in the Scriptures tab.
              </p>
            </div>
          </div>
        </div>

        {/* Daily Ashtayama Note */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-[#52525B] leading-relaxed">
            <strong className="text-[#18181B]">What are the 8 Ashtayama Watches?</strong> The 24 hours of the day are divided into 8 peaceful time-periods (Dawn, Morning, Midday, Evening, Night). Following this cadence anchors your day in constant peace.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartChanting();
          }}
          className="w-full py-3.5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span>Begin My Sadhana Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
};
