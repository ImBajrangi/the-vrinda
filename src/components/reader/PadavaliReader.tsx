import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Bookmark,
  Search,
  BookOpen,
  Music,
  ChevronLeft,
  ChevronRight,
  Feather,
  X,
  Sparkles,
  Wind,
  SlidersHorizontal,
  BookOpenCheck,
  Copy,
  Check,
  Type,
} from 'lucide-react';
import { SacredDatabase } from '../../services/sacredDatabase';
import { SacredPad } from '../../types/devotional';
import { seo } from '../../services/seoService';
import {
  getReaderStateSync,
  saveReaderState,
  saveCachedBookmarks,
  getCachedBookmarks,
  initMultiTabSync,
  formatDevanagariNumerals,
} from '../../services/cacheService';
import {
  getCachedDevotionalSummarySync,
  getDevotionalSummary,
  DevotionalSummaryRequest,
} from '../../services/devotionalSummaryService';

interface PadavaliReaderProps {
  onPlayPad: (pad: SacredPad) => void;
  activePlayingPadId?: string;
  isPlaying?: boolean;
  selectedGranthaId?: string;
  selectedSearchQuery?: string;
  initialPadId?: string;
}

type ReaderTheme = 'ivory' | 'mint' | 'chandan' | 'night';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderFontFamily = 'serif' | 'devanagari';

