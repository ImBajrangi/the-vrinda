import React, { useMemo, useState } from 'react';
import { BookOpen, Check, RotateCw, Sparkles, X } from 'lucide-react';
import { extractVerseDictionaryWords, WordDefinition } from '../../data/brajDictionary';
import { formatDevanagariNumerals } from '../../services/cacheService';

export interface BrajWordStudyPanelProps {
  verseText: string;
  onClose?: () => void;
}

export const BrajWordStudyPanel: React.FC<BrajWordStudyPanelProps> = ({
  verseText,
  onClose,
}) => {
  const [flippedWords, setFlippedWords] = useState<Record<string, boolean>>({});
  const [masteredWords, setMasteredWords] = useState<Record<string, boolean>>({});

  const relevantWords: WordDefinition[] = useMemo(
    () => extractVerseDictionaryWords(verseText),
    [verseText]
  );

  const toggleFlip = (word: string) => {
    setFlippedWords((prev) => ({ ...prev, [word]: !prev[word] }));
  };

  const toggleMastered = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    setMasteredWords((prev) => ({ ...prev, [word]: !prev[word] }));
  };

  const masteredCount = Object.values(masteredWords).filter(Boolean).length;
  const pct = relevantWords.length > 0 ? Math.round((masteredCount / relevantWords.length) * 100) : 0;

  return (
    <section
      aria-label="ब्रज शब्दकोश अध्ययन (Braj Word Study)"
      className="rounded-[26px] bg-[#FAF8F4] p-3.5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <h3 className="font-rozha text-sm sm:text-base font-bold text-neutral-900">
              ब्रज शब्दार्थ अध्ययन (Word Study)
            </h3>
            {relevantWords.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#78350F] text-[11px] font-serif font-bold">
                {formatDevanagariNumerals(masteredCount)}/{formatDevanagariNumerals(relevantWords.length)} कंठस्थ
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs font-serif text-neutral-600">
            किसी भी शब्द कार्ड पर टैप करके ब्रजभाषा व संस्कृत अर्थ देखें।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {relevantWords.length > 0 && (
            <div className="hidden sm:block w-24 h-1.5 rounded-full bg-[#EFE7D8] overflow-hidden">
              <div
                className="h-full bg-[#D97706] rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white text-neutral-600 hover:bg-[#EFE7D8] transition-colors cursor-pointer"
              aria-label="शब्दार्थ बंद करें"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {relevantWords.length === 0 ? (
        <div className="rounded-[12px] bg-white p-5 text-center space-y-1.5">
          <Sparkles className="w-6 h-6 text-amber-600 mx-auto" />
          <p className="font-serif font-bold text-xs sm:text-sm text-neutral-800">
            इस पद की शब्दावली सरल व सहज ब्रजभाषा में है।
          </p>
          <p className="text-[11px] font-serif text-neutral-500">
            विस्तृत पारिभाषिक शब्दों के लिए मुख्य ‘ब्रज शब्दकोश’ देखें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {relevantWords.map((item) => {
            const isFlipped = !!flippedWords[item.word];
            const isMastered = !!masteredWords[item.word];

            return (
              <div
                key={item.word}
                role="button"
                tabIndex={0}
                onClick={() => toggleFlip(item.word)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFlip(item.word);
                  }
                }}
                className={`rounded-[12px] p-3.5 transition-colors cursor-pointer flex flex-col justify-between gap-2.5 min-h-[124px] select-none ${
                  isMastered
                    ? 'bg-emerald-50/75'
                    : isFlipped
                      ? 'bg-[#FFFDF9] shadow-[0_2px_10px_rgba(24,24,27,0.03)]'
                      : 'bg-white hover:bg-[#FFFDF9]'
                }`}
              >
                {!isFlipped ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-serif">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#FAF8F4] text-amber-900 font-bold">
                        {item.category}
                      </span>
                      <span className="text-neutral-400 inline-flex items-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        <span>अर्थ देखें</span>
                      </span>
                    </div>
                    <div className="pt-1 text-center">
                      <div className="font-rozha text-xl font-bold text-neutral-900">{item.word}</div>
                      <div className="text-[11px] font-mono text-amber-800">{item.translit}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-serif text-neutral-500">
                      <span>{item.word} ({item.translit})</span>
                      <RotateCw className="w-3 h-3 text-neutral-400" />
                    </div>
                    <p className="text-xs font-serif font-bold text-neutral-900 leading-snug">
                      {item.meaning}
                    </p>
                    <p className="text-[11px] font-sans text-neutral-500 italic leading-snug">
                      {item.english}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-serif text-neutral-400">
                    {isFlipped ? 'हिन्दी व English' : 'टैप करें'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => toggleMastered(e, item.word)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-serif font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      isMastered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#FAF8F4] text-neutral-700 hover:bg-[#EFE7D8]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{isMastered ? 'कंठस्थ' : 'याद हुआ'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BrajWordStudyPanel;
