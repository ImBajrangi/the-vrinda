import React from 'react';

const SCALLOP_PATH = "M99.6,50.0L99.2,51.7L98.0,53.4L96.5,54.9L95.0,56.3L93.9,57.7L93.5,59.2L93.8,60.9L94.6,62.8L95.5,64.8L96.0,66.8L96.0,68.6L95.1,70.1L93.6,71.2L91.6,72.1L89.6,72.8L87.9,73.7L86.8,74.8L86.3,76.4L86.3,78.3L86.3,80.5L86.2,82.6L85.6,84.4L84.4,85.6L82.6,86.2L80.5,86.3L78.3,86.3L76.4,86.3L74.8,86.8L73.7,87.9L72.8,89.6L72.1,91.6L71.2,93.6L70.1,95.1L68.6,96.0L66.8,96.0L64.8,95.5L62.8,94.6L60.9,93.8L59.2,93.5L57.7,93.9L56.3,95.0L54.9,96.5L53.4,98.0L51.7,99.2L50.0,99.6L48.3,99.2L46.6,98.0L45.1,96.5L43.7,95.0L42.3,93.9L40.8,93.5L39.1,93.8L37.2,94.6L35.2,95.5L33.2,96.0L31.4,96.0L29.9,95.1L28.8,93.6L27.9,91.6L27.2,89.6L26.3,87.9L25.2,86.8L23.6,86.3L21.7,86.3L19.5,86.3L17.4,86.2L15.6,85.6L14.4,84.4L13.8,82.6L13.7,80.5L13.7,78.3L13.7,76.4L13.2,74.8L12.1,73.7L10.4,72.8L8.4,72.1L6.4,71.2L4.9,70.1L4.0,68.6L4.0,66.8L4.5,64.8L5.4,62.8L6.2,60.9L6.5,59.2L6.1,57.7L5.0,56.3L3.5,54.9L2.0,53.4L0.8,51.7L0.4,50.0L0.8,48.3L2.0,46.6L3.5,45.1L5.0,43.7L6.1,42.3L6.5,40.8L6.2,39.1L5.4,37.2L4.5,35.2L4.0,33.2L4.0,31.4L4.9,29.9L6.4,28.8L8.4,27.9L10.4,27.1L12.1,26.3L13.2,25.2L13.7,23.6L13.7,21.7L13.7,19.5L13.8,17.4L14.4,15.6L15.6,14.4L17.4,13.8L19.5,13.7L21.7,13.7L23.6,13.7L25.2,13.2L26.3,12.1L27.1,10.4L27.9,8.4L28.8,6.4L29.9,4.9L31.4,4.0L33.2,4.0L35.2,4.5L37.2,5.4L39.1,6.2L40.8,6.5L42.3,6.1L43.7,5.0L45.1,3.5L46.6,2.0L48.3,0.8L50.0,0.4L51.7,0.8L53.4,2.0L54.9,3.5L56.3,5.0L57.7,6.1L59.2,6.5L60.9,6.2L62.8,5.4L64.8,4.5L66.8,4.0L68.6,4.0L70.1,4.9L71.2,6.4L72.1,8.4L72.8,10.4L73.7,12.1L74.8,13.2L76.4,13.7L78.3,13.7L80.5,13.7L82.6,13.8L84.4,14.4L85.6,15.6L86.2,17.4L86.3,19.5L86.3,21.7L86.3,23.6L86.8,25.2L87.9,26.3L89.6,27.1L91.6,27.9L93.6,28.8L95.1,29.9L96.0,31.4L96.0,33.2L95.5,35.2L94.6,37.2L93.8,39.1L93.5,40.8L93.9,42.3L95.0,43.7L96.5,45.1L98.0,46.6L99.2,48.3Z";

interface ScallopedBadgeProps {
  value: number | string;
  label: string;
  type: 'milestone' | 'streak';
  isLocked?: boolean;
  onClick?: () => void;
}

export const ScallopedBadge: React.FC<ScallopedBadgeProps> = ({
  value,
  label,
  type,
  isLocked = false,
  onClick,
}) => {
  const isMilestone = type === 'milestone';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex flex-col items-center select-none pressable p-1.5 sm:p-2 rounded-2xl transition-all cursor-pointer ${
        isLocked ? 'opacity-40 grayscale' : 'hover:bg-white/40'
      }`}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        {isMilestone ? (
          // Refined White Rosette with balanced inner geometry
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            aria-hidden="true"
          >
            <path
              d={SCALLOP_PATH}
              fill="#FFFFFF"
              stroke="#E8ECE9"
              strokeWidth="1.2"
            />
            {/* Soft inner circular accent */}
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="#FAF9F6"
              stroke="#F3D3D3"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Stars: 1 star for 1, 2 stars for >= 5 */}
            <text
              x="50"
              y="36"
              textAnchor="middle"
              fontSize={Number(value) >= 5 ? "8" : "9"}
              letterSpacing={Number(value) >= 5 ? "1.5" : "0"}
              fill={isLocked ? "#9CA3AF" : "#E23B3B"}
              fontWeight="bold"
            >
              {Number(value) >= 5 ? "★★" : "★"}
            </text>
            {/* Centered Bold Numeral */}
            <text
              x="50"
              y="62"
              textAnchor="middle"
              fontFamily="'Doto', Inter, sans-serif"
              fontWeight="700"
              fontSize="24"
              fill={isLocked ? "#9CA3AF" : "#E23B3B"}
            >
              {value}
            </text>
          </svg>
        ) : (
          // Refined Streak Rosette with Radial Gradient
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_4px_14px_rgba(31,77,18,0.2)]"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`g_streak_${value}`} cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor={isLocked ? "#3D5A34" : "#2E6B1B"} />
                <stop offset="60%" stopColor={isLocked ? "#243B1E" : "#1B4610"} />
                <stop offset="100%" stopColor={isLocked ? "#152412" : "#102D08"} />
              </radialGradient>
            </defs>
            <path
              d={SCALLOP_PATH}
              fill={`url(#g_streak_${value})`}
              stroke={isLocked ? "#4B6B40" : "#3E8027"}
              strokeWidth="1.2"
            />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity={isLocked ? "0.15" : "0.3"}
            />
            {/* Pixel Flame Icon centered */}
            <path
              transform="translate(43, 25) scale(1.4)"
              d="M10 2h4v4h4v6h-2v4h-4v4H6v-4H4v-6h2V8h4z"
              fill={isLocked ? "#749B6A" : "#B6FF2E"}
            />
            {/* Bold Lime Streak Number */}
            <text
              x="50"
              y="66"
              textAnchor="middle"
              fontFamily="'Doto', Inter, sans-serif"
              fontWeight="700"
              fontSize="24"
              fill={isLocked ? "#749B6A" : "#B6FF2E"}
            >
              {value}
            </text>
          </svg>
        )}
      </div>

      <span className="text-[11.5px] sm:text-xs font-medium text-[#444444] mt-2 text-center tracking-tight">
        {label}
      </span>
      <span className={`text-[9.5px] font-semibold uppercase tracking-wider mt-0.5 ${
        isLocked ? 'text-gray-400' : isMilestone ? 'text-[#E23B3B]' : 'text-[#2E6B1B]'
      }`}>
        {isLocked ? 'साधनारत' : 'सिद्ध'}
      </span>
    </div>
  );
};
