import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Trophy,
  Play,
  Pause,
  Flame,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  ScrollText,
  Feather,
} from 'lucide-react';
import { NavTab } from './FloatingNavbar';
import { SacredLogo } from './SacredLogo';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';
import { SadhanaState } from '../../types/devotional';

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
  isMarqueeVisible?: boolean;
}

export const DynamicNotchNavbar: React.FC<DynamicNotchNavbarProps> = ({
  activeTab,
  onSelectTab,
  streakDays = 1,
  isPlayingAudio = false,
  currentTrackTitle = 'Hit Chaurasi Pad 01',
  onToggleAudio,
  onOpenPlayer,
  onOpenSearch,
  onOpenFocus,
  sadhana,
  onQuickJapa,
  isMarqueeVisible = true,
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
      }, 240);
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

  const ashtayama = computeAshtayamaPhase();

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const tabRefs = useRef<{ [key in NavTab]?: HTMLButtonElement | null }>({});
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Platform-wide consistent dismissal: close mobile menu on outside tap or Escape (pointerdown only to prevent dual firing)
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (isMenuClosing) return;
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, isMenuClosing]);

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
      badge: `🔥 ${streakDays}d`,
      icon: Trophy,
    },
  ];

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      const el = tabRefs.current[activeTab];
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

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
        className={`fixed ${
          isMarqueeVisible ? 'top-10 sm:top-12' : 'top-2.5 sm:top-4'
        } left-0 right-0 z-50 w-full px-3 sm:px-6 pointer-events-none select-none header-banner-transition`}
      >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Main Floating Glass & Paper Header Bar */}
        <div className="pointer-events-auto rounded-full w-full max-w-[96vw] md:max-w-6xl bg-white/95 backdrop-blur-md border border-neutral-900/[0.07] shadow-[0_4px_16px_-2px_rgba(24,24,27,0.05)] px-3.5 sm:px-4 py-1.5 transition-all transform-gpu will-change-transform">
          <div className="flex items-center justify-between gap-2 h-10 sm:h-11">
            
            {/* 1. Left: Brand Identity & Sacred Logo */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelectNav('smaran')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectNav('smaran')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none shrink-0 py-0.5"
              title="श्री वृन्दोपनिषद् 2.0 • Daily Sadhana Sanctuary"
            >
              <SacredLogo size={30} className="shrink-0" />
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-devanagari font-bold text-sm sm:text-base text-amber-950 tracking-tight">
                  वृन्दोपनिषद्
                </span>
                <span className="font-mono font-bold text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                  2.0
                </span>
              </div>
            </div>

            {/* 2. Center: Segmented Navigation Menu Bar (Desktop & Tablet >= md) */}
            <nav
              aria-label="Main Navigation Menu"
              className="relative hidden md:flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-full"
            >
              {/* Dynamic Elastic Sliding Indicator Bar */}
              {indicatorStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-[transform,width] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,width]"
                  style={{
                    transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
                    width: `${indicatorStyle.width}px`,
                    left: 0,
                  }}
                />
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[item.id] = el;
                    }}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`relative z-10 flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'text-[#18181B] font-bold'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] transition-colors duration-200 ${isActive ? 'text-[#B45309]' : 'text-[#71717A]'}`} />
                    <span className="inline lg:hidden">{item.shortLabel}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 3. Right: Contemplation Actions & Tools Deck */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Spotlight Search Pill */}
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  aria-label="Search (Cmd+K)"
                  title="Search: Verses, Saints, Scriptures (Cmd+K)"
                  className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1.5 sm:px-2.5 sm:h-8 rounded-full bg-[#FFFDF9] text-amber-950 hover:bg-amber-50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-amber-900 stroke-[2.2]" />
                  <span className="hidden sm:inline text-xs">Search</span>
                  <kbd className="hidden lg:inline text-[9px] font-mono text-amber-800/70 bg-amber-100/60 px-1 py-0.2 rounded">⌘K</kbd>
                </button>
              )}

              {/* Audio Shravan Pill */}
              <div
                className={`flex items-center justify-center gap-1.5 h-8 rounded-full transition-colors shrink-0 ${
                  isPlayingAudio
                    ? 'bg-[#FEF08A] text-[#78350F] px-1.5 sm:px-2.5 font-bold'
                    : 'bg-[#FFFDF9] text-amber-950 w-8 sm:w-auto sm:px-2.5 font-semibold'
                }`}
              >
                <button
                  type="button"
                  onClick={onToggleAudio}
                  aria-label={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  title={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[#FACC15] hover:bg-[#FDE047] text-[#18181B] font-bold"
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
                  title={`Track: ${currentTrackTitle}`}
                  className="hidden sm:inline text-xs font-semibold truncate max-w-[80px] lg:max-w-[110px] cursor-pointer"
                >
                  {isPlayingAudio ? 'Playing' : 'Audio'}
                </button>
              </div>

              {/* Devotion Streak Badge: Visible on >= 480px so compact mobile screens never clip */}
              <button
                type="button"
                onClick={() => handleSelectNav('milestones')}
                aria-label={`Devotion Streak: ${streakDays} days`}
                title="View Devotion Streaks & Milestones"
                className="hidden min-[480px]:flex items-center gap-1 px-2.5 h-8 rounded-full bg-[#FFFDF9] text-xs font-bold text-amber-950 hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-mono text-xs font-bold">{streakDays}d</span>
              </button>

              {/* Mobile Menu Hamburger Button (< md only): Styled in matching porcelain white with generous padding */}
              <button
                ref={mobileToggleRef}
                type="button"
                onClick={handleToggleMenu}
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                className="md:hidden w-8 h-8 rounded-full bg-[#FFFDF9] hover:bg-amber-50 flex items-center justify-center text-amber-950 transition-colors cursor-pointer shrink-0"
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
            className={`pointer-events-auto w-full max-w-[96vw] mt-2 p-3 sm:p-4 rounded-3xl bg-white md:hidden border border-neutral-200/90 shadow-[0_12px_36px_-8px_rgba(24,24,27,0.12),inset_0_1px_0_rgba(255,255,255,1)] space-y-2.5 max-h-[85vh] overflow-y-auto no-scrollbar text-[#18181B] transform-gpu will-change-transform ${
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
                        {currentTrackTitle}
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
