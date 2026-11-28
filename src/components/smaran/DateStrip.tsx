import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { PanchangInfo } from '../../services/panchangService';

export interface DayItem {
  dayName: string;
  dateNum: number;
  isToday?: boolean;
  tithiLabel?: string;
  isoDate?: string;
  panchang?: PanchangInfo;
}

interface DateStripProps {
  days: DayItem[];
  selectedDate: number;
  onSelectDate: (date: number) => void;
}

/** Count visible Devanagari base characters (ignoring vowel matras/halant marks). */
function countBaseAksharas(s: string): number {
  return s.replace(/[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963]/g, '').length;
}

/**
 * Concise single-line Hindi Tithi label so all 7 calendar columns maintain
 * razor-steady vertical baseline alignment across narrow mobile viewports.
 */
function formatCompactTithiLabel(raw?: string): string {
  if (!raw) return '—';
  const cleaned = raw.trim();
  const spaceIdx = cleaned.indexOf(' ');
  const word = spaceIdx !== -1 ? cleaned.slice(spaceIdx + 1) : cleaned;
  // Most Braj Tithis (पूर्णिमा, चतुर्थी, तृतीया, पंचमी, एकादशी) have 3-5 base glyphs
  if (countBaseAksharas(word) <= 5) return word;
  // Trim safely by base glyph count if exceptionally long (e.g. चतुर्दशी -> चतुर्द.)
  let baseCount = 0;
  let cutIdx = 0;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const isMatra = /[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963]/.test(ch);
    if (!isMatra) baseCount++;
    if (baseCount > 4) {
      cutIdx = i;
      break;
    }
    cutIdx = i + 1;
  }
  return `${word.slice(0, cutIdx)}…`;
}

export const DateStrip: React.FC<DateStripProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const selectedIndex = Math.max(
    0,
    days.findIndex((d) => d.dateNum === selectedDate)
  );
  const selectedItem = days[selectedIndex] || days[0];
  const todayItem = days.find((d) => d.isToday);
  const isViewingToday = selectedItem?.isToday ?? true;

  const measurePill = () => {
    const el = itemRefs.current[selectedDate];
    if (el) {
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: el.offsetWidth > 0,
      });
    }
  };

  useLayoutEffect(() => {
    measurePill();
  }, [selectedDate, days]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measurePill());
    ro.observe(track);
    return () => ro.disconnect();
  }, [selectedDate, days]);

  const handleStep = (delta: number) => {
    if (days.length === 0) return;
    const nextIdx = Math.min(days.length - 1, Math.max(0, selectedIndex + delta));
    if (days[nextIdx]) {
      onSelectDate(days[nextIdx].dateNum);
    }
  };

  const panchang = selectedItem?.panchang;

  return (
    <div className="w-full space-y-2">
      {/* Interactive Selected-Day Summary & Quick Navigation Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-[8px] bg-[#FAF6EE] text-[#92400E] shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C140D] truncate">
              <span>
                {panchang
                  ? `${panchang.weekdayDevanagari || panchang.weekdayShort} • ${panchang.gregorianLabel}`
                  : `${selectedItem?.dayName || ''} ${selectedDate}`}
              </span>
              {panchang?.specialOccasionDevanagari && (
                <span className="text-[10.5px] font-bold text-[#92400E] bg-[#FEF08A] px-2 py-0.5 rounded-full truncate">
                  {panchang.specialOccasionDevanagari}
                </span>
              )}
            </div>
            {panchang && (
              <p className="text-[11px] text-[#6B5B4D] truncate leading-tight mt-0.5">
                {panchang.masaDevanagari} {panchang.pakshaDevanagari} {panchang.tithiNameDevanagari} • {panchang.nakshatraDevanagari} नक्षत्र
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {todayItem && !isViewingToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayItem.dateNum)}
              className="px-2.5 py-1 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#5C2D0C] text-[11px] font-bold cursor-pointer transition-colors"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={selectedIndex <= 0}
            aria-label="Previous day"
            className="w-7 h-7 rounded-full bg-[#FAF6EE] hover:bg-[#EFE7D8] disabled:opacity-35 text-[#443528] flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={selectedIndex >= days.length - 1}
            aria-label="Next day"
            className="w-7 h-7 rounded-full bg-[#FAF6EE] hover:bg-[#EFE7D8] disabled:opacity-35 text-[#443528] flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Steady 7-Column Grid Week Strip (Concentric 20px outer -> 4px pad -> 16px active pill) */}
      <div
        ref={trackRef}
        role="listbox"
        aria-label="Weekly Panchang Calendar"
        style={{ cornerShape: 'squircle' } as React.CSSProperties}
        className="relative w-full grid grid-cols-7 gap-0.5 sm:gap-1 p-1 bg-[#F5EFE6]/85 rounded-[20px]"
      >
        {/* High-Contrast Smooth Elastic Active Pill */}
        {pillStyle.ready && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(${pillStyle.left}px, 0, 0)`,
              width: `${pillStyle.width}px`,
              left: 0,
              cornerShape: 'squircle',
            } as React.CSSProperties}
            className="absolute top-1 bottom-1 rounded-[16px] bg-[#1C140D] shadow-[0_4px_12px_rgba(28,20,13,0.18)] pointer-events-none transition-[transform,width] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width]"
          />
        )}

        {days.map((item) => {
          const isSelected = selectedDate === item.dateNum;
          const compactTithi = formatCompactTithiLabel(item.tithiLabel);
          const hasFestival = Boolean(item.panchang?.specialOccasionDevanagari);

          return (
            <button
              key={item.dateNum}
              ref={(el) => {
                itemRefs.current[item.dateNum] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectDate(item.dateNum)}
              style={{ cornerShape: 'squircle' } as React.CSSProperties}
              className={`relative z-10 h-[66px] sm:h-[70px] px-0.5 sm:px-1 rounded-[16px] flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-[0.94] cursor-pointer select-none touch-manipulation ${
                isSelected
                  ? 'text-[#FFFDF9]'
                  : 'text-[#5C4B3B] hover:bg-white/55'
              }`}
            >
              {/* Fixed 14px Day Row */}
              <span
                className={`h-3.5 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold tracking-tight leading-none ${
                  isSelected
                    ? 'text-[#FDE047]'
                    : item.isToday
                      ? 'text-[#B45309] font-bold'
                      : 'text-[#78685A]'
                }`}
              >
                {item.dayName}
              </span>

              {/* Fixed 22px Date Numeral Row */}
              <span
                className={`h-[22px] flex items-center justify-center font-sans font-extrabold text-[15px] sm:text-[17px] tabular-nums leading-none ${
                  isSelected ? 'text-[#FFFDF9]' : 'text-[#1C140D]'
                }`}
              >
                {item.dateNum}
              </span>

              {/* Fixed 14px Single-Line Tithi Row — Zero Wrap Jitter */}
              <span
                className={`h-3.5 w-full px-0.5 flex items-center justify-center text-[9.5px] sm:text-[10px] leading-none font-devanagari whitespace-nowrap overflow-hidden text-ellipsis ${
                  isSelected
                    ? 'text-[#F5EFE6]/90 font-medium'
                    : hasFestival
                      ? 'text-[#92400E] font-bold'
                      : 'text-[#8B7B6B]'
                }`}
              >
                {compactTithi}
              </span>

              {/* Subtle Today underline marker when inspecting another day */}
              {item.isToday && !isSelected && (
                <span
                  aria-hidden="true"
                  className="w-3 h-[2px] rounded-full bg-[#D97706] absolute bottom-1"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
