import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  Search,
  Feather,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { SacredDatabase } from '../../services/sacredDatabase';
import { useSidebarState } from '../../hooks/useSidebarState';
import { getEpicDarshanVisual } from '../../services/devotionalVisuals';
import { SacredPad, EpicIndexData } from '../../types/devotional';
import { DevotionalVersePresenter } from './DevotionalVersePresenter';
import { InlinePurportCard } from './InlinePurportCard';
import { formatDevanagariNumerals, getCachedBookmarks, saveCachedBookmarks } from '../../services/cacheService';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';
import { seo } from '../../services/seoService';
import { MobileReaderHeader } from './MobileReaderHeader';
import { MobileScriptureDrawer } from './MobileScriptureDrawer';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { normalizeEpicChapterSlug, REVERSE_KAND_MAP } from '../../utils/epicSlugs';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';

interface MahagranthReaderProps {
  isActiveTab?: boolean;
  initialGranthaId?: string;
  initialChapterId?: string;
  initialVerseId?: string;
  onSelectGrantha?: (granthaId: string) => void;
  onSwitchToPadavali?: () => void;
  onOpenSearch?: () => void;
}

const EPICS = [
  {
    id: 'valmiki-ramayana',
    name: 'श्रीमद् वाल्मीकि रामायण',
    shortName: 'वाल्मीकि रामायण',
    author: 'महर्षि वाल्मीकि',
    tag: 'आदिकाव्य',
    kandaLabel: 'काण्ड / सर्ग',
    chapterTerm: 'सर्ग',
    sectionTerm: 'काण्ड',
    verseTerm: 'श्लोक',
    color: '#047857',
    coverBg: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #0F766E 100%)',
    spineGlyph: 'ॐ',
    totalVerses: 14079,
    description: 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के पावन चरित्र का अमर महाकाव्य'
  },
  {
    id: 'shrimad-bhagavatam',
    name: 'श्रीमद् भागवत महापुराण',
    shortName: 'श्रीमद्भागवत',
    author: 'महर्षि वेदव्यास',
    tag: 'अमलरस संहिता',
    kandaLabel: 'स्कन्ध / अध्याय',
    chapterTerm: 'अध्याय',
    sectionTerm: 'स्कन्ध',
    verseTerm: 'श्लोक',
    color: '#1E3A8A',
    coverBg: 'linear-gradient(135deg, #172554 0%, #1E40AF 50%, #1D4ED8 100%)',
    spineGlyph: 'श्री',
    totalVerses: 12301,
    description: 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमलरस की सर्वोच्च भागवती ज्ञानधारा'
  },
  {
    id: 'ramcharitmanas',
    name: 'श्री रामचरितमानस',
    shortName: 'रामचरितमानस',
    author: 'गोस्वामी तुलसीदास',
    tag: 'अवधी महाकाव्य',
    kandaLabel: 'काण्ड',
    chapterTerm: 'काण्ड',
    sectionTerm: 'काण्ड',
    verseTerm: 'दोहा / चौपाई',
    color: '#B45309',
    coverBg: 'linear-gradient(135deg, #78350F 0%, #B45309 50%, #D97706 100%)',
    spineGlyph: 'राम',
    totalVerses: 960,
    description: 'कलयुग तारक प्रभु श्री राम के पावन चरित्र का अवधी महाकाव्य'
  },
  {
    id: 'bhagavad-gita',
    name: 'श्रीमद्भगवद्गीता',
    shortName: 'भगवद्गीता',
    author: 'महर्षि वेदव्यास',
    tag: 'योगशास्त्र',
    kandaLabel: 'अध्याय',
    chapterTerm: 'अध्याय',
    sectionTerm: 'अध्याय',
    verseTerm: 'श्लोक',
    color: '#4C1D95',
    coverBg: 'linear-gradient(135deg, #2E1065 0%, #5B21B6 50%, #6D28D9 100%)',
    spineGlyph: 'गीत',
    totalVerses: 658,
    description: 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया आत्मज्ञान'
  },
  {
    id: 'durga-saptashati',
    name: 'श्री दुर्गा सप्तशती',
    shortName: 'दुर्गा सप्तशती',
    author: 'महर्षि मार्कण्डेय',
    tag: 'चण्डी पाठ',
    kandaLabel: 'अध्याय',
    chapterTerm: 'अध्याय',
    sectionTerm: 'अध्याय',
    verseTerm: 'श्लोक',
    color: '#991B1B',
    coverBg: 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 50%, #DC2626 100%)',
    spineGlyph: 'माँ',
    totalVerses: 555,
    description: 'मार्कण्डेय पुराणान्तर्गत आदिशक्ति माँ भगवती के प्राकट्य व महात्म्य की पवित्र सप्तशती'
  }
];

