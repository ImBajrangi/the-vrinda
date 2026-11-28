import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Trophy,
  Play,
  Pause,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  ScrollText,
  Feather,
  Bell,
  BookMarked,
  Users,
  MapPin,
  Bot,
} from 'lucide-react';
import { NavTab } from './FloatingNavbar';
import { SacredLogo } from './SacredLogo';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';
import { SadhanaState } from '../../types/devotional';
import { useSoftPresence } from '../../hooks/useSoftPresence';
import { extractPurePadaTitle } from '../../utils/padaTitle';
import { queueAgentEvent } from '../../utils/agentQueue';

interface DynamicNotchNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakDays?: number;
  isPlayingAudio?: boolean;
  currentTrackTitle?: string;
  onToggleAudio?: () => void;
  onOpenPlayer?: () => void;
  isLowSpec?: boolean;
  onToggleLowSpec?: () => void;
  onOpenSearch?: () => void;
  onOpenFocus?: () => void;
  sadhana?: SadhanaState;
  onQuickJapa?: () => void;
  onNavigatePath?: (path: string) => void;
  isKnowledgeActive?: boolean;
  isMarqueeVisible?: boolean;
  isVisibleOnMobile?: boolean;
}

export const DynamicNotchNavbar: React.FC<DynamicNotchNavbarProps> = ({
  activeTab,
  onSelectTab,
  streakDays: _streakDays = 1,
  isPlayingAudio = false,
  currentTrackTitle = 'Hit Chaurasi Pad 01',
  onToggleAudio,
  onOpenPlayer,
  onOpenSearch,
  onOpenFocus,
  sadhana,
  onQuickJapa,
  onNavigatePath,
  isKnowledgeActive = false,
  isVisibleOnMobile = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuRendered, setIsMenuRendered] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isMobileMenuOpen) {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
        menuTimerRef.current = null;
      }
      setIsMenuRendered(true);
      setIsMenuClosing(false);
    } else if (isMenuRendered) {
      setIsMenuClosing(true);
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
      menuTimerRef.current = setTimeout(() => {
        setIsMenuRendered(false);
        setIsMenuClosing(false);
        menuTimerRef.current = null;
      }, 260);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    };
  }, []);

  const handleToggleMenu = () => {
    if (isMenuClosing) return;
    setIsMobileMenuOpen((prev) => !prev);
  };

  const [ashtayama, setAshtayama] = useState(() =>
    computeAshtayamaPhase(new Date('2026-01-01T19:00:00+05:30'))
  );

  useEffect(() => {
    setAshtayama(computeAshtayamaPhase());
    const timer = setInterval(() => {
      setAshtayama(computeAshtayamaPhase());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<{ [key in NavTab]?: HTMLButtonElement | null }>({});
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const [isSangrahaOpen, setIsSangrahaOpen] = useState(false);
  const { isRendered: isSangrahaRendered, isClosing: isSangrahaClosing } = useSoftPresence(isSangrahaOpen, 220);
  const sangrahaRef = useRef<HTMLDivElement>(null);

  const isSangrahaActive =
    isKnowledgeActive ||
    activeTab === 'rituals' ||
    activeTab === 'stories' ||
    activeTab === 'biographies' ||
    activeTab === 'places';

  // Platform-wide consistent dismissal: close mobile menu & desktop sangraha dropdown on outside tap or Escape
  useEffect(() => {
    if (!isMobileMenuOpen && !isSangrahaOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (isMobileMenuOpen && !isMenuClosing) {
        if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(target) &&
          mobileToggleRef.current &&
          !mobileToggleRef.current.contains(target)
        ) {
          setIsMobileMenuOpen(false);
        }
      }
      if (isSangrahaOpen) {
        if (sangrahaRef.current && !sangrahaRef.current.contains(target)) {
          setIsSangrahaOpen(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsSangrahaOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, isMenuClosing, isSangrahaOpen]);

  const navItems: { id: NavTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'smaran', label: 'Home Sanctuary', shortLabel: 'Home', icon: Compass },
    { id: 'granthas', label: 'Sanatan Epics', shortLabel: 'Epics', icon: ScrollText },
    { id: 'padavali', label: 'Padavali & Chhand', shortLabel: 'Vani', icon: Feather },
    { id: 'feed', label: 'Darshan Feed', shortLabel: 'Darshan', icon: Sparkles },
    { id: 'milestones', label: 'Devotion', shortLabel: 'Sadhana', icon: Trophy },
  ];

  const mobileNavItems: {
    id: NavTab;
    label: string;
    sublabel: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'smaran',
      label: 'गृह स्मरण',
      sublabel: 'Home • नित्य सेवा',
      icon: Compass,
    },
    {
      id: 'granthas',
      label: 'सनातन महाग्रंथ',
      sublabel: 'Epics • रामायण, भागवत, गीता',
      badge: '५ महाग्रंथ',
      icon: ScrollText,
    },
    {
      id: 'padavali',
      label: 'रसिक पद्यावली व छंद',
      sublabel: 'Vani • पद, दोहा, सवैया',
      badge: '१३१ संत',
      icon: Feather,
    },
    {
      id: 'feed',
      label: 'नित्य दर्शन',
      sublabel: 'Darshan Feed • उत्सव',
      badge: 'Live',
      icon: Sparkles,
    },
    {
      id: 'milestones',
      label: 'साधना सोपान',
      sublabel: 'Devotion • अखंड निष्ठा',
      icon: Trophy,
    },
    {
      id: 'rituals',
      label: 'नित्य आरती व चालीसा',
      sublabel: 'Aarti • आरती, चालीसा, स्तोत्र',
      badge: 'उपासना',
      icon: Bell,
    },
    {
      id: 'stories',
      label: 'दिव्य कथा व लीला',
      sublabel: 'Stories • पावन प्रसंग व शिक्षा',
      badge: 'कथा',
      icon: BookMarked,
    },
    {
      id: 'biographies',
      label: 'संत व ऋषि चरित्र',
      sublabel: 'Charitra • पावन जीवन व परंपरा',
      badge: 'चरित्र',
      icon: Users,
    },
    {
      id: 'places',
      label: 'पावन तीर्थ व धाम',
      sublabel: 'Tirtha • मंदिर, परिक्रमा, महिमा',
      badge: 'तीर्थ',
      icon: MapPin,
    },
  ];

  useEffect(() => {
    const updateIndicator = () => {
      const targetTabKey = isKnowledgeActive ? 'rituals' : activeTab;
      const el = tabRefs.current[targetTabKey];
      const navEl = navRef.current;
      if (el && navEl) {
        const navRect = navEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const left = el.offsetParent === navEl ? el.offsetLeft : elRect.left - navRect.left;
        setIndicatorStyle({
          left,
          width: el.offsetWidth,
          ready: true,
        });
      }
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab, isKnowledgeActive]);

  const handleSelectNav = (tabId: NavTab) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Subtle dark backdrop when mobile menu is open - tap outside closes menu with fadeout */}
      {isMenuRendered && (
        <div
          className={`fixed inset-0 z-40 bg-black/35 md:hidden pointer-events-auto transition-opacity ${
            isMenuClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={() => {
            if (isMenuClosing) return;
            setIsMobileMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}
      <header
        className={`sticky top-0 z-50 w-full bg-white shadow-[0_2px_18px_rgba(24,24,27,0.045)] select-none ${
          !isVisibleOnMobile ? 'hidden md:block' : 'block'
        }`}
      >
      <div className="w-full max-w-full md:max-w-6xl xl:max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 flex flex-col">
        
        {/* Clean Borderless Solid Header Row — FarmDirect Sticky Flow + Apple Spatial Rhythm */}
        <div className="w-full py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-3 h-10 sm:h-11">
            
            {/* 1. Left: Brand Identity & Sacred Logo */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelectNav('smaran')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectNav('smaran')}
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 py-0.5"
              title="श्री वृन्दोपनिषद् 2.0 • Daily Sadhana Sanctuary"
            >
              <SacredLogo size={32} className="shrink-0" />
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-devanagari font-bold text-[16px] sm:text-[18px] text-[#1C140D] tracking-tight">
                  वृन्दोपनिषद्
                </span>
                <span className="font-mono font-bold text-[10px] text-amber-800/80 uppercase shrink-0">
                  2.0
                </span>
              </div>
            </div>

            {/* 2. Center: Open Borderless Navigation Rail (Desktop & Tablet >= md) */}
            <nav
              ref={navRef}
              aria-label="Main Navigation Menu"
              className="relative hidden md:flex items-center gap-0.5 xl:gap-1"
            >
              {/* Dynamic Elastic Sliding Indicator Bar */}
              {indicatorStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,width]"
                  style={{
                    transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
                    width: `${indicatorStyle.width}px`,
                    left: 0,
                  }}
                />
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = !isKnowledgeActive && activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[item.id] = el;
                    }}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`relative z-10 flex items-center gap-1.5 px-3 lg:px-3.5 xl:px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-[#1C140D] font-bold'
                        : 'text-[#6E675F] hover:text-[#1C140D] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.1] transition-colors duration-150 ${isActive ? 'text-[#B45309]' : 'text-[#78716C]'}`} />
                    <span aria-hidden="true" className="inline xl:hidden">{item.shortLabel}</span>
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                );
              })}

              {/* Sangraha Dropdown Menu for Desktop */}
              <div ref={sangrahaRef} className="relative z-10">
                <button
                  type="button"
                  ref={(el) => {
                    tabRefs.current['rituals'] = el;
                    tabRefs.current['stories'] = el;
                    tabRefs.current['biographies'] = el;
                    tabRefs.current['places'] = el;
                  }}
                  onClick={() => setIsSangrahaOpen((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    isSangrahaActive
                      ? 'text-[#18181B] font-bold'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                  aria-expanded={isSangrahaOpen}
                  aria-haspopup="true"
                >
                  <BookMarked className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] transition-colors duration-200 ${isSangrahaActive ? 'text-[#B45309]' : 'text-[#71717A]'}`} />
                  <span>संग्रह</span>
                  <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform duration-200 ${isSangrahaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSangrahaRendered && (
                  <div
                    className={`absolute top-full right-0 mt-2 w-64 bg-white rounded-[20px] p-2 shadow-[0_12px_36px_rgba(24,24,27,0.12)] space-y-1 origin-top-right z-50 text-[#18181B] ${
                      isSangrahaClosing ? 'popover-exit' : 'popover-enter'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      पावन संकलन
                    </div>
                    {[
                      { id: 'rituals' as NavTab, label: 'नित्य आरती व चालीसा', sublabel: 'आरती, चालीसा, स्तोत्र', icon: Bell },
                      { id: 'stories' as NavTab, label: 'दिव्य कथा व लीला', sublabel: 'पौराणिक प्रसंग व शिक्षा', icon: BookMarked },
                      { id: 'biographies' as NavTab, label: 'संत व ऋषि चरित्र', sublabel: 'पावन जीवन दर्शन', icon: Users },
                      { id: 'places' as NavTab, label: 'पावन तीर्थ व धाम', sublabel: 'तीर्थ, मंदिर व परिक्रमा', icon: MapPin },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleSelectNav(item.id);
                            setIsSangrahaOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2.5 p-2 rounded-[12px] transition-colors duration-150 cursor-pointer ${
                            isItemActive
                              ? 'bg-amber-100/90 text-amber-950 font-bold'
                              : 'hover:bg-amber-50/80 text-neutral-800'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isItemActive ? 'bg-amber-200/80 text-amber-900' : 'bg-neutral-100 text-neutral-600'}`}>
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs leading-tight font-serif truncate">{item.label}</div>
                            <div className="text-[10px] text-neutral-500 truncate">{item.sublabel}</div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="pt-1.5 mt-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      ज्ञानकोश एवं उत्सव
                    </div>
                    {[
                      { path: '/ragas', label: 'शास्त्रीय राग कोष', sub: '२९४ राग व पद' },
                      { path: '/themes', label: 'ब्रज लीला प्रसंग', sub: 'होली, राधाष्टमी, झूलन' },
                      { path: '/knowledge-base', label: 'सनातन ज्ञानकोश विकी', sub: '३५+ मार्गदर्शिकाएँ' },
                      { path: '/glossary', label: 'ब्रजभाषा शब्दकोश', sub: 'सिद्धान्त व शब्दार्थ' },
                      { path: '/festivals', label: 'ब्रज महोत्सव धरोहर', sub: 'झूलन, राधाष्टमी, होरी' },
                      { path: '/faq', label: 'साधक प्रश्नोत्तरी', sub: 'शंका समाधान (FAQ)' },
                    ].map((linkItem) => (
                      <a
                        key={linkItem.path}
                        href={linkItem.path}
                        onClick={(e) => {
                          if (onNavigatePath && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                            e.preventDefault();
                            onNavigatePath(linkItem.path);
                            setIsSangrahaOpen(false);
                          }
                        }}
                        className="w-full text-left flex items-center justify-between gap-2 px-2.5 py-2 rounded-[12px] hover:bg-[#FAF8F4] text-neutral-800 transition-colors no-underline"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-medium truncate">{linkItem.label}</div>
                          <div className="text-[10px] text-neutral-500 truncate">{linkItem.sub}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* 3. Right: Borderless Tonal Actions Deck */}
            <div className="flex items-center gap-2 shrink-0">

              {/* FarmDirect 14-Bot Interactive Hub Trigger */}
              <button
                type="button"
                onClick={() => {
                  queueAgentEvent('open-agent-hub', {});
                  window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: {} }));
                }}
                aria-label="Open 14 Interactive Bots Hub"
                title="AI Sakha • 14 Interactive Bots"
                className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-3 sm:h-9 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Bot className="w-3.5 h-3.5 stroke-[2.3]" />
                <span className="hidden lg:inline text-xs">14 Bots</span>
              </button>

              {/* Spotlight Search Trigger */}
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  aria-label="Search (Cmd+K)"
                  title="Search: Verses, Saints, Scriptures (Cmd+K)"
                  className="w-9 h-9 sm:w-auto flex items-center justify-center gap-2 sm:px-3.5 sm:h-9 rounded-full bg-[#F5F1E8] hover:bg-[#EDE6D6] text-[#1C140D] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-amber-900 stroke-[2.2]" />
                  <span className="hidden sm:inline text-xs">Search</span>
                  <kbd className="hidden lg:inline text-[9.5px] font-mono text-amber-900/70">⌘K</kbd>
                </button>
              )}

              {/* Audio Shravan Pill */}
              <div
                className={`flex items-center justify-center gap-1.5 h-9 rounded-full transition-colors shrink-0 ${
                  isPlayingAudio
                    ? 'bg-[#FEF08A] text-[#78350F] px-2 sm:px-3.5 font-bold'
                    : 'bg-[#1C140D] hover:bg-[#2F2217] text-[#FEF08A] w-9 sm:w-auto sm:px-3.5 font-semibold'
                }`}
              >
                <button
                  type="button"
                  onClick={onToggleAudio}
                  aria-label={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  title={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer font-bold ${
                    isPlayingAudio
                      ? 'bg-[#B45309] text-white'
                      : 'bg-[#FEF08A] text-[#1C140D]'
                  }`}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenPlayer}
                  title={`Track: ${currentTrackTitle ? extractPurePadaTitle(currentTrackTitle).title : ''}`}
                  className="hidden sm:inline text-xs font-semibold truncate max-w-[80px] lg:max-w-[110px] cursor-pointer"
                >
                  {isPlayingAudio ? 'Playing' : 'Audio'}
                </button>
              </div>

              {/* Mobile Menu Hamburger Button (< md only) */}
              <button
                ref={mobileToggleRef}
                type="button"
                onClick={handleToggleMenu}
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                className="md:hidden w-9 h-9 rounded-full bg-[#F5F1E8] hover:bg-[#EDE6D6] flex items-center justify-center text-[#1C140D] transition-colors cursor-pointer shrink-0"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Card (Pure, Ascetic Simplicity & High Utility with Smooth Exit) */}
        {isMenuRendered && (
          <div
            ref={mobileMenuRef}
            onClick={(e) => e.stopPropagation()}
            className={`pointer-events-auto w-full max-w-[96vw] mt-2 p-3 sm:p-4 rounded-3xl bg-white md:hidden border border-neutral-200/90 shadow-[0_12px_36px_-8px_rgba(24,24,27,0.12),inset_0_1px_0_rgba(255,255,255,1)] space-y-2.5 max-h-[85vh] overflow-y-auto no-scrollbar text-[#18181B] origin-top ${
              isMenuClosing ? 'apple-view-exit' : 'apple-view-enter'
            }`}
          >
            
            {/* 1. Minimalist Search Bar (Clean White) */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={() => {
                  onOpenSearch();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full h-10 px-3.5 rounded-2xl bg-white hover:bg-neutral-50/90 border border-neutral-200/80 shadow-2xs text-neutral-700 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-500">पद, संत, राग या ग्रंथ खोजें...</span>
                </div>
                <kbd className="text-[10px] font-mono text-neutral-500 bg-neutral-100/90 px-1.5 py-0.5 rounded-md shadow-2xs border border-neutral-200/60">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* 2. Primary 4 Sanctuary Portals (Pure, Luminous White Cards) */}
            <div className="grid grid-cols-2 gap-2">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`relative flex flex-col justify-between p-3 rounded-2xl text-left transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-300/40'
                        : 'bg-white hover:bg-neutral-50/80 border-neutral-200/80 text-neutral-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-amber-300/80 text-amber-950'
                            : 'bg-[#FAF9F5] text-neutral-600 border border-neutral-200/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-amber-200/80 text-amber-950'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-devanagari font-bold text-xs leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium truncate mt-0.5">
                        {item.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 2B. Knowledge Base, Glossary & Festivals Quick Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { path: '/knowledge-base', label: 'ज्ञानकोश विकी' },
                { path: '/glossary', label: 'ब्रज शब्दकोश' },
                { path: '/festivals', label: 'ब्रज महोत्सव' },
                { path: '/faq', label: 'प्रश्नोत्तरी (FAQ)' },
              ].map((linkItem) => (
                <a
                  key={linkItem.path}
                  href={linkItem.path}
                  onClick={(e) => {
                    if (onNavigatePath && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onNavigatePath(linkItem.path);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-950 no-underline transition-colors"
                >
                  {linkItem.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  queueAgentEvent('open-agent-hub', {});
                  window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: {} }));
                  setIsMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-xs font-serif font-bold text-[#78350F] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Bot className="w-3 h-3" />
                <span>AI Sakha • 14 Bots</span>
              </button>
            </div>

            {/* 3. Live Presence Strip: Ashtayama Period + Audio Player (Radiant White Card with Gold Trim) */}
            <div className="rounded-2xl bg-white border border-amber-200/80 shadow-2xs p-3 space-y-2.5">
              {/* Row A: Ashtayama Period */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 border border-amber-200/60">
                    {['शयन', 'मंगला'].includes(ashtayama.nameDevanagari) ? (
                      <Moon className="w-3.5 h-3.5" />
                    ) : (
                      <Sun className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-devanagari font-bold text-xs text-amber-950 truncate">
                        {ashtayama.nameDevanagari} वेला ({ashtayama.nameEnglish})
                      </span>
                      <span className="text-[10px] font-mono text-amber-800/80 bg-amber-100/70 px-1.5 py-0.2 rounded-full shrink-0">
                        {ashtayama.timeRange}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-amber-900/70 font-devanagari truncate">
                      {ashtayama.descriptionDevanagari || ashtayama.bhava}
                    </p>
                  </div>
                </div>

                {onOpenFocus && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFocus();
                      setIsMobileMenuOpen(false);
                    }}
                    className="h-7 px-2.5 rounded-full text-[11px] font-semibold bg-amber-200/90 hover:bg-amber-300 text-amber-950 shrink-0 flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    <span>ध्यान कक्ष</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Row B: Audio Track (if active or loaded) */}
              {currentTrackTitle && (
                <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={onToggleAudio}
                      className="w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-500 text-neutral-900 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-2.5 h-2.5 fill-current" />
                      ) : (
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 truncate">
                        {currentTrackTitle ? extractPurePadaTitle(currentTrackTitle).title : ''}
                      </div>
                      <div className="text-[10px] text-amber-800/80 font-mono">
                        {isPlayingAudio ? '● Recitation Active' : 'Paused • Sacred Audio'}
                      </div>
                    </div>
                  </div>

                  {onOpenPlayer && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPlayer();
                        setIsMobileMenuOpen(false);
                      }}
                      className="h-6 px-2 rounded-full text-[10px] font-medium bg-white text-amber-900 border border-amber-200/80 shrink-0 hover:bg-amber-50 cursor-pointer"
                    >
                      Player ↗
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. Daily Sadhana Snapshot (Pure White Card with Sacred Accents) */}
            {sadhana && (
              <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-2xs p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs px-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>दैनिक साधना • Daily Progress</span>
                  </div>
                  <span className="text-[11px] font-laila font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/60">
                    🔥 {formatDevanagariNumerals(sadhana.currentStreakDays)} दिवसीय नियम
                  </span>
                </div>

                {/* 3 Metric Tiles (Pure, clean porcelain tiles) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-neutral-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-neutral-500 font-medium font-laila">नाम जप</div>
                    <div className="text-xs font-bold text-neutral-800 font-laila mt-0.5">
                      {formatDevanagariNumerals(sadhana.japaCompleted)} / {formatDevanagariNumerals(sadhana.japaTarget)} <span className="text-[9px] font-normal text-neutral-400">माला</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-neutral-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-neutral-500 font-medium font-laila">वाणी श्रवण</div>
                    <div className="text-xs font-bold text-neutral-800 font-laila mt-0.5">
                      {formatDevanagariNumerals(sadhana.shravanMinutes)} / {formatDevanagariNumerals(sadhana.shravanTarget)} <span className="text-[9px] font-normal text-neutral-400">मिनट</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-neutral-200/60 shadow-2xs text-center">
                    <div className="text-[10px] text-neutral-500 font-medium font-laila">स्वाध्याय</div>
                    <div className="text-xs font-bold text-neutral-800 font-laila mt-0.5">
                      {formatDevanagariNumerals(sadhana.svadhyayaPadas)} / {formatDevanagariNumerals(sadhana.svadhyayaTarget)} <span className="text-[9px] font-normal text-neutral-400">पद</span>
                    </div>
                  </div>
                </div>

                {/* 1-Tap Quick Mala Bead */}
                {onQuickJapa && (
                  <button
                    type="button"
                    onClick={onQuickJapa}
                    className="w-full h-8 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-200/70 shadow-2xs"
                  >
                    <span>📿 +१ माला जप पूर्ण (+1 Mala Japa)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
    </>
  );
};
