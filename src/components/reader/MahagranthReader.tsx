import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ScrollText,
  Bookmark,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { SacredDatabase } from '../../services/sacredDatabase';
import { SacredPad, EpicIndexData } from '../../types/devotional';
import { DevotionalVersePresenter } from './DevotionalVersePresenter';
import { InlinePurportCard } from './InlinePurportCard';
import { formatDevanagariNumerals, getCachedBookmarks, saveCachedBookmarks } from '../../services/cacheService';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';

interface MahagranthReaderProps {
  initialGranthaId?: string;
  initialChapterId?: string;
  onSelectGrantha?: (granthaId: string) => void;
  onSwitchToPadavali?: () => void;
}

const EPICS = [
  {
    id: 'valmiki-ramayana',
    name: 'श्रीमद् वाल्मीकि रामायण',
    author: 'महर्षि वाल्मीकि',
    tag: 'आदिकाव्य',
    kandaLabel: 'काण्ड / सर्ग',
    color: '#047857',
    coverBg: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #0F766E 100%)',
    totalVerses: 14079,
    description: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के पावन चरित्र का अमर महाकाव्य'
  },
  {
    id: 'shrimad-bhagavatam',
    name: 'श्रीमद् भागवत महापुराण',
    author: 'महर्षि वेदव्यास',
    tag: 'अमलरस संहिता',
    kandaLabel: 'स्कन्ध / अध्याय',
    color: '#1E3A8A',
    coverBg: 'linear-gradient(135deg, #172554 0%, #1E40AF 50%, #1D4ED8 100%)',
    totalVerses: 12428,
    description: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा'
  },
  {
    id: 'ramcharitmanas',
    name: 'श्री रामचरितमानस',
    author: 'गोस्वामी तुलसीदास',
    tag: 'अवधी महाकाव्य',
    kandaLabel: 'काण्ड',
    color: '#B45309',
    coverBg: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #D97706 100%)',
    totalVerses: 960,
    description: 'कलयुग तारक प्रभु श्री राम के पावन चरित्र का अवधी महाकाव्य'
  },
  {
    id: 'bhagavad-gita',
    name: 'श्रीमद्भगवद्गीता',
    author: 'महर्षि वेदव्यास',
    tag: 'योगशास्त्र',
    kandaLabel: 'अध्याय',
    color: '#4C1D95',
    coverBg: 'linear-gradient(135deg, #2E1065 0%, #5B21B6 50%, #6D28D9 100%)',
    totalVerses: 658,
    description: 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया आत्मज्ञान'
  },
  {
    id: 'durga-saptashati',
    name: 'श्री दुर्गा सप्तशती',
    author: 'महर्षि मार्कण्डेय',
    tag: 'चण्डी पाठ',
    kandaLabel: 'अध्याय',
    color: '#991B1B',
    coverBg: 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 50%, #DC2626 100%)',
    totalVerses: 555,
    description: 'मार्कण्डेय पुराणान्तर्गत आदिशक्ति माँ भगवती के प्राकट्य व महात्म्य की पवित्र सप्तशती'
  }
];