export const MahagranthReader: React.FC<MahagranthReaderProps> = ({
  isActiveTab = true,
  initialGranthaId = 'valmiki-ramayana',
  initialChapterId,
  initialVerseId,
  onSelectGrantha,
  onSwitchToPadavali: _onSwitchToPadavali,
  onOpenSearch,
}) => {
  const [selectedGranthaId, setSelectedGranthaId] = useState<string>(initialGranthaId);
  const [loadingGranthaId, setLoadingGranthaId] = useState<string | null>(null);
  const [epicIndex, setEpicIndex] = useState<EpicIndexData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<boolean>(true);

  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterPadas, setChapterPadas] = useState<SacredPad[]>([]);
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);
  const [activeVerseId, setActiveVerseId] = useState<string>('');
  const isProgrammaticEpicScrollRef = useRef<boolean>(false);
  const epicScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const { showChrome } = useScrollDirection();

  const [tocFilterSection, setTocFilterSection] = useState<string>('all');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activePurportId, setActivePurportId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const {
    leftCollapsed: isLeftCollapsed,
    rightCollapsed: isRightCollapsed,
    toggleLeft: toggleLeftSidebar,
    toggleRight: toggleRightSidebar,
    setLeftCollapsed,
  } = useSidebarState('epics');
  const chapterSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize initialGranthaId prop changes from parent
  useEffect(() => {
    if (initialGranthaId && initialGranthaId !== selectedGranthaId && SacredDatabase.isEpicGrantha(initialGranthaId)) {
      setSelectedGranthaId(initialGranthaId);
    }
  }, [initialGranthaId]);

  // Synchronize initialChapterId prop changes from parent
  useEffect(() => {
    if (initialChapterId && initialChapterId !== selectedChapterId) {
      const norm = normalizeEpicChapterSlug(selectedGranthaId, initialChapterId);
      setSelectedChapterId(norm);
    }
  }, [initialChapterId, selectedGranthaId]);

  // Section (Kanda) Filter Pills Elastic Sliding Indicator
  const sectionRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [sectionPillStyle, setSectionPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  // 5 Epics Shelf Elastic Sliding Indicator
  const epicCardRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [epicPillStyle, setEpicPillStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    const updateEpicPill = () => {
      const el = epicCardRefs.current[selectedGranthaId];
      if (el) {
        setEpicPillStyle({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
          ready: true,
        });
      } else {
        setEpicPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateEpicPill();
    const frame = requestAnimationFrame(updateEpicPill);
    const timer = setTimeout(updateEpicPill, 40);
    window.addEventListener('resize', updateEpicPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateEpicPill);
    };
  }, [selectedGranthaId]);

  // Load persistent bookmarks on mount
  useEffect(() => {
    getCachedBookmarks().then(setBookmarkedIds).catch(() => {});
  }, []);

  const currentEpicConfig = useMemo(() => {
    return EPICS.find((e) => e.id === selectedGranthaId) || EPICS[0];
  }, [selectedGranthaId]);

  // Unified, atomic loader for Grantha switch
  useEffect(() => {
    let cancelled = false;
    setLoadingGranthaId(selectedGranthaId);
    setLoadingIndex(true);
    setLoadingChapter(true);

    SacredDatabase.getEpicIndex(selectedGranthaId)
      .then(async (idx) => {
        if (cancelled) return;
        setEpicIndex(idx);
        setLoadingIndex(false);

        if (idx && idx.chapters.length > 0) {
          let targetChapter = idx.chapters[0].id;
          const candidateChapter = initialChapterId || selectedChapterId;
          if (candidateChapter) {
            const normCandidate = normalizeEpicChapterSlug(selectedGranthaId, candidateChapter);
            const decInit = decodeURIComponent(candidateChapter).trim().toLowerCase();
            // 1. Normalized match
            let found = idx.chapters.find((c) => c.id === normCandidate || c.id === normCandidate.toLowerCase());
            // 2. Exact match by id or decoded id
            if (!found) {
              found = idx.chapters.find(
                (c) => c.id === candidateChapter || decodeURIComponent(c.id).toLowerCase() === decInit
              );
            }
            // 3. Exact match by name or decoded name
            if (!found) {
              found = idx.chapters.find(
                (c) => c.name === candidateChapter || decodeURIComponent(c.name).toLowerCase() === decInit
              );
            }
            // 4. Scoped chapter number match
            if (!found) {
              const numMatch = decInit.match(/\d+/g);
              if (numMatch) {
                const targetNum = numMatch[numMatch.length - 1];
                found = idx.chapters.find((c) => {
                  if (normCandidate.includes('-') && !c.id.includes(normCandidate.split('-')[0])) return false;
                  const cNums = decodeURIComponent(c.id).toLowerCase().match(/\d+/g);
                  return cNums && cNums[cNums.length - 1] === targetNum;
                });
              }
            }
            if (found) {
              targetChapter = found.id;
            }
          }
          setSelectedChapterId(targetChapter);

          const padas = await SacredDatabase.fetchEpicChapter(selectedGranthaId, targetChapter);
          if (cancelled) return;
          const cleanPadas = Array.isArray(padas) ? padas.filter(Boolean) : [];
          cleanPadas.sort((a, b) => (a.verseNumber || a.index || 0) - (b.verseNumber || b.index || 0));
          setChapterPadas(cleanPadas);
          setLoadingChapter(false);
          setLoadingGranthaId(null);
          navigationProgress.done();
          if (cleanPadas.length > 0) {
            let targetVerseId = cleanPadas[0].id;
            if (initialVerseId) {
              const cleanV = decodeURIComponent(initialVerseId).trim().toLowerCase();
              const vFound = cleanPadas.find(
                (p) =>
                  p.id.toLowerCase() === cleanV ||
                  (p.slug && p.slug.toLowerCase() === cleanV) ||
                  p.id.toLowerCase().includes(cleanV)
              );
              if (vFound) {
                targetVerseId = vFound.id;
              }
            }
            setActiveVerseId(targetVerseId);
            if (initialVerseId) {
              setTimeout(() => {
                const el = document.getElementById(`shloka-${targetVerseId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }
          }
        } else {
          setChapterPadas([]);
          setLoadingChapter(false);
          setLoadingGranthaId(null);
          navigationProgress.done();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[MahagranthReader] Failed to load grantha index/chapter:', err);
          setLoadingIndex(false);
          setLoadingChapter(false);
          setLoadingGranthaId(null);
          navigationProgress.done();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGranthaId]);

  // Load target chapter chunk on-demand (when switching chapters within the same grantha)
  useEffect(() => {
    if (!selectedGranthaId || !selectedChapterId) return;

    // Skip if chapterPadas already loaded for this chapter
    if (chapterPadas.length > 0 && chapterPadas[0]?.chapterId === selectedChapterId) {
      return;
    }

    let cancelled = false;
    setLoadingChapter(true);
    SacredDatabase.fetchEpicChapter(selectedGranthaId, selectedChapterId)
      .then((padas) => {
        if (cancelled) return;
        const cleanPadas = Array.isArray(padas) ? padas.filter(Boolean) : [];
        cleanPadas.sort((a, b) => (a.verseNumber || a.index || 0) - (b.verseNumber || b.index || 0));
        setChapterPadas(cleanPadas);
        setLoadingChapter(false);
        navigationProgress.done();
        if (cleanPadas.length > 0) {
          setActiveVerseId(cleanPadas[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[MahagranthReader] Failed to fetch chapter:', err);
          setLoadingChapter(false);
          navigationProgress.done();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChapterId, selectedGranthaId, chapterPadas]);

  // Synchronize browser history popstate navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const qG = url.searchParams.get('grantha');
      const qC = url.searchParams.get('chapter');
      if (qG && qG !== selectedGranthaId && SacredDatabase.isEpicGrantha(qG)) {
        setSelectedGranthaId(qG);
      }
      if (qC) {
        const norm = normalizeEpicChapterSlug(qG || selectedGranthaId, qC);
        setSelectedChapterId(norm);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedGranthaId]);

  const currentChapter = useMemo(() => {
    if (!epicIndex || !epicIndex.chapters || epicIndex.chapters.length === 0) return null;
    const normSel = normalizeEpicChapterSlug(selectedGranthaId, selectedChapterId);
    const decSel = decodeURIComponent(selectedChapterId).trim().toLowerCase();

    // 1. Normalized match
    let matched = epicIndex.chapters.find(
      (c) => c.id === normSel || c.id === normSel.toLowerCase()
    );
    // 2. Exact ID match (case-sensitive or lowercase decoded)
    if (!matched) {
      matched = epicIndex.chapters.find(
        (c) => c.id === selectedChapterId || decodeURIComponent(c.id).toLowerCase() === decSel
      );
    }
    // 3. Exact Name match
    if (!matched) {
      matched = epicIndex.chapters.find(
        (c) => c.name === selectedChapterId || decodeURIComponent(c.name).toLowerCase() === decSel
      );
    }
    // 4. Substring / kand-prefix match
    if (!matched && normSel) {
      matched = epicIndex.chapters.find(
        (c) => c.id.includes(normSel) || normSel.includes(c.id)
      );
    }
    // 4b. Reverse Kand map match (Devanagari name lookup)
    if (!matched && normSel && REVERSE_KAND_MAP[normSel]) {
      const devName = REVERSE_KAND_MAP[normSel];
      matched = epicIndex.chapters.find(
        (c) => c.name.includes(devName) || c.id.includes(devName)
      );
    }
    // 5. Scoped chapter number match
    if (!matched) {
      const numMatch = decSel.match(/\d+/g);
      if (numMatch) {
        const targetNum = numMatch[numMatch.length - 1];
        matched = epicIndex.chapters.find((c) => {
          if (normSel.includes('-') && !c.id.includes(normSel.split('-')[0])) return false;
          const cNums = decodeURIComponent(c.id).toLowerCase().match(/\d+/g);
          return cNums && cNums[cNums.length - 1] === targetNum;
        });
      }
    }
    return matched || epicIndex.chapters[0] || null;
  }, [epicIndex, selectedChapterId, selectedGranthaId]);

  // Real-time Dynamic Epic & Chapter SEO synchronization
  useEffect(() => {
    if (!isActiveTab) return;
    if (currentEpicConfig) {
      const chName = currentChapter ? ` • ${currentChapter.name}` : '';
      seo.updateSEO({
        tab: 'granthas',
        title: `${currentEpicConfig.name}${chName} (${currentEpicConfig.author}) • संपूर्ण मूल पाठ व पारायण | वृन्दोपनिषद् 2.0`,
        description: `${currentEpicConfig.name}${chName}। प्रणेता: ${currentEpicConfig.author}। संपूर्ण मूल श्लोक, अवधी/संस्कृत पाठ व ऑन-डिमांड पारायण। वृन्दोपनिषद् 2.0`,
      });
    }
  }, [isActiveTab, selectedGranthaId, currentEpicConfig, currentChapter]);

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

  useEffect(() => {
    const updateSectionPill = () => {
      const el = sectionRefs.current[tocFilterSection];
      if (el) {
        setSectionPillStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setSectionPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateSectionPill();
    const frame = requestAnimationFrame(updateSectionPill);
    const timer = setTimeout(updateSectionPill, 40);
    window.addEventListener('resize', updateSectionPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateSectionPill);
    };
  }, [tocFilterSection, sectionsList]);

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

  // Chapter List Elastic Sliding Indicator
  const chapterItemRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [chapterPillStyle, setChapterPillStyle] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    const updateChapterPill = () => {
      const el = chapterItemRefs.current[selectedChapterId];
      if (el) {
        setChapterPillStyle({
          top: el.offsetTop,
          height: el.offsetHeight,
          ready: true,
        });
      } else {
        setChapterPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateChapterPill();
    const frame = requestAnimationFrame(updateChapterPill);
    const timer = setTimeout(updateChapterPill, 40);
    window.addEventListener('resize', updateChapterPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateChapterPill);
    };
  }, [selectedChapterId, filteredChapters]);

  // Quick Jump Shloka Grid 2D Elastic Sliding Indicator
  const shlokaGridRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [shlokaPillStyle, setShlokaPillStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    const updateShlokaPill = () => {
      const el = shlokaGridRefs.current[activeVerseId];
      if (el) {
        setShlokaPillStyle({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
          ready: true,
        });
      } else {
        setShlokaPillStyle((prev) => ({ ...prev, ready: false }));
      }
    };
    updateShlokaPill();
    const frame = requestAnimationFrame(updateShlokaPill);
    const timer = setTimeout(updateShlokaPill, 40);
    window.addEventListener('resize', updateShlokaPill);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('resize', updateShlokaPill);
    };
  }, [activeVerseId, chapterPadas]);

  // Active Shloka ScrollSpy: Synchronizes active verse, bottom grid, and commentary with content on screen
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || chapterPadas.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticEpicScrollRef.current) return;

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        visibleEntries.sort(
          (a, b) => Math.abs(a.boundingClientRect.top - 140) - Math.abs(b.boundingClientRect.top - 140)
        );
        const topEntry = visibleEntries[0];
        const shlokaId = topEntry.target.id.replace('shloka-', '');

        if (shlokaId && shlokaId !== activeVerseId) {
          setActiveVerseId(shlokaId);

          const gridEl = shlokaGridRefs.current[shlokaId];
          if (gridEl) {
            gridEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      },
      {
        root: null,
        rootMargin: '-100px 0px -55% 0px',
        threshold: [0, 0.1, 0.3],
      }
    );

    const shlokaItems = document.querySelectorAll('[id^="shloka-"]');
    shlokaItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
    };
  }, [chapterPadas, activeVerseId]);

  const activePad = useMemo(() => {
    return chapterPadas.find((p) => p.id === activeVerseId) || chapterPadas[0] || null;
  }, [chapterPadas, activeVerseId]);

  const activeVerseIndex = useMemo(() => {
    return chapterPadas.findIndex((p) => p.id === activeVerseId);
  }, [chapterPadas, activeVerseId]);

  const handleSelectGrantha = (gId: string) => {
    if (gId === selectedGranthaId && !loadingGranthaId) return;

    const el = epicCardRefs.current[gId];
    if (el) {
      setEpicPillStyle({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        ready: true,
      });
    }
    navigationProgress.start();
    setLoadingGranthaId(gId);
    setSelectedGranthaId(gId);
    setTocFilterSection('all');
    setChapterSearchQuery('');
    if (onSelectGrantha) onSelectGrantha(gId);
  };

  const handleSelectChapter = (chId: string) => {
    const normChId = normalizeEpicChapterSlug(selectedGranthaId, chId);
    navigationProgress.start();
    setSelectedChapterId(normChId);
    // Crucial: reset chapter padas immediately so previous chapter verses never linger
    setChapterPadas([]);
    setLoadingChapter(true);

    // Atomically fetch the target chapter immediately
    SacredDatabase.fetchEpicChapter(selectedGranthaId, normChId)
      .then((padas) => {
        const cleanPadas = Array.isArray(padas) ? padas.filter(Boolean) : [];
        cleanPadas.sort((a, b) => (a.verseNumber || a.index || 0) - (b.verseNumber || b.index || 0));
        setChapterPadas(cleanPadas);
        setLoadingChapter(false);
        navigationProgress.done();
        if (cleanPadas.length > 0) {
          setActiveVerseId(cleanPadas[0].id);
        }
      })
      .catch((err) => {
        console.error('[MahagranthReader] Failed to fetch chapter:', err);
        setLoadingChapter(false);
        navigationProgress.done();
      });

    if (typeof window !== 'undefined') {
      try {
        const isPath = window.location.hostname.includes('path.');
        if (isPath || window.location.pathname.startsWith('/grantha/')) {
          const newPath = `/grantha/${encodeURIComponent(selectedGranthaId)}/${encodeURIComponent(normChId)}`;
          window.history.replaceState({}, '', newPath);
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', 'granthas');
          url.searchParams.set('grantha', selectedGranthaId);
          url.searchParams.set('chapter', normChId);
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="w-full pb-20 sm:pb-24 md:pb-16 pt-0 sm:pt-4 px-0 sm:px-0">
      {/* Mobile-Optimized Reader Header: 1-Tap Chapter Drawer, Auto-Hiding Chrome */}
      <MobileReaderHeader
        scriptureTitle={currentEpicConfig.shortName || currentEpicConfig.name}
        chapterTitle={!loadingGranthaId && currentChapter ? currentChapter.name : undefined}
        onOpenSelector={() => setIsMobileDrawerOpen(true)}
        onToggleAppearance={() =>
          setFontSize((prev) => (prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm'))
        }
        onOpenSearch={onOpenSearch}
        isVisible={showChrome}
        hasAudio={false}
      />

      {/* Mobile Scripture & Chapter Bottom Sheet Selector */}
      <MobileScriptureDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        title={currentEpicConfig.name}
        subtitle={`${epicIndex?.totalChapters || 0} ${currentEpicConfig.chapterTerm} उपलब्ध`}
        categories={EPICS.map((e) => ({ id: e.id, label: e.shortName || e.name }))}
        activeCategory={selectedGranthaId}
        onCategoryChange={(epicId) => {
          handleSelectGrantha(epicId);
        }}
        items={filteredChapters.map((ch) => ({
          id: ch.id,
          name: ch.name,
          section: ch.section,
          count: ch.verseCount,
          type: 'chapter' as const,
        }))}
        selectedId={selectedChapterId}
        onSelect={(chId) => {
          handleSelectChapter(chId);
        }}
      />

      {/* Master Workstation Header: Unified Sacred Parayan Gateway & Compact 5-Epic Shelf */}
      <div className="mb-4 md:mb-6 p-3.5 sm:p-5 rounded-[22px] sm:rounded-[28px] bg-white border border-neutral-200/80 shadow-2xs space-y-3 sm:space-y-4">
        {/* Top Title & Quick Routing Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-serif font-bold tracking-wider uppercase bg-[#FEF08A] text-[#78350F]">
                सनातन महाग्रंथ पारायण
              </span>
              <span className="text-xs font-serif text-neutral-400 hidden sm:inline">
                अखण्ड मूल शास्त्र एवं ऑन-डिमांड त्वरित पाठ
              </span>
            </div>
            <h1 className="font-rozha font-bold text-xl sm:text-3xl text-neutral-900 mt-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
              <span>{currentEpicConfig.name}</span>
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-neutral-500 mt-0.5 max-w-2xl">
              {currentEpicConfig.description} • प्रणेता: <strong className="text-neutral-800">{currentEpicConfig.author}</strong>
            </p>
          </div>
        </div>

        {/* 5 Monumental Epics Segmented Pothi Grid */}
        <div className="relative p-1 sm:p-1.5 rounded-[14px] sm:rounded-[20px] bg-[#FAF8F5] border border-amber-900/10 shadow-2xs">
          <div className="relative flex overflow-x-auto no-scrollbar md:grid md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
            {/* Dynamic 2D Elastic Sliding Indicator for Active Epic */}
            {epicPillStyle.ready && (
              <span
                aria-hidden="true"
                className="absolute rounded-[14px] bg-[#FEF08A] pointer-events-none transition-[transform,width,height] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width,height] z-0 shadow-2xs"
                style={{
                  transform: `translate3d(${epicPillStyle.left}px, ${epicPillStyle.top}px, 0)`,
                  width: `${epicPillStyle.width}px`,
                  height: `${epicPillStyle.height}px`,
                  top: 0,
                  left: 0,
                }}
              />
            )}
            {EPICS.map((epic) => {
              const isSelected = selectedGranthaId === epic.id;
              const isLoadingThis = loadingGranthaId === epic.id;
              return (
                <a
                  key={epic.id}
                  ref={(el) => {
                    epicCardRefs.current[epic.id] = el;
                  }}
                  href={`/grantha/${encodeURIComponent(epic.id)}`}
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      handleSelectGrantha(epic.id);
                    }
                  }}
                  className={`relative z-10 shrink-0 md:shrink flex items-center gap-2.5 p-2 sm:p-2.5 rounded-[14px] cursor-pointer select-none transition-colors duration-150 text-left border-0 no-underline ${
                    isSelected
                      ? epicPillStyle.ready
                        ? 'text-[#18181B]'
                        : 'bg-[#FEF08A] text-[#18181B] shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.03]'
                  }`}
                >
                  {/* Authentic Miniature Pothi Spine */}
                  <div
                    className="relative w-8 h-12 rounded-[5px_7px_7px_5px] text-white flex flex-col justify-between items-center p-1 shadow-2xs shrink-0 border border-amber-300/30 overflow-hidden"
                    style={{ background: epic.coverBg }}
                  >
                    <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-amber-400/40" />
                    {isLoadingThis ? (
                      <IOSSpinner size="xs" theme="white" className="z-10" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-2xs z-10" />
                    )}
                    <span className="text-[10.5px] font-serif font-bold text-amber-100 z-10 select-none">
                      {epic.spineGlyph}
                    </span>
                    <div className="w-4 h-0.5 bg-amber-300/60 rounded-full z-10" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-serif font-bold uppercase tracking-wider block truncate ${
                          isSelected ? 'text-[#B45309]' : 'text-neutral-400'
                        }`}
                      >
                        {epic.tag}
                      </span>
                      {isLoadingThis && (
                        <span className="inline-flex items-center text-amber-800 shrink-0">
                          <IOSSpinner size="xs" theme="amber" />
                        </span>
                      )}
                    </div>
                    <div
                      className={`font-serif font-bold text-xs sm:text-sm truncate mt-0.5 ${
                        isSelected ? 'text-[#18181B] font-black' : 'text-neutral-700'
                      }`}
                    >
                      {epic.shortName || epic.name}
                    </div>
                    <div
                      className={`text-[11px] font-serif mt-0.5 ${
                        isSelected ? 'text-[#78350F]/80 font-medium' : 'text-neutral-400'
                      }`}
                    >
                      {formatDevanagariNumerals(epic.totalVerses)} {epic.verseTerm}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-Column Desk Architecture (Identical to Padavali & Chhand Sanctuary)      */}
      {/* Left Column: Sarga/Chapter Rail | Center: Main Canvas | Right: Commentary */}
      {/* ========================================================================= */}
      <div className="w-full md:flex md:items-start gap-5 sm:gap-6 lg:gap-6 2xl:gap-8">

        {/* ========================================================================= */}
        {/* Left Column: Expandable/Shrinkable Sarga/Chapter Catalog Desk             */}
        {/* ========================================================================= */}
        <aside
          aria-label="अध्याय अनुक्रमणिका"
          className={`hidden md:block shrink-0 sticky top-20 sm:top-24 self-start transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isLeftCollapsed ? 'w-12' : 'w-[clamp(245px,24%,320px)]'
          }`}
        >
          {isLeftCollapsed ? (
            <div className="rounded-3xl border border-amber-900/10 bg-[#FAF8F5] shadow-xs py-3 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={toggleLeftSidebar}
                aria-expanded="false"
                aria-label="सूची पैनल खोलें (Expand Chapters Sidebar)"
                title="सूची पैनल खोलें (Expand)"
                className="w-8 h-8 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C140D] flex items-center justify-center transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftCollapsed(false);
                  setTimeout(() => chapterSearchInputRef.current?.focus(), 60);
                }}
                aria-label={`${currentEpicConfig.chapterTerm} खोजें`}
                title={`${currentEpicConfig.chapterTerm} खोजें`}
                className="w-8 h-8 rounded-full bg-white hover:bg-amber-50 text-neutral-600 hover:text-amber-900 border border-amber-900/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-[#CA8A04] bg-white border border-amber-900/10 px-1.5 py-0.5 rounded-full">
                {epicIndex?.totalChapters || 0}
              </span>
              <span
                className="text-[11px] font-serif font-semibold text-neutral-500 select-none tracking-wider py-1"
                style={{ writingMode: 'vertical-rl' }}
              >
                {currentEpicConfig.kandaLabel}
              </span>
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-900/10 bg-[#FAF8F5] shadow-xs overflow-hidden flex flex-col max-h-[calc(100vh-7.5rem)]">
              {/* Header with Active Scripture Name, Counter & Shrink Control */}
              <div className="p-4 border-b border-amber-900/10 space-y-2.5">
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-serif font-bold text-neutral-900 truncate">
                      {currentEpicConfig.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-[#CA8A04] border border-amber-900/10">
                      {epicIndex?.totalChapters || 0} {currentEpicConfig.chapterTerm}
                    </span>
                    <button
                      type="button"
                      onClick={toggleLeftSidebar}
                      aria-expanded="true"
                      aria-label="सूची पैनल संक्षिप्त करें (Shrink Chapters Sidebar)"
                      title="संक्षिप्त करें (Shrink)"
                      className="w-6 h-6 rounded-full hover:bg-amber-900/10 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                  {/* Instant Sarga / Chapter Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      ref={chapterSearchInputRef}
                      type="text"
                      value={chapterSearchQuery}
                      onChange={(e) => setChapterSearchQuery(e.target.value)}
                      placeholder={`${currentEpicConfig.chapterTerm} खोजें...`}
                      className="w-full pl-8 pr-3 py-1.5 text-[16px] sm:text-xs rounded-[8px] bg-white border border-neutral-200/80 focus:border-amber-400 focus:outline-none text-neutral-800 placeholder-neutral-400"
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

                {/* Section Filter Pills (Kandas / Skandhas) with Elastic Sliding Indicator */}
                {sectionsList.length > 1 && (
                  <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 pt-1">
                    {/* Dynamic Elastic Sliding Indicator Bar */}
                    {sectionPillStyle.ready && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 bottom-0 rounded-[6px] bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width] z-0 shadow-2xs"
                        style={{
                          transform: `translate3d(${sectionPillStyle.left}px, 0, 0)`,
                          width: `${sectionPillStyle.width}px`,
                          left: 0,
                        }}
                      />
                    )}
                    <button
                      ref={(el) => {
                        sectionRefs.current['all'] = el;
                      }}
                      type="button"
                      onClick={() => setTocFilterSection('all')}
                      className={`relative z-10 px-2.5 py-0.5 rounded-[6px] text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 select-none ${
                        tocFilterSection === 'all'
                          ? sectionPillStyle.ready
                            ? 'text-[#78350F] font-bold'
                            : 'bg-[#FEF08A] text-[#78350F] font-bold'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50'
                      }`}
                    >
                      समस्त
                    </button>
                    {sectionsList.map((sec) => (
                      <button
                        key={sec}
                        ref={(el) => {
                          sectionRefs.current[sec] = el;
                        }}
                        type="button"
                        onClick={() => setTocFilterSection(sec)}
                        className={`relative z-10 px-2.5 py-0.5 rounded-[6px] text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 select-none ${
                          tocFilterSection === sec
                            ? sectionPillStyle.ready
                              ? 'text-[#78350F] font-bold'
                              : 'bg-[#FEF08A] text-[#78350F] font-bold'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Chapters List with Elastic Sliding Active Bar */}
              <div className="relative flex-1 overflow-y-auto p-2 space-y-1">
                {/* Dynamic Elastic Sliding Indicator for Active Chapter */}
                {chapterPillStyle.ready && (
                  <span
                    aria-hidden="true"
                    className="absolute left-2 right-2 rounded-[8px] bg-[#FEF08A] pointer-events-none transition-[transform,height] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,height] z-0 shadow-2xs"
                    style={{
                      transform: `translate3d(0, ${chapterPillStyle.top}px, 0)`,
                      height: `${chapterPillStyle.height}px`,
                      top: 0,
                    }}
                  />
                )}
                {loadingGranthaId || loadingIndex ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
                    <IOSSpinner size="sm" theme="amber" />
                    <p className="font-serif text-xs text-neutral-400">अनुक्रमणिका संकलित हो रही है...</p>
                  </div>
                ) : (
                  filteredChapters.map((ch) => {
                    const isSelected = ch.id === selectedChapterId;
                    return (
                      <a
                        key={ch.id}
                        ref={(el) => {
                          chapterItemRefs.current[ch.id] = el;
                        }}
                        href={`/grantha/${encodeURIComponent(selectedGranthaId)}/${encodeURIComponent(ch.id)}`}
                        onClick={(e) => {
                          if (!e.metaKey && !e.ctrlKey) {
                            e.preventDefault();
                            handleSelectChapter(ch.id);
                          }
                        }}
                        className={`relative z-10 w-full text-left p-2.5 rounded-[8px] text-xs font-semibold flex items-center justify-between transition-colors duration-150 cursor-pointer select-none no-underline ${
                          isSelected
                            ? chapterPillStyle.ready
                              ? 'text-[#18181B] font-semibold'
                              : 'bg-[#FEF08A] text-[#18181B] font-semibold shadow-2xs'
                            : 'hover:bg-white/80 text-neutral-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate font-serif">{ch.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {ch.section}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-[4px] bg-black/5">
                          {ch.verseCount} {currentEpicConfig.verseTerm}
                        </span>
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          )}
          </aside>

        {/* ========================================================================= */}
        {/* Center Column: Continuous Sacred Shloka Reading Stream                    */}
        {/* ========================================================================= */}
        <article
          id="epic-canvas-top"
          className={`min-w-0 w-full md:flex-1 ${isLeftCollapsed && isRightCollapsed ? 'max-w-4xl mx-auto' : ''} bg-transparent sm:bg-white rounded-none sm:rounded-3xl p-0 sm:p-8 xl:p-9 2xl:p-10 min-h-[calc(100vh-8rem)] border-0 sm:border sm:border-neutral-200/70 shadow-none sm:shadow-2xs transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
        >
          {/* Chapter Header Bar (Desktop Only - on mobile, MobileReaderHeader provides the top chrome) */}
          <div className="hidden sm:flex pb-4 mb-6 border-b border-neutral-100 flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-24 z-20 bg-white/[0.98] -mx-4 sm:-mx-8 xl:-mx-9 2xl:-mx-10 px-4 sm:px-8 xl:px-9 2xl:px-10 pt-3 rounded-t-3xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)]">
            <div>
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-800 tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentEpicConfig.name}</span>
                <span>•</span>
                <span>{!loadingGranthaId && currentChapter?.section ? currentChapter.section : 'पारायण पाठ'}</span>
              </div>
              <h1 className="font-rozha font-bold text-2xl sm:text-3xl text-neutral-900 mt-1">
                {!loadingGranthaId && currentChapter ? currentChapter.name : 'पावन पाठ'}
              </h1>
              <p className="text-xs text-neutral-500 font-serif mt-0.5">
                {loadingGranthaId || loadingChapter
                  ? 'पावन महाग्रंथ संकलित हो रहा है...'
                  : `कुल ${formatDevanagariNumerals(chapterPadas.length)} ${currentEpicConfig.verseTerm} संकलित • ऑन-डिमांड त्वरित पाठ`}
              </p>
            </div>

            {/* Quick Sizing Control Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center bg-neutral-100/90 p-1 rounded-full border border-neutral-200/80 text-xs font-sans font-medium">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer select-none ${
                    fontSize === 'sm'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="छोटा आकार"
                >
                  अ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('md')}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer select-none ${
                    fontSize === 'md'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="मध्यम आकार"
                >
                  आ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-3 py-0.5 rounded-full transition-colors cursor-pointer select-none whitespace-nowrap ${
                    fontSize === 'lg'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="बड़ा आकार"
                >
                  बड़ा
                </button>
              </div>
            </div>
          </div>

          {/* Reading Stream */}
          {loadingGranthaId || loadingChapter || chapterPadas.length === 0 ? (
            <div className="py-24 px-6 flex flex-col items-center justify-center text-center space-y-3 select-none">
              <IOSSpinner size="md" theme="amber" />
              <p className="font-serif font-bold text-base sm:text-lg text-neutral-800">
                {currentEpicConfig.name} {currentChapter?.name && !loadingGranthaId ? `• ${currentChapter.name}` : ''} संकलित हो रहा है...
              </p>
              <p className="font-serif text-xs text-neutral-400">
                पावन मूल शास्त्र पाठ संकलित हो रहा है (~15-35 KB)
              </p>
            </div>
          ) : (
            <div className={`space-y-6 transition-opacity duration-200 ${loadingChapter ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                    className={`pad-stream-card scroll-mt-28 p-3.5 sm:p-6 rounded-[18px] sm:rounded-[20px] border-0 sm:border transition-colors duration-200 space-y-4 cursor-pointer select-text ${
                      isActive
                        ? 'bg-[#FFFDF9] sm:border-amber-300/70 shadow-[0_2px_12px_rgba(251,191,36,0.07)]'
                        : 'bg-white sm:bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] sm:border-amber-900/10 shadow-2xs sm:shadow-none'
                    }`}
                  >
                    {/* Verse Meta Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-amber-900/10 gap-2 flex-nowrap text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-2.5 py-0.5 rounded-[6px] font-serif font-bold text-xs transition-colors shrink-0 ${
                          isActive
                            ? 'bg-amber-100 text-amber-950 border border-amber-300/60 shadow-2xs'
                            : 'bg-amber-100/40 text-amber-900 border border-amber-200/40'
                        }`}>
                          ॥ {currentEpicConfig.verseTerm} {formatDevanagariNumerals(pad.verseNumber || idx + 1)} ॥
                        </span>
                        <span className="font-serif font-semibold text-neutral-800 text-xs sm:text-sm hidden sm:inline truncate max-w-xs">
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
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors shadow-2xs ${
                            isPurportOpen ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-200/60'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="whitespace-nowrap">भावार्थ ▾</span>
                        </button>
                      </div>
                    </div>

                    {/* Verse Typography Presentation */}
                    {pad.verses && pad.verses.length > 0 && pad.verses[0]?.linesDevanagari?.length > 0 ? (
                      pad.verses.map((v, vIdx) => (
                        <div key={vIdx} className={vIdx > 0 ? 'mt-4 pt-3 border-t border-amber-900/10' : ''}>
                          <DevotionalVersePresenter
                            lines={v.linesDevanagari}
                            fontClass="font-laila"
                            fontSize={fontSize}
                            textAlignClass="text-center"
                            currentTheme={{
                              lineColor: 'text-[#18181B]',
                              titleColor: 'text-[#78350F]',
                              metaColor: 'text-[#92400E]'
                            }}
                            hideToolbar={true}
                          />
                          {pad.verses.length > 1 && (
                            <div className="flex items-center justify-center my-3 select-none">
                              <span className="font-serif font-bold text-xs tracking-widest text-[#92400E]">
                                ॥ {formatDevanagariNumerals(v.stanzaNumber || vIdx + 1)} ॥
                              </span>
                            </div>
                          )}
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
          <div className="mt-12 pt-6 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 select-none">
            {prevChapter ? (
              <a
                href={`/grantha/${encodeURIComponent(selectedGranthaId)}/${encodeURIComponent(prevChapter.id)}`}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    handleSelectChapter(prevChapter.id);
                  }
                }}
                className="p-3.5 rounded-[14px] bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 text-xs font-serif font-bold text-stone-800 flex items-center gap-2.5 cursor-pointer transition-colors shadow-2xs no-underline"
              >
                <ChevronLeft className="w-4 h-4 text-stone-500 shrink-0" />
                <div className="min-w-0 text-left">
                  <span className="text-[10px] text-stone-500 font-sans block">पिछला {currentEpicConfig.chapterTerm}</span>
                  <span className="truncate block">{prevChapter.name}</span>
                </div>
              </a>
            ) : <div className="hidden sm:block" />}

            {nextChapter && (
              <a
                href={`/grantha/${encodeURIComponent(selectedGranthaId)}/${encodeURIComponent(nextChapter.id)}`}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    handleSelectChapter(nextChapter.id);
                  }
                }}
                className="p-3.5 rounded-[14px] bg-[#FEF08A] hover:bg-amber-300 active:bg-amber-300/90 text-xs font-serif font-bold text-[#78350F] flex items-center justify-between gap-2.5 cursor-pointer transition-colors shadow-2xs no-underline"
              >
                <div className="min-w-0 text-left">
                  <span className="text-[10px] text-[#92400E] font-sans block">अगला {currentEpicConfig.chapterTerm}</span>
                  <span className="truncate block">{nextChapter.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#78350F] shrink-0" />
              </a>
            )}
          </div>

          {/* Sacred Correlated Discovery Nexus */}
          <SacredDiscoveryShelf
            entityType="story"
            entitySlug={currentEpicConfig.id}
            title={`${currentEpicConfig.name} • सम्बन्धित पावन नेक्सस`}
          />

          {/* Sacred Colophon / Chapter Dedication */}
          <div className="mt-12 pt-6 pb-2 text-center select-none flex flex-col items-center justify-center space-y-2 border-t border-amber-900/10">
            <div className="flex items-center gap-2 text-amber-800/60 text-xs font-serif">
              <span className="w-8 h-px bg-amber-900/20" />
              <span>॥ ॐ तत्सत् ॥</span>
              <span className="w-8 h-px bg-amber-900/20" />
            </div>
            <p className="text-[11px] font-serif text-neutral-400">
              {currentEpicConfig.name} • सनातन महाग्रंथ पारायण
            </p>
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-1 px-3.5 py-1.5 rounded-full text-xs font-serif bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/60 cursor-pointer transition-colors"
            >
              ↑ शीर्ष पर जाएँ (Back to Top)
            </button>
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Column: Dedicated Epic Commentary Desk (Expand / Shrink)            */}
        {/* ========================================================================= */}
        <aside
          aria-label="महाग्रंथ भावार्थ साइडबार"
          className={`hidden xl:block shrink-0 sticky top-20 sm:top-24 self-start transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isRightCollapsed ? 'w-12' : 'w-[clamp(255px,24%,325px)]'
          }`}
        >
          {isRightCollapsed ? (
            <div className="bg-[#FAF8F5] rounded-2xl border border-amber-900/15 shadow-xs p-1.5 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleRightSidebar}
                aria-label="भावार्थ साइडबार विस्तारित करें (Expand Commentary Sidebar)"
                aria-expanded="false"
                title="भावार्थ व टीका विस्तारित करें"
                className="w-9 h-9 rounded-[10px] bg-amber-50 hover:bg-[#FEF08A] text-[#78350F] flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-amber-900/10"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleRightSidebar}
                aria-label="दर्शन व टीका खोलें"
                title={currentEpicConfig.name}
                className="w-9 h-9 rounded-[10px] overflow-hidden border border-amber-900/15 bg-[#1A120B] cursor-pointer shrink-0"
              >
                <img
                  src={getEpicDarshanVisual(selectedGranthaId).src}
                  alt={getEpicDarshanVisual(selectedGranthaId).caption}
                  className="w-full h-full object-cover object-[center_20%]"
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <div className="w-6 h-px bg-amber-900/10" />
              <div className="flex flex-col items-center gap-1.5 py-1.5 select-none">
                <span className="text-[10px] font-mono font-bold text-[#78350F] bg-[#FEF08A] px-1.5 py-0.5 rounded-md">
                  {formatDevanagariNumerals(activePad?.verseNumber || (activeVerseIndex >= 0 ? activeVerseIndex + 1 : 1))}
                </span>
                <span className="text-[10px] font-serif font-semibold text-amber-900/75 [writing-mode:vertical-rl] tracking-wider py-1">
                  भावार्थ व टीका
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto custom-scroll pr-0.5">
              {/* Sacred Contemplative Darshan Plate */}
              {(() => {
                const visual = getEpicDarshanVisual(selectedGranthaId);
                return (
                  <div className="rounded-3xl border border-amber-900/10 bg-[#FAF8F5] p-3 shadow-xs relative">
                    <button
                      type="button"
                      onClick={toggleRightSidebar}
                      aria-label="भावार्थ साइडबार संक्षिप्त करें (Shrink Commentary Sidebar)"
                      aria-expanded="true"
                      title="साइडबार संक्षिप्त करें (Shrink)"
                      className="absolute top-4 right-4 z-10 w-7 h-7 rounded-lg bg-[#FAF8F5]/95 hover:bg-[#FEF08A] text-[#78350F] flex items-center justify-center border border-amber-900/15 shadow-xs transition-colors cursor-pointer"
                    >
                      <PanelRightClose className="w-3.5 h-3.5" />
                    </button>
                    <div className="aspect-[4/3] w-full rounded-[12px] overflow-hidden bg-[#1A120B]">
                      <img
                        src={visual.src}
                        alt={visual.caption}
                        className="w-full h-full object-cover object-[center_20%]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="px-1 pt-2 text-[11px] font-serif font-semibold text-amber-950/90 truncate">
                      {visual.caption}
                    </div>
                  </div>
                );
              })()}
              <div className="rounded-3xl border border-amber-900/10 bg-[#FAF8F5] p-5 shadow-xs transition-colors duration-300">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-900/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF08A] flex items-center justify-center text-[#78350F] shrink-0">
                      <Feather className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-sm text-neutral-900 truncate">
                        महाग्रंथ भावार्थ व टीका
                      </h3>
                      <span className="text-[10px] text-amber-800 font-mono font-semibold block truncate">
                        Sanatan Purport & Guidance
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleRightSidebar}
                    aria-label="भावार्थ साइडबार संक्षिप्त करें"
                    title="संक्षिप्त करें (Shrink)"
                    className="w-7 h-7 rounded-lg text-neutral-500 hover:text-[#78350F] hover:bg-amber-100/70 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <PanelRightClose className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Active Shloka Indicator Pill */}
                {activePad && (
                  <div className="bg-white rounded-2xl p-3 border border-amber-900/10 shadow-2xs space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-[#78350F] bg-[#FEF08A] px-2 py-0.5 rounded-md">
                        {currentEpicConfig.verseTerm} {formatDevanagariNumerals(activePad?.verseNumber || (activeVerseIndex >= 0 ? activeVerseIndex + 1 : 1))}
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
                <div className="bg-[#FEF9C3]/75 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-[#451A03] leading-relaxed shadow-2xs space-y-2 mb-3">
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
                    वर्तमान {currentEpicConfig.chapterTerm} के {currentEpicConfig.verseTerm} ({chapterPadas.length})
                  </span>
                  <div className="relative grid grid-cols-5 gap-1.5 max-h-[30vh] overflow-y-auto no-scrollbar pt-1 p-0.5">
                    {/* Dynamic 2D Elastic Sliding Indicator Bar */}
                    {shlokaPillStyle.ready && (
                      <span
                        aria-hidden="true"
                        className="absolute rounded-[6px] bg-[#FEF08A] pointer-events-none transition-[transform,width,height] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width,height] z-0 shadow-2xs"
                        style={{
                          transform: `translate3d(${shlokaPillStyle.left}px, ${shlokaPillStyle.top}px, 0)`,
                          width: `${shlokaPillStyle.width}px`,
                          height: `${shlokaPillStyle.height}px`,
                          top: 0,
                          left: 0,
                        }}
                      />
                    )}
                    {chapterPadas.map((pad, idx) => {
                      const isSelected = activeVerseId === pad.id;
                      return (
                        <button
                          key={pad.id}
                          ref={(el) => {
                            shlokaGridRefs.current[pad.id] = el;
                          }}
                          type="button"
                          onClick={() => {
                            isProgrammaticEpicScrollRef.current = true;
                            if (epicScrollTimeoutRef.current) clearTimeout(epicScrollTimeoutRef.current);
                            epicScrollTimeoutRef.current = setTimeout(() => {
                              isProgrammaticEpicScrollRef.current = false;
                            }, 900);
                            setActiveVerseId(pad.id);
                            const el = document.getElementById(`shloka-${pad.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={`relative z-10 h-7 rounded-[6px] text-[11px] font-mono font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center select-none ${
                            isSelected
                              ? shlokaPillStyle.ready
                                ? 'text-[#78350F] font-bold border border-transparent'
                                : 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                              : 'bg-white/80 hover:bg-white text-neutral-600 border border-neutral-200/60'
                          }`}
                        >
                          {pad.verseNumber || idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};
