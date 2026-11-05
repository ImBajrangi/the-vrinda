import React, { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

export interface NityaSevaCardProps {
  templeName: string;
  sevaTitle: string;
  time: string;
  sevaDetails: string[];
  statusLabel?: string;
  statusType?: 'active' | 'upcoming' | 'completed';
  imageUrl?: string;
  onOpen?: () => void;
}

export const NityaSevaCard: React.FC<NityaSevaCardProps> = ({
  templeName,
  sevaTitle,
  time,
  sevaDetails,
  statusLabel = 'नित्य दर्शन',
  statusType = 'upcoming',
  imageUrl,
  onOpen,
}) => {
  const [imgError, setImgError] = useState(false);

  const getStatusBadge = () => {
    switch (statusType) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/25 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            {statusLabel}
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide text-[#B84A28] bg-[#B84A28]/10 border border-[#B84A28]/20">
            {statusLabel}
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-[#6B6F6B] bg-black/5">
            {statusLabel}
          </span>
        );
    }
  };

  return (
    <div
      onClick={onOpen}
      className="w-full bg-[#F4F4F4] hover:bg-[#ECECEC] rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 shadow-card pressable cursor-pointer border border-white/80 transition-all"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Sacred Temple Thumbnail with guaranteed SVG fallback */}
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-black/5 bg-[#E8E8E8] relative flex items-center justify-center">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={sevaTitle}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FAF3EA] to-[#F1E5D5] flex items-center justify-center p-3">
              <svg viewBox="0 0 40 40" className="w-full h-full text-[#B84A28]" fill="none">
                <path
                  d="M20 6L7 16V34H33V16L20 6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="22" r="4" fill="#D4A359" />
                <path d="M20 2V6M16 4L20 2L24 4" stroke="#B84A28" strokeWidth="1.5" />
                <path d="M15 34V24H25V34" fill="#B84A28" opacity="0.2" />
              </svg>
            </div>
          )}
        </div>

        {/* Text information */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          {/* Top row: Temple name with plenty of room */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[11.5px] font-bold text-[#8B5CF6] uppercase tracking-wide truncate">
              {templeName}
            </span>
            <div className="sm:hidden">
              {getStatusBadge()}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-devanagari font-bold text-sm sm:text-[15px] text-[#111111] leading-tight truncate">
            {sevaTitle}
          </h3>

          {/* Seva details rendered cleanly without individual tag truncation */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#555555] mt-1 overflow-hidden whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-[#D4A359] shrink-0" />
            <span className="truncate">
              {sevaDetails.join(' • ')}
            </span>
          </div>
        </div>
      </div>

      {/* Right meta */}
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
        <div className="hidden sm:flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            aria-label="View seva details"
            className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#6B6F6B] shadow-xs pressable transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="sm:hidden">
          <button
            type="button"
            aria-label="View seva details"
            className="w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#6B6F6B] shadow-xs pressable transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#111111] mt-auto">
          <img src="/assets/icons/clock-8.svg" alt="Clock" className="w-3 h-3 inline-block opacity-70" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};
