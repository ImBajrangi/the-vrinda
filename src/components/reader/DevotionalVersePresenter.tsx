import React, { useState } from 'react';
import { Sparkles, MapPin, BookOpen, ScrollText, Eye, EyeOff } from 'lucide-react';
import { parseDevotionalContent } from '../../utils/devotionalContentParser';

interface DevotionalVersePresenterProps {
  lines: string[];
  fontClass: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  textAlignClass: string;
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
  textAlignClass,
  currentTheme,
}) => {
  const [showMeanings, setShowMeanings] = useState(true);
  const parsed = parseDevotionalContent(lines);

  const verseSizeClass =
    fontSize === 'sm'
      ? 'text-[17px] sm:text-[19px] leading-[2.1]'
      : fontSize === 'md'
      ? 'text-[20px] sm:text-[22px] leading-[2.2]'
      : fontSize === 'lg'
      ? 'text-[23px] sm:text-[25px] leading-[2.3]'
      : 'text-[26px] sm:text-[28px] leading-[2.4]';

  return (
    <div className="space-y-4 py-1">
      {/* Optional Mode Toggle when Inherent Verse Pairs are detected */}
      {parsed.hasVersePairs && (
        <div className="flex items-center justify-end pb-1 border-b border-amber-900/5">
          <button
            type="button"
            onClick={() => setShowMeanings(!showMeanings)}
            className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 shadow-2xs"
            title="भावार्थ दिखाएँ या छिपाएँ"
          >
            {showMeanings ? (
              <>
                <EyeOff className="w-3 h-3 text-amber-800" />
                <span>केवल मूल पद</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-amber-800" />
                <span>पद एवं भावार्थ</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Structured Inherently Distributed Units */}
      <div className={`space-y-3.5 ${textAlignClass}`}>
        {parsed.units.map((unit, idx) => {
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

          if (unit.type === 'section_header') {
            const isLocation = unit.title.includes('स्थान');
            const isLeela = unit.title.includes('लीला');
            const isKatha = unit.title.includes('कथा') || unit.title.includes('प्रसंग');

            return (
              <div key={idx} className="pt-3 pb-1 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-950 bg-amber-100/90 border border-amber-300/80 shadow-2xs">
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

          // Plain Prose / Couplet Line
          return (
            <p
              key={idx}
              className={`${fontClass} ${
                idx === 0 ? 'font-semibold' : 'font-normal'
              } tracking-normal ${currentTheme.lineColor} ${verseSizeClass}`}
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
