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
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 py-1 overflow-x-auto no-scrollbar">
      {days.map((item) => {
        const isSelected = selectedDate === item.dateNum;
        return (
          <button
            key={item.dateNum}
            type="button"
            onClick={() => onSelectDate(item.dateNum)}
            className={`w-[42px] h-[48px] sm:w-auto sm:flex-1 sm:h-[54px] sm:px-3 rounded-full flex flex-col items-center justify-center text-[11px] leading-[1.15] border transition-colors pressable shrink-0 ${
              item.isToday || isSelected
                ? 'bg-white text-[#111111] font-semibold border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.06)]'
                : 'bg-white/55 text-[#555555] border-white/80 hover:bg-white/80'
            }`}
          >
            <span className="font-semibold text-xs sm:text-sm leading-none">
              {item.dateNum}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#6B6F6B] leading-none mt-1">
              {item.isToday ? 'Today' : item.dayName}
            </span>
            {item.tithiLabel && (
              <span className="hidden sm:inline-block text-[8px] font-bold text-[#B84A28] leading-none mt-0.5">
                {item.tithiLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
