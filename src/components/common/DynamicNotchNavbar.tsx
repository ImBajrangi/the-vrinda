import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  BookOpen,
  Sparkles,
  Trophy,
  Play,
  Pause,
  Flame,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { NavTab } from './FloatingNavbar';
import { SacredLogo } from './SacredLogo';
import { computeAshtayamaPhase } from '../../services/cacheService';

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
}

export const DynamicNotchNavbar: React.FC<DynamicNotchNavbarProps> = ({
  activeTab,
  onSelectTab,
  streakDays = 14,
  isPlayingAudio = false,
  currentTrackTitle = 'Hit Chaurasi Pad 01',
  onToggleAudio,
  onOpenPlayer,
  onOpenSearch,
  onOpenFocus,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const ashtayama = computeAshtayamaPhase();

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const tabRefs = useRef<{ [key in NavTab]?: HTMLButtonElement | null }>({});

  const navItems: { id: NavTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'smaran', label: 'Home Sanctuary', shortLabel: 'Home', icon: Compass },
    { id: 'padavali', label: 'Scriptures', shortLabel: 'Read', icon: BookOpen },
    { id: 'feed', label: 'Darshan Feed', shortLabel: 'Darshan', icon: Sparkles },
    { id: 'milestones', label: 'Devotion', shortLabel: 'Sadhana', icon: Trophy },
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
    <header className="fixed top-2.5 sm:top-4 left-0 right-0 z-50 w-full px-3 sm:px-6 pointer-events-none select-none transition-all duration-300">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Main Floating Glass & Paper Header Bar */}
        <div className="pointer-events-auto rounded-full w-full max-w-[96vw] md:max-w-6xl bg-white/95 backdrop-blur-2xl border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-3.5 sm:px-4 py-1.5 transition-all">
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
              <SacredLogo size={30} className="shadow-xs shrink-0" />
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-devanagari font-bold text-sm sm:text-base text-[#18181B] tracking-tight">
                  वृन्दोपनिषद्
                </span>
                <span className="font-mono font-bold text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                  2.0
                </span>
              </div>
            </div>

            {/* 2. Center: Segmented Navigation Menu Bar (Desktop & Tablet >= md) */}
            <nav
              aria-label="Main Navigation Menu"
              className="relative hidden md:flex items-center gap-1 bg-[#F4F4F5]/80 p-1 rounded-full border border-neutral-200/60"
            >
              {/* Dynamic Elastic Sliding Indicator Bar */}
              {indicatorStyle.ready && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-[#18181B] shadow-xs pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                  style={{
                    transform: `translateX(${indicatorStyle.left}px)`,
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
                        ? 'text-white font-bold'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] transition-colors duration-200 ${isActive ? 'text-amber-400' : 'text-[#71717A]'}`} />
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
                  className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1.5 sm:px-2.5 sm:h-8 rounded-full bg-white text-[#18181B] border border-neutral-200/80 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-[#18181B] stroke-[2.2]" />
                  <span className="hidden sm:inline text-xs">Search</span>
                  <kbd className="hidden lg:inline text-[9px] font-mono text-[#A1A1AA] bg-neutral-100 px-1 py-0.2 rounded">⌘K</kbd>
                </button>
              )}

              {/* Audio Shravan Pill */}
              <div
                className={`flex items-center justify-center gap-1.5 h-8 rounded-full border shadow-2xs transition-colors shrink-0 ${
                  isPlayingAudio
                    ? 'bg-[#18181B] text-white border-[#18181B] px-1.5 sm:px-2.5'
                    : 'bg-white text-[#18181B] border-neutral-200/80 w-8 sm:w-auto sm:px-2.5'
                }`}
              >
                <button
                  type="button"
                  onClick={onToggleAudio}
                  aria-label={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  title={isPlayingAudio ? 'Pause Sacred Audio' : 'Play Sacred Audio'}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isPlayingAudio ? 'bg-amber-600 text-white' : 'bg-[#18181B] text-white'
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
                className="hidden min-[480px]:flex items-center gap-1 px-2.5 h-8 rounded-full bg-white text-xs font-bold text-[#18181B] border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-mono text-xs font-bold">{streakDays}d</span>
              </button>

              {/* Mobile Menu Hamburger Button (< md only): Styled in matching porcelain white with generous padding */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                className="md:hidden w-8 h-8 rounded-full bg-white hover:bg-neutral-50 flex items-center justify-center text-[#18181B] border border-neutral-200/80 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Card (Graceful & non-intrusive when toggled) */}
        {isMobileMenuOpen && (
          <div className="pointer-events-auto w-full max-w-[96vw] mt-2 p-3 rounded-3xl bg-white/95 backdrop-blur-2xl border border-neutral-200/80 shadow-xl md:hidden apple-view-enter">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'bg-neutral-50 text-[#18181B] hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Ashtayama & Dhyana Row */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs px-1">
              <span className="text-[#71717A] text-[11px] font-medium truncate max-w-[200px]">
                {ashtayama.nameEnglish} ({ashtayama.timeRange})
              </span>
              {onOpenFocus && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFocus();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#18181B] text-white"
                >
                  Sanctuary →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
