import React from 'react';
import { ArrowLeft, ChevronDown, Volume2, VolumeX, Search, BookOpen } from 'lucide-react';

interface MobileReaderHeaderProps {
  /** Title of current scripture / epic, e.g. "श्री हित चौरासी" */
  scriptureTitle: string;
  /** Sub-title / chapter / verse label, e.g. "पद ५" or "सुन्दरकाण्ड" */
  chapterTitle?: string;
  /** Callback when user taps title pill to open scripture/chapter selector */
  onOpenSelector: () => void;
  /** Optional back button callback */
  onBack?: () => void;
  /** Typography / Appearance drawer toggle */
  onToggleAppearance?: () => void;
  isAppearanceOpen?: boolean;
  /** Audio playback */
  isPlayingAudio?: boolean;
  onToggleAudio?: () => void;
  hasAudio?: boolean;
  /** Search modal trigger */
  onOpenSearch?: () => void;
  /** Whether the header should be hidden (scrolling down) */
  isVisible?: boolean;
}

/**
 * Mobile-first unified reader header (44px).
 * Replaces multiple tiers of bulky cards, category filters, and horizontal pill carousels
 * with a single streamlined, book-like navigation bar.
 *
 * Automatically glides out of view on downward scroll to provide
 * 90%+ visible screen area for the sacred verses.
 */
export const MobileReaderHeader: React.FC<MobileReaderHeaderProps> = ({
  scriptureTitle,
  chapterTitle,
  onOpenSelector,
  onBack,
  onToggleAppearance,
  isAppearanceOpen = false,
  isPlayingAudio = false,
  onToggleAudio,
  hasAudio = true,
  onOpenSearch,
  isVisible: _isVisible = true,
}) => {
  return (
    <div className="md:hidden sticky top-2 z-30 w-full mb-3 select-none">
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-900/10 rounded-2xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 shadow-2xs">
        {/* Left: Table of Contents / Directory trigger */}
        <div className="flex items-center shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-900 active:bg-neutral-100 transition-colors cursor-pointer"
              title="पीछे जाएँ (Back)"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSelector}
              className="h-8 px-2.5 rounded-full flex items-center gap-1.5 text-amber-900 active:bg-amber-100/60 bg-[#FAF8F5] border border-amber-900/10 transition-colors cursor-pointer text-xs font-serif font-bold shadow-2xs"
              title="ग्रंथ व पद सूची खोलें"
              aria-label="Table of Contents"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden min-[360px]:inline">सूची</span>
            </button>
          )}
        </div>

        {/* Center: Tap to open Scripture / Chapter Bottom Sheet (Spacious, Gracefully Truncating Pill) */}
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex-1 min-w-0 max-w-[240px] mx-auto px-2.5 py-1.5 rounded-full bg-[#FAF8F5] border border-amber-900/10 active:bg-amber-100/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none shadow-2xs overflow-hidden"
          title="ग्रंथ व अध्याय सूची खोलें"
        >
          <span className="font-serif font-bold text-xs text-neutral-900 truncate min-w-0">
            {scriptureTitle}
          </span>
          {chapterTitle && (
            <>
              <span className="text-[10px] text-amber-700/60 font-serif shrink-0">•</span>
              <span className="font-serif text-xs text-amber-900 font-semibold truncate min-w-0">
                {chapterTitle}
              </span>
            </>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-amber-800 shrink-0 opacity-70" />
        </button>

        {/* Right: Quick Reader Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Search */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-900 active:bg-neutral-100 transition-colors cursor-pointer"
              title="खोजें (Search)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Audio Recitation Toggle */}
          {hasAudio && onToggleAudio && (
            <button
              type="button"
              onClick={onToggleAudio}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-400 text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 active:bg-neutral-100'
              }`}
              title={isPlayingAudio ? 'ऑडियो रोकें' : 'पाठ श्रवण करें'}
              aria-label="Toggle Audio"
            >
              {isPlayingAudio ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 opacity-70" />
              )}
            </button>
          )}

          {/* Typography & Theme Drawer Toggle (Aa) */}
          {onToggleAppearance && (
            <button
              type="button"
              onClick={onToggleAppearance}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif font-bold transition-colors cursor-pointer ${
                isAppearanceOpen
                  ? 'bg-[#FEF08A] text-[#78350F]'
                  : 'text-neutral-600 hover:text-neutral-900 active:bg-neutral-100'
              }`}
              title="अक्षर व परिवेश (Typography & Themes)"
              aria-label="Typography and Themes"
            >
              Aa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
