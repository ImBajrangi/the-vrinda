import React, { useState, useRef, useEffect } from 'react';
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
  fontClass?: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  textAlignClass?: string;
  currentTheme: {
    lineColor: string;
    titleColor: string;
    metaColor: string;
  };
  hideToolbar?: boolean;
}

export const DevotionalVersePresenter: React.FC<DevotionalVersePresenterProps> = ({
  lines,
  fontClass = 'font-laila',
  fontSize,
  textAlignClass: textAlignClassProp,
  currentTheme,
  hideToolbar = false,
}) => {
  const parsed = parseDevotionalContent(lines);

  // Reader Preferences: Default to centered alignment for classical rhythmic poetry
  const [alignment, setAlignment] = useState<'center' | 'left'>(() => {
    return parsed.hasStanzas ? 'center' : 'left';
  });
  const [showMeanings, setShowMeanings] = useState<boolean>(true);
  const [focusedStanzaIndex, setFocusedStanzaIndex] = useState<number | null>(null);

  // Alignment Toggle Elastic Sliding Indicator
  const alignRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [alignPillStyle, setAlignPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateAlignPill = () => {
      const el = alignRefs.current[alignment];
      if (el) {
        setAlignPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setAlignPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateAlignPill();
    const frame = requestAnimationFrame(updateAlignPill);
    const timer = setTimeout(updateAlignPill, 40);
    window.addEventListener('resize', updateAlignPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateAlignPill);
    };
  }, [alignment]);

  const verseSizeClass =
    fontSize === 'sm'
      ? 'text-[17px] sm:text-[19px] leading-[2.1]'
      : fontSize === 'md'
        ? 'text-[20px] sm:text-[22px] leading-[2.2]'
        : fontSize === 'lg'
          ? 'text-[23px] sm:text-[25px] leading-[2.3]'
          : 'text-[26px] sm:text-[28px] leading-[2.4]';

  const textAlignClass =
    hideToolbar && textAlignClassProp
      ? textAlignClassProp
      : alignment === 'center'
        ? 'text-center'
        : 'text-left';

  return (
    <div className="space-y-4 py-1 select-text">
      {/* Ease-of-Reading Utility Toolbar */}
      {!hideToolbar && (
        <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 gap-2 flex-wrap text-xs">
          {/* Left: Reading guidance hint */}
          <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline-flex items-center gap-1">
            <ScrollText className="w-3 h-3 text-amber-600" />
            <span>Focus Mode प्रारम्भ करें</span>
          </span>

          {/* Right: Alignment & Commentary Toggles */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Poetic Stanza Layout Toggle (Center vs Left) with Elastic Sliding Indicator */}
            <div className="relative flex items-center bg-white/95 border border-neutral-200/80 shadow-2xs p-0.5 rounded-full">
              {/* Dynamic Elastic Sliding Indicator Bar */}
              {alignPillStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 bottom-0.5 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width] z-0 shadow-2xs"
                  style={{
                    transform: `translate3d(${alignPillStyle.left}px, 0, 0)`,
                    width: `${alignPillStyle.width}px`,
                    left: 0,
                  }}
                />
              )}
              <button
                ref={(el) => {
                  alignRefs.current['center'] = el;
                }}
                type="button"
                onClick={() => setAlignment('center')}
                className={`relative z-10 h-6 px-2.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors duration-150 cursor-pointer select-none ${alignment === 'center'
                    ? 'text-[#18181B] font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                title="संकीर्तन / मध्यस्थ लय (Centered)"
              >
                <AlignCenter className="w-2.5 h-2.5" />
                <span>मध्यस्थ</span>
              </button>
              <button
                ref={(el) => {
                  alignRefs.current['left'] = el;
                }}
                type="button"
                onClick={() => setAlignment('left')}
                className={`relative z-10 h-6 px-2.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors duration-150 cursor-pointer select-none ${alignment === 'left'
                    ? 'text-[#18181B] font-bold'
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
      )}

      {/* Main Devotional Presentation Body */}
      <div className={`space-y-4 ${textAlignClass}`}>
        {parsed.units.map((unit, idx) => {
          // 1. Festive / Darshan Poem Title (e.g. "झूलन उत्सव संध्या दर्शन")
          if (unit.type === 'poem_title') {
            return (
              <div key={idx} className="text-center pt-2 pb-1 select-none">
                <h3 className={`inline-block px-3.5 py-1 rounded-full text-sm sm:text-base font-serif font-bold text-amber-950 bg-amber-100/60 border border-amber-300/40 ${fontClass}`}>
                  ॥ {unit.text} ॥
                </h3>
              </div>
            );
          }

          // 1B. Sacred Meter Badge (e.g. "॥ दोहा ॥", "॥ चौपाई ॥", "॥ सोरठा ॥")
          if (unit.type === 'meter_badge') {
            return (
              <div key={idx} className="flex items-center justify-center pt-2 pb-1 select-none">
                <span className="px-3.5 py-0.5 rounded-full text-xs font-serif font-bold bg-[#FEF08A] text-[#78350F] shadow-2xs border border-amber-300/60">
                  ॥ {unit.name} ॥
                </span>
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
                className={`group/stanza relative py-3 px-3.5 sm:px-4 rounded-xl transition-colors duration-200 cursor-pointer ${isFocused
                    ? 'bg-amber-50/70 shadow-2xs'
                    : 'hover:bg-amber-50/30'
                  }`}
                title="टैप करके इस चरण पर एकाग्रता पाठ करें"
              >
                {/* Floating Stanza Numeral Badge */}
                {!hideToolbar && unit.stanzaNumber && (
                  <span
                    className={`inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors select-none ${isFocused
                        ? 'bg-[#FEF08A] text-[#78350F]'
                        : 'bg-neutral-100 text-neutral-400 group-hover/stanza:text-amber-800 group-hover/stanza:bg-amber-100/60'
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
                      className={`${fontClass} ${lIdx === 0 ? 'font-semibold' : 'font-normal sm:font-medium'
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

      {/* Extracted Sacred Translation / Meaning (Commentary) */}
      {parsed.translations && parsed.translations.length > 0 && (
        <div className="mt-5 pt-3 border-t border-amber-900/10 text-left space-y-1.5 select-text">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1 select-none">
            <ScrollText className="w-3 h-3 text-amber-700" />
            <span>भावार्थ • English Commentary</span>
          </span>
          {parsed.translations.map((tr, tIdx) => (
            <p key={tIdx} className="text-xs sm:text-sm font-serif text-neutral-700 leading-relaxed font-normal">
              {tr}
            </p>
          ))}
        </div>
      )}

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
