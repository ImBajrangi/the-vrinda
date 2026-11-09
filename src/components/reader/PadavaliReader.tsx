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
  ChevronDown,
  ScrollText,
  Feather,
  X,
  Sparkles,
  Wind,
  SlidersHorizontal,
  BookOpenCheck,
  Copy,
  Check,
  Type,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Gauge,
  Palette,
} from 'lucide-react';
import { SacredDatabase } from '../../services/sacredDatabase';
import { SacredPad, AuthorHierarchyInfo } from '../../types/devotional';
import { InlinePurportCard } from './InlinePurportCard';
import { DevotionalVersePresenter } from './DevotionalVersePresenter';
import { seo } from '../../services/seoService';
import {
  getReaderStateSync,
  saveReaderState,
  saveCachedBookmarks,
  getCachedBookmarks,
  initMultiTabSync,
  formatDevanagariNumerals,
} from '../../services/cacheService';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';
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
  selectedPadId?: string;
  initialPadId?: string;
  onSelectGranthaId?: (granthaId: string) => void;
  onSelectPad?: (pad: SacredPad) => void;
}

type ReaderTheme = 'ivory' | 'mint' | 'chandan';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderFontFamily = 'serif' | 'devanagari';
type ReaderTextAlign = 'left' | 'center' | 'justify';