export const PadavaliReader: React.FC<PadavaliReaderProps> = ({
  onPlayPad,
  activePlayingPadId,
  isPlaying,
  selectedGranthaId,
  selectedSearchQuery,
  initialPadId,
}) => {
  const allPadas = SacredDatabase.getAllPadas();
  const allGranthas = SacredDatabase.getAllGranthas();

  const [searchQuery, setSearchQuery] = useState(selectedSearchQuery || '');
  const [selectedGrantha, setSelectedGrantha] = useState<string>(
    selectedGranthaId || getReaderStateSync().selectedTradition || 'all'
  );
  const [selectedRaga, setSelectedRaga] = useState<string>('all');
  const [sidebarQuery, setSidebarQuery] = useState('');

  // Scripture Category Pills Sliding Indicator
  const granthaRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [granthaPillStyle, setGranthaPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const el = granthaRefs.current[selectedGrantha];
    if (el) {
      setGranthaPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [selectedGrantha]);

  // Dynamically compute available classical ragas based on selected scripture collection
  const availableRagas = useMemo(() => {
    return SacredDatabase.getAvailableRagas(selectedGrantha);
  }, [selectedGrantha]);

  // Raga Sub-Filter Strip Elastic Indicator
  const ragaRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [ragaPillStyle, setRagaPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const el = ragaRefs.current[selectedRaga];
    if (el) {
      setRagaPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [selectedRaga, availableRagas]);

  // Desktop Sidebar Pada List Elastic Sliding Indicator
  const sidebarItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [sidebarPillStyle, setSidebarPillStyle] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

  // Mobile Horizontal Carousel Elastic Sliding Indicator
  const mobilePadRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [mobilePillStyle, setMobilePillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const initialReader = getReaderStateSync();
  const initialPad =
    (initialPadId && allPadas.find((p) => p.id === initialPadId)) ||
    allPadas.find((p) => p.id === initialReader.lastPadId) ||
    allPadas[0];

  const [selectedPad, setSelectedPad] = useState<SacredPad>(initialPad);

  useEffect(() => {
    if (selectedGranthaId) {
      setSelectedGrantha(selectedGranthaId);
    }
  }, [selectedGranthaId]);

  useEffect(() => {
    if (selectedSearchQuery !== undefined) {
      setSearchQuery(selectedSearchQuery);
    }
  }, [selectedSearchQuery]);
  // Backward compatibility alias for boundary test assertions
  const selectedTradition = selectedGrantha;

  // Real-time Dynamic Verse SEO, Meta tags, and Schema.org synchronization
  useEffect(() => {
    if (selectedPad) {
      seo.updateSEO({
        tab: 'padavali',
        pad: selectedPad,
        title: `${selectedPad.titleDevanagari} (${selectedPad.author})`,
        description:
          selectedPad.verses?.[0]?.bhavarth ||
          `राग ${selectedPad.rag} में निबद्ध पावन पद। रचयिता: ${selectedPad.author}। वृन्दोपनिषद् 2.0`,
      });
    }
  }, [selectedPad]);

  const [showTransliteration, setShowTransliteration] = useState(
    initialReader.showTransliteration ?? true
  );
  const [bookmarkedPadIds, setBookmarkedPadIds] = useState<string[]>(
    initialReader.bookmarkedPadIds || []
  );
  const [isCommentaryOpen, setIsCommentaryOpen] = useState(false);
  const [isCommentaryClosing, setIsCommentaryClosing] = useState(false);
  const [activeStanzaIndex, setActiveStanzaIndex] = useState(0);
  const [isFocusReadingMode, setIsFocusReadingMode] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState(30);

  // Reader Customizer States
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('ivory');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('md');
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>('serif');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isGlossaryClosing, setIsGlossaryClosing] = useState(false);
  const [copiedStanzaIdx, setCopiedStanzaIdx] = useState<number | null>(null);
  const [playbackPace, setPlaybackPace] = useState<'0.8x' | '1.0x' | '1.2x'>('1.0x');

  // Devotional Summary States
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string>('');

  const handleCloseCommentary = () => {
    setIsCommentaryClosing(true);
    setTimeout(() => {
      setIsCommentaryOpen(false);
      setIsCommentaryClosing(false);
    }, 200);
  };

  const handleCloseGlossary = () => {
    setIsGlossaryClosing(true);
    setTimeout(() => {
      setIsGlossaryOpen(false);
      setIsGlossaryClosing(false);
    }, 200);
  };

  // Lock body scroll when either mobile commentary drawer or lexicon sheet modal is active
  useEffect(() => {
    if (isGlossaryOpen || isCommentaryOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isGlossaryOpen, isCommentaryOpen]);


  // Defensive parsing for clean title, accurate author attribution, and grantha pill
  const { cleanTitle, authorName, granthaRef } = useMemo(() => {
    let clean = selectedPad.titleDevanagari || '';
    let author = selectedPad.author || '';
    let grantha = (selectedPad as { grantha?: string }).grantha || '';

    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
      clean = parts[0].trim();
      const meta = parts.slice(1).join(' - ').trim();
      if (meta.includes(',')) {
        const sub = meta.split(',');
        if (!author || author.includes('परंपरा') || author.includes('ब्रज रसिक')) {
          author = sub[0].trim();
        }
        if (!grantha) {
          grantha = sub.slice(1).join(',').trim();
        }
      } else if (meta.startsWith('श्री') || meta.startsWith('जगद्गुरु') || /शरण|दास|देव|वल्लभ|हरिदास|हित|सूरदास|मीरा/.test(meta)) {
        if (!author || author.includes('परंपरा') || author.includes('ब्रज रसिक')) {
          author = meta.trim();
        }
      } else if (!grantha) {
        grantha = meta.trim();
      }
    }
    return { cleanTitle: clean, authorName: author, granthaRef: grantha };
  }, [selectedPad]);

  const granthaDisplayName = useMemo(() => {
    if (granthaRef) return granthaRef.toUpperCase();
    const g = allGranthas.find((item) => item.id === selectedPad.collectionId);
    if (g) return `${g.name.toUpperCase()} (${g.author})`;
    if (selectedPad.collectionId === 'stotras') return 'STOTRAMALA (स्तोत्रमाला संग्रह)';
    return 'SACRED RASIK VANI (पावन वाणी संग्रह)';
  }, [allGranthas, selectedPad, granthaRef]);

  const summaryReq: DevotionalSummaryRequest = useMemo(() => {
    const canonicalId =
      selectedPad.id === 'shri-radha-kripa-kataksha-stotram' || selectedPad.id === 'radha-kripa-kataksha'
        ? 'shri-radha-kripa-kataksha-stotram-1'
        : selectedPad.id.startsWith('hit-chaurasi-01')
        ? 'hit-chaurasi-01-1'
        : selectedPad.id;

    const verseText =
      selectedPad.verses?.map((v) => v.linesDevanagari?.join(' ')).filter(Boolean).join('\n') ||
      selectedPad.titleDevanagari;

    return {
      id: canonicalId,
      text: verseText,
      source: selectedPad.collectionId || selectedPad.rag,
      author: selectedPad.author,
      type: 'pad',
      fallbackText: selectedPad.verses?.[0]?.bhavarth,
      collectionId: selectedPad.collectionId,
      padId: selectedPad.id,
      stanzaNumber: 1,
    };
  }, [selectedPad]);

  useEffect(() => {
    // Synchronous 0ms peek check against L1 cache and localStorage buffer
    const peek = getCachedDevotionalSummarySync(summaryReq);
    if (peek) {
      setSummaryText(peek);
      setIsSummaryLoading(false);
    } else {
      setSummaryText('');
      if (isSummaryOpen || isCommentaryOpen) {
        setIsSummaryLoading(true);
        getDevotionalSummary(summaryReq)
          .then((res) => {
            setSummaryText(res.summary);
          })
          .catch(() => {
            setSummaryText(
              summaryReq.fallbackText ||
                'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'
            );
          })
          .finally(() => {
            setIsSummaryLoading(false);
          });
      }
    }
  }, [summaryReq, isSummaryOpen, isCommentaryOpen]);

  const handleToggleSummary = () => {
    const nextState = !isSummaryOpen;
    setIsSummaryOpen(nextState);

    if (nextState && !summaryText) {
      const peek = getCachedDevotionalSummarySync(summaryReq);
      if (peek) {
        setSummaryText(peek);
      } else {
        setIsSummaryLoading(true);
        getDevotionalSummary(summaryReq)
          .then((res) => {
            setSummaryText(res.summary);
          })
          .catch(() => {
            setSummaryText(
              summaryReq.fallbackText ||
                'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'
            );
          })
          .finally(() => {
            setIsSummaryLoading(false);
          });
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    getCachedBookmarks().then((bookmarks) => {
      if (isMounted && bookmarks) {
        setBookmarkedPadIds(bookmarks);
      }
    });

    const cleanupSync = initMultiTabSync((event) => {
      if (!isMounted) return;
      if (event.type === 'BOOKMARKS_UPDATED' && Array.isArray(event.payload)) {
        setBookmarkedPadIds(event.payload as string[]);
      } else if (event.type === 'READER_STATE_UPDATED' && event.payload) {
        const payload = event.payload as {
          lastPadId?: string;
          showTransliteration?: boolean;
          bookmarkedPadIds?: string[];
          selectedTradition?: string;
        };
        if (payload.bookmarkedPadIds) {
          setBookmarkedPadIds(payload.bookmarkedPadIds);
        }
        if (typeof payload.showTransliteration === 'boolean') {
          setShowTransliteration(payload.showTransliteration);
        }
      }
    });

    return () => {
      isMounted = false;
      cleanupSync();
    };
  }, []);

  const isBookmarked = bookmarkedPadIds.includes(selectedPad.id);

  const handleToggleBookmark = async () => {
    const exists = bookmarkedPadIds.includes(selectedPad.id);
    const updated = exists
      ? bookmarkedPadIds.filter((id) => id !== selectedPad.id)
      : [...bookmarkedPadIds, selectedPad.id];

    setBookmarkedPadIds(updated);
    await saveCachedBookmarks(updated);
    await saveReaderState({
      bookmarkedPadIds: updated,
      lastPadId: selectedPad.id,
    });
  };

  const handleSelectPad = (pad: SacredPad) => {
    setSelectedPad(pad);
    setActiveStanzaIndex(0);
    saveReaderState({ lastPadId: pad.id });
  };

  const handleToggleTransliteration = () => {
    const next = !showTransliteration;
    setShowTransliteration(next);
    saveReaderState({ showTransliteration: next });
  };

  const handleSelectGrantha = (granthaId: string) => {
    setSelectedGrantha(granthaId);
    setSelectedRaga('all');
    setVisibleCount(30);
    saveReaderState({ selectedTradition: granthaId });
  };

  // Memoized instantaneous search & filter engine
  const filteredPads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPadas.filter((p) => {
      const matchesSearch =
        !q ||
        p.titleDevanagari.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.titleEnglish.toLowerCase().includes(q) ||
        (p.verses[0]?.linesDevanagari?.some((l) => l.toLowerCase().includes(q)) ?? false);

      const matchesTradition =
        selectedTradition === 'all' || p.collectionId === selectedTradition;

      const matchesRaga =
        selectedRaga === 'all' || p.rag === selectedRaga;

      return matchesSearch && matchesTradition && matchesRaga;
    });
  }, [allPadas, searchQuery, selectedTradition, selectedRaga]);

  // Sidebar instant quick-filter for seamless discovery
  const displayedSidebarPads = useMemo(() => {
    if (!sidebarQuery.trim()) return filteredPads;
    const q = sidebarQuery.trim().toLowerCase();
    return filteredPads.filter(
      (p) =>
        p.titleDevanagari.toLowerCase().includes(q) ||
        (p.titleEnglish && p.titleEnglish.toLowerCase().includes(q)) ||
        p.author.toLowerCase().includes(q) ||
        (p.rag && p.rag.toLowerCase().includes(q)) ||
        (p.verses[0]?.linesDevanagari?.some((l) => l.toLowerCase().includes(q)) ?? false)
    );
  }, [filteredPads, sidebarQuery]);

  // Synchronize dynamic vertical elastic sliding pill in desktop sidebar
  useEffect(() => {
    const updateSidebarPill = () => {
      const el = sidebarItemRefs.current[selectedPad.id];
      if (el) {
        setSidebarPillStyle({
          top: el.offsetTop,
          height: el.offsetHeight,
          ready: true,
        });
      } else {
        setSidebarPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };

    updateSidebarPill();
    const timer = setTimeout(updateSidebarPill, 40);
    return () => clearTimeout(timer);
  }, [selectedPad.id, displayedSidebarPads, visibleCount]);

  // Synchronize dynamic horizontal elastic sliding pill in mobile carousel
  useEffect(() => {
    const updateMobilePill = () => {
      const el = mobilePadRefs.current[selectedPad.id];
      if (el) {
        setMobilePillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setMobilePillStyle((prev) => ({ ...prev, ready: false }));
      }
    };

    updateMobilePill();
    const timer = setTimeout(updateMobilePill, 40);
    return () => clearTimeout(timer);
  }, [selectedPad.id, filteredPads, visibleCount]);

  // Current Pada Index in Filtered List for Prev/Next
  const currentIdx = filteredPads.findIndex((p) => p.id === selectedPad.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < filteredPads.length - 1;

  const handlePrevPad = () => {
    if (hasPrev) handleSelectPad(filteredPads[currentIdx - 1]);
  };

  const handleNextPad = () => {
    if (hasNext) handleSelectPad(filteredPads[currentIdx + 1]);
  };

  const handleCopyVerse = (verse: SacredPad['verses'][0], vIdx: number) => {
    const text = [
      `॥ ${selectedPad.titleDevanagari} • पद पंक्ति ${verse.stanzaNumber} ॥`,
      ...(verse.linesDevanagari || []),
      ...(verse.bhavarth ? [`भावार्थ: ${verse.bhavarth}`] : []),
      `— रचयिता: ${selectedPad.author} (${selectedPad.collectionId})`,
      'स्रोत: वृन्दोपनिषद् २.० (Vrindopanishad)',
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedStanzaIdx(vIdx);
      setTimeout(() => setCopiedStanzaIdx(null), 2200);
    }
  };

  // Keyboard navigation for contemplative recitation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' && hasPrev) {
        handlePrevPad();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNextPad();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, currentIdx]);

  const isCurrentPadPlaying = activePlayingPadId === selectedPad.id && Boolean(isPlaying);

  return (
    <div className="w-full pb-44 md:pb-32 pt-2 sm:pt-4">
      {/* ========================================================================= */}
      {/* 1. Serene Light Header & Spotlight Search Bar                             */}
      {/* ========================================================================= */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-[#0F172A] font-bold flex items-center gap-2 leading-tight">
            <BookOpen className="w-5 h-5 text-[#B8934A] shrink-0" />
            <span>Sacred Padavali & Stotras</span>
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Rasik Vani & Sacred Scriptures ({filteredPads.length} verses available)
          </p>
        </div>

        {/* Search Input, Reading Controls & IAST Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search pad, stotra, saint, raga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#D4AF37]/30 placeholder:text-[#94A3B8] shadow-2xs transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Reader Customizer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`h-8 px-3 rounded-full text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isSettingsOpen
                  ? 'bg-[#18181B] text-[#D4AF37]'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
              }`}
              title="Appearance & Typography Controls"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isSettingsOpen ? 'text-[#D4AF37]' : 'text-[#64748B]'}`} />
              <span>Appearance</span>
            </button>

            {/* Braj Sacred Lexicon Button */}
            <button
              type="button"
              onClick={() => setIsGlossaryOpen(true)}
              className="h-8 px-3 rounded-full text-xs font-medium bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Braj Sacred Glossary (शब्दकोश)"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-[#B8934A]" />
              <span>Lexicon</span>
            </button>

            {/* IAST Transliteration Toggle */}
            <button
              type="button"
              onClick={handleToggleTransliteration}
              className={`h-8 px-3 rounded-full text-xs font-medium shadow-2xs transition-colors cursor-pointer shrink-0 ${
                showTransliteration
                  ? 'bg-[#18181B] text-[#D4AF37]'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
              }`}
              title="Toggle IAST Roman Transliteration"
            >
              {showTransliteration ? 'IAST: On' : 'IAST: Off'}
            </button>

            {/* Distraction-Free Reading Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsFocusReadingMode(!isFocusReadingMode)}
              className={`h-8 px-3.5 rounded-full text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isFocusReadingMode
                  ? 'bg-[#18181B] text-[#D4AF37]'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
              }`}
              title="Distraction-Free Reading Mode"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{isFocusReadingMode ? 'Standard' : 'Focus'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Typography & Devotional Ambiance Customizer Floating Tray     */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div className="mb-4 p-4 rounded-2xl bg-white shadow-xs space-y-3 apple-sheet-enter text-[#18181B]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            {/* Font Size Stepper with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                <Type className="w-3.5 h-3.5 text-neutral-600" />
                Font Size:
              </span>
              <div className="relative flex items-center p-1 bg-neutral-100 rounded-full">
                {/* Dynamic Elastic Sliding Pill */}
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                  style={{
                    width: 'calc((100% - 8px) / 4)',
                    left: '4px',
                    transform: `translateX(${['sm', 'md', 'lg', 'xl'].indexOf(fontSize) * 100}%)`,
                  }}
                />
                {[
                  { id: 'sm' as ReaderFontSize, label: 'Small' },
                  { id: 'md' as ReaderFontSize, label: 'Normal' },
                  { id: 'lg' as ReaderFontSize, label: 'Large' },
                  { id: 'xl' as ReaderFontSize, label: 'Extra' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontSize(s.id)}
                    className={`relative z-10 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                      fontSize === s.id
                        ? 'text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Toggle with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                Font:
              </span>
              <div className="relative flex items-center p-1 bg-neutral-100 rounded-full">
                {/* Dynamic Elastic Sliding Pill */}
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                  style={{
                    width: 'calc((100% - 8px) / 2)',
                    left: '4px',
                    transform: `translateX(${fontFamily === 'serif' ? 0 : 100}%)`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFontFamily('serif')}
                  className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    fontFamily === 'serif'
                      ? 'text-white font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Serif (Traditional)
                </button>
                <button
                  type="button"
                  onClick={() => setFontFamily('devanagari')}
                  className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    fontFamily === 'devanagari'
                      ? 'text-white font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Sans (Modern)
                </button>
              </div>
            </div>

            {/* Playback Pace Stepper with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                Audio Pace:
              </span>
              <div className="relative flex items-center p-1 bg-neutral-100 rounded-full">
                {/* Dynamic Elastic Sliding Pill */}
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    left: '4px',
                    transform: `translateX(${Math.max(0, ['0.8x', '1.0x', '1.2x'].indexOf(playbackPace)) * 100}%)`,
                  }}
                />
                {(['0.8x', '1.0x', '1.2x'] as const).map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setPlaybackPace(pace)}
                    className={`relative z-10 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-colors duration-200 cursor-pointer ${
                      playbackPace === pace
                        ? 'text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {pace}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ambiance Theme Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
              Ambiance Theme:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ivory' as ReaderTheme, label: 'पावन पत्र', desc: 'Porcelain White', bg: '#FFFFFF', text: '#18181B' },
                { id: 'mint' as ReaderTheme, label: 'तमाल निकुंज', desc: 'Tamal Green', bg: '#F0FDF4', text: '#166534' },
                { id: 'chandan' as ReaderTheme, label: 'चन्दन प्रभा', desc: 'Chandan Gold', bg: '#FAF9F5', text: '#3D260F' },
                { id: 'night' as ReaderTheme, label: 'निशीथ ध्यान', desc: 'Twilight Night', bg: '#18181B', text: '#F4F4F5' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReaderTheme(t.id)}
                  style={{ backgroundColor: t.bg, color: t.text }}
                  className={`p-2.5 rounded-xl text-left transition-colors cursor-pointer shadow-2xs ${
                    readerTheme === t.id
                      ? 'ring-2 ring-neutral-900 font-bold'
                      : 'opacity-85'
                  }`}
                >
                  <div className="text-xs font-bold font-devanagari">{t.label}</div>
                  <div className="text-[10px] opacity-70 font-mono">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Canonical Grantha Filter Shelf (Hidden in Distraction-Free Mode)       */}
      {/* ========================================================================= */}
      {!isFocusReadingMode && (
        <div className="mb-5 space-y-2.5">
          {/* Main Grantha Segmented Pill Track */}
          <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-white/90 backdrop-blur-md rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            {granthaPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-[0_2px_10px_rgba(212,175,55,0.15)] pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                style={{
                  transform: `translateX(${granthaPillStyle.left}px)`,
                  width: `${granthaPillStyle.width}px`,
                  left: 0,
                }}
              />
            )}

            <button
              ref={(el) => {
                granthaRefs.current['all'] = el;
              }}
              type="button"
              onClick={() => handleSelectGrantha('all')}
              className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none ${
                selectedGrantha === 'all'
                  ? 'text-white font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              समस्त ग्रंथ <span className={`text-[10px] font-mono ml-0.5 ${selectedGrantha === 'all' ? 'text-[#D4AF37]' : 'text-[#94A3B8]'}`}>({allPadas.length})</span>
            </button>
            {allGranthas.map((g) => {
              const isActive = selectedGrantha === g.id;
              return (
                <button
                  key={g.id}
                  ref={(el) => {
                    granthaRefs.current[g.id] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectGrantha(g.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{g.name}</span>
                  <span className={`ml-1 text-[10px] font-mono ${isActive ? 'text-[#D4AF37]' : 'text-[#94A3B8]'}`}>
                    ({g.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Raga Sub-Filter Strip: Minimal Classical Ragas */}
          {availableRagas.length > 0 && (
            <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar text-xs px-2 py-0.5">
              <span className="text-[10px] font-mono font-bold text-[#997A35] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Music className="w-3 h-3 text-[#B8934A]" />
                राग:
              </span>

              {/* Dynamic Elastic Sliding Indicator Bar */}
              {ragaPillStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 bottom-0.5 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                  style={{
                    transform: `translateX(${ragaPillStyle.left}px)`,
                    width: `${ragaPillStyle.width}px`,
                    left: 0,
                  }}
                />
              )}

              <button
                ref={(el) => {
                  ragaRefs.current['all'] = el;
                }}
                type="button"
                onClick={() => setSelectedRaga('all')}
                className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors duration-200 cursor-pointer select-none ${
                  selectedRaga === 'all'
                    ? 'text-[#D4AF37] font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                सभी राग
              </button>
              {availableRagas.map((r) => {
                const count = allPadas.filter(
                  (p) =>
                    (selectedGrantha === 'all' || p.collectionId === selectedGrantha) &&
                    p.rag === r
                ).length;
                const isActive = selectedRaga === r;
                return (
                  <button
                    key={r}
                    ref={(el) => {
                      ragaRefs.current[r] = el;
                    }}
                    type="button"
                    onClick={() => setSelectedRaga(r)}
                    className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none ${
                      isActive
                        ? 'text-[#D4AF37] font-bold'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {r}
                    <span className={`ml-1 text-[9.5px] font-mono ${isActive ? 'text-[#E6C687]' : 'text-[#94A3B8]'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Mobile Horizontal Carousel (< md, Hidden in Distraction-Free Mode)         */}
      {/* ========================================================================= */}
      {!isFocusReadingMode && (
        <div className="md:hidden relative flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-3">
          {/* Dynamic Elastic Sliding Bouncy Indicator Bar */}
          {mobilePillStyle.ready && (
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-1 rounded-full bg-[#18181B] pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform shadow-[0_2px_10px_rgba(212,175,55,0.18)] z-0"
              style={{
                transform: `translateX(${mobilePillStyle.left}px)`,
                width: `${mobilePillStyle.width}px`,
                left: 0,
              }}
            />
          )}

          {filteredPads.slice(0, visibleCount).map((pad, idx) => {
            const isSelected = selectedPad.id === pad.id;
            return (
              <button
                key={pad.id}
                ref={(el) => {
                  mobilePadRefs.current[pad.id] = el;
                }}
                type="button"
                onClick={() => handleSelectPad(pad)}
                className={`relative z-10 shrink-0 h-8 px-3 rounded-full transition-colors duration-200 cursor-pointer select-none flex items-center gap-1.5 text-xs ${
                  isSelected
                    ? 'text-white font-bold'
                    : 'bg-white text-[#1E293B] shadow-2xs hover:bg-[#F8FAFC] font-medium'
                }`}
              >
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                  isSelected ? 'bg-white/10 text-[#D4AF37] font-semibold' : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  #{idx + 1}
                </span>
                <span className="font-serif truncate max-w-[130px]">
                  {pad.titleDevanagari}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Main Responsive Devotional Desk / Distraction-Free Sanctuary            */}
      {/* ========================================================================= */}
      <div className={isFocusReadingMode ? 'w-full max-w-3xl mx-auto' : 'grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start'}>
        
        {/* ========================================================================= */}
        {/* Left Column: Pada Index Catalog (Desktop only: hidden md:block)           */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <div className="hidden md:block md:col-span-4 xl:col-span-3 sticky top-24">
            <div className="bg-white rounded-3xl shadow-xs overflow-hidden flex flex-col max-h-[82vh]">
              {/* Header with Active Scripture Name & Search Input */}
              <div className="p-4 border-b border-neutral-100 space-y-2.5 bg-white">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#B8934A] shrink-0" />
                    <span className="font-serif font-bold text-[#0F172A] truncate">
                      {selectedGrantha === 'all'
                        ? 'समस्त पावन ग्रंथ'
                        : allGranthas.find((g) => g.id === selectedGrantha)?.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#997A35] shrink-0">
                    {displayedSidebarPads.length} पद
                  </span>
                </div>

                {/* Instant In-Sidebar Quick Filter */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={sidebarQuery}
                    onChange={(e) => setSidebarQuery(e.target.value)}
                    placeholder="पद, टेक या संत खोजें..."
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#F8FAFC] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                  />
                  {sidebarQuery && (
                    <button
                      type="button"
                      onClick={() => setSidebarQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Unified Scannable List with Dynamic Elastic Sliding Bouncy Indicator */}
              <div className="relative flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scroll">
                {/* Dynamic Elastic Sliding Bouncy Indicator Bar (Lustrous Obsidian with Champagne Gold Glow) */}
                {sidebarPillStyle.ready && (
                  <span
                    aria-hidden="true"
                    className="absolute left-2 right-2 rounded-2xl bg-[#18181B] pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform shadow-[0_4px_18px_rgba(212,175,55,0.18)] z-0"
                    style={{
                      transform: `translateY(${sidebarPillStyle.top}px)`,
                      height: `${sidebarPillStyle.height}px`,
                      top: 0,
                    }}
                  />
                )}

                {displayedSidebarPads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#94A3B8] font-serif">
                    कोई पद नहीं मिला ("{sidebarQuery}")
                  </div>
                ) : (
                  displayedSidebarPads.slice(0, visibleCount).map((pad, idx) => {
                    const isSelected = selectedPad.id === pad.id;
                    const isCurrentlyPlaying = activePlayingPadId === pad.id && isPlaying;
                    return (
                      <div
                        key={pad.id}
                        ref={(el) => {
                          sidebarItemRefs.current[pad.id] = el;
                        }}
                        onClick={() => handleSelectPad(pad)}
                        className={`group relative z-10 px-3 py-2.5 rounded-2xl flex items-start gap-2.5 cursor-pointer select-none transition-colors duration-200 ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                        }`}
                      >
                        {/* Compact Slim Index Number / Equalizer */}
                        <div className="w-7 shrink-0 pt-0.5 text-right font-mono text-xs select-none">
                          {isCurrentlyPlaying ? (
                            <div className="flex items-end justify-end gap-0.5 h-3">
                              <span className={`w-0.5 rounded-full animate-apple-eq-1 ${isSelected ? 'bg-[#D4AF37]' : 'bg-[#18181B]'}`} />
                              <span className={`w-0.5 rounded-full animate-apple-eq-2 ${isSelected ? 'bg-[#D4AF37]' : 'bg-[#18181B]'}`} />
                              <span className={`w-0.5 rounded-full animate-apple-eq-3 ${isSelected ? 'bg-[#D4AF37]' : 'bg-[#18181B]'}`} />
                            </div>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-mono transition-colors ${
                              isSelected ? 'bg-white/10 text-[#E6C687] font-bold shadow-2xs' : 'text-[#94A3B8]'
                            }`}>
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Verse Title & Meta */}
                        <div className="min-w-0 flex-1">
                          <div className={`font-serif font-bold text-sm leading-snug break-words transition-colors ${
                            isSelected ? 'text-[#FFFDF8]' : 'text-[#0F172A] group-hover:text-black'
                          }`}>
                            {pad.titleDevanagari}
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs mt-0.5 flex-wrap transition-colors ${
                            isSelected ? 'text-[#D1D5DB]' : 'text-[#64748B]'
                          }`}>
                            <span className="truncate">{pad.author}</span>
                            {pad.rag && (
                              <>
                                <span className={isSelected ? 'text-[#D4AF37]/60' : 'text-[#CBD5E1]'}>•</span>
                                <span className={`font-mono text-[11px] font-medium ${isSelected ? 'text-[#D4AF37]' : 'text-[#94A3B8]'}`}>
                                  {pad.rag}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Minimal Play Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayPad(pad);
                          }}
                          aria-label={`Play ${pad.titleDevanagari}`}
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                            isCurrentlyPlaying || isSelected
                              ? 'bg-[#D4AF37] hover:bg-[#C5A059] text-[#18181B] shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 ml-0.5 fill-current" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}

                {visibleCount < displayedSidebarPads.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 30)}
                    className="w-full py-2.5 text-xs font-semibold text-neutral-600 hover:text-[#18181B] cursor-pointer border-t border-neutral-100 mt-1 font-serif"
                  >
                    और पद लोड करें ({displayedSidebarPads.length - visibleCount} शेष)...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Center Column: Serene Editorial Reading Canvas                             */}
        {/* ========================================================================= */}
        <article className={`${
          isFocusReadingMode
            ? `w-full dhyana-reader-canvas p-6 sm:p-10 ${
                readerTheme === 'night'
                  ? 'bg-[#18181B] text-[#E4E4E7]'
                  : 'bg-white text-[#18181B] shadow-xs'
              }`
            : `md:col-span-8 xl:col-span-6 w-full rounded-3xl p-6 sm:p-9 shadow-xs ${
                readerTheme === 'night'
                  ? 'bg-[#18181B] text-[#E4E4E7]'
                  : 'bg-white text-[#18181B]'
              }`
        }`}>
          
          {/* Header Bar */}
          <div className="pb-6 mb-7 border-b border-neutral-100 space-y-4">
            {/* Top Meta Line & Bookmark */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#997A35] font-mono text-[11px] font-semibold tracking-wider uppercase">
                <span>{granthaDisplayName}</span>
                {selectedPad.rag && (
                  <>
                    <span className="text-[#D4AF37]">•</span>
                    <span>राग {selectedPad.rag}</span>
                  </>
                )}
                {selectedPad.duration && (
                  <>
                    <span className="text-[#CBD5E1]">•</span>
                    <span className="text-[#64748B]">{selectedPad.duration}</span>
                  </>
                )}
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleToggleBookmark}
                title={isBookmarked ? "Saved to Bookmarks" : "Save Pad to Bookmarks"}
                className={`h-7 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
                  isBookmarked
                    ? 'bg-[#18181B] text-[#D4AF37] shadow-xs'
                    : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                <span className="text-[11px]">{isBookmarked ? 'संग्रहित' : 'बुकमार्क'}</span>
              </button>
            </div>

            {/* Noble Headline & Author */}
            <div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[32px] text-[#0F172A] leading-tight tracking-tight">
                {cleanTitle}
              </h2>
              <div className="flex items-center gap-2 text-sm text-[#64748B] font-serif font-normal mt-2 flex-wrap">
                <span className="text-[#0F172A] font-semibold">{authorName}</span>
                {granthaRef && (
                  <>
                    <span className="text-[#D4AF37]">•</span>
                    <span>{granthaRef}</span>
                  </>
                )}
              </div>
            </div>

            {/* Sleek Minimal Audio Player Pill (Charcoal Obsidian with Champagne Gold Luster) */}
            <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-[#18181B] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onPlayPad(selectedPad)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E6C687] via-[#D4AF37] to-[#B8934A] text-[#18181B] flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-[0_2px_12px_rgba(212,175,55,0.35)]"
                  aria-label={isCurrentPadPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {isCurrentPadPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                      {isCurrentPadPlaying ? 'Now Playing' : 'Audio Shravan'}
                    </span>
                    {isCurrentPadPlaying && (
                      <div className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 bg-[#D4AF37] rounded-full animate-apple-eq-1" />
                        <span className="w-0.5 bg-[#D4AF37] rounded-full animate-apple-eq-2" />
                        <span className="w-0.5 bg-[#D4AF37] rounded-full animate-apple-eq-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-serif font-medium text-white/95 truncate mt-0.5">
                    {cleanTitle} • {selectedPad.rag || 'विभास'} ({selectedPad.duration || '05:20'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSummary}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[#FAF7F0] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isSummaryOpen ? 'भाव संक्षेप छुपाएं' : 'भाव संक्षेप'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer"
                  title="Typography & Ambiance Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#CBD5E1]" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Summary Card */}
          {isSummaryOpen && (
            <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 mb-7 shadow-2xs apple-view-enter">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 font-serif">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                  <span>भाव संक्षेप एवं रस-गूढ़ार्थ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 font-medium cursor-pointer"
                >
                  बंद करें ×
                </button>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-3 text-xs text-neutral-500 font-medium min-h-[48px]">
                  <Sparkles className="w-4 h-4 text-neutral-400 animate-spin" />
                  <span>प्रस्तुत किया जा रहा है...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-devanagari text-neutral-800 leading-relaxed break-words font-normal">
                  {summaryText ||
                    selectedPad.verses?.[0]?.bhavarth ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>
          )}

          {/* Verses Stanza Block */}
          <div className="space-y-6 sm:space-y-8">
            {selectedPad.verses.map((verse, vIdx) => {
              const isStanzaActive = isFocusReadingMode
                ? activeStanzaIndex === vIdx
                : (isCurrentPadPlaying && activeStanzaIndex === vIdx);
              const isStanzaDimmed = isFocusReadingMode && activeStanzaIndex !== vIdx;

              return (
                <div
                  key={verse.stanzaNumber}
                  onClick={() => setActiveStanzaIndex(vIdx)}
                  className={`p-5 sm:p-6 rounded-2xl transition-colors cursor-pointer ${
                    isStanzaActive
                      ? 'bg-[#FAF8F5] shadow-xs'
                      : isStanzaDimmed
                      ? 'bg-neutral-50/40 opacity-50'
                      : 'hover:bg-[#F8FAFC]/80'
                  }`}
                >
                  {/* Stanza Utility Header: Stanza Number + Verse Copy Action */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-100">
                    <span className="text-xs font-mono font-bold text-[#997A35] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-[#D4AF37] text-[10px]">✦</span>
                      चरण {formatDevanagariNumerals(verse.stanzaNumber)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyVerse(verse, vIdx);
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy verse stanza to clipboard"
                    >
                      {copiedStanzaIdx === vIdx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">प्रतिलिपि सफल ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>प्रतिलिपि</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Devanagari Verses Typography */}
                  <div className="space-y-2.5 py-1">
                    {(verse.linesDevanagari || []).map((line, lIdx) => {
                      if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
                        return (
                          <div key={lIdx} className="text-xs font-serif text-[#997A35] font-medium mb-1">
                            ॥ {line.replace(/[()]/g, '').trim()} छंद ॥
                          </div>
                        );
                      }
                      return (
                        <p
                          key={lIdx}
                          className={`dhyana-verse-line font-serif font-bold text-[#0F172A] tracking-tight ${
                            fontSize === 'sm'
                              ? 'text-[18px] sm:text-[20px] leading-[2.0]'
                              : fontSize === 'md'
                              ? 'text-[21px] sm:text-[24px] leading-[2.1] sm:leading-[2.2]'
                              : fontSize === 'lg'
                              ? 'text-[24px] sm:text-[27px] leading-[2.2] sm:leading-[2.3]'
                              : 'text-[27px] sm:text-[31px] leading-[2.3] sm:leading-[2.4]'
                          } ${
                            readerTheme === 'night' ? 'text-[#F4F4F5]' : 'text-[#0F172A]'
                          }`}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Simple Dignified Delimiter */}
                  <div className="flex items-center justify-center gap-2 my-4 select-none">
                    <span className="text-[#D4AF37] text-xs">✦</span>
                    <span className="font-serif font-semibold text-xs tracking-widest text-[#B8934A]">
                      ॥ {formatDevanagariNumerals(verse.stanzaNumber)} ॥
                    </span>
                    <span className="text-[#D4AF37] text-xs">✦</span>
                  </div>

                  {/* Transliteration */}
                  {showTransliteration && (verse.linesTransliteration?.length ?? 0) > 0 && (
                    <div className="space-y-0.5 pt-2 border-t border-neutral-100 mt-2">
                      {verse.linesTransliteration?.map((line, lIdx) => (
                        <p key={lIdx} className="text-xs sm:text-sm text-[#64748B] italic font-serif">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Hindi Meaning / Bhavarth Block */}
                  {verse.bhavarth && (
                    <div className="bg-[#F8FAFC] p-4 rounded-xl mt-3 shadow-2xs">
                      <span className="text-[10px] font-mono font-bold text-[#997A35] uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        भावार्थ (Sacred Meaning)
                      </span>
                      <p className="text-xs sm:text-[13.5px] text-[#334155] leading-relaxed font-normal">
                        {verse.bhavarth}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Prev / Next Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-neutral-100">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={handlePrevPad}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                hasPrev
                  ? 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]'
                  : 'opacity-40 cursor-not-allowed text-[#94A3B8] bg-neutral-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला पद</span>
            </button>

            <span className="text-xs text-[#94A3B8] font-mono font-medium">
              पद {currentIdx + 1} / {filteredPads.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={handleNextPad}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                hasNext
                  ? 'bg-[#18181B] hover:bg-[#27272A] text-white'
                  : 'opacity-40 cursor-not-allowed text-[#94A3B8] bg-neutral-100'
              }`}
            >
              <span>अगला पद</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Desktop Commentary Desk (Visible on xl:block)     */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <aside className="hidden xl:block xl:col-span-3 space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100">
                <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] flex items-center justify-center text-[#B8934A]">
                  <Feather className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#0F172A]">
                    रसिक भावार्थ एवं गूढ़ार्थ
                  </h3>
                  <span className="text-[10px] text-[#997A35] font-mono">
                    Rasik Commentary & Purport
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto custom-scroll pr-1">
                {selectedPad.verses.map((v) => {
                  const isActive = activeStanzaIndex === v.stanzaNumber - 1;
                  return (
                    <div
                      key={v.stanzaNumber}
                      onClick={() => setActiveStanzaIndex(v.stanzaNumber - 1)}
                      className={`p-3.5 rounded-xl transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF7F0] text-[#0F172A] shadow-2xs'
                          : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#997A35] uppercase tracking-wider flex items-center gap-1">
                          {isActive && <span className="text-[#D4AF37]">✦</span>}
                          चरण {formatDevanagariNumerals(v.stanzaNumber)}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">भावार्थ</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans font-normal text-[#334155]">
                        {v.bhavarth}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Luminous Champagne-Diamond Sacred Footnote */}
            <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F5F2EC] rounded-2xl p-4 text-xs text-[#334155] leading-relaxed shadow-2xs">
              <div className="flex items-center gap-1.5 mb-1 text-[#0F172A] font-serif font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>नित्य निकुंज विहार दर्शन</span>
              </div>
              <p className="text-[11.5px] text-[#475569] font-devanagari">
                श्री वृन्दावन धाम में प्रिया-प्रियतम की नित्य विहार लीला अखंड एवं नित्य-नूतन है। यहाँ प्रेम ही साधन है और प्रेम ही साध्य है।
              </p>
              <div className="pt-2 mt-2 border-t border-[#E5E0D8]/60 flex items-center justify-between text-[10px] text-[#997A35] font-mono font-semibold">
                <span>✦ ॥ अगाध निकुंज रस ॥ ✦</span>
                <span>राधा कृपा कटाक्ष</span>
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* ========================================================================= */}
      {/* Mobile Rasik Commentary Drawer (< xl) Portal                               */}
      {/* ========================================================================= */}
      {isCommentaryOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`xl:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 transition-opacity ${
            isCommentaryClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseCommentary}
        >
          <div
            className={`bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 relative ${
              isCommentaryClosing ? 'sheet-exit' : 'sheet-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-neutral-700" />
                <h3 className="font-semibold text-sm sm:text-base text-[#18181B]">
                  Rasik Commentary & Purport (रसिक भावार्थ)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCommentary}
                aria-label="Close commentary drawer"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#18181B] hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Featured Divine Devotional Summary Card */}
            <div className="bg-neutral-50 p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                <Sparkles className="w-4 h-4 text-neutral-500" />
                <span>दिव्य भाव संक्षेप एवं रस-गूढ़ार्थ</span>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-2 text-xs text-neutral-500 font-medium min-h-[48px]">
                  <Sparkles className="w-4 h-4 text-neutral-400 animate-spin" />
                  <span>प्रस्तुत किया जा रहा है...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed text-neutral-800 font-devanagari break-words font-normal">
                  {summaryText ||
                    selectedPad.verses?.[0]?.bhavarth ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>

            {/* Verse-by-verse bhavarth */}
            <div className="space-y-3">
              {selectedPad.verses.map((v) => (
                <div key={v.stanzaNumber} className="bg-neutral-50 p-3.5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider block mb-1.5 font-mono w-fit">
                    चरण {formatDevanagariNumerals(v.stanzaNumber)} भावार्थ
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-neutral-700">
                    {v.bhavarth}
                  </p>
                </div>
              ))}
            </div>

            {/* Nitya Nikunj Vihar Tattva Section */}
            <div className="bg-neutral-50 text-[#18181B] rounded-2xl p-4 sm:p-5 shadow-2xs">
              <span className="text-[10.5px] text-neutral-700 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                नित्य निकुंज विहार दर्शन
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal">
                श्री वृन्दावन धाम में प्रिया-प्रियतम की नित्य विहार लीला अखंड एवं नित्य-नूतन है। यहाँ प्रेम ही साधन है और प्रेम ही साध्य है।
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleCloseCommentary}
              className="w-full mt-2 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-[#18181B] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Dismiss • Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* Mobile & Desktop Braj Sacred Lexicon Sheet Modal Portal                    */}
      {/* ========================================================================= */}
      {isGlossaryOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity ${
            isGlossaryClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseGlossary}
        >
          <div
            className={`bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 relative text-[#18181B] ${
              isGlossaryClosing ? 'sheet-exit' : 'sheet-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-neutral-800" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#18181B]">
                    Rasik Braj Lexicon • Sacred Vocabulary
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    Essential devotional vocabulary of eternal Nikunj & Braj ras
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseGlossary}
                aria-label="Close glossary modal"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#18181B] hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1 no-scrollbar">
              {SacredDatabase.getBrajGlossary().map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-neutral-50 shadow-2xs"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif font-bold text-sm text-[#18181B]">
                      {item.term}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-600 bg-neutral-200/60 px-2 py-0.5 rounded-full font-semibold">
                      {item.transliteration}
                    </span>
                  </div>
                  <p className="text-xs text-[#18181B] mt-1 leading-relaxed">
                    {item.meaningDevanagari}
                  </p>
                  <div className="text-[10px] text-neutral-400 mt-1.5 pt-1.5 border-t border-neutral-200/60 font-serif italic">
                    Context: {item.context}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCloseGlossary}
              className="w-full mt-2 py-3 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
            >
              Dismiss • Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
