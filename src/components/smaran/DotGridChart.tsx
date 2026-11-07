import React from 'react';

interface DotGridChartProps {
  levels?: number[]; // Percentage per column (0 to 100)
}

export const DotGridChart: React.FC<DotGridChartProps> = ({
  levels = [35, 50, 65, 85, 95, 80, 55, 70, 90, 85, 60, 45, 75, 85, 95, 70, 50, 40],
}) => {
  const numColumns = 18;
  const numRows = 22;
  const dotRadius = 1.35;
  const stepY = 5.5;
  const startY = 116.85;

  return (
    <div className="w-full flex justify-center py-1 select-none overflow-x-auto no-scrollbar">
      <svg
        width="100%"
        height="121"
        viewBox="0 0 198 121"
        preserveAspectRatio="xMidYMid meet"
        className="max-w-[260px] sm:max-w-[320px] md:max-w-[360px] h-[121px] drop-shadow-xs"
        aria-hidden="true"
      >
        {Array.from({ length: numColumns }).map((_, colIdx) => {
          const cx = 1.35 + colIdx * 11.5;
          const fillPercent = levels[colIdx] ?? 50;
          const filledCount = Math.round((fillPercent / 100) * numRows);

          // Color accents matching sacred chandan & pitambari amber design
          const isAccent = colIdx >= 4 && colIdx <= 9;
          const dotColor = isAccent ? '#D97706' : '#F59E0B';

          return (
            <g key={colIdx}>
              {Array.from({ length: numRows }).map((_, rowIdx) => {
                const cy = startY - rowIdx * stepY;
                const isFilled = rowIdx < filledCount;
                return (
                  <circle
                    key={rowIdx}
                    cx={cx.toFixed(2)}
                    cy={cy.toFixed(2)}
                    r={dotRadius}
                    fill={dotColor}
                    opacity={isFilled ? 1 : 0.2}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
