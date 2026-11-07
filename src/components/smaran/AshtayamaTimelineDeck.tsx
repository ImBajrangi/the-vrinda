import React, { useState, useRef, useEffect } from 'react';
import { Music } from 'lucide-react';
import { computeAshtayamaPhase } from '../../services/cacheService';
import { SacredDatabase, AshtayamaPeriod } from '../../services/sacredDatabase';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';

export const AshtayamaTimelineDeck: React.FC = () => {
  const periods = SacredDatabase.getAshtayamaPeriods();
  const currentActive = computeAshtayamaPhase();
  const defaultPeriod =
    periods.find((p) => p.nameDevanagari.includes(currentActive.nameDevanagari) || currentActive.nameDevanagari.includes(p.nameDevanagari)) ||
    periods[3];

  const [selectedPeriod, setSelectedPeriod] = useState<AshtayamaPeriod>(defaultPeriod);

  const periodRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const el = periodRefs.current[selectedPeriod.id];
    if (el) {
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [selectedPeriod.id]);

  return (
    <div className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
      {/* Header Bar matching pure porcelain aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              Ashtayama 8-Watch Timeline
            </h3>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
              नित्य अष्टयाम लीला
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1">
            24-hour contemplative cycle of Priya-Priyatam’s divine pastimes and aligned classical ragas.
          </p>
        </div>

        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-mono self-start sm:self-auto">
          {currentActive.nameEnglish} (Active Now)
        </span>
      </div>

      {/* 8-Pahar Horizontal Interactive Pill Strip with Elastic Sliding Card */}
      <div className="relative w-full flex items-center gap-1 p-1 bg-[#F4F4F5] rounded-full border border-neutral-200/60 overflow-x-auto no-scrollbar">
        {/* Dynamic Elastic Sliding Watch Indicator Pill */}
        {pillStyle.ready && (
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
            style={{
              transform: `translateX(${pillStyle.left}px)`,
              width: `${pillStyle.width}px`,
              left: 0,
            }}
          />
        )}

        {periods.map((period) => {
          const isSelected = selectedPeriod.id === period.id;
          const isCurrentTime =
            period.nameEnglish.toLowerCase() === currentActive.nameEnglish.toLowerCase() ||
            period.nameDevanagari.includes(currentActive.nameDevanagari) ||
            currentActive.nameDevanagari.includes(period.nameDevanagari);

          return (
            <button
              key={period.id}
              ref={(el) => {
                periodRefs.current[period.id] = el;
              }}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer select-none ${
                isSelected
                  ? 'text-white font-bold'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {isCurrentTime && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isSelected ? 'bg-amber-400' : 'bg-amber-500'}`} />
              )}
              <span>{period.nameDevanagari}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Watch Formatted as a Graphics-Friendly Editorial Card */}
      <div className="w-full bg-white rounded-[24px] p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
        {/* Dedicated Ashtayama Leela Graphic Slot - Empty by default, ready for painting */}
        <ArtworkGraphicSlot
          src={null}
          aspectRatio="card"
          theme="amber"
          placeholderLabel={`${selectedPeriod.nameEnglish} Leela Artwork`}
          placeholderCategory="dham"
          badge={`${selectedPeriod.bhava} • ${selectedPeriod.timeRange}`}
          roundedClassName="rounded-[18px]"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider font-mono">
                {selectedPeriod.bhava} • {selectedPeriod.timeRange}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-800 bg-amber-50">
                Nikunja Bhava
              </span>
            </div>

            <h4 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              {selectedPeriod.nameEnglish} Watch ({selectedPeriod.nameDevanagari})
            </h4>

            <p className="text-xs sm:text-[13px] text-[#71717A] leading-relaxed font-normal">
              {selectedPeriod.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
            <span className="text-[10px] text-[#71717A] uppercase font-mono font-medium">
              Classical Raga
            </span>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7C3AED] font-mono">
              <Music className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{selectedPeriod.raga}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
