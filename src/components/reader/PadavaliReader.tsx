import React, { useState, useEffect, useMemo } from 'react';
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
}

type ReaderTheme = 'ivory' | 'mint' | 'chandan' | 'night';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderFontFamily = 'serif' | 'devanagari';

const BRAJ_GLOSSARY: Array<{ term: string; transliteration: string; meaningDevanagari: string; context: string }> = [
  {
    term: 'प्यारो (प्रिया-प्रियतम)',
    transliteration: 'Pyāro / Priyā-Priyatam',
    meaningDevanagari: 'श्री राधा-माधव युगल सरकार, जो दो रूप धारण करके भी नित्य एक प्राण हैं।',
    context: 'हित चौरासी प्रथम पद: "जोई जोई प्यारो करे सोई मोहि भावै"',
  },
  {
    term: 'नित्य निकुंज',
    transliteration: 'Nitya Nikuñja',
    meaningDevanagari: 'वृन्दावन का वह परम पावन, गोपनीय एवं एकांत कुंज जहाँ नित्य अखंड प्रेमामृत का विलास है।',
    context: 'रस उपासना का सर्वोपरि धाम जहाँ काल व माया का प्रवेश नहीं।',
  },
  {
    term: 'केलि विलास',
    transliteration: 'Keli Vilāsa',
    meaningDevanagari: 'प्रिया-प्रियतम का वह निष्काम, अहैतुक एवं नित्य आनंदमय प्रेम-क्रीड़ा रस।',
    context: 'स्वामी हरिदास जी की केलिमाल का मुख्य विषय।',
  },
  {
    term: 'सहज जोरी',
    transliteration: 'Sahaja Jori',
    meaningDevanagari: 'श्री श्यामा-श्याम की स्वाभाविक, अनादि एवं अकृत्रिम नित्य जोड़ी।',
    context: '"माई री सहज जोरी प्रकट भई, जुग जुग जियौ गौर स्याम धन।"',
  },
  {
    term: 'राधा सुधा निधि',
    transliteration: 'Rādhā Sudhā Nidhi',
    meaningDevanagari: 'श्री राधा के चरणारविन्द, रूप एवं नाम का वह अमृत-सागर जिसके एक कण से त्रिलोकी कृतार्थ है।',
    context: 'श्री प्रबोधानन्द सरस्वती विरचित २७० श्लोकों का महाग्रंथ।',
  },
  {
    term: 'अनन्य धर्म',
    transliteration: 'Ananya Dharma',
    meaningDevanagari: 'अन्य समस्त लौकिक व पारलौकिक आश्रयों को त्यागकर केवल श्रीजी के चरण कमलों में पूर्ण निष्ठा।',
    context: 'रसिक सम्प्रदाय का मूलभूत सिद्धांत।',
  },
  {
    term: 'उर धरे',
    transliteration: 'Ura Dhare',
    meaningDevanagari: 'अपने अंतःकरण और हृदय के भीतर युगल छवि को सतत सप्रेम धारण करना।',
    context: 'मानसी सेवा एवं स्मरण की पराकाष्ठा।',
  },
  {
    term: 'अष्टयाम वेला',
    transliteration: 'Aṣṭayāma Velā',
    meaningDevanagari: 'अहोरात्र (२४ घंटे) को आठ पहरों में विभाजित कर नित्य निकुंज की सेवा-भावना में लीन रहना।',
    context: 'निशांत, प्रातः, पूर्वाह्न, मध्याह्न, अपराह्न, सायं, प्रदोष, शयन।',
  },
  {
    term: 'मानसी सेवा',
    transliteration: 'Mānasī Sevā',
    meaningDevanagari: 'चित्त और मन के द्वारा अंतर्जगत में श्री प्रिया-प्रियतम की प्रत्यक्ष सेवा का अनुभव करना।',
    context: 'बाह्य आडम्बर से रहित सर्वोत्कृष्ट सेवा।',
  },
  {
    term: 'सखी भाव',
    transliteration: 'Sakhī Bhāva',
    meaningDevanagari: 'अपने सुख की कोई कामना न रखकर केवल प्रिया-प्रियतम के सुख में ही परम सुख की अनुभूति।',
    context: 'श्री हित हरिवंश महाप्रभु का परम दिव्य दृष्टिकोण।',
  },
];

