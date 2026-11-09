import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  ArrowRight,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  Search,
  Feather
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
    totalVerses: 12301,
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
  const [activeVerseId, setActiveVerseId] = useState<string>('');

  // Shrinkable Sidebars States with LocalStorage Persistence
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vrind_epic_reader_left_collapsed') === 'true';
    }
    return false;
  });

  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vrind_epic_reader_right_collapsed') === 'true';
    }
    return false;
  });

  const [tocFilterSection, setTocFilterSection] = useState<string>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activePurportId, setActivePurportId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  // Load persistent bookmarks on mount
  useEffect(() => {
    getCachedBookmarks().then(setBookmarkedIds).catch(() => {});
  }, []);

  const handleToggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vrind_epic_reader_left_collapsed', String(next));
      }
      return next;
    });
  };

  const handleToggleRightSidebar = () => {
    setIsRightSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vrind_epic_reader_right_collapsed', String(next));
      }
      return next;
    });
  };

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
      if (padas.length > 0) {
        setActiveVerseId(padas[0].id);
      }
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
      if (c.section && c.section !== 'मूल पाठ') secSet.add(c.section);
    });
    return Array.from(secSet);
  }, [epicIndex]);

  const filteredChapters = useMemo(() => {
    if (!epicIndex) return [];
    let list = epicIndex.chapters;
    if (tocFilterSection !== 'all') {
      list = list.filter((c) => c.section === tocFilterSection);
    }
    if (chapterSearchQuery.trim()) {
      const q = chapterSearchQuery.toLowerCase().trim();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    return list;
  }, [epicIndex, tocFilterSection, chapterSearchQuery]);

  const activePad = useMemo(() => {
    return chapterPadas.find((p) => p.id === activeVerseId) || chapterPadas[0] || null;
  }, [chapterPadas, activeVerseId]);

  const handleSelectGrantha = (gId: string) => {
    navigationProgress.start();
    setSelectedGranthaId(gId);
    setTocFilterSection('all');
    setChapterSearchQuery('');
    if (onSelectGrantha) onSelectGrantha(gId);
    requestAnimationFrame(() => navigationProgress.done());
  };

  const handleSelectChapter = (chId: string) => {
    navigationProgress.start();
    setSelectedChapterId(chId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="mb-6 p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] bg-white border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-[8px] text-[10px] font-mono font-bold tracking-wider uppercase bg-[#FEF08A] text-[#78350F]">
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
                className="w-10 h-14 rounded-[4px_6px_6px_4px] text-white flex flex-col justify-between p-1.5 shadow-sm shrink-0"
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

      {/* ========================================================================= */}
      {/* 3-Column Desk Architecture (Identical to Padavali & Chhand Sanctuary)      */}
      {/* Left Column: Sarga/Chapter Rail | Center: Main Canvas | Right: Commentary */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col md:flex-row items-start gap-4 sm:gap-6 transition-all duration-300">

        {/* ========================================================================= */}
        {/* Left Column: Sarga/Chapter Catalog Desk (Desktop: hidden md:block)         */}
        {/* ========================================================================= */}
        <aside
          className={`hidden md:block sticky top-24 shrink-0 overflow-hidden rounded-[28px] sm:rounded-[32px] border border-amber-900/10 bg-[#FAF8F5] shadow-xs transition-[width,min-width,max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width] ${
            isLeftSidebarCollapsed
              ? 'w-14 min-w-[56px] max-w-[56px]'
              : 'w-72 lg:w-80 min-w-[288px] lg:min-w-[320px] max-w-[320px]'
          }`}
        >
          <div className="relative w-full h-full min-h-[520px] max-h-[82vh] flex flex-col">
            {/* Shrunk / Compact Icon Rail Layer */}
            <div
              className={`absolute inset-0 flex flex-col items-center p-2.5 transition-all duration-300 ease-out z-10 ${
                isLeftSidebarCollapsed
                  ? 'opacity-100 pointer-events-auto delay-150'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Expand Toggle */}
              <button
                type="button"
                onClick={handleToggleLeftSidebar}
                className="w-9 h-9 rounded-[8px] hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                title="Expand Sarga Index (सर्ग/अध्याय सूची खोलें)"
                aria-label="Expand Sarga Index"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#CA8A04]" />
              </button>

              <div className="w-6 h-px bg-amber-900/10 my-2" />

              {/* Shrunk Quick Search Icon - reopens with search */}
              <button
                type="button"
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="w-9 h-9 rounded-[8px] hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                title="Search Chapters (अध्याय खोजें)"
              >
                <Search className="w-4 h-4" />
              </button>

              <div className="w-6 h-px bg-amber-900/10 my-2" />

              {/* Vertical Scrollable Numbered Shloka Badges Rail */}
              <div className="flex-1 w-full space-y-1.5 overflow-y-auto no-scrollbar py-1">
                {chapterPadas.map((pad, idx) => {
                  const isSelected = activeVerseId === pad.id;
                  return (
                    <button
                      key={pad.id}
                      type="button"
                      onClick={() => {
                        setActiveVerseId(pad.id);
                        const el = document.getElementById(`shloka-${pad.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      title={`श्लोक ${idx + 1}: ${pad.titleDevanagari}`}
                      className={`w-9 h-9 mx-auto rounded-[8px] flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-xs'
                          : 'text-[#64748B] hover:bg-black/5'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Expanded Left Sidebar Layer */}
            <div
              className={`w-72 lg:w-80 flex flex-col h-full max-h-[82vh] transition-all duration-300 ease-out ${
                isLeftSidebarCollapsed
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100 pointer-events-auto delay-100'
              }`}
            >
              {/* Header with Active Scripture Name, Counter & Shrink Button */}
              <div className="p-4 border-b border-amber-900/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-serif font-bold text-neutral-900 truncate">
                      {currentEpicConfig.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-[#CA8A04] border border-amber-900/10">
                      {epicIndex?.totalChapters || 0} सर्ग
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleLeftSidebar}
                      className="w-6 h-6 rounded-[6px] hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      title="Shrink Sidebar (सूची समेटें)"
                      aria-label="Shrink Sarga Index Sidebar"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Instant Sarga / Chapter Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={chapterSearchQuery}
                    onChange={(e) => setChapterSearchQuery(e.target.value)}
                    placeholder="सर्ग / अध्याय खोजें..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[8px] bg-white border border-neutral-200/80 focus:border-amber-400 focus:outline-none text-neutral-800 placeholder-neutral-400"
                  />
                  {chapterSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setChapterSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-neutral-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Section Filter Pills (Kandas / Skandhas) */}
                {sectionsList.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    <button
                      type="button"
                      onClick={() => setTocFilterSection('all')}
                      className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        tocFilterSection === 'all'
                          ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                          : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/60'
                      }`}
                    >
                      समस्त
                    </button>
                    {sectionsList.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTocFilterSection(sec)}
                        className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          tocFilterSection === sec
                            ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/60'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Chapters List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingIndex ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <IOSSpinner size="sm" theme="amber" />
                    <p className="font-serif text-xs text-neutral-400">अनुक्रमणिका संकलित हो रही है...</p>
                  </div>
                ) : (
                  filteredChapters.map((ch) => {
                    const isSelected = ch.id === selectedChapterId;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectChapter(ch.id)}
                        className={`w-full text-left p-2.5 rounded-[8px] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                            : 'hover:bg-white text-neutral-700'
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
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* Center Column: Continuous Sacred Shloka Reading Stream                    */}
        {/* ========================================================================= */}
        <article
          id="epic-canvas-top"
          className={`flex-1 min-w-0 w-full bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 border border-neutral-200/80 shadow-xs transition-all duration-300 ${
            isLeftSidebarCollapsed && isRightSidebarCollapsed ? 'max-w-4xl mx-auto' : ''
          }`}
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

            {/* Quick Sizing Control Pill */}
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
                const isActive = activeVerseId === pad.id;

                return (
                  <div
                    key={pad.id}
                    id={`shloka-${pad.id}`}
                    onClick={() => setActiveVerseId(pad.id)}
                    className={`p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] border transition-colors duration-200 space-y-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#FAF8F5] border-amber-300 ring-1 ring-amber-300/60 shadow-xs'
                        : 'bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] border-amber-900/10'
                    }`}
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
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                className="px-4 py-2.5 rounded-[8px] bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>पिछला: {prevChapter.name}</span>
              </button>
            ) : <div />}

            {nextChapter && (
              <button
                type="button"
                onClick={() => handleSelectChapter(nextChapter.id)}
                className="px-5 py-2.5 rounded-[8px] bg-[#FEF08A] hover:bg-amber-300 text-xs font-bold text-[#78350F] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs self-end sm:self-auto"
              >
                <span>अगला सर्ग/अध्याय: {nextChapter.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Epic Commentary Desk (Desktop: hidden xl:block)   */}
        {/* ========================================================================= */}
        <aside
          className={`hidden xl:block sticky top-24 shrink-0 overflow-hidden rounded-[28px] sm:rounded-[32px] border border-amber-900/10 bg-[#FAF8F5] shadow-xs transition-[width,min-width,max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width] ${
            isRightSidebarCollapsed
              ? 'w-14 min-w-[56px] max-w-[56px]'
              : 'w-72 lg:w-80 min-w-[288px] lg:min-w-[320px] max-w-[320px]'
          }`}
        >
          <div className="relative w-full h-full min-h-[520px] flex flex-col">
            {/* Shrunk / Compact Commentary Rail Layer */}
            <div
              className={`absolute inset-0 flex flex-col items-center p-2.5 transition-all duration-300 ease-out z-10 ${
                isRightSidebarCollapsed
                  ? 'opacity-100 pointer-events-auto delay-150'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={handleToggleRightSidebar}
                className="w-9 h-9 rounded-[8px] hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                title="Expand Commentary (भावार्थ खोलें)"
                aria-label="Expand Commentary Sidebar"
              >
                <PanelRightOpen className="w-4 h-4 text-[#CA8A04]" />
              </button>

              <div className="w-6 h-px bg-amber-900/10 my-2" />

              <button
                type="button"
                onClick={handleToggleRightSidebar}
                className="w-9 h-9 rounded-[8px] hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                title="Sanatan Purport & Commentary (महाग्रंथ टीका)"
              >
                <Feather className="w-4 h-4" />
              </button>

              <div className="w-6 h-px bg-amber-900/10 my-2" />

              {/* Vertical Sacred Accent Tag */}
              <span
                className="text-[10.5px] font-mono font-bold tracking-widest text-[#B45309] select-none [writing-mode:vertical-lr] rotate-180 py-3 opacity-90"
              >
                महाग्रंथ टीका
              </span>
            </div>

            {/* Full Expanded Right Sidebar Layer */}
            <div
              className={`w-72 lg:w-80 flex flex-col transition-all duration-300 ease-out p-4 space-y-4 ${
                isRightSidebarCollapsed
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100 pointer-events-auto delay-100'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-[#FEF08A] flex items-center justify-center text-[#78350F]">
                    <Feather className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-neutral-900">
                      महाग्रंथ भावार्थ व टीका
                    </h3>
                    <span className="text-[10px] text-amber-800 font-mono font-semibold">
                      Sanatan Purport & Guidance
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRightSidebar}
                  className="w-6 h-6 rounded-[6px] hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  title="Shrink Commentary (समेटें)"
                  aria-label="Shrink Commentary Sidebar"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active Shloka Indicator Pill */}
              {activePad && (
                <div className="bg-white rounded-[10px] p-3 border border-amber-900/10 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#78350F] bg-[#FEF08A] px-2 py-0.5 rounded-[4px]">
                      श्लोक {formatDevanagariNumerals(activePad.index || 1)}
                    </span>
                    <span className="font-serif text-neutral-500 truncate max-w-[150px]">
                      {currentChapter?.name}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-xs text-neutral-900 line-clamp-2">
                    {activePad.titleDevanagari}
                  </h4>
                </div>
              )}

              {/* Divine Summary / Purport Card */}
              <div className="bg-[#FEF9C3]/75 border border-amber-200/80 rounded-[12px] p-3.5 text-xs text-[#451A03] leading-relaxed shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-900 font-serif font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                  <span>दिव्य भाव संक्षेप एवं शास्त्रीय मर्म</span>
                </div>
                <p className="text-xs leading-relaxed text-[#451A03] font-serif font-normal">
                  {activePad?.verses?.[0]?.linesEnglish?.join(' ') ||
                    activePad?.verses?.[0]?.linesTransliteration?.join(' ') ||
                    `${currentEpicConfig.name} का यह पावन श्लोक प्रभु के दिव्य स्वरूप, धर्म एवं आत्म-कल्याण का पवित्र सोपान है।`}
                </p>
              </div>

              {/* Quick Jump Grid for Current Chapter Shlokas */}
              <div className="space-y-1.5 pt-2 border-t border-amber-900/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                  वर्तमान सर्ग के श्लोक ({chapterPadas.length})
                </span>
                <div className="grid grid-cols-5 gap-1.5 max-h-[30vh] overflow-y-auto no-scrollbar pt-1">
                  {chapterPadas.map((pad, idx) => {
                    const isSelected = activeVerseId === pad.id;
                    return (
                      <button
                        key={pad.id}
                        type="button"
                        onClick={() => {
                          setActiveVerseId(pad.id);
                          const el = document.getElementById(`shloka-${pad.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`h-7 rounded-[6px] text-[11px] font-mono font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/60'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};
