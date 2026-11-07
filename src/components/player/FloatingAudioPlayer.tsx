import React from 'react';
import { Play, Pause, X, SkipForward, SkipBack, Heart } from 'lucide-react';
import { SacredPad } from '../../types/devotional';

interface FloatingAudioPlayerProps {
  currentPad: SacredPad | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onOpenLyrics?: () => void;
}

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  currentPad,
  isPlaying,
  onTogglePlay,
  onClose,
  onNext,
  onPrev,
  onOpenLyrics,
}) => {
  if (!currentPad) return null;

  return (
    // Apple-grade Docked Pill: Mobile centered at bottom-24; Desktop/Tablet docked at bottom-6 right-8
    <aside
      aria-label="Floating Audio Player"
      className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-[390px] max-w-md mx-auto md:mx-0 z-50 apple-view-enter"
    >
      <div className="bg-[#FFFDF9]/96 backdrop-blur-md border border-neutral-900/[0.07] shadow-[0_8px_28px_-6px_rgba(24,24,27,0.12),0_2px_8px_-2px_rgba(24,24,27,0.04)] text-[#18181B] rounded-full p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all duration-300 transform-gpu will-change-transform">
        {/* Animated Visualizer Icon with Apple Fluid Waves */}
        <div
          onClick={onOpenLyrics}
          title="Open Pad & Lyrics"
          className="w-11 h-11 rounded-full bg-[#FEF08A] flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer select-none"
        >
          <div className="flex items-end gap-1 h-4">
            <span
              className={`w-1 bg-amber-600 rounded-full ${
                isPlaying ? 'animate-apple-eq-1' : 'h-1.5'
              }`}
            />
            <span
              className={`w-1 bg-[#F59E0B] rounded-full ${
                isPlaying ? 'animate-apple-eq-2' : 'h-2.5'
              }`}
            />
            <span
              className={`w-1 bg-amber-600 rounded-full ${
                isPlaying ? 'animate-apple-eq-3' : 'h-1'
              }`}
            />
          </div>
        </div>

        {/* Pad Info */}
        <div
          className="flex flex-col flex-1 min-w-0 pr-1 cursor-pointer select-none"
          onClick={onOpenLyrics}
          title="View Pad Details"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 truncate font-mono">
              {currentPad.rag} • {currentPad.author}
            </span>
          </div>
          <span className="font-serif font-bold text-xs sm:text-sm truncate text-[#18181B] mt-0.5">
            {currentPad.titleDevanagari}
          </span>
        </div>

        {/* Controls with Smooth Press Feedback */}
        <div className="flex items-center gap-1 shrink-0">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous track"
              className="p-1.5 text-neutral-400 hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-[#18181B]" />
            ) : (
              <Play className="w-4 h-4 fill-current text-[#18181B] ml-0.5" />
            )}
          </button>

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next track"
              className="p-1.5 text-neutral-400 hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            aria-label="Add to favorites"
            className="p-1.5 text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audio player"
            className="p-1.5 text-neutral-400 hover:text-[#18181B] transition-colors cursor-pointer ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