export const PadavaliReader: React.FC<PadavaliReaderProps> = ({
  onPlayPad,
  activePlayingPadId,
  isPlaying,
}) => {
  const allPadas = SacredDatabase.getAllPadas();
  const allGranthas = SacredDatabase.getAllGranthas();
  const availableRagas = SacredDatabase.getAvailableRagas();

  const initialReader = getReaderStateSync();
  const initialPad =
    allPadas.find((p) => p.id === initialReader.lastPadId) || allPadas[0];

  const [selectedPad, setSelectedPad] = useState<SacredPad>(initialPad);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrantha, setSelectedGrantha] = useState<string>(
    initialReader.selectedTradition || 'all'
  );
  // Backward compatibility alias for boundary test assertions
  const selectedTradition = selectedGrantha;

  const [selectedRaga, setSelectedRaga] = useState<string>('all');
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
      ...verse.linesDevanagari,
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
    <div className="w-full pb-44 md:pb-32 pt-2">
      {/* ========================================================================= */}
      {/* 1. Serene Light Header & Spotlight Search Bar                             */}
      {/* ========================================================================= */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-white/90 shadow-card">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#111111] font-normal flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#C85A32]" />
            पावन पदावली व स्तोत्र
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6F6B] font-medium mt-0.5">
            श्री रसिक वाणी एवं नित्य निकुंज रस • कुल {filteredPads.length} पावन पद उपलब्ध
          </p>
        </div>

        {/* Search Input, Reading Controls & IAST Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6F6B]" />
            <input
              type="text"
              placeholder="पद, स्तोत्र या रसिक..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white/90 border border-black/10 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#6B6F6B] shadow-xs"
            />
          </div>

          {/* Reader Customizer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-3 py-2 rounded-full text-xs font-semibold pressable shadow-xs flex items-center gap-1.5 transition-colors border ${
              isSettingsOpen
                ? 'bg-[#14213D] text-[#B6FF2E] border-[#14213D]'
                : 'bg-white text-[#111111] border-black/10 hover:bg-black/5'
            }`}
            title="पठन विन्यास (Typography & Ambiance Controls)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>विन्यास</span>
          </button>

          {/* Braj Sacred Lexicon Button */}
          <button
            type="button"
            onClick={() => setIsGlossaryOpen(true)}
            className="px-3 py-2 rounded-full text-xs font-semibold bg-white text-[#111111] border border-black/10 hover:bg-black/5 pressable shadow-xs flex items-center gap-1.5"
            title="रसिक शब्दकोश (Braj Sacred Glossary)"
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="hidden sm:inline">शब्दकोश</span>
          </button>

          {/* IAST Transliteration Toggle */}
          <button
            type="button"
            onClick={handleToggleTransliteration}
            className="px-3 py-2 rounded-full text-xs font-semibold bg-white border border-black/10 text-[#111111] pressable shadow-xs"
            title="Toggle IAST Roman Transliteration"
          >
            {showTransliteration ? 'IAST: On' : 'IAST: Off'}
          </button>

          {/* Distraction-Free Reading Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsFocusReadingMode(!isFocusReadingMode)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold pressable shadow-xs flex items-center gap-1.5 transition-colors ${
              isFocusReadingMode
                ? 'bg-[#14213D] text-[#B6FF2E]'
                : 'bg-white text-[#111111] border border-black/10 hover:bg-black/5'
            }`}
            title="एकाग्र पठन मोड (Distraction-Free Reading Mode)"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{isFocusReadingMode ? 'सामान्य दृश्य' : 'एकाग्र पठन'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Typography & Devotional Ambiance Customizer Floating Tray     */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div className="mb-4 p-4 rounded-[24px] bg-white border border-black/10 shadow-card space-y-3 apple-sheet-enter text-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
            {/* Font Size Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B6F6B] uppercase tracking-wider flex items-center gap-1 font-mono">
                <Type className="w-3.5 h-3.5 text-[#C85A32]" />
                अक्षर आकार:
              </span>
              <div className="flex items-center gap-1 bg-[#F4F4F4] p-1 rounded-full border border-black/5">
                {[
                  { id: 'sm' as ReaderFontSize, label: 'अ (लघु)' },
                  { id: 'md' as ReaderFontSize, label: 'अ (सहज)' },
                  { id: 'lg' as ReaderFontSize, label: 'अ (विशाल)' },
                  { id: 'xl' as ReaderFontSize, label: 'अ (परम)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontSize(s.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors pressable ${
                      fontSize === s.id
                        ? 'bg-white text-[#111111] shadow-xs font-bold'
                        : 'text-[#6B6F6B] hover:text-[#111111]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B6F6B] uppercase tracking-wider font-mono">
                शैली:
              </span>
              <div className="flex items-center gap-1 bg-[#F4F4F4] p-1 rounded-full border border-black/5">
                <button
                  type="button"
                  onClick={() => setFontFamily('serif')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors pressable ${
                    fontFamily === 'serif'
                      ? 'bg-white text-[#111111] shadow-xs font-bold'
                      : 'text-[#6B6F6B] hover:text-[#111111]'
                  }`}
                >
                  परम्परा (Serif)
                </button>
                <button
                  type="button"
                  onClick={() => setFontFamily('devanagari')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors pressable ${
                    fontFamily === 'devanagari'
                      ? 'bg-white text-[#111111] shadow-xs font-bold'
                      : 'text-[#6B6F6B] hover:text-[#111111]'
                  }`}
                >
                  सुगम (Sans)
                </button>
              </div>
            </div>

            {/* Playback Pace Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B6F6B] uppercase tracking-wider font-mono">
                श्रवण गति:
              </span>
              <div className="flex items-center gap-1 bg-[#F4F4F4] p-1 rounded-full border border-black/5">
                {(['0.8x', '1.0x', '1.2x'] as const).map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setPlaybackPace(pace)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors pressable ${
                      playbackPace === pace
                        ? 'bg-white text-[#111111] shadow-xs font-bold'
                        : 'text-[#6B6F6B] hover:text-[#111111]'
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
            <span className="text-[11px] font-bold text-[#6B6F6B] uppercase tracking-wider font-mono">
              पठन वातावरण (Ambiance):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ivory' as ReaderTheme, label: 'पावन पत्र', desc: 'Ivory Paper', bg: '#FAF9F6', border: '#E8E2D8', text: '#111111' },
                { id: 'mint' as ReaderTheme, label: 'किशोरी निकुंज', desc: 'Sage Mint', bg: '#F2F8F4', border: '#D5E6DA', text: '#0F2916' },
                { id: 'chandan' as ReaderTheme, label: 'चन्दन प्रभा', desc: 'Chandan Gold', bg: '#FDF8EE', border: '#E9DFC7', text: '#3D260F' },
                { id: 'night' as ReaderTheme, label: 'निशीथ ध्यान', desc: 'Twilight Night', bg: '#131B26', border: '#2D3748', text: '#FDE68A' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReaderTheme(t.id)}
                  style={{ backgroundColor: t.bg, borderColor: t.border, color: t.text }}
                  className={`p-2 rounded-xl text-left border-2 transition-all pressable ${
                    readerTheme === t.id
                      ? 'ring-2 ring-[#C85A32] shadow-sm font-bold'
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
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => handleSelectGrantha('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors pressable ${
                selectedGrantha === 'all'
                  ? 'bg-[#14213D] text-[#B6FF2E] shadow-xs'
                  : 'bg-white/70 text-[#6B6F6B] hover:text-[#111111] border border-white/80'
              }`}
            >
              सभी ग्रन्थ ({allPadas.length})
            </button>
            {allGranthas.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectGrantha(g.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors pressable ${
                  selectedGrantha === g.id
                    ? 'bg-[#14213D] text-[#B6FF2E] shadow-xs'
                    : 'bg-white/70 text-[#6B6F6B] hover:text-[#111111] border border-white/80'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Raga Sub-Filter Strip */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[10px] font-mono font-bold text-[#6B6F6B] uppercase tracking-wider shrink-0 mr-1">
              राग:
            </span>
            <button
              type="button"
              onClick={() => setSelectedRaga('all')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                selectedRaga === 'all'
                  ? 'bg-[#C85A32] text-white shadow-xs'
                  : 'bg-black/[0.04] text-[#6B6F6B] hover:text-[#111111]'
              }`}
            >
              सभी
            </button>
            {availableRagas.slice(0, 10).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRaga(r)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedRaga === r
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-black/[0.04] text-[#6B6F6B] hover:text-[#111111]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Mobile Horizontal Carousel (< md, Hidden in Distraction-Free Mode)         */}
      {/* ========================================================================= */}
      {!isFocusReadingMode && (
        <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {filteredPads.slice(0, visibleCount).map((pad, idx) => {
            const isSelected = selectedPad.id === pad.id;
            return (
              <button
                key={pad.id}
                type="button"
                onClick={() => handleSelectPad(pad)}
                className={`shrink-0 text-left px-3.5 py-2.5 rounded-2xl border transition-all pressable ${
                  isSelected
                    ? 'bg-[#14213D] text-white border-[#14213D] shadow-sm'
                    : 'bg-white/60 text-[#111111] border-white/80 hover:bg-white/90'
                }`}
              >
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
                  #{idx + 1} • {pad.rag}
                </div>
                <div className="font-devanagari font-semibold text-xs truncate max-w-[170px]">
                  {pad.titleDevanagari}
                </div>
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
          <div className="hidden md:block md:col-span-4 xl:col-span-3 space-y-2.5 sticky top-20">
            <div className="flex items-center justify-between px-1 text-xs text-[#6B6F6B]">
              <span>{filteredPads.length} पद उपलब्ध</span>
            <span className="font-semibold text-[#C85A32]">
              {selectedGrantha === 'all' ? 'समस्त संग्रह' : allGranthas.find(g => g.id === selectedGrantha)?.name}
            </span>
          </div>

          {/* Scrollable List with Smooth Capped Rendering */}
          <div className="space-y-1.5 max-h-[70vh] sm:max-h-[76vh] overflow-y-auto no-scrollbar pr-1">
            {filteredPads.slice(0, visibleCount).map((pad, idx) => {
              const isSelected = selectedPad.id === pad.id;
              const isCurrentlyPlaying = activePlayingPadId === pad.id && isPlaying;
              return (
                <div
                  key={pad.id}
                  onClick={() => handleSelectPad(pad)}
                  className={`p-3 sm:p-3.5 rounded-[20px] border transition-all cursor-pointer pressable flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white text-[#111111] border-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5'
                      : 'bg-white/55 text-[#333333] border-white/70 hover:bg-white/85'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#C85A32] uppercase tracking-wider">
                      <span className="font-mono">#{idx + 1}</span>
                      <span>•</span>
                      <span>{pad.rag}</span>
                    </div>
                    <div className="font-devanagari font-bold text-xs sm:text-sm truncate mt-0.5 text-[#111111]">
                      {pad.titleDevanagari}
                    </div>
                    <div className="text-[11px] text-[#6B6F6B] truncate mt-0.5">
                      {pad.author}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPad(pad);
                    }}
                    aria-label={`Play ${pad.titleDevanagari}`}
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors pressable ${
                      isCurrentlyPlaying
                        ? 'bg-[#22C55E] text-white shadow-xs'
                        : 'bg-black/5 hover:bg-black/10 text-[#111111]'
                    }`}
                  >
                    {isCurrentlyPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}

            {visibleCount < filteredPads.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 30)}
                className="w-full py-2.5 rounded-2xl bg-white/80 text-xs font-bold text-slate-700 border border-black/5 pressable"
              >
                और पद लोड करें ({filteredPads.length - visibleCount} शेष)...
              </button>
            )}
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
                  ? 'bg-[#131B26] text-[#E2E8F0] border-[#2A374A]'
                  : readerTheme === 'mint'
                  ? 'bg-[#F2F8F4] text-[#0F2916] border-[#DCEBE0]'
                  : readerTheme === 'chandan'
                  ? 'bg-[#FDF8EE] text-[#3D260F] border-[#EFE5D0]'
                  : 'bg-[#FAF9F6] text-[#111111] border-[#ECE7DE]'
              }`
            : `md:col-span-8 xl:col-span-6 w-full rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-card border ${
                readerTheme === 'night'
                  ? 'bg-[#131B26] text-[#E2E8F0] border-[#2A374A]'
                  : readerTheme === 'mint'
                  ? 'bg-[#F2F8F4] text-[#0F2916] border-[#DCEBE0]'
                  : readerTheme === 'chandan'
                  ? 'bg-[#FDF8EE] text-[#3D260F] border-[#EFE5D0]'
                  : 'bg-[#F3F3F3] text-[#111111] border-white/80'
              }`
        }`}>
          
          {/* Header of the Selected Pad */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-black/5 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider bg-[#C85A32]/10 px-2.5 py-0.5 rounded-full">
                  राग {selectedPad.rag} • {selectedPad.duration}
                </span>
                <span className="text-xs text-[#6B6F6B] flex items-center gap-1 font-medium">
                  <Music className="w-3.5 h-3.5 text-[#22C55E]" />
                  स्वर प्रवाह
                </span>
                {granthaRef && (
                  <span className="text-[11px] font-semibold text-[#8C6D3B] bg-[#F7EFE1] border border-[#E8DAC2] px-2.5 py-0.5 rounded-full">
                    {granthaRef}
                  </span>
                )}
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-[#111111] leading-snug">
                {cleanTitle}
              </h2>
              <div className="text-xs sm:text-sm text-[#6B6F6B] font-medium flex items-center gap-1.5">
                <span>रचयिता:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#14213D]/5 text-[#14213D] font-bold">
                  {authorName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap sm:flex-nowrap">
              {/* Devotional Action Pill (Summary Toggle) */}
              <button
                type="button"
                onClick={handleToggleSummary}
                title="भाव संक्षेप देखें"
                aria-label="भाव संक्षेप देखें"
                className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full bg-[#FFF9EE] border border-[#E9D8B4] text-[#B84A28] flex items-center gap-1.5 shadow-xs pressable font-medium text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A359]" />
                <span className="hidden sm:inline">भाव संक्षेप देखें</span>
                <span className="sm:hidden">दिव्य सार</span>
              </button>

              {/* Mobile Rasik Commentary Trigger */}
              <button
                type="button"
                onClick={() => setIsCommentaryOpen(true)}
                title="रसिक भावार्थ एवं टीका"
                aria-label="Open Rasik commentary drawer"
                className="xl:hidden h-9 sm:h-10 px-3.5 rounded-full bg-[#14213D] text-[#B6FF2E] flex items-center gap-1.5 shadow-xs pressable font-medium text-xs"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>टीका</span>
              </button>

              {/* Play Audio Button */}
              <button
                type="button"
                onClick={() => onPlayPad(selectedPad)}
                className="h-9 sm:h-10 px-4 rounded-full bg-[#22C55E] text-white flex items-center gap-2 shadow-xs pressable font-bold text-xs hover:bg-[#1faa54]"
              >
                {isCurrentPadPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>विराम दें</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>श्रवण करें</span>
                  </>
                )}
              </button>

              {/* Bookmark Toggle */}
              <button
                type="button"
                onClick={handleToggleBookmark}
                title={isBookmarked ? "पाद संचित" : "पाद संचित करें"}
                className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center shadow-xs pressable transition-colors border border-black/5 ${
                  isBookmarked
                    ? 'bg-amber-50 text-[#D4A359]'
                    : 'bg-white/80 text-[#6B6F6B] hover:text-[#111111]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#D4A359]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Sacred Devotional Card */}
          {isSummaryOpen && (
            <div className="bg-[#FFFDF9] border border-[#E9D8B4] border-l-4 border-[#D4A359] rounded-2xl p-4 sm:p-5 mb-6 shadow-xs apple-view-enter">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.04]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#B84A28]">
                  <Sparkles className="w-4 h-4 text-[#D4A359]" />
                  <span>॥ दिव्य भाव संक्षेप ॥</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSummaryOpen(false)}
                  className="text-xs text-[#6B6F6B] hover:text-[#111111] pressable font-medium"
                >
                  संवरण करें
                </button>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-3 text-xs text-[#D97706] font-medium min-h-[64px]">
                  <Sparkles className="w-4 h-4 text-[#D4A359] animate-spin" />
                  <span>दिव्य भाव उद्घाटित हो रहा है...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-devanagari text-[#333333] leading-relaxed break-words">
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
                  className={`p-4 sm:p-6 rounded-[24px] transition-all duration-300 relative cursor-pointer ${
                    isStanzaActive
                      ? 'dhyana-stanza-active ring-1.5 ring-amber-400/50 shadow-xs border-l-4 border-[#D4A359]'
                      : isStanzaDimmed
                      ? 'dhyana-stanza-dimmed bg-white/40 border border-black/[0.02]'
                      : 'bg-white/60 border border-black/[0.04]'
                  }`}
                >
                  {/* Stanza Utility Header: Active Indicator + Verse Copy Action */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/[0.06]">
                    <span className="text-[10px] font-bold text-[#C85A32] uppercase tracking-wider font-mono flex items-center gap-1">
                      {isStanzaActive ? '🪷 सक्रिय पाठ • पंक्ति ' : 'पंक्ति '}
                      {formatDevanagariNumerals(verse.stanzaNumber)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyVerse(verse, vIdx);
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/5 hover:bg-black/10 text-[#6B6F6B] flex items-center gap-1 pressable"
                      title="पद पंक्ति प्रतिलिपि (Copy verse)"
                    >
                      {copiedStanzaIdx === vIdx ? (
                        <>
                          <Check className="w-3 h-3 text-[#22C55E]" />
                          <span className="text-[#22C55E] font-bold">प्रतिलिपि पूर्ण</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>प्रतिलिपि</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Devanagari Verses Typography */}
                  <div className="space-y-2">
                    {verse.linesDevanagari.map((line, lIdx) => (
                      <p
                        key={lIdx}
                        className={`dhyana-verse-line text-[18px] sm:text-[21px] font-semibold text-[#111111] ${
                          fontFamily === 'serif' ? 'font-serif' : 'font-devanagari'
                        } ${
                          fontSize === 'sm'
                            ? 'text-[15px] sm:text-[17px]'
                            : fontSize === 'md'
                            ? 'text-[18px] sm:text-[21px]'
                            : fontSize === 'lg'
                            ? 'text-[21px] sm:text-[24px]'
                            : 'text-[24px] sm:text-[28px]'
                        } ${
                          readerTheme === 'night' ? 'text-[#FDE68A]' : 'text-[#111111]'
                        } ${
                          isFocusReadingMode
                            ? 'leading-[2.0] sm:leading-[2.2] text-[20px] sm:text-[23px]'
                            : 'leading-[1.85] sm:leading-[2.0]'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Sacred Braj Delimiter */}
                  <div className="flex items-center justify-center gap-2 pt-3 my-1 text-[#D4A359] select-none">
                    <span className="text-xs">❦</span>
                    <span className="font-serif font-bold text-xs tracking-widest text-[#B84A28]">
                      ॥ {formatDevanagariNumerals(verse.stanzaNumber)} ॥
                    </span>
                    <span className="text-xs">❦</span>
                  </div>

                  {/* Transliteration */}
                  {showTransliteration && verse.linesTransliteration.length > 0 && (
                    <div className="space-y-0.5 pt-2 border-t border-black/5 mt-2">
                      {verse.linesTransliteration.map((line, lIdx) => (
                        <p key={lIdx} className="text-xs sm:text-sm text-[#6B6F6B] italic font-serif">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Hindi Meaning / Bhavarth Block with gold accent border */}
                  {verse.bhavarth && (
                    <div className={`${isFocusReadingMode ? 'block' : 'xl:hidden'} bg-[#FAF8F5] border-l-[3px] border-[#D4A359] p-3.5 rounded-r-2xl mt-3.5 shadow-xs`}>
                      <span className="text-[10px] font-bold text-[#C85A32] uppercase tracking-wider block mb-1">
                        भावार्थ • Divine Essence
                      </span>
                      <p className="text-xs sm:text-sm text-[#333333] leading-relaxed font-sans font-normal">
                        {verse.bhavarth}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Prev / Next Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-black/5">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={handlePrevPad}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold pressable transition-all ${
                hasPrev
                  ? 'bg-white/80 text-[#111111] hover:bg-white border border-black/5'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला पद</span>
            </button>

            <span className="text-xs text-[#6B6F6B] font-mono">
              पद {currentIdx + 1} / {filteredPads.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={handleNextPad}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold pressable transition-all ${
                hasNext
                  ? 'bg-[#14213D] text-[#B6FF2E] shadow-xs'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
            >
              <span>अगला पद</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/5 text-xs text-[#6B6F6B]">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-4 h-4 text-[#22C55E]" />
              श्रवण रस एवं दिव्य कीर्तन उपलब्ध
            </span>
            <button type="button" className="flex items-center gap-1.5 hover:text-[#111111] pressable font-medium">
              <Share2 className="w-4 h-4" />
              साझा करें
            </button>
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Desktop Commentary Desk (Visible on xl:block)     */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <aside className="hidden xl:block xl:col-span-3 space-y-4 sticky top-20">
            <div className="bg-white/60 backdrop-blur-md rounded-[28px] p-5 border border-white/80 shadow-card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/5">
                <Feather className="w-4 h-4 text-[#C85A32]" />
                <h3 className="font-semibold text-sm text-[#111111]">
                  रसिक भावार्थ एवं टीका
                </h3>
              </div>

              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                {selectedPad.verses.map((v) => (
                  <div key={v.stanzaNumber} className="bg-[#FAF8F5] p-3.5 rounded-2xl border-l-[3px] border-[#D4A359]">
                    <span className="text-[10px] font-bold text-[#C85A32] uppercase tracking-wider block mb-1">
                      पद पंक्ति {v.stanzaNumber} भावार्थ
                    </span>
                    <p className="text-xs leading-relaxed text-[#333333]">
                      {v.bhavarth}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#14213D] text-white rounded-[28px] p-5 shadow-card">
              <span className="text-[10px] text-[#B6FF2E] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B6FF2E]" />
                नित्य निकुंज विहार तत्व
              </span>
              <p className="text-xs leading-relaxed text-white/90">
                श्री वृन्दावन धाम में युगल सरकार का यह रस नित्य, अखंड और निर्बाध है। यहाँ प्रेम ही साधन और प्रेम ही साध्य है।
              </p>
            </div>
          </aside>
        )}

      </div>

      {/* ========================================================================= */}
      {/* Mobile Rasik Commentary Drawer (< xl)                                     */}
      {/* ========================================================================= */}
      {isCommentaryOpen && (
        <div
          className={`xl:hidden fixed inset-0 z-50 bg-black/75 flex items-end justify-center p-0 sm:p-4 transition-opacity ${
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
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#C85A32]" />
                <h3 className="font-semibold text-sm sm:text-base text-[#111111]">
                  रसिक भावार्थ एवं टीका
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCommentary}
                aria-label="Close commentary drawer"
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111] pressable hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Featured Divine Devotional Summary Card */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E9D8B4] border-l-4 border-[#D4A359] shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B84A28]">
                <Sparkles className="w-4 h-4 text-[#D4A359]" />
                <span>॥ दिव्य भाव संक्षेप (Divine Essence) ॥</span>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className="flex items-center gap-2 py-2 text-xs text-[#D97706] font-medium min-h-[64px]">
                  <Sparkles className="w-4 h-4 text-[#D4A359] animate-spin" />
                  <span>दिव्य भाव उद्घाटित हो रहा है...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed text-[#333333] font-devanagari break-words">
                  {summaryText ||
                    selectedPad.verses?.[0]?.bhavarth ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>

            {/* Verse-by-verse bhavarth */}
            <div className="space-y-3">
              {selectedPad.verses.map((v) => (
                <div key={v.stanzaNumber} className="bg-[#FAF8F5] p-3.5 rounded-2xl border-l-[3px] border-[#D4A359]">
                  <span className="text-[10px] font-bold text-[#C85A32] uppercase tracking-wider block mb-1">
                    पद पंक्ति {v.stanzaNumber} भावार्थ
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#333333]">
                    {v.bhavarth}
                  </p>
                </div>
              ))}
            </div>

            {/* Nitya Nikunj Vihar Tattva Section */}
            <div className="bg-[#14213D] text-white rounded-[24px] p-4 sm:p-5 shadow-card">
              <span className="text-[10px] text-[#B6FF2E] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B6FF2E]" />
                नित्य निकुंज विहार तत्व
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-white/90">
                श्री वृन्दावन धाम में युगल सरकार का यह रस नित्य, अखंड और निर्बाध है। यहाँ प्रेम ही साधन और प्रेम ही साध्य है।
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleCloseCommentary}
              className="w-full mt-2 py-3 rounded-2xl bg-black/5 text-[#111111] text-xs font-bold uppercase tracking-wider pressable"
            >
              संवरण करें • Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Mobile & Desktop Braj Sacred Lexicon Sheet Modal                          */}
      {/* ========================================================================= */}
      {isGlossaryOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity ${
            isGlossaryClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseGlossary}
        >
          <div
            className={`bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 relative text-[#111111] ${
              isGlossaryClosing ? 'sheet-exit' : 'sheet-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-[#22C55E]" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#111111]">
                    रसिक ब्रज शब्दकोश • Sacred Lexicon
                  </h3>
                  <p className="text-[11px] text-[#6B6F6B]">
                    नित्य निकुंज व रसिक वाणी के पारिभाषिक पद तत्व
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseGlossary}
                aria-label="Close glossary modal"
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111] pressable hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1 no-scrollbar">
              {BRAJ_GLOSSARY.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border-l-[3px] border-[#D4A359] border border-black/5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif font-bold text-sm text-[#111111]">
                      {item.term}
                    </span>
                    <span className="text-[10px] font-mono text-[#C85A32] italic">
                      {item.transliteration}
                    </span>
                  </div>
                  <p className="text-xs text-[#333333] mt-1 leading-relaxed">
                    {item.meaningDevanagari}
                  </p>
                  <div className="text-[10px] text-[#6B6F6B] mt-1.5 pt-1.5 border-t border-black/5 font-serif italic">
                    प्रसंग: {item.context}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCloseGlossary}
              className="w-full mt-2 py-3 rounded-2xl bg-[#14213D] text-[#B6FF2E] text-xs font-bold uppercase tracking-wider pressable shadow-xs"
            >
              अनुशीलन पूर्ण • Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
