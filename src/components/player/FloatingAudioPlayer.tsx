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
      <div className="bg-[#14213D] text-white rounded-full p-2.5 sm:p-3 shadow-[0_20px_40px_rgba(0,0,0,0.32)] border border-white/20 flex items-center justify-between gap-3 backdrop-blur-2xl transition-all duration-300">
        {/* Animated Visualizer Icon with Apple Fluid Waves */}
        <div
          onClick={onOpenLyrics}
          title="Open Pad & Lyrics"
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/10 cursor-pointer pressable"
        >
          <div className="flex items-end gap-1 h-4">
            <span
              className={`w-1 bg-[#B6FF2E] rounded-full ${
                isPlaying ? 'animate-apple-eq-1' : 'h-1.5'
              }`}
            />
            <span
              className={`w-1 bg-[#22C55E] rounded-full ${
                isPlaying ? 'animate-apple-eq-2' : 'h-2.5'
              }`}
            />
            <span
              className={`w-1 bg-[#B6FF2E] rounded-full ${
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
            <img src="/assets/icons/shriJiMukut.svg" alt="Mukut" className="w-3.5 h-3.5 object-contain inline-block" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B6FF2E] truncate">
              {currentPad.rag} • {currentPad.author}
            </span>
          </div>
          <span className="font-devanagari font-bold text-xs sm:text-sm truncate text-white mt-0.5">
            {currentPad.titleDevanagari}
          </span>
        </div>

        {/* Controls with Apple Press Feedback */}
        <div className="flex items-center gap-1 shrink-0">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous track"
              className="p-1 text-white/70 hover:text-white pressable-sm"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full bg-[#B6FF2E] text-[#14213D] flex items-center justify-center font-bold shadow-sm pressable-sm hover:bg-[#a6ec24]"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-[#14213D]" />
            ) : (
              <Play className="w-4 h-4 fill-[#14213D] ml-0.5" />
            )}
          </button>

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next track"
              className="p-1 text-white/70 hover:text-white pressable-sm"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            aria-label="Add to favorites"
            className="p-1 text-white/70 hover:text-white pressable-sm"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audio player"
            className="p-1 text-white/50 hover:text-white pressable-sm ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
