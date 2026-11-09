import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  BookOpen,
  ScrollText,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';
import { parseDevotionalContent } from '../../utils/devotionalContentParser';
import { formatDevanagariNumerals } from '../../services/cacheService';

interface DevotionalVersePresenterProps {
  lines: string[];
  fontClass: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  textAlignClass?: string;
  currentTheme: {
    lineColor: string;
    titleColor: string;
    metaColor: string;
  };
}

export const DevotionalVersePresenter: React.FC<DevotionalVersePresenterProps> = ({
  lines,
  fontClass,
  fontSize,
  currentTheme,
}) => {
  const parsed = parseDevotionalContent(lines);

  // Reader Preferences: Default to centered alignment for classical rhythmic poetry
  const [alignment, setAlignment] = useState<'center' | 'left'>(() => {
    return parsed.hasStanzas ? 'center' : 'left';
  });
  const [showMeanings, setShowMeanings] = useState<boolean>(true);
  const [focusedStanzaIndex, setFocusedStanzaIndex] = useState<number | null>(null);

  const verseSizeClass =
    fontSize === 'sm'
      ? 'text-[17px] sm:text-[19px] leading-[2.1]'
      : fontSize === 'md'
      ? 'text-[20px] sm:text-[22px] leading-[2.2]'
      : fontSize === 'lg'
      ? 'text-[23px] sm:text-[25px] leading-[2.3]'
      : 'text-[26px] sm:text-[28px] leading-[2.4]';

  const textAlignClass = alignment === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="space-y-4 py-1 select-text">
      {/* Ease-of-Reading Utility Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 gap-2 flex-wrap text-xs">
        {/* Left: Reading guidance hint */}
        <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline-flex items-center gap-1">
          <ScrollText className="w-3 h-3 text-amber-600" />
          <span>चरण पर टैप कर एकाग्रता पाठ (Focus Mode) प्रारम्भ करें</span>
        </span>

        {/* Right: Alignment & Commentary Toggles */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Poetic Stanza Layout Toggle (Center vs Left) */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200/80">
            <button
              type="button"
              onClick={() => setAlignment('center')}
              className={`h-6 px-2.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer select-none ${
                alignment === 'center'
                  ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="संकीर्तन / मध्यस्थ लय (Centered)"
            >
              <AlignCenter className="w-2.5 h-2.5" />
              <span>मध्यस्थ</span>
            </button>
            <button
              type="button"
              onClick={() => setAlignment('left')}
              className={`h-6 px-2.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer select-none ${
                alignment === 'left'
                  ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="शास्त्रीय / वामस्थ पाठ (Left-aligned)"
            >
              <AlignLeft className="w-2.5 h-2.5" />
              <span>वामस्थ</span>
            </button>
          </div>

          {/* Toggle Inherent Meaning if present */}
          {parsed.hasVersePairs && (
            <button
              type="button"
              onClick={() => setShowMeanings(!showMeanings)}
              className="h-6 px-2.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer select-none bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 shadow-2xs"
              title="भावार्थ दिखाएँ या छिपाएँ"
            >
              {showMeanings ? (
                <>
                  <EyeOff className="w-2.5 h-2.5 text-amber-800" />
                  <span>केवल मूल</span>
                </>
              ) : (
                <>
                  <Eye className="w-2.5 h-2.5 text-amber-800" />
                  <span>भावार्थ सहित</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Devotional Presentation Body */}
      <div className={`space-y-4 ${textAlignClass}`}>
        {parsed.units.map((unit, idx) => {
          // 1. Festive / Darshan Poem Title (e.g. "झूलन उत्सव संध्या दर्शन")
          if (unit.type === 'poem_title') {
            return (
              <div key={idx} className="text-center pt-3 pb-1 select-none space-y-1">
                <div className="inline-flex items-center justify-center gap-2">
                  <span className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent to-amber-500/60" />
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-amber-800 uppercase">
                    लीला उत्सव प्रसंग
                  </span>
                  <span className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent to-amber-500/60" />
                </div>
                <h3 className={`text-lg sm:text-xl lg:text-2xl font-serif font-bold text-amber-950 tracking-normal leading-snug ${fontClass}`}>
                  ॥ {unit.text} ॥
                </h3>
              </div>
            );
          }

          // 2. Sacred Floral Garland Line (Pushpa Mala)
          if (unit.type === 'garland') {
            return (
              <div
                key={idx}
                className="py-2.5 sm:py-3.5 flex items-center justify-center select-none"
                aria-hidden="true"
              >
                <div className="flex items-center gap-2 sm:gap-3 text-amber-700/80">
                  <span className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent via-amber-400/50 to-amber-500/70" />
                  <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-amber-50/60 border border-amber-900/10 shadow-2xs">
                    <span className="text-rose-500 text-xs sm:text-sm">❀</span>
                    <span className="w-1 h-1 rounded-full bg-amber-400/90" />
                    <span className="text-amber-600 text-xs sm:text-sm">✿</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-700/70" title="तुलसी दल" />
                    <span className="text-amber-700 text-sm sm:text-base font-serif px-0.5">𑁍</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-700/70" title="तुलसी दल" />
                    <span className="text-amber-600 text-xs sm:text-sm">✿</span>
                    <span className="w-1 h-1 rounded-full bg-amber-400/90" />
                    <span className="text-rose-500 text-xs sm:text-sm">❀</span>
                  </div>
                  <span className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent via-amber-400/50 to-amber-500/70" />
                </div>
              </div>
            );
          }

          // 3. Poetic Stanza Grouping (Couplets & Chhands with breathing pauses)
          if (unit.type === 'stanza') {
            const isFocused = focusedStanzaIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => setFocusedStanzaIndex(isFocused ? null : idx)}
                className={`group/stanza relative py-2.5 px-3 sm:px-3.5 rounded-lg transition-colors duration-300 cursor-pointer ${
                  isFocused
                    ? 'bg-amber-50/45 shadow-2xs'
                    : 'hover:bg-amber-900/[0.015]'
                }`}
                title="टैप करके इस चरण पर एकाग्रता पाठ करें"
              >
                {/* Floating Stanza Numeral Badge */}
                {unit.stanzaNumber && (
                  <span
                    className={`inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors select-none ${
                      isFocused
                        ? 'bg-[#FEF08A] text-[#78350F]'
                        : 'bg-neutral-100/80 text-neutral-400 group-hover/stanza:text-amber-800 group-hover/stanza:bg-amber-100/40'
                    }`}
                  >
                    ॥ {formatDevanagariNumerals(unit.stanzaNumber)} ॥
                  </span>
                )}

                {/* Stanza Lines rendered with harmonious cadence */}
                <div className="space-y-1.5 sm:space-y-2">
                  {unit.lines.map((line, lIdx) => (
                    <p
                      key={lIdx}
                      className={`${fontClass} ${
                        lIdx === 0 ? 'font-semibold' : 'font-normal sm:font-medium'
                      } tracking-normal ${currentTheme.lineColor} ${verseSizeClass}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                {/* Subtle Stanza Flourish Separator */}
                {idx < parsed.units.length - 1 && (
                  <div className="flex items-center justify-center pt-3 select-none text-amber-300/60 text-xs">
                    ❀
                  </div>
                )}
              </div>
            );
          }

          // 4. Quoted Verse + Inherent Line-by-Line Meaning
          if (unit.type === 'verse_pair') {
            return (
              <div key={idx} className="space-y-2 py-1">
                {/* Sacred Metric Verse Line (मूल पद) */}
                <p
                  className={`${fontClass} font-semibold tracking-wide ${currentTheme.lineColor} ${verseSizeClass}`}
                >
                  {unit.verse}
                </p>

                {/* Inherent Line-by-Line Meaning / Commentary (अन्वय / भावार्थ) */}
                {unit.meaning && showMeanings && (
                  <div className="flex items-start gap-2.5 pl-3.5 pr-3 py-2 rounded-xl bg-amber-50/75 border-l-2 border-amber-400 text-neutral-800 transition-colors text-left">
                    <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded shrink-0 mt-0.5 select-none uppercase tracking-wider">
                      भावार्थ
                    </span>
                    <p
                      className={`${fontClass} text-sm sm:text-base leading-relaxed text-neutral-700 font-normal`}
                    >
                      {unit.meaning}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // 5. Section Header Badges (e.g. स्थान, दिव्य लीला)
          if (unit.type === 'section_header') {
            const isLocation = unit.title.includes('स्थान');
            const isLeela = unit.title.includes('लीला');
            const isKatha = unit.title.includes('कथा') || unit.title.includes('प्रसंग');

            return (
              <div key={idx} className="pt-3 pb-1 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-950 bg-amber-50/90 border border-amber-900/10 shadow-2xs">
                  {isLocation ? (
                    <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  ) : isLeela ? (
                    <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  ) : isKatha ? (
                    <BookOpen className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  ) : (
                    <ScrollText className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  )}
                  <span>{unit.title}</span>
                </span>
                {unit.content && (
                  <p
                    className={`${fontClass} mt-2 text-base sm:text-lg leading-relaxed ${currentTheme.lineColor}`}
                  >
                    {unit.content}
                  </p>
                )}
              </div>
            );
          }

          // 6. Plain Prose Line
          return (
            <p
              key={idx}
              className={`${fontClass} font-normal tracking-normal ${currentTheme.lineColor} ${verseSizeClass}`}
            >
              {unit.text}
            </p>
          );
        })}
      </div>

      {/* Attribution Footnote Citation */}
      {parsed.attribution && (
        <div className="mt-5 pt-3 border-t border-amber-900/10 flex items-center justify-end text-xs font-serif text-amber-900/85 italic gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-amber-700 opacity-80 shrink-0" />
          <span>— {parsed.attribution}</span>
        </div>
      )}
    </div>
  );
};
