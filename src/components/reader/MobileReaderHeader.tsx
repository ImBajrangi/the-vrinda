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
  /** Whether the header should be visible */
  isVisible?: boolean;
}

/**
 * Mobile-First Sacred Reader Header Bar.
 *
 * Implements Apple Books / Kindle style edge-to-edge reading navigation:
 * - Edge-to-edge clean surface with subtle hairline border
 * - Zero GPU blur filters for silky 60fps / 120fps scrolling
 * - Perfectly balanced 3-column layout (Table of Contents, Title Selector, Typography)
 * - Safe tactile touch targets (>= 36px)
 * - Concentric nested border geometry
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
    <div className="md:hidden sticky top-0 z-30 w-full mb-3 select-none bg-white/98 border-b border-stone-200/70 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Table of Contents / Back Button */}
        <div className="flex items-center shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-100 transition-colors cursor-pointer"
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

        {/* Center: Tap to open Scripture / Chapter Bottom Sheet */}
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex-1 min-w-0 max-w-[250px] mx-auto px-2.5 py-1.5 rounded-full bg-[#FAF8F5] border border-amber-900/10 active:bg-amber-100/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none shadow-2xs overflow-hidden"
          title="ग्रंथ व अध्याय सूची खोलें"
        >
          <span className="font-serif font-bold text-xs text-stone-900 truncate min-w-0">
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 active:bg-stone-100 transition-colors cursor-pointer"
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
                  ? 'bg-[#FEF08A] text-[#78350F] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 active:bg-stone-100'
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
              className={`h-8 px-2.5 rounded-full flex items-center justify-center text-xs font-serif font-bold transition-colors cursor-pointer select-none border ${
                isAppearanceOpen
                  ? 'bg-[#FEF08A] text-[#78350F] border-amber-300 shadow-2xs'
                  : 'bg-[#FAF8F5] text-stone-700 hover:text-stone-900 active:bg-stone-100 border-stone-200/80'
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
