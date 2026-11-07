import React, { useRef, useState, useEffect } from 'react';

export interface DayItem {
  dayName: string;
  dateNum: number;
  isToday?: boolean;
  tithiLabel?: string;
}

interface DateStripProps {
  days: DayItem[];
  selectedDate: number;
  onSelectDate: (date: number) => void;
}

export const DateStrip: React.FC<DateStripProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const itemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const el = itemRefs.current[selectedDate];
    if (el) {
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [selectedDate, days]);

  return (
    <div className="relative w-full flex items-center justify-between gap-1 sm:gap-2 p-1.5 bg-[#F4F4F5]/70 rounded-[22px] border border-neutral-200/60 overflow-x-auto no-scrollbar">
      {/* Dynamic Elastic Sliding Day Indicator Pill */}
      {pillStyle.ready && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 rounded-[16px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-neutral-200/80 pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            left: 0,
          }}
        />
      )}

      {days.map((item) => {
        const isSelected = selectedDate === item.dateNum;
        return (
          <button
            key={item.dateNum}
            ref={(el) => {
              itemRefs.current[item.dateNum] = el;
            }}
            type="button"
            onClick={() => onSelectDate(item.dateNum)}
            className={`relative z-10 flex-1 min-w-[42px] sm:min-w-0 h-[64px] sm:h-[68px] px-1 sm:px-2 rounded-[16px] flex flex-col items-center justify-center leading-tight transition-colors duration-200 cursor-pointer shrink-0 select-none ${
              isSelected
                ? 'text-[#18181B] font-bold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <span className="font-sans font-bold text-sm sm:text-base leading-none text-[#18181B]">
              {item.dateNum}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#71717A] leading-none mt-1 font-medium">
              {item.isToday ? 'Today' : item.dayName}
            </span>
            {item.tithiLabel ? (
              <span
                className={`text-[9.5px] sm:text-[10px] font-medium leading-none mt-1 font-devanagari transition-colors ${
                  isSelected ? 'text-amber-700 font-bold' : 'text-neutral-400'
                }`}
              >
                {item.tithiLabel}
              </span>
            ) : (
              <span className="text-[9.5px] sm:text-[10px] leading-none mt-1 opacity-0 pointer-events-none select-none">
                -
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
