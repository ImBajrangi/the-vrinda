import React, { useState, useRef, useEffect } from 'react';
import { Music } from 'lucide-react';
import { computeAshtayamaPhase } from '../../services/cacheService';
import { SacredDatabase, AshtayamaPeriod } from '../../services/sacredDatabase';

const ASHTAYAMA_ARTWORKS: Record<string, string> = {
  mangala: '/assets/temples/aarti-lamp.webp',
  shringar: '/assets/darshan/radharaman-yugal.webp',
  gwal: '/assets/temples/keshi-ghat.webp',
  rajbhog: '/assets/temples/radha-vallabh.webp',
  utthapan: '/assets/temples/banke-bihari-gate.webp',
  bhoga: '/assets/temples/banke-bihari.webp',
  sandhya: '/assets/temples/diya-pujan.webp',
  shayana: '/assets/temples/barsana-radharani.webp',
};

interface AshtayamaTimelineDeckProps {
  onExplorePrahar?: () => void;
}

export const AshtayamaTimelineDeck: React.FC<AshtayamaTimelineDeckProps> = ({ onExplorePrahar }) => {
  const periods = SacredDatabase.getAshtayamaPeriods();
  const [currentActive, setCurrentActive] = useState(() =>
    computeAshtayamaPhase(new Date('2026-01-01T19:00:00+05:30'))
  );
  const defaultPeriod =
    periods.find((p) => p.nameDevanagari.includes(currentActive.nameDevanagari) || currentActive.nameDevanagari.includes(p.nameDevanagari)) ||
    periods[3];

  const [selectedPeriod, setSelectedPeriod] = useState<AshtayamaPeriod>(defaultPeriod);

  useEffect(() => {
    const live = computeAshtayamaPhase();
    setCurrentActive(live);
    const liveMatch = periods.find(
      (p) => p.nameDevanagari.includes(live.nameDevanagari) || live.nameDevanagari.includes(p.nameDevanagari)
    );
    if (liveMatch) setSelectedPeriod(liveMatch);
  }, []);

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
    <div className="w-full bg-white rounded-[32px] p-6 sm:p-7 space-y-4">
      {/* Header Bar matching pure porcelain aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              Ashtayama 8-Watch Timeline
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
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
      <div className="relative w-full flex items-center gap-1 p-1 bg-[#FAF6EE] rounded-full overflow-x-auto no-scrollbar">
        {/* Dynamic Elastic Sliding Watch Indicator Pill */}
        {pillStyle.ready && (
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
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
                  ? 'text-[#18181B] font-bold'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {isCurrentTime && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isSelected ? 'bg-amber-600' : 'bg-amber-500'}`} />
              )}
              <span>{period.nameDevanagari}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Watch Formatted as a Compact Horizontal Editorial Showcase */}
      <div className="w-full bg-[#FAF9F5] rounded-[22px] p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* Clean Unobscured Temple Artwork Plate */}
        <div className="md:col-span-5 aspect-[4/3] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8]">
          <img
            src={
              ASHTAYAMA_ARTWORKS[selectedPeriod.id] ||
              ASHTAYAMA_ARTWORKS[selectedPeriod.nameEnglish.toLowerCase()] ||
              '/assets/temples/keshi-ghat.webp'
            }
            alt={`${selectedPeriod.nameDevanagari} प्रहर लीला दर्शन — ${selectedPeriod.bhava}`}
            className="w-full h-full object-cover object-[center_22%]"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Rich Leela Watch Information & Raga Details */}
        <div className="md:col-span-7 space-y-3 px-1 sm:pr-2 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider font-mono">
              {selectedPeriod.bhava} • {selectedPeriod.timeRange}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-900 bg-amber-100/70">
              Nikunja Bhava
            </span>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-snug">
              {selectedPeriod.nameEnglish} Watch ({selectedPeriod.nameDevanagari})
            </h4>
            <p className="text-xs sm:text-[13px] text-[#71717A] leading-relaxed font-normal mt-1">
              {selectedPeriod.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2.5 flex-wrap">
            <div>
              <span className="text-[10px] text-[#71717A] uppercase font-mono font-medium block">
                Classical Raga
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-800 font-mono">
                <Music className="w-3.5 h-3.5 text-amber-700" />
                <span>{selectedPeriod.raga}</span>
              </div>
            </div>
            {onExplorePrahar && (
              <button
                type="button"
                onClick={onExplorePrahar}
                className="px-4 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-laila font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                प्रहर की वाणी पढ़ें →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