const ENTITY_REGEX_MAP: [RegExp, string][] = [
  [/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, ''],
  [/&(?:ndash|#8211);/gi, '–'],
  [/&(?:mdash|#8212);/gi, '—'],
  [/&(?:lsquo|#8216);/gi, '‘'],
  [/&(?:rsquo|#8217);/gi, '’'],
  [/&(?:ldquo|#8220);/gi, '“'],
  [/&(?:rdquo|#8221);/gi, '”'],
  [/&(?:bull|#8226);/gi, '•'],
  [/&(?:nbsp|#160);/gi, ' '],
  [/&(?:quot|#34);/gi, '"'],
  [/&(?:apos|#39);/gi, "'"],
];

export const sanitizeSacredText = (text: string): string => {
  if (!text) return '';
  let res = String(text);
  res = res.replace(/&amp;/gi, '&');
  res = res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '');
  res = res.replace(/[\u200B-\u200D\uFEFF]/g, '');
  for (const [regex, replacement] of ENTITY_REGEX_MAP) {
    res = res.replace(regex, replacement);
  }
  res = res.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  return res.replace(/&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?/gi, '');
};

/**
 * Defensive verse line sanitizer & stanza segmenter
 * Ensures unformatted commentary blobs or monolithic prose strings
 * gracefully decompose into authentic poetic verses for optimal reading cadence.
 */


const themeStyles: Record<
  ReaderTheme,
  {
    canvasBg: string;
    canvasText: string;
    cardActiveBg: string;
    cardHoverBg: string;
    cardDefaultBg: string;
    titleColor: string;
    metaColor: string;
    lineColor: string;
    translitColor: string;
    bhavarthBg: string;
    bhavarthText: string;
    borderColor: string;
    commentaryBg: string;
  }
> = {
  ivory: {
    canvasBg: 'bg-white',
    canvasText: 'text-[#18181B]',
    cardActiveBg: 'bg-[#FEF9C3]/75',
    cardHoverBg: 'hover:bg-[#FAF9F5]',
    cardDefaultBg: 'bg-transparent',
    titleColor: 'text-[#0F172A]',
    metaColor: 'text-[#B45309]',
    lineColor: 'text-[#0F172A]',
    translitColor: 'text-[#64748B]',
    bhavarthBg: 'bg-[#F8FAFC]',
    bhavarthText: 'text-[#334155]',
    borderColor: 'border-neutral-100',
    commentaryBg: 'bg-white',
  },
  mint: {
    canvasBg: 'bg-[#F0FDF4]',
    canvasText: 'text-[#14532D]',
    cardActiveBg: 'bg-[#DCFCE7]',
    cardHoverBg: 'hover:bg-[#DCFCE7]/50',
    cardDefaultBg: 'bg-transparent',
    titleColor: 'text-[#064E3B]',
    metaColor: 'text-[#15803D]',
    lineColor: 'text-[#064E3B]',
    translitColor: 'text-[#166534]',
    bhavarthBg: 'bg-[#DCFCE7]/70',
    bhavarthText: 'text-[#14532D]',
    borderColor: 'border-emerald-200/60',
    commentaryBg: 'bg-[#F0FDF4]',
  },
  chandan: {
    canvasBg: 'bg-[#FAF7EE]',
    canvasText: 'text-[#3D260F]',
    cardActiveBg: 'bg-[#FEF08A]/75',
    cardHoverBg: 'hover:bg-[#FEFCE8]/75',
    cardDefaultBg: 'bg-transparent',
    titleColor: 'text-[#291807]',
    metaColor: 'text-[#B45309]',
    lineColor: 'text-[#3D260F]',
    translitColor: 'text-[#78350F]',
    bhavarthBg: 'bg-[#FEF9C3]/75',
    bhavarthText: 'text-[#451A03]',
    borderColor: 'border-amber-200/60',
    commentaryBg: 'bg-[#FAF7EE]',
  },
};

export const PadavaliReader: React.FC<PadavaliReaderProps> = ({
  onPlayPad,
  activePlayingPadId,
  isPlaying,
  selectedGranthaId,
  selectedSearchQuery,
  selectedPadId,
  initialPadId,
  onSelectGranthaId,
  onSelectPad: onExternalSelectPad,
}) => {
  const [allPadas, setAllPadas] = useState<SacredPad[]>(() => SacredDatabase.getAllPadas());
  const allGranthas = SacredDatabase.getAllGranthas();

  // Subscribe to dynamic sacred database hydration (IndexedDB / CDN)
  useEffect(() => {
    return SacredDatabase.subscribe(() => {
      setAllPadas([...SacredDatabase.getAllPadas()]);
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState(selectedSearchQuery || '');
  const [loadingGranthaId, setLoadingGranthaId] = useState<string | null>(null);
  const [loadingPadId, setLoadingPadId] = useState<string | null>(null);
  const [selectedGrantha, setSelectedGrantha] = useState<string>(
    selectedGranthaId || getReaderStateSync().selectedTradition || 'all'
  );
  type GranthaCategory = 'all' | 'mahagranth' | 'rasik-vani' | 'kavya' | 'dham-leela' | 'authors';
  const [granthaCategory, setGranthaCategory] = useState<GranthaCategory>(() => {
    if (selectedGranthaId) {
      const g = SacredDatabase.getGranthaById(selectedGranthaId);
      if (g?.category) return g.category as GranthaCategory;
    }
    return 'all';
  });

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState<boolean>(false);
  const [activeScrollerVerseId, setActiveScrollerVerseId] = useState<string>('');

  type ReadingMode = 'continuous' | 'single';
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reading_mode') as ReadingMode;
      if (saved === 'single' || saved === 'continuous') return saved;
    }
    return 'continuous';
  });

  const handleSetReadingMode = (mode: ReadingMode) => {
    setReadingMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reading_mode', mode);
    }
  };

  const [expandedPurportPadIds, setExpandedPurportPadIds] = useState<Set<string>>(new Set());
  const toggleInlinePurport = (padId: string) => {
    setExpandedPurportPadIds((prev) => {
      const next = new Set(prev);
      if (next.has(padId)) next.delete(padId);
      else next.add(padId);
      return next;
    });
  };

  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const autoScrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
      return;
    }

    let lastTime = performance.now();
    const speed = 0.65;

    const scrollStep = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      lastTime = currentTime;
      if (elapsed > 0 && elapsed < 100) {
        window.scrollBy({ top: speed * (elapsed / 16.6), behavior: 'auto' });
      }
      autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    };

    autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [isAutoScrolling]);

  useEffect(() => {
    if (!isAutoScrolling) return;
    const handlePauseScroll = () => {
      setIsAutoScrolling(false);
    };
    window.addEventListener('wheel', handlePauseScroll, { passive: true });
    window.addEventListener('touchmove', handlePauseScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', handlePauseScroll);
      window.removeEventListener('touchmove', handlePauseScroll);
    };
  }, [isAutoScrolling]);

  const [hierarchyAuthors, setHierarchyAuthors] = useState<AuthorHierarchyInfo[]>(() =>
    SacredDatabase.getAllHierarchyAuthors()
  );

  useEffect(() => {
    SacredDatabase.getScriptureHierarchy().then((h) => {
      if (h && h.authors) {
        setHierarchyAuthors(Object.values(h.authors).sort((a, b) => b.verseCount - a.verseCount));
      }
    });
  }, []);

  const displayedGranthas = useMemo(() => {
    if (granthaCategory === 'all' || granthaCategory === 'authors') return allGranthas;
    return allGranthas.filter((g) => g.category === granthaCategory);
  }, [allGranthas, granthaCategory]);

  const [selectedRaga, setSelectedRaga] = useState<string>('all');
  const [sidebarQuery, setSidebarQuery] = useState('');

  // Scripture Category Pills Sliding Indicator
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [categoryPillStyle, setCategoryPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateCategoryPill = () => {
      const el = categoryRefs.current[granthaCategory];
      if (el) {
        setCategoryPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setCategoryPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateCategoryPill();
    const frame = requestAnimationFrame(updateCategoryPill);
    const timer = setTimeout(updateCategoryPill, 40);
    window.addEventListener('resize', updateCategoryPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateCategoryPill);
    };
  }, [granthaCategory]);

  // Main Grantha / Author Segmented Pill Track Sliding Indicator
  const granthaRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [granthaPillStyle, setGranthaPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateGranthaPill = () => {
      const activeKey = granthaCategory === 'authors' ? (selectedAuthor || 'all') : selectedGrantha;
      const el = granthaRefs.current[activeKey] || granthaRefs.current['all'];
      if (el) {
        setGranthaPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setGranthaPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };

    updateGranthaPill();
    const frame = requestAnimationFrame(updateGranthaPill);
    const timer = setTimeout(updateGranthaPill, 40);
    window.addEventListener('resize', updateGranthaPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateGranthaPill);
    };
  }, [selectedGrantha, displayedGranthas, granthaCategory, selectedAuthor]);

  useEffect(() => {
    const activeKey = granthaCategory === 'authors' ? (selectedAuthor || 'all') : selectedGrantha;
    const el = granthaRefs.current[activeKey];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [selectedGrantha, selectedAuthor, granthaCategory]);

  // Dynamically compute available classical ragas based on selected scripture collection
  const availableRagas = useMemo(() => {
    return SacredDatabase.getAvailableRagas(selectedGrantha);
  }, [selectedGrantha]);

  // Retain rendered ragas during collapsing animation so items smoothly slide without disappearing abruptly
  const [renderedRagas, setRenderedRagas] = useState<string[]>(availableRagas);

  useEffect(() => {
    if (availableRagas.length > 0) {
      setRenderedRagas(availableRagas);
    }
  }, [availableRagas]);

  const hasRagas = availableRagas.length > 0;

  // Reset selected raga if current raga is no longer in the active collection
  useEffect(() => {
    if (selectedRaga !== 'all' && !availableRagas.includes(selectedRaga)) {
      setSelectedRaga('all');
    }
  }, [availableRagas, selectedRaga]);

  // Raga Sub-Filter Strip Elastic Indicator
  const ragaRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [ragaPillStyle, setRagaPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateRagaPill = () => {
      const el = ragaRefs.current[selectedRaga] || ragaRefs.current['all'];
      if (el) {
        setRagaPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setRagaPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };

    if (hasRagas) {
      updateRagaPill();
      const frame = requestAnimationFrame(updateRagaPill);
      const timer = setTimeout(updateRagaPill, 40);
      window.addEventListener('resize', updateRagaPill);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        window.removeEventListener('resize', updateRagaPill);
      };
    }
  }, [selectedRaga, hasRagas, renderedRagas]);

  // Automatically reset selectedChapter if it does not exist in the newly selected grantha
  useEffect(() => {
    if (selectedGrantha !== 'all' && selectedChapter !== 'all') {
      const chapters = SacredDatabase.getGranthaChapters(selectedGrantha);
      const exists = chapters.some((c) => c.id === selectedChapter);
      if (!exists) {
        setSelectedChapter('all');
      }
    }
  }, [selectedGrantha, selectedChapter]);

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
    (initialPadId && SacredDatabase.getPadById(initialPadId)) ||
    (initialReader.lastPadId && SacredDatabase.getPadById(initialReader.lastPadId)) ||
    allPadas[0];

  const [selectedPad, setSelectedPad] = useState<SacredPad>(initialPad);

  const lastExplicitGranthaIdRef = useRef<string | undefined>(selectedGranthaId);
  const initialAppliedRef = useRef(false);
  const lastExplicitPadIdRef = useRef<string | undefined>(selectedPadId || initialPadId);

  useEffect(() => {
    if (selectedGranthaId && selectedGranthaId !== lastExplicitGranthaIdRef.current) {
      lastExplicitGranthaIdRef.current = selectedGranthaId;
      setSelectedGrantha(selectedGranthaId);
      const g = SacredDatabase.getGranthaById(selectedGranthaId);
      if (g?.category) {
        setGranthaCategory(g.category as GranthaCategory);
      }
    }
  }, [selectedGranthaId]);

  // On-Demand Single Pada Fetcher (Only fetches 0.65 KB for active verse)
  useEffect(() => {
    const targetId = selectedPadId || initialPadId;
    if (targetId) {
      SacredDatabase.fetchPadBySlug(targetId);
    }
  }, [selectedPadId, initialPadId]);

  useEffect(() => {
    const targetId = selectedPadId || initialPadId;
    if (!targetId) return;

    // Only apply if initial load has not resolved target pad yet, OR if parent explicitly changed selectedPadId
    if (!initialAppliedRef.current || (selectedPadId && selectedPadId !== lastExplicitPadIdRef.current)) {
      const p = SacredDatabase.getPadById(targetId);
      if (p) {
        setSelectedPad(p);
        if (p.collectionId && p.collectionId !== selectedGrantha) {
          setSelectedGrantha(p.collectionId);
          const g = SacredDatabase.getGranthaById(p.collectionId);
          if (g?.category) {
            setGranthaCategory(g.category as GranthaCategory);
          }
        }
        initialAppliedRef.current = true;
        lastExplicitPadIdRef.current = selectedPadId;
      }
    }
  }, [selectedPadId, initialPadId, allPadas]);

  useEffect(() => {
    if (selectedSearchQuery !== undefined) {
      setSearchQuery(selectedSearchQuery);
    }
  }, [selectedSearchQuery]);
  // Real-time Dynamic Verse SEO, Meta tags, and Schema.org synchronization
  useEffect(() => {
    if (selectedPad) {
      seo.updateSEO({
        tab: 'padavali',
        pad: selectedPad,
        title: `${selectedPad.titleDevanagari} (${selectedPad.author})`,
        description: `राग ${selectedPad.rag} में निबद्ध पावन पद। रचयिता: ${selectedPad.author}। वृन्दोपनिषद् 2.0`,
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

  // Reader Customizer States with Persistent LocalStorage
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reader_theme') as ReaderTheme;
      if (['ivory', 'mint', 'chandan'].includes(saved)) return saved;
    }
    return 'ivory';
  });
  const [fontSize, setFontSize] = useState<ReaderFontSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reader_fontSize') as ReaderFontSize;
      if (['sm', 'md', 'lg', 'xl'].includes(saved)) return saved;
    }
    return 'md';
  });
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reader_fontFamily') as ReaderFontFamily;
      if (['serif', 'devanagari'].includes(saved)) return saved;
    }
    return 'serif';
  });
  const [playbackPace, setPlaybackPace] = useState<'0.8x' | '1.0x' | '1.2x'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reader_playbackPace') as '0.8x' | '1.0x' | '1.2x';
      if (['0.8x', '1.0x', '1.2x'].includes(saved)) return saved;
    }
    return '1.0x';
  });
  const [textAlign, setTextAlign] = useState<ReaderTextAlign>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vrind_reader_textAlign') as ReaderTextAlign;
      if (['left', 'center', 'justify'].includes(saved)) return saved;
    }
    return 'center';
  });

  const handleSetReaderTheme = (t: ReaderTheme) => {
    setReaderTheme(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reader_theme', t);
    }
  };

  const handleSetFontSize = (s: ReaderFontSize) => {
    setFontSize(s);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reader_fontSize', s);
    }
  };

  const handleSetFontFamily = (f: ReaderFontFamily) => {
    setFontFamily(f);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reader_fontFamily', f);
    }
  };

  const handleSetPlaybackPace = (p: '0.8x' | '1.0x' | '1.2x') => {
    setPlaybackPace(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reader_playbackPace', p);
    }
  };

  const handleSetTextAlign = (a: ReaderTextAlign) => {
    setTextAlign(a);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vrind_reader_textAlign', a);
    }
  };

  // Shrinkable Sidebars States with LocalStorage Persistence
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vrind_reader_left_collapsed') === 'true';
    }
    return false;
  });

  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vrind_reader_right_collapsed') === 'true';
    }
    return false;
  });

  const handleToggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vrind_reader_left_collapsed', String(next));
      }
      return next;
    });
  };

  const handleToggleRightSidebar = () => {
    setIsRightSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vrind_reader_right_collapsed', String(next));
      }
      return next;
    });
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsTrayRef = useRef<HTMLDivElement>(null);
  const settingsToggleTopRef = useRef<HTMLButtonElement>(null);
  const settingsToggleBottomRef = useRef<HTMLButtonElement>(null);
  const [drawerHeight, setDrawerHeight] = useState<number>(0);

  // Expert Measured Height Animation (100% Flicker-Free, 0px Subpixel Jitter)
  useEffect(() => {
    const el = settingsTrayRef.current;
    if (!el) return;

    if (isSettingsOpen) {
      setDrawerHeight(el.scrollHeight);

      const ro = new ResizeObserver(() => {
        if (settingsTrayRef.current) {
          setDrawerHeight(settingsTrayRef.current.scrollHeight);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      setDrawerHeight(0);
    }
  }, [isSettingsOpen]);

  const handleToggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  // Platform-wide consistent dismissal: close settings tray on outside tap or Escape
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        settingsTrayRef.current &&
        !settingsTrayRef.current.contains(target) &&
        (!settingsToggleTopRef.current || !settingsToggleTopRef.current.contains(target)) &&
        (!settingsToggleBottomRef.current || !settingsToggleBottomRef.current.contains(target))
      ) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isGlossaryClosing, setIsGlossaryClosing] = useState(false);
  const glossaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedStanzaIdx, setCopiedStanzaIdx] = useState<number | null>(null);

  // Devotional Summary States
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string>('');
  const summaryTrayRef = useRef<HTMLDivElement>(null);
  const [summaryHeight, setSummaryHeight] = useState<number>(0);

  useEffect(() => {
    const el = summaryTrayRef.current;
    if (!el) return;

    if (isSummaryOpen) {
      setSummaryHeight(el.scrollHeight);
      const ro = new ResizeObserver(() => {
        if (summaryTrayRef.current) {
          setSummaryHeight(summaryTrayRef.current.scrollHeight);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      setSummaryHeight(0);
    }
  }, [isSummaryOpen, summaryText, isSummaryLoading]);

  const commentaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCloseCommentary = () => {
    if (isCommentaryClosing) return;
    setIsCommentaryClosing(true);
    if (commentaryTimerRef.current) clearTimeout(commentaryTimerRef.current);
    commentaryTimerRef.current = setTimeout(() => {
      setIsCommentaryOpen(false);
      setIsCommentaryClosing(false);
      commentaryTimerRef.current = null;
    }, 240);
  };

  const handleCloseGlossary = () => {
    if (isGlossaryClosing) return;
    setIsGlossaryClosing(true);
    if (glossaryTimerRef.current) clearTimeout(glossaryTimerRef.current);
    glossaryTimerRef.current = setTimeout(() => {
      setIsGlossaryOpen(false);
      setIsGlossaryClosing(false);
      glossaryTimerRef.current = null;
    }, 240);
  };

  useEffect(() => {
    return () => {
      if (commentaryTimerRef.current) clearTimeout(commentaryTimerRef.current);
      if (glossaryTimerRef.current) clearTimeout(glossaryTimerRef.current);
    };
  }, []);

  // Lock body scroll and handle Escape key when either mobile commentary drawer or lexicon sheet modal is active
  useEffect(() => {
    if (isGlossaryOpen || isCommentaryOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isCommentaryOpen) handleCloseCommentary();
          if (isGlossaryOpen) handleCloseGlossary();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isGlossaryOpen, isCommentaryOpen]);


  // Defensive parsing for clean title, accurate author attribution, and grantha pill
  const { cleanTitle, authorName, granthaRef } = useMemo(() => {
    let clean = sanitizeSacredText(selectedPad.titleDevanagari || '');
    let author = sanitizeSacredText(selectedPad.author || '');
    let grantha = sanitizeSacredText((selectedPad as { grantha?: string }).grantha || '');

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
    const g = allGranthas.find((item) => item.id === selectedPad.collectionId);
    const mainName = g
      ? `${g.name} (${g.author})`
      : selectedPad.collectionId === 'stotras'
        ? 'स्तोत्रमाला संग्रह'
        : 'पावन वाणी संग्रह';

    if (granthaRef && !mainName.toLowerCase().includes(granthaRef.toLowerCase())) {
      return `${mainName} • ${granthaRef}`.toUpperCase();
    }
    return mainName.toUpperCase();
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
      fallbackText: 'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।',
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

  const handleSelectPad = async (pad: SacredPad) => {
    if (selectedPad.id === pad.id && selectedPad.verses && selectedPad.verses.length > 0) return;
    navigationProgress.start();
    setLoadingPadId(pad.id);
    setSelectedPad(pad);
    if (onExternalSelectPad) onExternalSelectPad(pad);
    setActiveStanzaIndex(0);
    saveReaderState({ lastPadId: pad.id });

    if (!pad.verses || pad.verses.length === 0) {
      try {
        const slug = pad.slug || pad.id;
        if (slug) {
          const full = await SacredDatabase.fetchPadBySlug(slug);
          if (full) {
            setSelectedPad(full);
          }
        }
      } catch (err) {
        console.warn('Error fetching full verses for pad:', err);
      }
    }

    setLoadingPadId(null);
    requestAnimationFrame(() => {
      navigationProgress.done();
    });
  };

  const handleToggleTransliteration = () => {
    const next = !showTransliteration;
    setShowTransliteration(next);
    saveReaderState({ showTransliteration: next });
  };

  const handleSelectGrantha = async (granthaId: string) => {
    if (granthaId === selectedGrantha && !loadingGranthaId) {
      const existing = SacredDatabase.getPadasByGrantha(granthaId);
      if (existing && existing.length > 0) return;
    }
    navigationProgress.start();
    setLoadingGranthaId(granthaId);
    setSelectedGrantha(granthaId);
    if (onSelectGranthaId) onSelectGranthaId(granthaId);
    setSelectedRaga('all');
    setSearchQuery('');
    setSidebarQuery('');
    setSelectedChapter('all');
    setVisibleCount(30);
    saveReaderState({ selectedTradition: granthaId });

    try {
      if (granthaId !== 'all') {
        const cached = SacredDatabase.getPadasByGrantha(granthaId);
        if (cached && cached.length > 0) {
          setSelectedPad(cached[0]);
          setActiveScrollerVerseId(cached[0].id);
        }
        // Always ensure full grantha chunk is hydrated
        const loaded = await SacredDatabase.fetchGranthaPadas(granthaId);
        setAllPadas([...SacredDatabase.getAllPadas()]);
        if (loaded && loaded.length > 0) {
          setSelectedPad(loaded[0]);
          setActiveScrollerVerseId(loaded[0].id);
        }
      } else {
        const first = allPadas[0];
        if (first) {
          setSelectedPad(first);
          setActiveScrollerVerseId(first.id);
        }
      }
    } catch (err) {
      console.warn('Error loading grantha chunk:', err);
    } finally {
      setLoadingGranthaId(null);
      requestAnimationFrame(() => {
        navigationProgress.done();
      });
    }
  };

  // Ensure grantha padas are loaded whenever selectedGrantha changes
  useEffect(() => {
    let isCancelled = false;
    if (selectedGrantha !== 'all') {
      const existing = SacredDatabase.getPadasByGrantha(selectedGrantha);
      if (!existing || existing.length === 0) {
        setLoadingGranthaId(selectedGrantha);
      }
      SacredDatabase.fetchGranthaPadas(selectedGrantha)
        .then((padas) => {
          if (!isCancelled) {
            setLoadingGranthaId(null);
            if (padas && padas.length > 0) {
              setAllPadas([...SacredDatabase.getAllPadas()]);
              setSelectedPad((curr) => {
                if (!curr || curr.collectionId !== selectedGrantha) {
                  return padas[0];
                }
                return curr;
              });
              setActiveScrollerVerseId((curr) => {
                if (!curr) return padas[0]?.id || '';
                return curr;
              });
            }
          }
        })
        .catch(() => {
          if (!isCancelled) setLoadingGranthaId(null);
        });
    } else {
      setLoadingGranthaId(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedGrantha]);

  const handleSelectCategory = (catId: GranthaCategory) => {
    navigationProgress.start();
    setGranthaCategory(catId);
    setSelectedAuthor(null);
    setSelectedChapter('all');
    setSelectedRaga('all');
    setSearchQuery('');
    setSidebarQuery('');

    if (catId === 'all') {
      // Keep or reset
    } else if (catId === 'authors') {
      setSelectedGrantha('all');
    } else {
      const catGranthas = allGranthas.filter((g) => g.category === catId);
      const isCurrentInCat = catGranthas.some((g) => g.id === selectedGrantha);
      if (!isCurrentInCat && catGranthas.length > 0) {
        handleSelectGrantha(catGranthas[0].id);
      }
    }
    requestAnimationFrame(() => navigationProgress.done());
  };

  const handleSelectAuthor = (authorName: string | null) => {
    navigationProgress.start();
    setSelectedAuthor(authorName);
    setSelectedChapter('all');
    setSelectedRaga('all');
    setVisibleCount(30);
    requestAnimationFrame(() => navigationProgress.done());
  };

  const handleSelectChapter = async (chapterId: string) => {
    navigationProgress.start();
    setSelectedChapter(chapterId);
    setVisibleCount(30);

    if (selectedGrantha !== 'all') {
      await SacredDatabase.fetchGranthaPadas(selectedGrantha);
      setAllPadas([...SacredDatabase.getAllPadas()]);
    }

    const chapterPads = chapterId === 'all'
      ? SacredDatabase.getPadasByGrantha(selectedGrantha)
      : SacredDatabase.getPadasByChapter(selectedGrantha, chapterId);

    const cleanTarget = chapterId.replace(/^(ch|leela|adhyay|sarga)-/, '').trim().toLowerCase();
    const target = chapterPads[0] || allPadas.find(
      (p) =>
        (selectedGrantha === 'all' || p.collectionId === selectedGrantha) &&
        (chapterId === 'all' ||
          p.chapterId === chapterId ||
          p.chapterName === chapterId ||
          (p.chapterId || '').replace(/^(ch|leela|adhyay|sarga)-/, '').trim().toLowerCase() === cleanTarget ||
          (p.chapterName || '').trim().toLowerCase() === cleanTarget)
    );
    if (target) {
      setSelectedPad(target);
      setActiveScrollerVerseId(target.id);
    }
    requestAnimationFrame(() => {
      navigationProgress.done();
      const el = document.getElementById('reading-canvas-top');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const availableChapters = useMemo(() => {
    if (selectedGrantha === 'all') return [];
    return SacredDatabase.getGranthaChapters(selectedGrantha);
  }, [selectedGrantha, allPadas]);

  const currentChapter = useMemo(() => {
    if (selectedChapter === 'all') return null;
    return availableChapters.find((c) => c.id === selectedChapter) || null;
  }, [availableChapters, selectedChapter]);

  const nextChapter = useMemo(() => {
    if (!currentChapter || availableChapters.length <= 1) return null;
    const idx = availableChapters.findIndex((c) => c.id === currentChapter.id);
    if (idx >= 0 && idx < availableChapters.length - 1) {
      return availableChapters[idx + 1];
    }
    return null;
  }, [availableChapters, currentChapter]);

  const handleSelectRaga = (raga: string) => {
    navigationProgress.start();
    setSelectedRaga(raga);
    setSidebarQuery('');
    setVisibleCount(30);
    const matching = allPadas.filter((p) => {
      const matchG = selectedGrantha === 'all' || p.collectionId === selectedGrantha;
      const matchR = raga === 'all' || p.rag === raga;
      return matchG && matchR;
    });
    if (matching.length > 0) {
      setSelectedPad(matching[0]);
    }
    requestAnimationFrame(() => {
      navigationProgress.done();
    });
  };

  // Memoized instantaneous search & filter engine (< 0.1ms using indexed lookups)
  const filteredPads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Step 1: Select smallest pre-indexed slice directly from SacredDatabase
    let baseList: SacredPad[];
    if (selectedGrantha !== 'all') {
      baseList = selectedChapter !== 'all'
        ? SacredDatabase.getPadasByChapter(selectedGrantha, selectedChapter)
        : SacredDatabase.getPadasByGrantha(selectedGrantha);
    } else if (selectedAuthor) {
      baseList = SacredDatabase.getPadasByAuthor(selectedAuthor);
    } else if (granthaCategory !== 'all' && granthaCategory !== 'authors') {
      baseList = SacredDatabase.getPadasByCategory(granthaCategory);
    } else {
      baseList = allPadas;
    }

    // Step 2: Instant fast-path if no search query and no raga filter (0ms cold path)
    if (!q && selectedRaga === 'all') {
      return baseList;
    }

    // Step 3: Fast filtered pass over only the targeted slice (e.g. 29 - 300 items)
    return baseList.filter((p) => {
      if (selectedRaga !== 'all' && p.rag !== selectedRaga) {
        return false;
      }
      if (!q) return true;

      // Quick title / author check first
      if (
        p.titleDevanagari.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        (p.titleEnglish && p.titleEnglish.toLowerCase().includes(q))
      ) {
        return true;
      }

      // Check verse lines only if title didn't match
      return p.verses?.some((v) =>
        v.linesDevanagari?.some((l) => l.toLowerCase().includes(q))
      ) ?? false;
    });
  }, [
    allPadas,
    searchQuery,
    selectedGrantha,
    granthaCategory,
    selectedAuthor,
    selectedChapter,
    selectedRaga,
  ]);

  // Ensure selectedPad automatically syncs to active filtered subset
  useEffect(() => {
    if (filteredPads.length > 0 && !filteredPads.some((p) => p.id === selectedPad.id)) {
      setSelectedPad(filteredPads[0]);
    }
  }, [filteredPads, selectedPad.id]);

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

  // Auto-advance stanzas synchronized with audio playback pace
  useEffect(() => {
    if (!isCurrentPadPlaying || !selectedPad.verses || selectedPad.verses.length === 0) return;
    const paceMultiplier = playbackPace === '0.8x' ? 1.25 : playbackPace === '1.2x' ? 0.83 : 1.0;
    const intervalMs = Math.round(9000 * paceMultiplier);
    const timer = setInterval(() => {
      setActiveStanzaIndex((prev) => {
        const next = (prev + 1) % selectedPad.verses.length;
        const stanzaEl = document.getElementById(`stanza-${next}`);
        if (stanzaEl) stanzaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isCurrentPadPlaying, playbackPace, selectedPad.id, selectedPad.verses]);

  // Synchronize audio playback elements with active playback pace
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const audioElements = document.querySelectorAll('audio');
      const rate = playbackPace === '0.8x' ? 0.8 : playbackPace === '1.2x' ? 1.2 : 1.0;
      audioElements.forEach((el) => {
        try {
          el.playbackRate = rate;
        } catch { }
      });
    }
  }, [playbackPace]);

  const currentTheme = themeStyles[readerTheme] || themeStyles.ivory;
  const fontClass = fontFamily === 'serif' ? 'font-serif' : 'font-devanagari font-sans';
  const textAlignClass =
    textAlign === 'center'
      ? 'text-center'
      : textAlign === 'justify'
        ? 'text-justify'
        : 'text-left';

  return (
    <div className="w-full pb-44 md:pb-32 pt-2 sm:pt-4">
      {/* ========================================================================= */}
      {/* 1. Serene Light Header & Spotlight Search Bar                             */}
      {/* ========================================================================= */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white border border-neutral-200/80 shadow-2xs rounded-2xl p-4 sm:p-5">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-[#0F172A] font-bold flex items-center gap-2 leading-tight">
            <BookOpen className="w-5 h-5 text-[#FACC15] shrink-0" />
            <span>Sacred Padavali & Stotras</span>
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Rasik Vani & Sacred Scriptures ({filteredPads.length} verses available)
          </p>
        </div>

        {/* Search Input, Reading Controls & IAST Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex items-center w-full sm:w-60 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-amber-900/10 focus-within:border-amber-400/80 focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(217,119,6,0.08)] transition-all duration-200">
            <Search className="w-3.5 h-3.5 text-amber-800/50 shrink-0 pointer-events-none transition-colors" />
            <input
              type="text"
              placeholder="Search pad, stotra, saint, raga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2 pr-6 bg-transparent text-xs text-[#18181B] placeholder:text-neutral-400 outline-none border-none focus:outline-none focus:ring-0 focus:border-none ring-0 select-text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Reader Customizer Toggle Button */}
            <button
              ref={settingsToggleTopRef}
              type="button"
              onClick={handleToggleSettings}
              className={`h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${isSettingsOpen
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]'
                }`}
              title="Appearance & Typography Controls"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isSettingsOpen ? 'text-[#78350F]' : 'text-[#64748B]'}`} />
              <span>Appearance</span>
            </button>

            {/* Braj Sacred Lexicon Button */}
            <button
              type="button"
              onClick={() => setIsGlossaryOpen(true)}
              className="h-8 px-3 rounded-full text-xs font-medium bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Braj Sacred Glossary (शब्दकोश)"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-[#CA8A04]" />
              <span>Lexicon</span>
            </button>

            {/* IAST Transliteration Toggle */}
            <button
              type="button"
              onClick={handleToggleTransliteration}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${showTransliteration
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
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
              className={`h-8 px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${isFocusReadingMode
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
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
      {/* Interactive Typography & Devotional Ambiance Customizer Inline Drawer     */}
      {/* Expert Measured Height Architecture (100% Flicker-Free & Subpixel Smooth) */}
      {/* ========================================================================= */}
      <div
        className="w-full overflow-hidden transition-[height,opacity] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[height,opacity]"
        style={{
          height: isSettingsOpen ? `${drawerHeight}px` : '0px',
          opacity: isSettingsOpen ? 1 : 0,
          pointerEvents: isSettingsOpen ? 'auto' : 'none',
        }}
        aria-hidden={!isSettingsOpen}
        inert={!isSettingsOpen ? true : undefined}
      >
        <div ref={settingsTrayRef} className="pb-5">
          <div className="native-drawer-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/80 shadow-2xs space-y-4 text-[#18181B]">
            {/* Top Section: Sacred Ambiance Canvas Selection (Full Width 3-Column Grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                  <Palette className="w-3.5 h-3.5 text-amber-600" />
                  <span>पवित्र परिवेश • Sacred Ambiance Theme</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                  {readerTheme === 'ivory' ? 'Porcelain White Canvas' : readerTheme === 'mint' ? 'Tamal Green Grove Canvas' : 'Chandan Gold Sandalwood Canvas'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {[
                  {
                    id: 'ivory' as ReaderTheme,
                    label: 'पावन पत्र',
                    desc: 'Porcelain White',
                    cardBg: 'bg-white',
                    borderColor: 'border-neutral-200',
                    activeRing: 'ring-2 ring-neutral-900/10 border-neutral-900 shadow-xs',
                    titleColor: 'text-[#0F172A]',
                    subColor: 'text-neutral-500',
                    swatchBg: '#FFFFFF',
                    swatchBorder: '#D4D4D8',
                  },
                  {
                    id: 'mint' as ReaderTheme,
                    label: 'तमाल निकुंज',
                    desc: 'Tamal Green',
                    cardBg: 'bg-[#F0FDF4]',
                    borderColor: 'border-emerald-200',
                    activeRing: 'ring-2 ring-emerald-500/20 border-emerald-600 shadow-xs',
                    titleColor: 'text-[#14532D]',
                    subColor: 'text-emerald-700/80',
                    swatchBg: '#DCFCE7',
                    swatchBorder: '#86EFAC',
                  },
                  {
                    id: 'chandan' as ReaderTheme,
                    label: 'चन्दन प्रभा',
                    desc: 'Chandan Gold',
                    cardBg: 'bg-[#FAF7EE]',
                    borderColor: 'border-amber-200',
                    activeRing: 'ring-2 ring-amber-500/20 border-amber-600 shadow-xs',
                    titleColor: 'text-[#3D260F]',
                    subColor: 'text-amber-800/80',
                    swatchBg: '#FEF08A',
                    swatchBorder: '#FCD34D',
                  },
                ].map((t) => {
                  const isThemeActive = readerTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSetReaderTheme(t.id)}
                      className={`group relative flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${t.cardBg} ${isThemeActive
                          ? `${t.activeRing} font-bold`
                          : `${t.borderColor} opacity-85 hover:opacity-100`
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full shrink-0 border ${t.swatchBorder} shadow-2xs flex items-center justify-center`}
                          style={{ backgroundColor: t.swatchBg }}
                        >
                          {isThemeActive && (
                            <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold font-devanagari leading-snug truncate ${t.titleColor}`}>
                            {t.label}
                          </div>
                          <div className={`text-[11px] font-mono leading-tight truncate ${t.subColor}`}>
                            {t.desc}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isThemeActive ? (
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-neutral-900 flex items-center justify-center shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-neutral-300/60 opacity-30 group-hover:opacity-60" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delicate Hairline Divider */}
            <div className="border-t border-neutral-100" />

            {/* Bottom Section: 4 Equal Symmetrical Reading & Audio Controls (4-Column Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
              {/* Control 1: Font Size Stepper */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  <Type className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Font Size</span>
                </div>
                <div className="relative flex items-center p-1 bg-neutral-100/90 rounded-full w-full">
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
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
                      onClick={() => handleSetFontSize(s.id)}
                      className={`relative z-10 flex-1 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer text-center ${fontSize === s.id ? 'text-[#18181B] font-bold' : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 2: Typeface Serif vs Sans */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Typeface</span>
                </div>
                <div className="relative flex items-center p-1 bg-neutral-100/90 rounded-full w-full">
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                    style={{
                      width: 'calc((100% - 8px) / 2)',
                      left: '4px',
                      transform: `translateX(${fontFamily === 'serif' ? 0 : 100}%)`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSetFontFamily('serif')}
                    className={`relative z-10 flex-1 py-1 px-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer text-center ${fontFamily === 'serif' ? 'text-[#18181B] font-bold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    Serif (पारंपरिक)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetFontFamily('devanagari')}
                    className={`relative z-10 flex-1 py-1 px-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer text-center ${fontFamily === 'devanagari' ? 'text-[#18181B] font-bold' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    Sans (आधुनिक)
                  </button>
                </div>
              </div>

              {/* Control 3: Alignment (Left, Center, Justified) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  <AlignLeft className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Alignment</span>
                </div>
                <div className="relative flex items-center p-1 bg-neutral-100/90 rounded-full w-full">
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                    style={{
                      width: 'calc((100% - 8px) / 3)',
                      left: '4px',
                      transform: `translateX(${['left', 'center', 'justify'].indexOf(textAlign) * 100}%)`,
                    }}
                  />
                  {[
                    { id: 'left' as ReaderTextAlign, label: 'Left', icon: AlignLeft },
                    { id: 'center' as ReaderTextAlign, label: 'Center', icon: AlignCenter },
                    { id: 'justify' as ReaderTextAlign, label: 'Justified', icon: AlignJustify },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleSetTextAlign(a.id)}
                        className={`relative z-10 flex-1 py-1 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer ${textAlign === a.id ? 'text-[#18181B] font-bold' : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden xl:inline">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control 4: Recitation Audio Pace */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Audio Pace</span>
                </div>
                <div className="relative flex items-center p-1 bg-neutral-100/90 rounded-full w-full">
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
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
                      onClick={() => handleSetPlaybackPace(pace)}
                      className={`relative z-10 flex-1 py-1 rounded-full text-xs font-mono font-semibold transition-colors duration-200 cursor-pointer text-center ${playbackPace === pace ? 'text-[#18181B] font-bold' : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                    >
                      {pace}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Canonical Grantha & Author Shelf (Hidden in Distraction-Free Mode)    */}
      {/* ========================================================================= */}
      {!isFocusReadingMode && (
        <div className="mb-5 space-y-2.5">
          {/* Scripture Category Filter Strip (महाग्रंथ, रसिक वाणी, काव्य व छंद, धाम व लीला, संत व रचयिता) */}
          <div className="relative flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-white/95 border border-neutral-200/80 shadow-2xs rounded-full text-xs">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            {categoryPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width] z-0 shadow-2xs"
                style={{
                  transform: `translate3d(${categoryPillStyle.left}px, 0, 0)`,
                  width: `${categoryPillStyle.width}px`,
                  left: 0,
                }}
              />
            )}

            {[
              { id: 'all' as GranthaCategory, label: 'समस्त संग्रह' },
              { id: 'mahagranth' as GranthaCategory, label: 'सनातन महाग्रंथ' },
              { id: 'rasik-vani' as GranthaCategory, label: 'रसिक वाणी' },
              { id: 'kavya' as GranthaCategory, label: 'काव्य व छंद' },
              { id: 'dham-leela' as GranthaCategory, label: 'धाम व लीला' },
              { id: 'authors' as GranthaCategory, label: 'संत व रचयिता' },
            ].map((cat) => {
              const isActive = granthaCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? allGranthas.length
                  : cat.id === 'authors'
                    ? (hierarchyAuthors.length || 761)
                    : allGranthas.filter((g) => g.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    categoryRefs.current[cat.id] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1 ${isActive
                      ? categoryPillStyle.ready
                        ? 'text-[#18181B] font-bold'
                        : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                    }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`ml-0.5 text-[10px] font-mono font-bold ${isActive ? 'text-[#B45309]' : 'text-[#94A3B8]'
                      }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Grantha / Author Segmented Pill Track */}
          <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-white/95 border border-neutral-200/80 shadow-2xs rounded-full">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            {granthaPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width] z-0 shadow-2xs"
                style={{
                  transform: `translate3d(${granthaPillStyle.left}px, 0, 0)`,
                  width: `${granthaPillStyle.width}px`,
                  left: 0,
                }}
              />
            )}

            {granthaCategory === 'authors' ? (
              <>
                <button
                  ref={(el) => {
                    granthaRefs.current['all'] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectAuthor(null)}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1.5 ${!selectedAuthor
                      ? granthaPillStyle.ready
                        ? 'text-[#18181B] font-bold'
                        : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                    }`}
                >
                  <span>समस्त संत / रचयिता</span>
                  <span className={`text-[10px] font-mono ml-0.5 ${!selectedAuthor ? 'text-[#B45309] font-bold' : 'text-[#94A3B8]'}`}>
                    ({hierarchyAuthors.length || SacredDatabase.getAllSaints().length})
                  </span>
                </button>
                {hierarchyAuthors.slice(0, 35).map((a) => {
                  const isActive = selectedAuthor === a.name;
                  return (
                    <button
                      key={a.name}
                      ref={(el) => {
                        granthaRefs.current[a.name] = el;
                      }}
                      type="button"
                      onClick={() => handleSelectAuthor(a.name)}
                      className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1.5 ${isActive
                          ? granthaPillStyle.ready
                            ? 'text-[#18181B] font-bold'
                            : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                        }`}
                    >
                      <span>{a.name}</span>
                      <span className={`ml-1 text-[10px] font-mono font-bold ${isActive ? 'text-[#B45309]' : 'text-[#94A3B8]'}`}>
                        ({a.verseCount})
                      </span>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <button
                  ref={(el) => {
                    granthaRefs.current['all'] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectGrantha('all')}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1.5 ${selectedGrantha === 'all'
                      ? granthaPillStyle.ready
                        ? 'text-[#18181B] font-bold'
                        : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                    }`}
                >
                  {loadingGranthaId === 'all' && <IOSSpinner size="xs" theme="amber" />}
                  <span>समस्त ग्रंथ</span>
                  <span className={`text-[10px] font-mono ml-0.5 ${selectedGrantha === 'all' ? 'text-[#B45309] font-bold' : 'text-[#94A3B8]'}`}>
                    ({displayedGranthas.reduce((acc, g) => acc + g.count, 0) || allPadas.length})
                  </span>
                </button>
                {displayedGranthas.map((g) => {
                  const isActive = selectedGrantha === g.id;
                  const isLoadingThis = loadingGranthaId === g.id;
                  return (
                    <button
                      key={g.id}
                      ref={(el) => {
                        granthaRefs.current[g.id] = el;
                      }}
                      type="button"
                      onClick={() => handleSelectGrantha(g.id)}
                      className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1.5 ${isActive
                          ? granthaPillStyle.ready
                            ? 'text-[#18181B] font-bold'
                            : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                        }`}
                    >
                      {isLoadingThis && <IOSSpinner size="xs" theme="amber" />}
                      <span>{g.name}</span>
                      <span className={`ml-1 text-[10px] font-mono font-bold ${isActive ? 'text-[#B45309]' : 'text-[#94A3B8]'}`}>
                        ({g.count})
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Raga Sub-Filter Strip: Fluid Relative Sliding Transition */}
          <div
            className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${hasRagas
                ? 'grid-rows-[1fr] opacity-100 mt-1'
                : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
              }`}
            aria-hidden={!hasRagas}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar text-xs px-2 py-0.5">
                <span className="text-[10px] font-mono font-bold text-[#CA8A04] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Music className="w-3 h-3 text-[#CA8A04]" />
                  राग:
                </span>

                {/* Dynamic Elastic Sliding Indicator Bar */}
                {ragaPillStyle.ready && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 bottom-0.5 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width] z-0 shadow-2xs"
                    style={{
                      transform: `translate3d(${ragaPillStyle.left}px, 0, 0)`,
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
                  tabIndex={hasRagas ? 0 : -1}
                  onClick={() => handleSelectRaga('all')}
                  className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none ${selectedRaga === 'all'
                      ? ragaPillStyle.ready
                        ? 'text-[#18181B] font-bold'
                        : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                    }`}
                >
                  सभी राग
                </button>
                {renderedRagas.map((r) => {
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
                      tabIndex={hasRagas ? 0 : -1}
                      onClick={() => handleSelectRaga(r)}
                      className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer select-none inline-flex items-center gap-1 ${isActive
                          ? ragaPillStyle.ready
                            ? 'text-[#18181B] font-bold'
                            : 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100/50'
                        }`}
                    >
                      <span>{r}</span>
                      <span className={`ml-1 text-[9.5px] font-mono font-bold ${isActive ? 'text-[#B45309]' : 'text-[#94A3B8]'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
              className="absolute top-0 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width] z-0"
              style={{
                transform: `translate3d(${mobilePillStyle.left}px, 0, 0)`,
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
                className={`relative z-10 shrink-0 h-8 px-3 rounded-full transition-colors duration-200 cursor-pointer select-none flex items-center gap-1.5 text-xs ${isSelected
                    ? 'text-[#18181B] font-bold'
                    : 'bg-white text-[#1E293B] hover:bg-[#F8FAFC] font-medium'
                  }`}
              >
                {loadingPadId === pad.id ? (
                  <IOSSpinner size="xs" theme="amber" />
                ) : (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${isSelected ? 'bg-white/90 text-[#854D0E] font-bold' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                    #{idx + 1}
                  </span>
                )}
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
      <div className={`w-full flex flex-col md:flex-row items-start gap-4 sm:gap-6 transition-all duration-300 ${isFocusReadingMode ? 'max-w-3xl mx-auto' : ''}`}>

        {/* ========================================================================= */}
        {/* Left Column: Pada Index Catalog (Desktop only: hidden md:block)           */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <aside
            className={`hidden md:block sticky top-24 shrink-0 overflow-hidden rounded-3xl border shadow-xs transition-[width,min-width,max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width] ${currentTheme.commentaryBg} ${currentTheme.borderColor} ${isLeftSidebarCollapsed
                ? 'w-14 min-w-[56px] max-w-[56px]'
                : 'w-72 lg:w-80 min-w-[288px] lg:min-w-[320px] max-w-[320px]'
              }`}
          >
            <div className="relative w-full h-full min-h-[500px] max-h-[82vh] flex flex-col">
              {/* Shrunk / Compact Icon Rail Layer */}
              <div
                className={`absolute inset-0 flex flex-col items-center p-2.5 transition-all duration-300 ease-out z-10 ${isLeftSidebarCollapsed
                    ? 'opacity-100 pointer-events-auto delay-150'
                    : 'opacity-0 pointer-events-none'
                  }`}
              >
                {/* Expand Toggle */}
                <button
                  type="button"
                  onClick={handleToggleLeftSidebar}
                  className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                  title="Expand Sidebar (पद सूची खोलें)"
                  aria-label="Expand Pada Index Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-[#CA8A04]" />
                </button>

                <div className={`w-6 h-px ${currentTheme.borderColor} my-2`} />

                {/* Shrunk Quick Search Icon - reopens with search */}
                <button
                  type="button"
                  onClick={() => setIsLeftSidebarCollapsed(false)}
                  className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  title="Search Padas (खोजें)"
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className={`w-6 h-px ${currentTheme.borderColor} my-2`} />

                {/* Vertical Scrollable Numbered Badges Rail */}
                <div className="flex-1 w-full space-y-1.5 overflow-y-auto no-scrollbar py-1">
                  {displayedSidebarPads.slice(0, visibleCount).map((pad, idx) => {
                    const isSelected = selectedPad.id === pad.id;
                    return (
                      <button
                        key={pad.id}
                        type="button"
                        onClick={() => handleSelectPad(pad)}
                        title={`${idx + 1}. ${pad.titleDevanagari} (${pad.author})`}
                        className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${isSelected
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
                className={`w-72 lg:w-80 flex flex-col h-full max-h-[82vh] transition-all duration-300 ease-out ${isLeftSidebarCollapsed
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100 pointer-events-auto delay-100'
                  }`}
              >
                {/* Header with Active Scripture Name, Counter & Shrink Button */}
                <div className={`p-4 border-b ${currentTheme.borderColor} space-y-2.5`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BookOpen className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                      <span className={`font-serif font-bold ${currentTheme.titleColor} truncate`}>
                        {selectedGrantha === 'all'
                          ? 'समस्त पावन ग्रंथ'
                          : allGranthas.find((g) => g.id === selectedGrantha)?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#CA8A04]">
                        {displayedSidebarPads.length} पद
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleLeftSidebar}
                        className="w-6 h-6 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                        title="Shrink Sidebar (साइडबार समेटें)"
                        aria-label="Shrink Pada Index Sidebar"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instant In-Sidebar Quick Filter */}
                  <div className="relative flex items-center w-full px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-amber-900/10 focus-within:border-amber-400/80 focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(217,119,6,0.08)] transition-all duration-200">
                    <Search className="w-3.5 h-3.5 text-amber-800/50 shrink-0 pointer-events-none transition-colors" />
                    <input
                      type="text"
                      value={sidebarQuery}
                      onChange={(e) => setSidebarQuery(e.target.value)}
                      placeholder="पद, टेक या संत खोजें..."
                      className="w-full pl-2 pr-6 bg-transparent text-xs text-[#18181B] font-laila placeholder:text-neutral-400 placeholder:font-laila outline-none border-none focus:outline-none focus:ring-0 focus:border-none ring-0 select-text"
                    />
                    {sidebarQuery && (
                      <button
                        type="button"
                        onClick={() => setSidebarQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="साफ़ करें"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Unified Scannable List with Dynamic Elastic Sliding Bouncy Indicator */}
                <div className="relative flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scroll">
                  {sidebarPillStyle.ready && (
                    <span
                      aria-hidden="true"
                      className="absolute left-2 right-2 rounded-2xl bg-[#FEF08A] pointer-events-none transition-[transform,height] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,height] z-0"
                      style={{
                        transform: `translate3d(0, ${sidebarPillStyle.top}px, 0)`,
                        height: `${sidebarPillStyle.height}px`,
                        top: 0,
                      }}
                    />
                  )}

                  {displayedSidebarPads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#94A3B8] font-serif space-y-2.5">
                      <p>
                        {sidebarQuery || searchQuery
                          ? `कोई पद नहीं मिला ("${sidebarQuery || searchQuery}")`
                          : 'इस चयन में कोई पद उपलब्ध नहीं है'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSidebarQuery('');
                          setSelectedRaga('all');
                          setSelectedGrantha('all');
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEF08A] text-[#78350F] hover:bg-[#FDE047] cursor-pointer transition-colors"
                      >
                        सभी पद देखें (फ़िल्टर हटाएं)
                      </button>
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
                          className={`group relative z-10 px-3 py-2.5 rounded-2xl flex items-start gap-2.5 cursor-pointer select-none transition-colors duration-200 ${isSelected
                              ? 'text-[#0F172A]'
                              : 'hover:bg-black/5 text-[#0F172A]'
                            }`}
                        >
                          {/* Compact Slim Index Number / Equalizer */}
                          <div className="w-7 shrink-0 pt-0.5 text-right font-mono text-xs select-none flex items-center justify-end">
                            {loadingPadId === pad.id ? (
                              <IOSSpinner size="xs" theme="amber" />
                            ) : isCurrentlyPlaying ? (
                              <div className="flex items-end justify-end gap-0.5 h-3">
                                <span className="w-0.5 rounded-full animate-apple-eq-1 bg-[#CA8A04]" />
                                <span className="w-0.5 rounded-full animate-apple-eq-2 bg-[#CA8A04]" />
                                <span className="w-0.5 rounded-full animate-apple-eq-3 bg-[#CA8A04]" />
                              </div>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-mono transition-colors ${isSelected ? 'bg-white/90 text-[#854D0E] font-bold' : 'text-[#94A3B8]'
                                }`}>
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Verse Title & Meta */}
                          <div className="min-w-0 flex-1">
                            <div className="font-serif font-bold text-sm leading-snug break-words text-[#0F172A]">
                              {pad.titleDevanagari}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap text-[#64748B] font-normal">
                              <span className="truncate font-normal">{pad.author}</span>
                              {pad.rag && (
                                <>
                                  <span className={isSelected ? 'text-[#CA8A04]' : 'text-[#CBD5E1]'}>•</span>
                                  <span className={`font-mono text-[11px] font-normal ${isSelected ? 'text-[#CA8A04]' : 'text-[#94A3B8]'}`}>
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
                            className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${isCurrentlyPlaying || isSelected
                                ? 'bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] font-bold'
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
          </aside>
        )}

        {/* ========================================================================= */}
        {/* Center Column: Serene Editorial Reading Canvas                             */}
        {/* ========================================================================= */}
        <article
          id="reading-canvas-top"
          className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFocusReadingMode
              ? `w-full dhyana-reader-canvas p-6 sm:p-10 ${currentTheme.canvasBg} ${currentTheme.canvasText}`
              : `w-full rounded-3xl p-6 sm:p-9 ${currentTheme.canvasBg} ${currentTheme.canvasText} ${isLeftSidebarCollapsed && isRightSidebarCollapsed ? 'max-w-4xl mx-auto' : ''
              }`
            }`}
        >
          {/* Chapter Hierarchy & Continuous Reading Mode Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-amber-900/10 mb-6">
            {/* Left: Chapter / Adhyaya Selector */}
            <div className="flex items-center gap-2 min-w-0">
              <ScrollText className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">
                {availableChapters.length > 1 ? 'अध्याय / खण्ड:' : 'पावन संग्रह:'}
              </span>
              {availableChapters.length > 1 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 border border-amber-300/70 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>{currentChapter ? currentChapter.name : 'समस्त अध्याय'}</span>
                    <span className="text-[10px] text-amber-800 font-mono font-bold">
                      ({currentChapter ? `${currentChapter.verseCount} पद` : `${availableChapters.reduce((acc, c) => acc + c.verseCount, 0)} पद`})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-amber-800 transition-transform duration-200 ${isChapterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isChapterDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-72 sm:w-80 max-h-80 overflow-y-auto bg-white rounded-2xl border border-neutral-200 shadow-xl p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectChapter('all');
                          setIsChapterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${selectedChapter === 'all'
                            ? 'bg-[#FEF08A] text-[#18181B] font-bold'
                            : 'hover:bg-neutral-100 text-neutral-700'
                          }`}
                      >
                        <span>समस्त अध्याय</span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({availableChapters.reduce((acc, c) => acc + c.verseCount, 0)})
                        </span>
                      </button>
                      {availableChapters.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            handleSelectChapter(ch.id);
                            setIsChapterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${selectedChapter === ch.id
                              ? 'bg-[#FEF08A] text-[#18181B] font-bold'
                              : 'hover:bg-neutral-100 text-neutral-700'
                            }`}
                        >
                          <span className="truncate pr-2">{ch.name}</span>
                          <span className="text-[10px] font-mono text-amber-800 font-bold shrink-0">
                            ({ch.verseCount} पद)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs font-serif font-bold text-neutral-800 truncate">
                  {selectedAuthor ? `संत: ${selectedAuthor}` : (displayedGranthas.find((g) => g.id === selectedGrantha)?.name || 'समस्त ग्रंथ')}
                </span>
              )}
            </div>

            {/* Right: Reading Mode Toggle (अखंड पाठ vs एकल पद) */}
            <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200/80 rounded-full text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleSetReadingMode('continuous')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${readingMode === 'continuous'
                    ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>अखंड पाठ</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetReadingMode('single')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${readingMode === 'single'
                    ? 'bg-[#FEF08A] text-[#18181B] font-bold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>एकल पद</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODE A: Continuous Reading Stream (अखंड पाठ)                               */}
          {/* ========================================================================= */}
          {readingMode === 'continuous' ? (
            <div className="space-y-6">
              {/* Header Title for Chapter Stream */}
              <div className={`pb-5 border-b ${currentTheme.borderColor} flex items-center justify-between gap-3 flex-wrap`}>
                <div>
                  <div className={`flex items-center gap-2 ${currentTheme.metaColor} font-mono text-[11px] font-bold tracking-wider uppercase`}>
                    <span>{granthaDisplayName}</span>
                    {currentChapter && (
                      <>
                        <span className="text-[#FACC15]">•</span>
                        <span>{currentChapter.name}</span>
                      </>
                    )}
                  </div>
                  <h2 className={`${fontClass} font-bold text-2xl sm:text-3xl lg:text-[32px] text-neutral-900 mt-1.5`}>
                    {currentChapter ? currentChapter.name : cleanTitle}
                  </h2>
                  <p className="text-xs text-neutral-500 font-serif mt-1">
                    अखंड स्वाध्याय धारा • {filteredPads.length} पावन पद उपलब्ध
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    ref={settingsToggleBottomRef}
                    type="button"
                    onClick={handleToggleSettings}
                    className="h-8 px-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>फ़ॉन्ट व शैली</span>
                  </button>
                </div>
              </div>

              {/* Sticky Quick-Jump Verse Scrubber */}
              <div className="sticky top-2 z-20 p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-900/10 shadow-xs flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-amber-800 shrink-0 uppercase tracking-wider pl-1.5">
                  पद क्रम:
                </span>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                  {filteredPads.slice(0, 100).map((pad, idx) => {
                    const isActive = (activeScrollerVerseId || selectedPad.id) === pad.id;
                    const displayNumber = idx + 1;
                    return (
                      <button
                        key={pad.id}
                        type="button"
                        onClick={() => {
                          setActiveScrollerVerseId(pad.id);
                          setSelectedPad(pad);
                          const el = document.getElementById(`verse-stream-${pad.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`min-w-7 h-7 px-2 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isActive
                            ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        title={pad.verseNumber ? `पद ${pad.verseNumber}: ${pad.titleDevanagari}` : pad.titleDevanagari}
                      >
                        {displayNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Swadhyay Auto-Scroll Button */}
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer select-none ${isAutoScrolling
                      ? 'bg-amber-600 text-white font-bold animate-pulse'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                    }`}
                  title="Continuous Contemplative Recitation Auto-Scroll"
                >
                  {isAutoScrolling ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                  <span className="hidden sm:inline">{isAutoScrolling ? 'विराम' : 'स्वाध्याय प्रवाह'}</span>
                </button>
              </div>

              {/* Continuous Stream of Verses */}
              <div className="space-y-6 sm:space-y-8">
                {filteredPads.length === 0 ? (
                  loadingGranthaId ? (
                    <div className="py-20 text-center space-y-3">
                      <IOSSpinner size="md" theme="amber" />
                      <p className="font-serif font-bold text-base text-neutral-700">
                        पावन ग्रंथ पाठ संकलित हो रहा है...
                      </p>
                    </div>
                  ) : (
                    <div className="py-16 px-4 text-center space-y-3 bg-[#FAF8F5] rounded-2xl border border-amber-900/10">
                      <p className="font-serif font-bold text-base text-neutral-800">
                        चयनित अध्याय या फ़िल्टर में पद संकलित हो रहे हैं
                      </p>
                      <p className="text-xs text-neutral-500 font-serif">
                        कृपया समस्त अध्याय चुनें अथवा पुनः प्रयास करें
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectChapter('all')}
                        className="px-4 py-2 rounded-full bg-[#FEF08A] hover:bg-amber-300 text-neutral-900 font-bold text-xs cursor-pointer transition-colors"
                      >
                        समस्त अध्याय देखें
                      </button>
                    </div>
                  )
                ) : (
                  filteredPads.slice(0, 100).map((pad, pIdx) => {
                    const isPadPlaying = activePlayingPadId === pad.id && Boolean(isPlaying);
                    const isPadBookmarked = bookmarkedPadIds.includes(pad.id);
                    const isPurportOpen = expandedPurportPadIds.has(pad.id);

                    return (
                      <div
                        key={pad.id}
                        id={`verse-stream-${pad.id}`}
                        className={`p-5 sm:p-7 rounded-2xl border transition-colors duration-200 ${currentTheme.cardHoverBg} ${selectedPad.id === pad.id
                            ? 'ring-1 ring-amber-300/50 border-amber-300/40'
                            : currentTheme.borderColor
                          }`}
                      >
                        {/* Verse Header Line */}
                        <div className={`flex items-center justify-between pb-3 mb-4 border-b ${currentTheme.borderColor} gap-2 flex-wrap`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FEF08A] text-[#78350F]">
                              ॥ पद {pIdx + 1} ॥
                            </span>
                            {selectedGrantha === 'all' && (
                              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                                {allGranthas.find((g) => g.id === pad.collectionId)?.name || pad.collectionId}
                              </span>
                            )}
                            <span className={`text-xs font-serif font-bold ${currentTheme.titleColor}`}>
                              {pad.author}
                            </span>
                            {pad.rag && (
                              <span className="text-[11px] text-[#B45309] font-mono">
                                • राग {pad.rag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onPlayPad(pad)}
                              className="w-7 h-7 rounded-full bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                              title="Play Audio Shravan"
                            >
                              {isPadPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const exists = bookmarkedPadIds.includes(pad.id);
                                const updated = exists
                                  ? bookmarkedPadIds.filter((id) => id !== pad.id)
                                  : [...bookmarkedPadIds, pad.id];
                                setBookmarkedPadIds(updated);
                                saveCachedBookmarks(updated);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isPadBookmarked ? 'bg-[#FEF08A] text-[#78350F]' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                }`}
                              title="Bookmark Verse"
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isPadBookmarked ? 'fill-[#CA8A04] text-[#CA8A04]' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleInlinePurport(pad.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${isPurportOpen ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-700" />
                              <span>भावार्थ ▾</span>
                            </button>
                          </div>
                        </div>

                        {/* Inherently Distributed Devotional Verses & Inherent Meaning */}
                        <DevotionalVersePresenter
                          lines={pad.verses?.[0]?.linesDevanagari || [pad.titleDevanagari]}
                          fontClass={fontClass}
                          fontSize={fontSize}
                          textAlignClass={textAlignClass}
                          currentTheme={currentTheme}
                        />

                        {/* Inline Purport Drawer */}
                        <InlinePurportCard pad={pad} isOpen={isPurportOpen} />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Chapter Completion / Advance Card */}
              {nextChapter && (
                <div className="mt-8 p-5 rounded-2xl bg-[#FAF8F5] border border-amber-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                      वर्तमान अध्याय सम्पन्न • अगला अध्याय
                    </span>
                    <h4 className="text-base sm:text-lg font-serif font-bold text-neutral-900 mt-0.5">
                      {nextChapter.name}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      कुल {nextChapter.verseCount} पावन पद / श्लोक
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectChapter(nextChapter.id)}
                    className="px-5 py-2.5 rounded-full bg-[#FEF08A] hover:bg-amber-300 text-[#18181B] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                  >
                    <span>अग्रिम अध्याय प्रारम्भ करें</span>
                    <ChevronRight className="w-4 h-4 text-neutral-900" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Header Bar */}
              <div className={`pb-6 mb-7 border-b ${currentTheme.borderColor} space-y-4`}>
                {/* Top Meta Line & Bookmark */}
                <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className={`flex items-center gap-2 ${currentTheme.metaColor} font-mono text-[11px] font-bold tracking-wider uppercase`}>
                    <span>{granthaDisplayName}</span>
                    {selectedPad.rag && (
                      <>
                        <span className="text-[#FACC15]">•</span>
                        <span>राग {selectedPad.rag}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      title={isBookmarked ? "Saved to Bookmarks" : "Save Pad to Bookmarks"}
                      className={`h-7 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${isBookmarked
                          ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                          : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569]'
                        }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#CA8A04] text-[#CA8A04]' : ''}`} />
                      <span className="text-[11px]">{isBookmarked ? 'संग्रहित' : 'बुकमार्क'}</span>
                    </button>
                  </div>
                </div>

                {/* Noble Headline & Author */}
                <div className={textAlign === 'center' ? 'text-center' : 'text-left'}>
                  <h2 className={`${fontClass} font-bold leading-tight tracking-tight ${currentTheme.titleColor} ${fontSize === 'sm'
                      ? 'text-xl sm:text-2xl'
                      : fontSize === 'md'
                        ? 'text-2xl sm:text-3xl lg:text-[32px]'
                        : fontSize === 'lg'
                          ? 'text-3xl sm:text-4xl lg:text-[36px]'
                          : 'text-4xl sm:text-5xl lg:text-[40px]'
                    }`}>
                    {cleanTitle}
                  </h2>
                  <div className={`flex items-center gap-2 text-sm ${currentTheme.metaColor} ${fontClass} font-normal mt-2 flex-wrap ${textAlign === 'center' ? 'justify-center' : 'justify-start'
                    }`}>
                    <span className={`${currentTheme.titleColor} font-semibold`}>{authorName}</span>
                    {granthaRef && (
                      <>
                        <span className="text-[#CA8A04]">•</span>
                        <span>{granthaRef}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sleek Minimal Audio Player Pill (Warm Golden-Cream Sanctuary Bar) */}
                <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-[#FEF9C3] text-[#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onPlayPad(selectedPad)}
                      className="w-10 h-10 rounded-full bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer font-bold"
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
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#B45309] font-bold">
                          {isCurrentPadPlaying ? 'Now Playing' : 'Audio Shravan'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#FACC15] text-[#78350F]">
                          {playbackPace}
                        </span>
                        {isCurrentPadPlaying && (
                          <div className="flex items-end gap-0.5 h-2.5">
                            <span className="w-0.5 bg-[#CA8A04] rounded-full animate-apple-eq-1" />
                            <span className="w-0.5 bg-[#CA8A04] rounded-full animate-apple-eq-2" />
                            <span className="w-0.5 bg-[#CA8A04] rounded-full animate-apple-eq-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-serif font-bold text-[#0F172A] truncate mt-0.5">
                        {cleanTitle} <span className="font-normal text-[#64748B]">• {selectedPad.rag || 'विभास'} ({playbackPace})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleSummary}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-white/80 text-[#78350F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                      <span>{isSummaryOpen ? 'भाव संक्षेप छुपाएं' : 'भाव संक्षेप'}</span>
                    </button>

                    <button
                      ref={settingsToggleBottomRef}
                      type="button"
                      onClick={handleToggleSettings}
                      className="w-8 h-8 rounded-full bg-white hover:bg-white/80 text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
                      title="Typography & Ambiance Settings"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Summary Card with Expert Measured Height Architecture */}
              <div
                className="w-full overflow-hidden transition-[height,opacity] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[height,opacity]"
                style={{
                  height: isSummaryOpen ? `${summaryHeight}px` : '0px',
                  opacity: isSummaryOpen ? 1 : 0,
                  pointerEvents: isSummaryOpen ? 'auto' : 'none',
                }}
                aria-hidden={!isSummaryOpen}
                inert={!isSummaryOpen ? true : undefined}
              >
                <div ref={summaryTrayRef} className="pb-7">
                  <div className={`native-drawer-surface ${currentTheme.bhavarthBg} border ${currentTheme.borderColor} rounded-2xl p-4 sm:p-5`}>
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b ${currentTheme.borderColor}`}>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${currentTheme.titleColor} font-serif`}>
                        <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                        <span>भाव संक्षेप एवं रस-गूढ़ार्थ</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSummaryOpen(false)}
                        className={`text-xs ${currentTheme.translitColor} hover:${currentTheme.lineColor} font-medium cursor-pointer`}
                      >
                        बंद करें ×
                      </button>
                    </div>
                    {isSummaryLoading && !summaryText ? (
                      <div className={`flex items-center gap-2 py-3 text-xs ${currentTheme.translitColor} font-medium min-h-[48px]`}>
                        <IOSSpinner size="xs" theme="amber" />
                        <span>प्रस्तुत किया जा रहा है...</span>
                      </div>
                    ) : (
                      <p className={`text-xs sm:text-sm font-devanagari ${currentTheme.bhavarthText} leading-relaxed break-words font-normal`}>
                        {summaryText ||
                          'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Verses Stanza Block */}
              <div className="space-y-6 sm:space-y-8">
                {loadingGranthaId || (loadingPadId && (!selectedPad?.verses || selectedPad.verses.length === 0)) || !selectedPad?.verses || selectedPad.verses.length === 0 ? (
                  <div className="py-24 px-6 flex flex-col items-center justify-center text-center space-y-3 select-none">
                    <IOSSpinner size="lg" theme="amber" />
                    <p className="font-serif font-bold text-base sm:text-lg text-[#18181B]">
                      पावन ग्रंथ पाठ संकलित हो रहा है...
                    </p>
                    <p className="font-mono text-xs text-[#71717A]">
                      श्री वृन्दावन कृपा • निरंतरता संधान
                    </p>
                  </div>
                ) : (
                  selectedPad.verses.map((verse, vIdx) => {
                    const isStanzaActive = isFocusReadingMode
                      ? activeStanzaIndex === vIdx
                      : (isCurrentPadPlaying && activeStanzaIndex === vIdx);
                    const isStanzaDimmed = isFocusReadingMode && activeStanzaIndex !== vIdx;

                    return (
                      <div
                        key={verse.stanzaNumber}
                        id={`stanza-${vIdx}`}
                        onClick={() => setActiveStanzaIndex(vIdx)}
                        className={`p-5 sm:p-6 rounded-2xl transition-colors duration-200 cursor-pointer ${isStanzaActive
                            ? currentTheme.cardActiveBg
                            : isStanzaDimmed
                              ? 'opacity-40'
                              : currentTheme.cardHoverBg
                          }`}
                      >
                        {/* Stanza Utility Header: Stanza Number + Verse Copy Action */}
                        <div className={`flex items-center justify-between pb-2.5 mb-3 border-b ${currentTheme.borderColor}`}>
                          <span className={`text-xs font-mono font-bold ${currentTheme.metaColor} uppercase tracking-wider`}>
                            चरण {formatDevanagariNumerals(verse.stanzaNumber)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyVerse(verse, vIdx);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${currentTheme.translitColor} hover:${currentTheme.lineColor} hover:bg-black/5 flex items-center gap-1 cursor-pointer transition-colors`}
                            title="Copy verse stanza to clipboard"
                          >
                            {copiedStanzaIdx === vIdx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">प्रतिलिपि सफल ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 opacity-60" />
                                <span>प्रतिलिपि</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Inherently Distributed Devanagari Verses Typography */}
                        <DevotionalVersePresenter
                          lines={verse.linesDevanagari || []}
                          fontClass={fontClass}
                          fontSize={fontSize}
                          textAlignClass={textAlignClass}
                          currentTheme={currentTheme}
                        />

                        {/* Simple Dignified Delimiter */}
                        <div className="flex items-center justify-center my-4 select-none">
                          <span className={`${fontClass} font-bold text-xs tracking-widest ${currentTheme.metaColor}`}>
                            ॥ {formatDevanagariNumerals(verse.stanzaNumber)} ॥
                          </span>
                        </div>

                        {/* Transliteration */}
                        {showTransliteration && (verse.linesTransliteration?.length ?? 0) > 0 && (
                          <div className={`space-y-1 pt-2 border-t ${currentTheme.borderColor} mt-2.5 ${textAlignClass}`}>
                            {verse.linesTransliteration?.map((line, lIdx) => (
                              <p key={lIdx} className={`${fontClass} italic ${currentTheme.translitColor} ${textAlignClass} ${fontSize === 'sm'
                                  ? 'text-[11px] sm:text-xs leading-relaxed'
                                  : fontSize === 'md'
                                    ? 'text-xs sm:text-sm leading-relaxed'
                                    : fontSize === 'lg'
                                      ? 'text-sm sm:text-base leading-relaxed'
                                      : 'text-base sm:text-lg leading-relaxed'
                                }`}>
                                {sanitizeSacredText(line)}
                              </p>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  }))}
              </div>

              {/* Bottom Prev / Next Navigation Controls */}
              <div className={`flex items-center justify-between pt-6 mt-8 border-t ${currentTheme.borderColor}`}>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={handlePrevPad}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${hasPrev
                      ? 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]'
                      : 'opacity-40 cursor-not-allowed text-[#94A3B8] bg-neutral-50'
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>पिछला पद</span>
                </button>

                <span className={`text-xs ${currentTheme.translitColor} font-mono font-medium`}>
                  पद {currentIdx + 1} / {filteredPads.length}
                </span>

                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={handleNextPad}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${hasNext
                      ? 'bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-bold'
                      : 'opacity-40 cursor-not-allowed text-[#94A3B8] bg-neutral-100'
                    }`}
                >
                  <span>अगला पद</span>
                  <ChevronRight className="w-4 h-4 text-[#CA8A04]" />
                </button>
              </div>
            </div>
          )}
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Desktop Commentary Desk (Visible on xl:block)     */}
        {/* ========================================================================= */}
        {!isFocusReadingMode && (
          <aside
            className={`hidden xl:block sticky top-24 shrink-0 overflow-hidden rounded-3xl border shadow-xs transition-[width,min-width,max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width] ${currentTheme.commentaryBg} ${currentTheme.borderColor} ${isRightSidebarCollapsed
                ? 'w-14 min-w-[56px] max-w-[56px]'
                : 'w-72 lg:w-80 min-w-[288px] lg:min-w-[320px] max-w-[320px]'
              }`}
          >
            <div className="relative w-full h-full min-h-[500px] flex flex-col">
              {/* Shrunk / Compact Commentary Rail Layer */}
              <div
                className={`absolute inset-0 flex flex-col items-center p-2.5 transition-all duration-300 ease-out z-10 ${isRightSidebarCollapsed
                    ? 'opacity-100 pointer-events-auto delay-150'
                    : 'opacity-0 pointer-events-none'
                  }`}
              >
                <button
                  type="button"
                  onClick={handleToggleRightSidebar}
                  className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                  title="Expand Commentary (भावार्थ खोलें)"
                  aria-label="Expand Commentary Sidebar"
                >
                  <PanelRightOpen className="w-4 h-4 text-[#CA8A04]" />
                </button>

                <div className={`w-6 h-px ${currentTheme.borderColor} my-2`} />

                <button
                  type="button"
                  onClick={handleToggleRightSidebar}
                  className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center text-[#CA8A04] transition-colors cursor-pointer"
                  title="Rasik Commentary & Purport (भावार्थ देखें)"
                >
                  <Feather className="w-4 h-4" />
                </button>

                <div className={`w-6 h-px ${currentTheme.borderColor} my-2`} />

                {/* Vertical Sacred Accent Tag */}
                <span
                  className={`text-[10.5px] font-mono font-bold tracking-widest ${currentTheme.metaColor} select-none [writing-mode:vertical-lr] rotate-180 py-3 opacity-90`}
                >
                  भावार्थ
                </span>
              </div>

              {/* Full Expanded Right Sidebar Layer */}
              <div
                className={`w-72 lg:w-80 flex flex-col transition-all duration-300 ease-out p-5 space-y-4 ${isRightSidebarCollapsed
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100 pointer-events-auto delay-100'
                  }`}
              >
                <div className="space-y-4">
                  <div className={`flex items-center justify-between pb-3 mb-3 border-b ${currentTheme.borderColor}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] flex items-center justify-center text-[#CA8A04]">
                        <Feather className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className={`${fontClass} font-bold text-sm ${currentTheme.titleColor}`}>
                          रसिक भावार्थ एवं गूढ़ार्थ
                        </h3>
                        <span className={`text-[10px] ${currentTheme.metaColor} font-mono font-semibold`}>
                          Rasik Commentary & Purport
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleRightSidebar}
                      className="w-6 h-6 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      title="Shrink Commentary (भावार्थ समेटें)"
                      aria-label="Shrink Commentary Sidebar"
                    >
                      <PanelRightClose className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI Devotional Summary Card */}
                  <div className={`${currentTheme.bhavarthBg} border ${currentTheme.borderColor} rounded-2xl p-4 text-xs ${currentTheme.canvasText} leading-relaxed transition-colors shadow-xs space-y-2`}>
                    <div className={`flex items-center gap-1.5 ${currentTheme.titleColor} font-serif font-bold text-xs`}>
                      <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                      <span>दिव्य भाव संक्षेप एवं रस-गूढ़ार्थ</span>
                    </div>
                    {isSummaryLoading && !summaryText ? (
                      <div className={`flex items-center gap-2 py-2 text-xs ${currentTheme.translitColor} font-medium`}>
                        <Sparkles className="w-3.5 h-3.5 text-[#CA8A04] animate-spin" />
                        <span>प्रस्तुत किया जा रहा है...</span>
                      </div>
                    ) : (
                      <p className={`text-xs leading-relaxed ${currentTheme.bhavarthText} font-devanagari font-normal`}>
                        {summaryText || 'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                      </p>
                    )}
                  </div>

                  {/* Stanza Navigation List */}
                  <div className="space-y-1.5 max-h-[42vh] overflow-y-auto custom-scroll pr-1">
                    <span className={`text-[10px] font-mono font-bold ${currentTheme.metaColor} uppercase tracking-wider block mb-1`}>
                      चरण सूची • Stanza Navigation
                    </span>
                    {selectedPad.verses.map((v) => {
                      const isActive = activeStanzaIndex === v.stanzaNumber - 1;
                      return (
                        <button
                          key={v.stanzaNumber}
                          type="button"
                          onClick={() => {
                            setActiveStanzaIndex(v.stanzaNumber - 1);
                            const stanzaEl = document.getElementById(`stanza-${v.stanzaNumber - 1}`);
                            if (stanzaEl) stanzaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${isActive
                              ? currentTheme.cardActiveBg
                              : `${currentTheme.cardHoverBg} opacity-85 hover:opacity-100`
                            }`}
                        >
                          <span className={`text-xs font-mono font-semibold ${currentTheme.metaColor}`}>
                            चरण {formatDevanagariNumerals(v.stanzaNumber)}
                          </span>
                          <span className={`text-[11px] truncate max-w-[150px] font-devanagari ${currentTheme.titleColor}`}>
                            {v.linesDevanagari?.[0] || ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Luminous Sacred Footnote */}
                <div className={`${currentTheme.commentaryBg} border ${currentTheme.borderColor} rounded-2xl p-4 text-xs ${currentTheme.canvasText} leading-relaxed transition-colors shadow-xs`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${currentTheme.titleColor} font-serif font-bold`}>
                    <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                    <span>नित्य निकुंज विहार दर्शन</span>
                  </div>
                  <p className={`text-[11.5px] ${currentTheme.translitColor} font-devanagari`}>
                    श्री वृन्दावन धाम में प्रिया-प्रियतम की नित्य विहार लीला अखंड एवं नित्य-नूतन है। यहाँ प्रेम ही साधन है और प्रेम ही साध्य है।
                  </p>
                  <div className={`pt-2 mt-2 border-t ${currentTheme.borderColor} flex items-center justify-between text-[10px] ${currentTheme.metaColor} font-mono font-semibold`}>
                    <span>॥ अगाध निकुंज रस ॥</span>
                    <span>राधा कृपा कटाक्ष</span>
                  </div>
                </div>
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
          className={`xl:hidden fixed inset-0 z-[100] bg-black/45 flex items-end justify-center p-0 sm:p-4 transition-opacity ${isCommentaryClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
          onClick={handleCloseCommentary}
        >
          <div
            className={`${currentTheme.commentaryBg} ${currentTheme.canvasText} rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6 space-y-4 relative ${isCommentaryClosing ? 'sheet-exit' : 'sheet-enter'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${currentTheme.borderColor}`}>
              <div className="flex items-center gap-2">
                <Feather className={`w-4 h-4 ${currentTheme.translitColor}`} />
                <h3 className={`font-semibold text-sm sm:text-base ${currentTheme.titleColor}`}>
                  Rasik Commentary & Purport (रसिक भावार्थ)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCommentary}
                aria-label="Close commentary drawer"
                className={`w-8 h-8 rounded-full ${currentTheme.cardActiveBg} flex items-center justify-center ${currentTheme.titleColor} hover:opacity-80 cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Featured Divine Devotional Summary Card */}
            <div className={`${currentTheme.bhavarthBg} border ${currentTheme.borderColor} p-4 rounded-2xl space-y-2`}>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${currentTheme.titleColor}`}>
                <Sparkles className={`w-4 h-4 ${currentTheme.metaColor}`} />
                <span>दिव्य भाव संक्षेप एवं रस-गूढ़ार्थ</span>
              </div>
              {isSummaryLoading && !summaryText ? (
                <div className={`flex items-center gap-2 py-2 text-xs ${currentTheme.translitColor} font-medium min-h-[48px]`}>
                  <Sparkles className="w-4 h-4 text-[#CA8A04] animate-spin" />
                  <span>प्रस्तुत किया जा रहा है...</span>
                </div>
              ) : (
                <p className={`text-xs sm:text-sm leading-relaxed ${currentTheme.bhavarthText} font-devanagari break-words font-normal`}>
                  {summaryText ||
                    'श्री युगल रस का यह पावन पद अंतःकरण में असीम शांति और दिव्य प्रेम का संचार करता है।'}
                </p>
              )}
            </div>

            {/* Nitya Nikunj Vihar Tattva Section */}
            <div className={`${currentTheme.cardActiveBg} border ${currentTheme.borderColor} ${currentTheme.canvasText} rounded-2xl p-4 sm:p-5`}>
              <span className={`text-[10.5px] ${currentTheme.metaColor} font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 font-mono`}>
                <Sparkles className="w-3.5 h-3.5 text-[#CA8A04]" />
                नित्य निकुंज विहार दर्शन
              </span>
              <p className={`text-xs sm:text-sm leading-relaxed ${currentTheme.translitColor} font-normal`}>
                श्री वृन्दावन धाम में प्रिया-प्रियतम की नित्य विहार लीला अखंड एवं नित्य-नूतन है। यहाँ प्रेम ही साधन है और प्रेम ही साध्य है।
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleCloseCommentary}
              className="w-full mt-2 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-[#18181B] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Close
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
          className={`fixed inset-0 z-[100] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity ${isGlossaryClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
          onClick={handleCloseGlossary}
        >
          <div
            className={`bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6 space-y-4 relative text-[#18181B] ${isGlossaryClosing ? 'sheet-exit' : 'sheet-enter'
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
                  className="p-3.5 rounded-2xl bg-neutral-50"
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
              className="w-full mt-2 py-3 rounded-2xl bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
