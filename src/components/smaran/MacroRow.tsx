import React from 'react';

interface MacroRowProps {
  label: string;
  value: string;
  sublabel?: string;
  accentColor: string; // e.g. '#22C55E' | '#8B5CF6' | '#A3C71F'
}

export const MacroRow: React.FC<MacroRowProps> = ({
  label,
  value,
  sublabel,
  accentColor,
}) => {
  return (
    <div className="flex items-center gap-2.5 py-1 sm:py-1.5">
      {/* 3x3 Dot-matrix indicator with subtle glow */}
      <div className="grid grid-cols-3 gap-0.5 w-4 h-4 shrink-0 p-0.5 bg-black/[0.03] rounded-md">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="w-0.75 h-0.75 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        ))}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="font-doto font-semibold text-base sm:text-lg text-[#111111] leading-none tracking-tight">
            {value}
          </span>
          {sublabel && (
            <span className="text-[10px] text-[#6B6F6B] font-medium">
              {sublabel}
            </span>
          )}
        </div>
        <span
          className="text-[11px] font-semibold mt-0.5 truncate"
          style={{ color: accentColor }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
