import React from 'react';

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
  return (
    <div className="w-full flex items-center justify-between gap-1 sm:gap-2 p-1.5 bg-[#F4F4F5]/70 rounded-[22px] border border-neutral-200/60 overflow-x-auto no-scrollbar">
      {days.map((item) => {
        const isSelected = selectedDate === item.dateNum;
        const isHighlight = item.isToday || isSelected;
        return (
          <button
            key={item.dateNum}
            type="button"
            onClick={() => onSelectDate(item.dateNum)}
            className={`flex-1 min-w-[42px] sm:min-w-0 h-[64px] sm:h-[68px] px-1 sm:px-2 rounded-[16px] flex flex-col items-center justify-center leading-tight transition-colors cursor-pointer shrink-0 select-none ${
              isHighlight
                ? 'bg-white text-[#18181B] font-bold border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-white/60 border border-transparent'
            }`}
          >
            <span className="font-sans font-bold text-sm sm:text-base leading-none text-[#18181B]">
              {item.dateNum}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#71717A] leading-none mt-1 font-medium">
              {item.isToday ? 'Today' : item.dayName}
            </span>
            {item.tithiLabel ? (
              <span className={`text-[9.5px] sm:text-[10px] font-medium leading-none mt-1 font-devanagari ${
                isHighlight ? 'text-amber-700 font-bold' : 'text-neutral-400'
              }`}>
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
