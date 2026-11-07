import React from 'react';
import { ExternalLink, Sparkles, Clock } from 'lucide-react';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';

export interface NityaSevaCardProps {
  templeName: string;
  sevaTitle: string;
  time: string;
  sevaDetails: string[];
  statusLabel?: string;
  statusType?: 'active' | 'upcoming' | 'completed';
  countdownLabel?: string;
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
  countdownLabel,
  imageUrl,
  onOpen,
}) => {
  const getStatusBadge = () => {
    switch (statusType) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-amber-50 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {statusLabel}
          </span>
        );
      case 'upcoming':
        if (statusLabel.toLowerCase().includes('rajbhog')) {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-orange-800 bg-orange-50">
              {statusLabel}
            </span>
          );
        }
        if (statusLabel.toLowerCase().includes('aarti') || statusLabel.toLowerCase().includes('sandhya')) {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-amber-800 bg-amber-50">
              {statusLabel}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-neutral-600 bg-neutral-100">
            {statusLabel}
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-neutral-600 bg-neutral-100">
            {statusLabel}
          </span>
        );
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen && onOpen()}
      className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors cursor-pointer select-none"
    >
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        {/* Sacred Squircle Thumbnail using ArtworkGraphicSlot */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
          <ArtworkGraphicSlot
            src={imageUrl || null}
            alt={sevaTitle}
            aspectRatio="square"
            theme="amber"
            placeholderLabel="दर्शन चित्र"
            placeholderCategory="temple"
            roundedClassName="rounded-[18px]"
          />
        </div>

        {/* Text stack */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          {/* Top row: Temple name in warm sacred amber */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider truncate">
              {templeName}
            </span>
            <div className="sm:hidden">
              {getStatusBadge()}
            </div>
          </div>

          {/* Title in bold serif with crisp obsidian typography */}
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
            {sevaTitle}
          </h3>

          {/* Seva details with sparkle icon */}
          <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              {sevaDetails.join(' • ')}
            </span>
            {countdownLabel && (
              <span className="hidden md:inline font-mono text-[10.5px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                {countdownLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right meta */}
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
        <div className="hidden sm:flex items-center gap-2">
          {getStatusBadge()}
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
        </div>

        <div className="sm:hidden flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#18181B] mt-auto font-mono">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};