export const MahagranthReader: React.FC<MahagranthReaderProps> = ({
  initialGranthaId = 'valmiki-ramayana',
  initialChapterId,
  onSelectGrantha,
  onSwitchToPadavali,
}) => {
  const [selectedGranthaId, setSelectedGranthaId] = useState<string>(initialGranthaId);
  const [epicIndex, setEpicIndex] = useState<EpicIndexData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<boolean>(true);

  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterPadas, setChapterPadas] = useState<SacredPad[]>([]);
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);

  const [tocFilterSection, setTocFilterSection] = useState<string>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activePurportId, setActivePurportId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  // Load persistent bookmarks on mount
  useEffect(() => {
    getCachedBookmarks().then(setBookmarkedIds).catch(() => {});
  }, []);

  const currentEpicConfig = useMemo(() => {
    return EPICS.find((e) => e.id === selectedGranthaId) || EPICS[0];
  }, [selectedGranthaId]);

  // Load Epic Index when selectedGranthaId changes
  useEffect(() => {
    let cancelled = false;
    setLoadingIndex(true);
    SacredDatabase.getEpicIndex(selectedGranthaId).then((idx) => {
      if (cancelled) return;
      setEpicIndex(idx);
      setLoadingIndex(false);
      if (idx && idx.chapters.length > 0) {
        const targetChapter = initialChapterId && idx.chapters.some((c) => c.id === initialChapterId)
          ? initialChapterId
          : idx.chapters[0].id;
        setSelectedChapterId(targetChapter);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedGranthaId, initialChapterId]);

  // Load target chapter chunk on-demand (piece-by-piece ~15-35 KB)
  useEffect(() => {
    if (!selectedGranthaId || !selectedChapterId) return;
    let cancelled = false;
    setLoadingChapter(true);
    SacredDatabase.fetchEpicChapter(selectedGranthaId, selectedChapterId).then((padas) => {
      if (cancelled) return;
      setChapterPadas(padas);
      setLoadingChapter(false);
      // Scroll to canvas top smoothly
      const el = document.getElementById('epic-canvas-top');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedGranthaId, selectedChapterId]);

  const currentChapter = useMemo(() => {
    if (!epicIndex) return null;
    return epicIndex.chapters.find((c) => c.id === selectedChapterId) || epicIndex.chapters[0] || null;
  }, [epicIndex, selectedChapterId]);

  const currentChapterIdx = useMemo(() => {
    if (!epicIndex || !currentChapter) return -1;
    return epicIndex.chapters.findIndex((c) => c.id === currentChapter.id);
  }, [epicIndex, currentChapter]);

  const prevChapter = useMemo(() => {
    if (!epicIndex || currentChapterIdx <= 0) return null;
    return epicIndex.chapters[currentChapterIdx - 1];
  }, [epicIndex, currentChapterIdx]);

  const nextChapter = useMemo(() => {
    if (!epicIndex || currentChapterIdx < 0 || currentChapterIdx >= epicIndex.chapters.length - 1) return null;
    return epicIndex.chapters[currentChapterIdx + 1];
  }, [epicIndex, currentChapterIdx]);

  const sectionsList = useMemo(() => {
    if (!epicIndex) return [];
    const secSet = new Set<string>();
    epicIndex.chapters.forEach((c) => {
      if (c.section) secSet.add(c.section);
    });
    return Array.from(secSet);
  }, [epicIndex]);

  const filteredChapters = useMemo(() => {
    if (!epicIndex) return [];
    if (tocFilterSection === 'all') return epicIndex.chapters;
    return epicIndex.chapters.filter((c) => c.section === tocFilterSection);
  }, [epicIndex, tocFilterSection]);

  const handleSelectGrantha = (gId: string) => {
    navigationProgress.start();
    setSelectedGranthaId(gId);
    setTocFilterSection('all');
    if (onSelectGrantha) onSelectGrantha(gId);
    requestAnimationFrame(() => navigationProgress.done());
  };

  const handleSelectChapter = (chId: string) => {
    navigationProgress.start();
    setSelectedChapterId(chId);
    requestAnimationFrame(() => navigationProgress.done());
  };

  const handleCopyPad = (pad: SacredPad) => {
    const text = (pad.verses?.[0]?.linesDevanagari || []).join('\n') || pad.titleDevanagari;
    navigator.clipboard?.writeText(text);
    setCopiedSlug(pad.slug || pad.id);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleToggleBookmark = (padId: string) => {
    const exists = bookmarkedIds.includes(padId);
    const updated = exists ? bookmarkedIds.filter((id) => id !== padId) : [...bookmarkedIds, padId];
    setBookmarkedIds(updated);
    saveCachedBookmarks(updated);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      {/* Top Banner: Sanatan Mahagranth Parayan Gateway */}
      <div className="mb-6 p-4 sm:p-5 rounded-[28px] bg-white border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-[10px] text-[10px] font-mono font-bold tracking-wider uppercase bg-[#FEF08A] text-[#78350F]">
              सनातन महाग्रंथ पारायण
            </span>
            <span className="text-xs font-serif text-neutral-400">
              मूल शास्त्र एवं अखण्ड पाठ धारा
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-neutral-900 mt-1">
            {currentEpicConfig.name}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 max-w-2xl">
            {currentEpicConfig.description} • प्रणेता: <strong className="text-neutral-800">{currentEpicConfig.author}</strong>
          </p>
        </div>

        {/* Action Button: Jump to Rasik Padavali & Chhand */}
        <button
          type="button"
          onClick={onSwitchToPadavali}
          className="px-4 py-2 rounded-[14px] bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-amber-900/10 text-xs font-semibold text-amber-950 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs self-start md:self-auto shrink-0"
        >
          <span>रसिक पद्यावली व छंद देखें</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
        </button>
      </div>

      {/* Scripture Selection Deck (5 Monumental Epics with 3D Pothi Covers) */}
      <div className="mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        {EPICS.map((epic) => {
          const isSelected = selectedGranthaId === epic.id;
          return (
            <div
              key={epic.id}
              onClick={() => handleSelectGrantha(epic.id)}
              className={`shrink-0 flex items-center gap-3 p-3 rounded-2xl cursor-pointer select-none transition-colors duration-150 border ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-400/80 shadow-xs ring-1 ring-amber-300'
                  : 'bg-white hover:bg-[#FAF8F5] border-neutral-200/80 text-neutral-800'
              }`}
            >
              {/* Proportional Mini Pothi Book Cover */}
              <div
                className="w-10 h-14 rounded-[4px_8px_8px_4px] text-white flex flex-col justify-between p-1.5 shadow-sm shrink-0"
                style={{ background: epic.coverBg }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-300/80" />
                <span className="text-[8px] font-serif font-bold text-center leading-tight line-clamp-2">
                  {epic.name.split(' ')[1] || epic.name}
                </span>
                <span className="text-[7px] font-mono text-center opacity-80">
                  {epic.totalVerses}
                </span>
              </div>

              <div className="min-w-0 pr-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                  {epic.tag}
                </span>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {epic.name}
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {epic.totalVerses} श्लोक • {epic.author}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Reading Canvas & Sidebar Grid */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Column: Parayan Navigation Desk & Table of Contents (Hidden on mobile modal) */}
        <aside className="w-full lg:w-80 shrink-0 bg-white rounded-[24px] p-4 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-700" />
              <h3 className="font-serif font-bold text-sm text-neutral-900">
                अध्याय / सर्ग अनुक्रमणिका
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px]">
              {epicIndex?.totalChapters || 0} सर्ग/अध्याय
            </span>
          </div>

          {/* Section Filter Pills (Kandas / Skandhas) */}
          {sectionsList.length > 1 && (
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setTocFilterSection('all')}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  tocFilterSection === 'all'
                    ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                समस्त
              </button>
              {sectionsList.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTocFilterSection(sec)}
                  className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    tocFilterSection === sec
                      ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          {/* Chapters Scroller */}
          {loadingIndex ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <IOSSpinner size="sm" theme="amber" />
              <p className="font-serif text-xs text-neutral-400">अनुक्रमणिका संकलित हो रही है...</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
              {filteredChapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChapter(ch.id)}
                    className={`w-full text-left p-2.5 rounded-[8px] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                        : 'hover:bg-[#FAF8F5] text-neutral-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-serif">{ch.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {ch.section}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-[4px] bg-black/5">
                      {ch.verseCount} श्लोक
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Column: Piece-by-Piece Sacred Reading Canvas */}
        <article
          id="epic-canvas-top"
          className="flex-1 min-w-0 w-full bg-white rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 border border-neutral-200/80 shadow-xs"
        >
          {/* Chapter Header Bar */}
          <div className="pb-5 mb-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentEpicConfig.name}</span>
                <span>•</span>
                <span>{currentChapter?.section || 'पारायण पाठ'}</span>
              </div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-neutral-900 mt-1">
                {currentChapter ? currentChapter.name : 'पावन पाठ'}
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                कुल {chapterPadas.length} श्लोक संकलित • ऑन-डिमांड त्वरित पाठ
              </p>
            </div>

            {/* Quick Sizing & Chapter Selector Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200/80 text-[11px] font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-0.5 rounded-full cursor-pointer ${fontSize === 'sm' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500'}`}
                >
                  अ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('md')}
                  className={`px-2 py-0.5 rounded-full cursor-pointer ${fontSize === 'md' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500'}`}
                >
                  आ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-0.5 rounded-full cursor-pointer ${fontSize === 'lg' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'text-neutral-500'}`}
                >
                  बड़ा
                </button>
              </div>
            </div>
          </div>

          {/* Reading Stream */}
          {loadingChapter ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <IOSSpinner size="md" theme="amber" />
              <p className="font-serif text-sm font-semibold text-neutral-700">
                {currentChapter?.name || 'अध्याय'} संकलित हो रहा है...
              </p>
              <p className="font-mono text-xs text-neutral-400">
                केवल सम्बद्ध सर्ग/अध्याय का त्वरित प्रवाह (~25 KB)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {chapterPadas.map((pad, idx) => {
                const isBookmarked = bookmarkedIds.includes(pad.id);
                const isPurportOpen = activePurportId === pad.id;
                const isCopied = copiedSlug === (pad.slug || pad.id);

                return (
                  <div
                    key={pad.id}
                    className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-[#FAF8F5] border border-amber-900/10 space-y-3"
                  >
                    {/* Verse Meta Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-amber-900/10 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[4px] font-mono font-bold text-[10px] bg-[#FEF08A] text-[#78350F]">
                          श्लोक {formatDevanagariNumerals(pad.index || idx + 1)}
                        </span>
                        <span className="font-serif font-bold text-amber-950 text-xs sm:text-sm">
                          {pad.titleDevanagari}
                        </span>
                      </div>

                      {/* Utility Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyPad(pad)}
                          className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="श्लोक प्रतिलिपि करें"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(pad.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-2xs ${
                            isBookmarked ? 'bg-[#FEF08A] text-[#78350F]' : 'bg-white hover:bg-neutral-100 text-neutral-600'
                          }`}
                          title="बुकमार्क करें"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#CA8A04] text-[#CA8A04]' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePurportId(isPurportOpen ? null : pad.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                            isPurportOpen ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-white hover:bg-amber-100/70 text-amber-900'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-700" />
                          <span>भावार्थ ▾</span>
                        </button>
                      </div>
                    </div>

                    {/* Verse Typography Presentation */}
                    {pad.verses && pad.verses.length > 0 && pad.verses[0]?.linesDevanagari?.length > 0 ? (
                      pad.verses.map((v, vIdx) => (
                        <div key={vIdx} className={vIdx > 0 ? 'mt-3 pt-2 border-t border-amber-900/10' : ''}>
                          <DevotionalVersePresenter
                            lines={v.linesDevanagari}
                            fontClass="font-serif"
                            fontSize={fontSize}
                            textAlignClass="text-center"
                            currentTheme={{
                              lineColor: 'text-[#18181B]',
                              titleColor: 'text-[#78350F]',
                              metaColor: 'text-[#92400E]'
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="py-4 flex flex-col items-center justify-center text-center space-y-1 select-none">
                        <IOSSpinner size="xs" theme="amber" />
                        <p className="font-serif text-xs text-neutral-500">श्लोक संकलित हो रहा है...</p>
                      </div>
                    )}

                    {/* Inline Purport Drawer */}
                    <InlinePurportCard pad={pad} isOpen={isPurportOpen} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Sequential Chapter Transition Footer */}
          <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(prevChapter.id)}
                className="px-4 py-2.5 rounded-[12px] bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>पिछला: {prevChapter.name}</span>
              </button>
            ) : <div />}

            {nextChapter && (
              <button
                type="button"
                onClick={() => handleSelectChapter(nextChapter.id)}
                className="px-5 py-2.5 rounded-[12px] bg-[#FEF08A] hover:bg-amber-300 text-xs font-bold text-[#78350F] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs self-end sm:self-auto"
              >
                <span>अगला सर्ग/अध्याय: {nextChapter.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
