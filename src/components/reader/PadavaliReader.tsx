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
  Volume2,
  Share2,
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

  // Dedicated component to guarantee 0 broken image [?] placeholders with elegant devotional typography monograms
  const ScriptureArtwork: React.FC<{
    pad: SacredPad;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isSelected?: boolean;
  }> = ({ pad, size = 'sm', className = '', isSelected = false }) => {
    const rawImage = (pad as { imageUrl?: string; artworkUrl?: string }).imageUrl || (pad as { imageUrl?: string; artworkUrl?: string }).artworkUrl;
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
      setImgError(false);
    }, [pad.id]);

    const initial = useMemo(() => {
      const raw = (pad.titleDevanagari || pad.author || 'श्री').trim();
      const cleaned = raw.replace(/^[॥\s]+/, '');
      return cleaned.slice(0, size === 'sm' ? 1 : 2);
    }, [pad.titleDevanagari, pad.author, size]);

    const sizeClasses = {
      sm: 'w-11 h-11 rounded-[16px] text-base',
      md: 'w-12 h-12 rounded-[16px] text-sm',
      lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] text-xl',
    }[size];

    if (imgError || !rawImage) {
      return (
        <div
          className={`${sizeClasses} shrink-0 relative bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/70 border-2 border-amber-300/90 shadow-[0_4px_16px_rgba(217,119,6,0.1)] flex items-center justify-center font-serif font-bold select-none transition-all duration-200 ${
            isSelected ? 'ring-2 ring-amber-500 shadow-md' : ''
          } ${className}`}
        >
          {/* Inner hairline gold ring */}
          <div className="absolute inset-1 rounded-[14px] sm:rounded-[18px] border border-amber-400/40 pointer-events-none" />
          <span className="leading-none text-amber-950 drop-shadow-2xs">{initial}</span>
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses} shrink-0 overflow-hidden relative shadow-2xs bg-neutral-100 flex items-center justify-center ${className}`}
      >
        <img
          src={rawImage}
          alt={pad.titleDevanagari}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

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
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white rounded-[28px] p-4 sm:p-6 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#18181B] font-bold flex items-center gap-2 leading-tight">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
            <span>Sacred Padavali & Stotras</span>
          </h1>
          <p className="text-xs text-[#71717A] font-medium mt-1">
            Rasik Vani & Sacred Scriptures ({filteredPads.length} verses available)
          </p>
        </div>

        {/* Search Input, Reading Controls & IAST Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search pad, stotra, saint, raga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F4F4F5] border border-neutral-200/80 text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-[#71717A] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Reader Customizer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`h-8 px-3 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors border cursor-pointer shrink-0 ${
                isSettingsOpen
                  ? 'bg-[#18181B] text-white border-[#18181B]'
                  : 'bg-white text-[#18181B] border-neutral-200/80 hover:bg-neutral-50'
              }`}
              title="Appearance & Typography Controls"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Appearance</span>
            </button>

            {/* Braj Sacred Lexicon Button */}
            <button
              type="button"
              onClick={() => setIsGlossaryOpen(true)}
              className="h-8 px-3 rounded-full text-xs font-semibold bg-white text-[#18181B] border border-neutral-200/80 hover:bg-neutral-50 shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Braj Sacred Glossary (शब्दकोश)"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Lexicon</span>
            </button>

            {/* IAST Transliteration Toggle */}
            <button
              type="button"
              onClick={handleToggleTransliteration}
              className="h-8 px-3 rounded-full text-xs font-semibold bg-white border border-neutral-200/80 text-[#18181B] hover:bg-neutral-50 shadow-2xs cursor-pointer shrink-0"
              title="Toggle IAST Roman Transliteration"
            >
              {showTransliteration ? 'IAST: On' : 'IAST: Off'}
            </button>

            {/* Distraction-Free Reading Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsFocusReadingMode(!isFocusReadingMode)}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isFocusReadingMode
                  ? 'bg-[#18181B] text-white'
                  : 'bg-white text-[#18181B] border border-neutral-200/80 hover:bg-neutral-50'
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
        <div className="mb-4 p-4 rounded-[24px] bg-white border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3 apple-sheet-enter text-[#18181B]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            {/* Font Size Stepper with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider flex items-center gap-1 font-mono">
                <Type className="w-3.5 h-3.5 text-amber-600" />
                Font Size:
              </span>
              <div className="relative flex items-center p-1 bg-[#F4F4F5] rounded-full border border-neutral-200/60">
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
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Toggle with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
                Font:
              </span>
              <div className="relative flex items-center p-1 bg-[#F4F4F5] rounded-full border border-neutral-200/60">
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
                      : 'text-[#71717A] hover:text-[#18181B]'
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
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  Sans (Modern)
                </button>
              </div>
            </div>

            {/* Playback Pace Stepper with Elastic Sliding Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
                Audio Pace:
              </span>
              <div className="relative flex items-center p-1 bg-[#F4F4F5] rounded-full border border-neutral-200/60">
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
                        : 'text-[#71717A] hover:text-[#18181B]'
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
            <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider font-mono">
              Ambiance Theme:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ivory' as ReaderTheme, label: 'पावन पत्र', desc: 'Porcelain White', bg: '#FFFFFF', border: '#E4E4E7', text: '#18181B' },
                { id: 'mint' as ReaderTheme, label: 'तमाल निकुंज', desc: 'Tamal Green', bg: '#F0FDF4', border: '#DCFCE7', text: '#166534' },
                { id: 'chandan' as ReaderTheme, label: 'चन्दन प्रभा', desc: 'Chandan Gold', bg: '#FDF8EE', border: '#E9DFC7', text: '#3D260F' },
                { id: 'night' as ReaderTheme, label: 'निशीथ ध्यान', desc: 'Twilight Night', bg: '#18181B', border: '#27272A', text: '#F4F4F5' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReaderTheme(t.id)}
                  style={{ backgroundColor: t.bg, borderColor: t.border, color: t.text }}
                  className={`p-2 rounded-xl text-left border-2 transition-all cursor-pointer ${
                    readerTheme === t.id
                      ? 'ring-2 ring-amber-500 shadow-sm font-bold'
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
        <div className="mb-6 p-3 sm:p-4 rounded-[26px] bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] border border-amber-200/80 shadow-[0_2px_12px_rgba(217,119,6,0.03)] space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-amber-200/40">
            <div className="flex items-center gap-1.5 font-serif font-bold text-amber-950">
              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>पावन ग्रंथ संग्रह एवं राग वीथिका</span>
            </div>
            <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              {allPadas.length} पद उपलब्ध
            </span>
          </div>

          <div className="relative flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            {granthaPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0.5 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
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
              className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none ${
                selectedGrantha === 'all'
                  ? 'text-white font-bold'
                  : 'text-[#71717A] hover:text-[#18181B] bg-white/80 border border-amber-100/60'
              }`}
            >
              समस्त ग्रंथ ({allPadas.length})
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
                      : 'text-[#71717A] hover:text-[#18181B] bg-white/80 border border-amber-100/60'
                  }`}
                >
                  <span>{g.name}</span>
                  <span className={`ml-1 text-[10px] font-mono ${isActive ? 'text-amber-300' : 'text-neutral-400'}`}>
                    ({g.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Raga Sub-Filter Strip: Only display if real classical ragas exist for current scope */}
          {availableRagas.length > 0 && (
            <div className="relative flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pt-2 border-t border-amber-200/40">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Music className="w-3 h-3 text-amber-600" />
                शास्त्रीय राग:
              </span>

              {/* Dynamic Elastic Sliding Indicator Bar */}
              {ragaPillStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 bottom-0 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
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
                    ? 'text-white font-bold'
                    : 'text-[#71717A] hover:text-[#18181B]'
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
                        ? 'text-white font-bold'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {r}
                    <span className={`ml-1 text-[9.5px] font-mono ${isActive ? 'text-amber-300' : 'opacity-60'}`}>
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
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-3">
          {filteredPads.slice(0, visibleCount).map((pad, idx) => {
            const isSelected = selectedPad.id === pad.id;
            return (
              <button
                key={pad.id}
                type="button"
                onClick={() => handleSelectPad(pad)}
                className={`shrink-0 h-8 px-2.5 rounded-full border transition-colors cursor-pointer select-none flex items-center gap-1.5 text-xs ${
                  isSelected
                    ? 'bg-[#18181B] text-white border-[#18181B] font-bold shadow-xs'
                    : 'bg-white text-[#18181B] border-neutral-200/80 hover:bg-neutral-50 font-medium'
                }`}
              >
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-amber-50 text-amber-800'}`}>
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
            <div className="bg-[#FFFDF9] rounded-[26px] border border-amber-200/80 shadow-[0_4px_24px_rgba(217,119,6,0.04)] overflow-hidden flex flex-col max-h-[80vh]">
              {/* 1. Header with Active Scripture Name & Live Filter */}
              <div className="p-3.5 bg-gradient-to-b from-[#FAF6EE] to-[#FFFDF9] border-b border-amber-200/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-serif font-bold text-amber-950 truncate">
                      {selectedGrantha === 'all'
                        ? 'समस्त पावन ग्रंथ (All)'
                        : allGranthas.find((g) => g.id === selectedGrantha)?.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-800 to-amber-900 text-amber-100 shrink-0 shadow-2xs">
                    {displayedSidebarPads.length} पद
                  </span>
                </div>

                {/* Instant In-Sidebar Quick Filter */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-700/60" />
                  <input
                    type="text"
                    value={sidebarQuery}
                    onChange={(e) => setSidebarQuery(e.target.value)}
                    placeholder="पद, टेक या संत खोजें..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-amber-200/80 text-xs text-amber-950 placeholder:text-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 shadow-2xs"
                  />
                  {sidebarQuery && (
                    <button
                      type="button"
                      onClick={() => setSidebarQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-amber-800 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Unified Scannable List (Illuminated Parchment Active Selection) */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scroll">
                {displayedSidebarPads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-amber-800/60 font-serif">
                    कोई पद नहीं मिला ("{sidebarQuery}")
                  </div>
                ) : (
                  displayedSidebarPads.slice(0, visibleCount).map((pad, idx) => {
                    const isSelected = selectedPad.id === pad.id;
                    const isCurrentlyPlaying = activePlayingPadId === pad.id && isPlaying;
                    return (
                      <div
                        key={pad.id}
                        onClick={() => handleSelectPad(pad)}
                        className={`group px-3 py-2.5 rounded-xl flex items-start gap-2.5 cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-100/90 via-[#FFFDF7] to-amber-50/70 text-amber-950 border-amber-300/90 shadow-[0_2px_10px_rgba(217,119,6,0.08)]'
                            : 'hover:bg-amber-50/40 text-[#292524] border-transparent'
                        }`}
                      >
                        {/* Compact Slim Index Number / Equalizer */}
                        <div className="w-7 shrink-0 pt-0.5 text-right font-mono text-xs select-none">
                          {isCurrentlyPlaying ? (
                            <div className="flex items-end justify-end gap-0.5 h-3">
                              <span className="w-0.5 bg-amber-600 rounded-full animate-apple-eq-1" />
                              <span className="w-0.5 bg-amber-600 rounded-full animate-apple-eq-2" />
                              <span className="w-0.5 bg-amber-600 rounded-full animate-apple-eq-3" />
                            </div>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-mono ${
                              isSelected ? 'bg-amber-200/90 text-amber-950 font-bold' : 'text-neutral-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Verse Title & Meta - Max Width, Never Truncated Early */}
                        <div className="min-w-0 flex-1">
                          <div className={`font-serif font-bold text-sm leading-snug break-words ${
                            isSelected ? 'text-amber-950' : 'text-[#1C1917]'
                          }`}>
                            {pad.titleDevanagari}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5 flex-wrap">
                            <span className="truncate">{pad.author}</span>
                            {pad.rag && (
                              <span className="text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded font-mono font-medium text-[10px] border border-amber-200/60">
                                {pad.rag}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tactile Golden Play Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayPad(pad);
                          }}
                          aria-label={`Play ${pad.titleDevanagari}`}
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                            isCurrentlyPlaying
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xs'
                              : isSelected
                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xs'
                                : 'text-neutral-400 hover:text-amber-700 hover:bg-amber-100/60 opacity-60 group-hover:opacity-100'
                          }`}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-3 h-3 fill-white" />
                          ) : (
                            <Play className={`w-3 h-3 ml-0.5 ${isSelected ? 'fill-white text-white' : 'fill-current'}`} />
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
                    className="w-full py-2.5 text-xs font-semibold text-amber-800 hover:underline cursor-pointer border-t border-amber-200/50 mt-1 font-serif"
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
            ? `w-full dhyana-reader-canvas p-5 sm:p-8 ${
                readerTheme === 'night'
                  ? 'bg-[#18181B] text-[#E4E4E7] border-neutral-800'
                  : 'bg-[#FFFDF9] text-[#18181B] border-amber-200/80 shadow-[0_8px_32px_rgba(217,119,6,0.05)]'
              }`
            : `md:col-span-8 xl:col-span-6 w-full rounded-[32px] p-5 sm:p-7 border border-amber-200/80 shadow-[0_8px_32px_rgba(217,119,6,0.04)] ${
                readerTheme === 'night'
                  ? 'bg-[#18181B] text-[#E4E4E7] border-neutral-800'
                  : 'bg-[#FFFDF9] text-[#18181B]'
              }`
        }`}>
          
          {/* ========================================================================= */}
          {/* Sacred Scripture Header Bar (Illuminated Manuscript Sanctuary Anatomy)    */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-b from-[#FFFDF8] via-[#FAF6EE] to-[#FFFDF8] rounded-[28px] p-5 sm:p-6 border border-amber-200/80 mb-6 shadow-2xs space-y-4 relative overflow-hidden">
            {/* Subtle ornamental corner aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

            {/* Sacred Traditional Invocation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-xs select-none">✦</span>
                <span className="font-serif font-bold text-[11px] sm:text-xs tracking-widest text-amber-900 uppercase">
                  ॥ श्रीराधावल्लभो विजयते • नित्य निकुंज रस ॥
                </span>
                <span className="text-amber-600 text-xs select-none">✦</span>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleToggleBookmark}
                title={isBookmarked ? "Saved to Bookmarks" : "Save Pad to Bookmarks"}
                className={`h-7 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all border cursor-pointer select-none ${
                  isBookmarked
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-white hover:bg-amber-50 text-neutral-500 hover:text-amber-900 border-amber-200/70'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                <span className="text-[11px]">{isBookmarked ? 'संग्रहित' : 'बुकमार्क'}</span>
              </button>
            </div>

            {/* Main Title & Medallion Section */}
            <div className="flex items-start gap-3.5 sm:gap-4 pt-1">
              <ScriptureArtwork pad={selectedPad} size="lg" />

              <div className="flex flex-col min-w-0 flex-1">
                {/* Grantha & Raga Badges */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border border-amber-200/80">
                    {granthaDisplayName}
                  </span>
                  {selectedPad.rag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/60 font-mono">
                      <Music className="w-3 h-3 text-amber-600" />
                      राग {selectedPad.rag}
                    </span>
                  )}
                  {selectedPad.duration && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold text-neutral-600 bg-white border border-neutral-200 font-mono">
                      {selectedPad.duration}
                    </span>
                  )}
                </div>

                {/* Full-Width Classical Serif Title */}
                <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[30px] text-[#1C1917] leading-tight tracking-tight">
                  {cleanTitle}
                </h2>

                {/* Dignified Lineage Attribution */}
                <div className="flex items-center gap-2 text-xs sm:text-[13px] text-amber-900/80 font-serif font-medium mt-1.5 flex-wrap">
                  <span className="font-semibold text-amber-950">{authorName}</span>
                  {granthaRef && (
                    <>
                      <span className="text-amber-500">•</span>
                      <span>{granthaRef}</span>
                    </>
                  )}
                  {selectedPad.rag && (
                    <>
                      <span className="text-amber-500">•</span>
                      <span className="inline-flex items-center gap-1">
                        राग {selectedPad.rag}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Artisanal Audio Player Bar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#18181B] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onPlayPad(selectedPad)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md ${
                    isCurrentPadPlaying
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white ring-2 ring-amber-300'
                      : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white'
                  }`}
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
                    <span className="text-[10.5px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      {isCurrentPadPlaying ? 'Now Chanting & Playing' : 'Listen Melodic Dhrupad'}
                    </span>
                    {isCurrentPadPlaying && (
                      <div className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 bg-amber-400 rounded-full animate-apple-eq-1" />
                        <span className="w-0.5 bg-amber-400 rounded-full animate-apple-eq-2" />
                        <span className="w-0.5 bg-amber-400 rounded-full animate-apple-eq-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-serif font-semibold text-white/95 truncate mt-0.5">
                    {cleanTitle} • राग {selectedPad.rag || 'विभास'} ({selectedPad.duration || '05:20'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSummary}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSummaryOpen ? 'भाव संक्षेप छुपाएं' : 'भाव संक्षेप'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
                  title="Typography & Ambiance Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Sacred Devotional Card */}
          {isSummaryOpen && (
            <div className="bg-gradient-to-r from-amber-50/90 via-[#FFFBEB] to-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs apple-view-enter">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 font-serif">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>॥ दिव्य भाव संक्षेप एवं रस-गूढ़ार्थ ॥</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(false)}
                  className="text-xs text-neutral-500 hover:text-amber-900 font-medium cursor-pointer"
                >
                  बंद करें ×
                </button>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-3 text-xs text-amber-700 font-medium min-h-[64px]">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Revealing divine essence and spiritual theme...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-devanagari text-[#1C1917] leading-relaxed break-words font-medium">
                  {summaryText ||
                    selectedPad.verses?.[0]?.bhavarth ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>
          )}

          {/* Verses Stanza Block */}
          <div className="space-y-6 sm:space-y-7">
            {selectedPad.verses.map((verse, vIdx) => {
              const isStanzaActive = isFocusReadingMode
                ? activeStanzaIndex === vIdx
                : (isCurrentPadPlaying && activeStanzaIndex === vIdx);
              const isStanzaDimmed = isFocusReadingMode && activeStanzaIndex !== vIdx;

              return (
                <div
                  key={verse.stanzaNumber}
                  onClick={() => setActiveStanzaIndex(vIdx)}
                  className={`p-5 sm:p-7 rounded-[26px] transition-all duration-300 relative cursor-pointer ${
                    isStanzaActive
                      ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] border-2 border-amber-300 ring-2 ring-amber-400/20 shadow-[0_6px_28px_rgba(217,119,6,0.08)]'
                      : isStanzaDimmed
                      ? 'bg-neutral-50/60 border border-neutral-200/40 opacity-60'
                      : 'bg-gradient-to-b from-[#FFFDF9] via-[#FCFAF5] to-[#FFFDF9] border border-amber-200/80 shadow-[0_2px_12px_rgba(217,119,6,0.03)] hover:border-amber-300'
                  }`}
                >
                  {/* Stanza Utility Header: Active Indicator Badge + Verse Copy Action */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/50">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 text-xs select-none">✦</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold ${
                        isStanzaActive
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-amber-100/90 text-amber-900 border border-amber-200/70'
                      }`}>
                        {isStanzaActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        {verse.linesDevanagari?.[0]?.startsWith('(')
                          ? `${verse.linesDevanagari[0].match(/\((.*?)\)/)?.[1] || 'छंद'} • चरण ${formatDevanagariNumerals(verse.stanzaNumber)}`
                          : `पद • चरण ${formatDevanagariNumerals(verse.stanzaNumber)}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyVerse(verse, vIdx);
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-amber-50 text-neutral-600 hover:text-amber-900 border border-amber-200/60 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      title="Copy verse stanza to clipboard"
                    >
                      {copiedStanzaIdx === vIdx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">प्रतिलिपि सफल ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>पद प्रतिलिपि</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Devanagari Verses Typography */}
                  <div className="space-y-3 py-1">
                    {(verse.linesDevanagari || []).map((line, lIdx) => {
                      if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
                        return (
                          <div key={lIdx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200/70 text-amber-950 font-serif text-xs font-bold shadow-2xs mb-1">
                            <Feather className="w-3 h-3 text-amber-700" />
                            <span>॥ {line.replace(/[()]/g, '').trim()} छंद ॥</span>
                          </div>
                        );
                      }
                      return (
                        <p
                          key={lIdx}
                          className={`dhyana-verse-line font-serif font-semibold text-[#1C1917] tracking-tight ${
                            fontSize === 'sm'
                              ? 'text-[18px] sm:text-[20px] leading-[2.0]'
                              : fontSize === 'md'
                              ? 'text-[21px] sm:text-[24px] leading-[2.1] sm:leading-[2.2]'
                              : fontSize === 'lg'
                              ? 'text-[24px] sm:text-[27px] leading-[2.2] sm:leading-[2.3]'
                              : 'text-[27px] sm:text-[31px] leading-[2.3] sm:leading-[2.4]'
                          } ${
                            readerTheme === 'night' ? 'text-[#F4F4F5]' : 'text-[#1C1917]'
                          }`}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Sacred Braj Delimiter */}
                  <div className="flex items-center justify-center gap-2 pt-4 my-2 text-amber-600 select-none">
                    <span className="text-sm">❦</span>
                    <span className="font-serif font-bold text-xs sm:text-sm tracking-widest text-amber-900">
                      ॥ श्री युगल चरण कमलेभ्यो नमः ॥ {formatDevanagariNumerals(verse.stanzaNumber)} ॥
                    </span>
                    <span className="text-sm">❦</span>
                  </div>

                  {/* Transliteration */}
                  {showTransliteration && (verse.linesTransliteration?.length ?? 0) > 0 && (
                    <div className="space-y-0.5 pt-2 border-t border-amber-200/40 mt-2">
                      {verse.linesTransliteration?.map((line, lIdx) => (
                        <p key={lIdx} className="text-xs sm:text-sm text-neutral-500 italic font-serif">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Hindi Meaning / Bhavarth Block with gold accent badge */}
                  {verse.bhavarth && (
                    <div className="bg-gradient-to-r from-amber-50/80 via-[#FFFBEB] to-amber-50/50 border border-amber-200/80 p-4 sm:p-4.5 rounded-2xl mt-4 shadow-2xs">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-mono">
                          रसिक भावार्थ एवं गूढ़ार्थ (Divine Meaning)
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13.5px] text-[#292524] leading-relaxed font-sans font-medium">
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
                  ? 'bg-white text-[#18181B] hover:bg-neutral-50 border border-neutral-200/80 shadow-2xs'
                  : 'opacity-40 cursor-not-allowed text-neutral-400 border border-neutral-200/40'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Pad</span>
            </button>

            <span className="text-xs text-[#71717A] font-mono font-medium">
              Pad {currentIdx + 1} of {filteredPads.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={handleNextPad}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                hasNext
                  ? 'bg-[#18181B] hover:bg-[#27272A] text-white'
                  : 'opacity-40 cursor-not-allowed text-neutral-400 bg-neutral-100'
              }`}
            >
              <span>Next Pad</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100 text-xs text-[#71717A]">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-4 h-4 text-amber-600" />
              Audio Kirtan & Melodic Recitation Available
            </span>
            <button type="button" className="flex items-center gap-1.5 hover:text-[#18181B] font-medium cursor-pointer">
              <Share2 className="w-4 h-4" />
              Share Pad
            </button>
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Desktop Commentary Desk (Visible on xl:block)     */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <aside className="hidden xl:block xl:col-span-3 space-y-4 sticky top-24">
            <div className="bg-[#FFFDF9] rounded-[28px] p-5 border border-amber-200/80 shadow-[0_4px_24px_rgba(217,119,6,0.04)]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Feather className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                      रसिक भावार्थ एवं गूढ़ार्थ
                    </h3>
                    <span className="text-[10px] text-amber-800/80 font-mono">
                      Rasik Commentary & Purport
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 max-h-[52vh] overflow-y-auto custom-scroll pr-1">
                {selectedPad.verses.map((v) => {
                  const isActive = activeStanzaIndex === v.stanzaNumber - 1;
                  return (
                    <div
                      key={v.stanzaNumber}
                      onClick={() => setActiveStanzaIndex(v.stanzaNumber - 1)}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-100/90 to-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-[#FAF6EE]/80 hover:bg-[#FAF6EE] border-amber-200/60 text-[#292524]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          isActive
                            ? 'bg-amber-700 text-white'
                            : 'bg-amber-200/80 text-amber-900'
                        }`}>
                          चरण {formatDevanagariNumerals(v.stanzaNumber)}
                        </span>
                        <span className="text-[10px] text-amber-800/70 font-mono">भावार्थ</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans font-medium">
                        {v.bhavarth}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eternal Nikunj Vihar Darshan Callout */}
            <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-amber-100/50 text-[#1C1917] rounded-[28px] p-5 border border-amber-300/80 shadow-[0_4px_20px_rgba(217,119,6,0.06)] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-serif font-bold text-amber-950 tracking-wider">
                  नित्य निकुंज विहार दर्शन
                </span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900/90 font-medium font-devanagari">
                श्री वृन्दावन धाम में प्रिया-प्रियतम की नित्य विहार लीला अखंड एवं नित्य-नूतन है। यहाँ प्रेम ही साधन है और प्रेम ही साध्य है।
              </p>
              <div className="pt-2.5 mt-2.5 border-t border-amber-300/50 flex items-center justify-between text-[11px] text-amber-800 font-mono font-semibold">
                <span>॥ अगाध निकुंज रस ॥</span>
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
                <Feather className="w-4 h-4 text-amber-600" />
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
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>॥ Divine Essence & Spiritual Theme (दिव्य भाव संक्षेप) ॥</span>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-2 text-xs text-amber-700 font-medium min-h-[64px]">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Revealing divine essence and spiritual theme...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed text-[#18181B] font-devanagari break-words">
                  {summaryText ||
                    selectedPad.verses?.[0]?.bhavarth ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>

            {/* Verse-by-verse bhavarth */}
            <div className="space-y-3">
              {selectedPad.verses.map((v) => (
                <div key={v.stanzaNumber} className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-neutral-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider block mb-1.5 font-mono w-fit">
                    Stanza {v.stanzaNumber} Purport
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#18181B]">
                    {v.bhavarth}
                  </p>
                </div>
              ))}
            </div>

            {/* Nitya Nikunj Vihar Tattva Section */}
            <div className="bg-[#FFFBEB]/80 text-[#18181B] rounded-[24px] p-4 sm:p-5 border border-amber-200/60 shadow-xs">
              <span className="text-[10.5px] text-amber-800 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Eternal Nikunj Vihar Darshan
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[#52525B]">
                In Shri Vrindavan Dham, the eternal loving leela of Priya-Priyatam is unbroken and ever-fresh. Love here is both the means (sadhan) and the ultimate goal (sadhya).
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
                <BookOpenCheck className="w-5 h-5 text-amber-600" />
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
                  className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-neutral-200/60 shadow-2xs"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif font-bold text-sm text-[#18181B]">
                      {item.term}
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                      {item.transliteration}
                    </span>
                  </div>
                  <p className="text-xs text-[#18181B] mt-1 leading-relaxed">
                    {item.meaningDevanagari}
                  </p>
                  <div className="text-[10px] text-[#71717A] mt-1.5 pt-1.5 border-t border-neutral-200/60 font-serif italic">
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
