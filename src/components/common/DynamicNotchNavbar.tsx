import React, { useState } from 'react';
import { Home, BookOpen, Users, Award, Flame, Search, Play, Pause, Music2, ChevronDown, ChevronUp } from 'lucide-react';
import { SacredLogo } from './SacredLogo';
import { NavTab } from './FloatingNavbar';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';

interface DynamicNotchNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakDays: number;
  isPlayingAudio: boolean;
  currentTrackTitle?: string;
  onToggleAudio: () => void;
  onOpenPlayer: () => void;
  isLowSpec?: boolean;
  onToggleLowSpec?: () => void;
  onOpenSearch?: () => void;
  onOpenFocus?: () => void;
}

export const DynamicNotchNavbar: React.FC<DynamicNotchNavbarProps> = ({
  activeTab,
  onSelectTab,
  streakDays = 14,
  isPlayingAudio,
  currentTrackTitle = 'जोई जोई प्यारो करे सोई मोहि भावै',
  onToggleAudio,
  onOpenPlayer,
  isLowSpec: _isLowSpec,
  onToggleLowSpec: _onToggleLowSpec,
  onOpenSearch,
  onOpenFocus,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ashtayama = computeAshtayamaPhase();

  const navItems = [
    { id: 'smaran' as NavTab, label: 'नित्य स्मरण', shortLabel: 'स्मरण', icon: Home },
    { id: 'padavali' as NavTab, label: 'पदावली', shortLabel: 'पदावली', icon: BookOpen },
    { id: 'feed' as NavTab, label: 'दिव्य दर्शन', shortLabel: 'दर्शन', icon: Users },
    { id: 'milestones' as NavTab, label: 'साधना सिद्धि', shortLabel: 'सिद्धि', icon: Award },
  ];

  return (
    <header className="fixed top-2.5 sm:top-4 left-0 right-0 z-50 w-full px-3 sm:px-6 pointer-events-none select-none transition-all duration-300">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Main Floating Glass & Paper Header Bar */}
        <div
          className={`pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isExpanded
              ? 'rounded-[28px] w-full max-w-xl bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-[0_16px_40px_rgba(20,33,61,0.12)] p-4 sm:p-5'
              : 'rounded-full w-full max-w-[96vw] md:max-w-6xl bg-white/96 dark:bg-[#14213D]/95 backdrop-blur-2xl border border-white dark:border-white/10 shadow-[0_8px_32px_rgba(20,33,61,0.12)] px-3 sm:px-4 py-1.5'
          }`}
        >
          {/* Compact Bar Row */}
          {!isExpanded ? (
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 h-10 sm:h-11">
              
              {/* 1. Left: Brand Identity & Sacred Logo */}
              <div
                onClick={() => onSelectTab('smaran')}
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer pressable shrink-0 py-0.5"
                title="श्री वृन्दोपनिषद् 2.0"
              >
                <SacredLogo size={32} className="shadow-xs" />
                <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                  <span className="font-devanagari font-bold text-sm sm:text-base text-[#111111] dark:text-white tracking-tight">
                    वृन्दोपनिषद्
                  </span>
                  <span className="hidden min-[360px]:inline font-doto font-bold text-[10px] text-[#15803D] bg-[#22C55E]/15 border border-[#22C55E]/30 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                    2.0
                  </span>
                </div>
              </div>

              {/* 2. Center: Segmented Navigation Menu Bar (Aligned with Site Design) */}
              <nav
                aria-label="मुख्य नेविगेशन"
                className="hidden md:flex items-center gap-1 bg-[#F4F4F4]/80 dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.05]"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all pressable ${
                        isActive
                          ? 'bg-white text-[#111111] dark:bg-white/20 dark:text-white shadow-xs font-bold'
                          : 'text-[#6B6F6B] dark:text-slate-300 hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* 3. Right: Contemplation Actions & Tools Deck */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                
                {/* Spotlight Search Pill */}
                {onOpenSearch && (
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    aria-label="खोजें (Cmd+K)"
                    title="खोजें: पद, संत, ग्रन्थ (Cmd+K)"
                    className="flex items-center gap-1 px-2 sm:px-2.5 h-8 rounded-full bg-white dark:bg-white/[0.06] text-[#111111] dark:text-white border border-black/[0.18] dark:border-white/20 hover:bg-black/5 pressable text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <Search className="w-3.5 h-3.5 text-[#111111] dark:text-white stroke-[2.2]" />
                    <span className="hidden lg:inline text-xs">खोजें</span>
                    <kbd className="hidden 2xl:inline text-[9px] font-mono text-slate-400 bg-black/5 dark:bg-white/10 px-1 rounded">⌘K</kbd>
                  </button>
                )}

                {/* Audio Shravan Pill */}
                <div
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-full border border-black/[0.18] dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors ${
                    isPlayingAudio
                      ? 'bg-[#14213D] text-white border-[#14213D]'
                      : 'bg-white dark:bg-white/[0.06] text-[#111111] dark:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={onToggleAudio}
                    aria-label={isPlayingAudio ? 'Pause' : 'Play'}
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center pressable ${
                      isPlayingAudio ? 'bg-[#B6FF2E] text-[#14213D]' : 'bg-[#14213D] text-white'
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
                    className="hidden lg:inline text-xs font-semibold truncate max-w-[85px]"
                  >
                    {isPlayingAudio ? 'श्रवण' : 'पद संगीत'}
                  </button>
                </div>

                {/* Streak Badge */}
                <button
                  type="button"
                  onClick={() => onSelectTab('milestones')}
                  aria-label="Bhakti Streak"
                  className="flex items-center gap-1 px-2 sm:px-2.5 h-8 rounded-full bg-white dark:bg-white/[0.06] text-xs font-bold text-[#111111] dark:text-white border border-black/[0.18] dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.06)] pressable"
                >
                  <Flame className="w-3.5 h-3.5 text-[#EF4444] fill-[#EF4444]" />
                  <span className="font-doto">{formatDevanagariNumerals(streakDays)}d</span>
                </button>


                {/* Expand Drawer Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  aria-label="विस्तृत विवरण देखें"
                  className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.1] hover:bg-black/[0.1] flex items-center justify-center text-[#111111] dark:text-white border border-black/[0.18] dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.06)] pressable transition-colors ml-0.5"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>
          ) : (
            /* Expanded Quick Control Drawer */
            <div className="w-full flex flex-col gap-3 apple-view-enter">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <SacredLogo size={28} />
                  <div>
                    <h3 className="font-devanagari font-bold text-sm text-[#111111] dark:text-white">
                      वृन्दोपनिषद् 2.0 • दैनिक निकुंज सेवा
                    </h3>
                    <p className="text-[11px] text-[#6B6F6B] dark:text-slate-400">
                      वर्तमान अष्टयाम: {ashtayama.nameDevanagari} वेला ({ashtayama.timeRange}) • {ashtayama.bhava}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Collapse Menu"
                  className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#555555] dark:text-slate-300 pressable"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Navigation List inside expanded drawer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsExpanded(false);
                      }}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#14213D] text-white shadow-xs'
                          : 'bg-[#F4F4F4] text-[#111111]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Audio Deck Banner */}
              <div className="flex items-center justify-between gap-3 bg-[#F4F4F4] dark:bg-black/30 p-3 rounded-2xl border border-black/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#14213D] flex items-center justify-center shrink-0">
                    <Music2 className="w-4 h-4 text-[#B6FF2E]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#B84A28] font-bold uppercase tracking-wider block">
                      वर्तमान रस प्रवाह
                    </span>
                    <h4 className="font-devanagari font-bold text-xs sm:text-sm text-[#111111] dark:text-white truncate">
                      {currentTrackTitle}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleAudio}
                    className="px-3.5 py-1.5 rounded-full bg-[#14213D] text-white text-xs font-bold pressable flex items-center gap-1.5"
                  >
                    {isPlayingAudio ? <Pause className="w-3 h-3 fill-current text-[#B6FF2E]" /> : <Play className="w-3 h-3 fill-current text-[#B6FF2E]" />}
                    <span>{isPlayingAudio ? 'विराम' : 'श्रवण'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPlayer();
                      setIsExpanded(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white text-[#111111] text-xs font-semibold border border-black/10 shadow-xs pressable"
                  >
                    प्लेयर
                  </button>
                </div>
              </div>

              {/* Dhyana Focus Sanctuary Drawer Row */}
              {onOpenFocus && (
                <div className="flex items-center justify-between gap-3 bg-[#F4F4F4] dark:bg-black/30 px-3.5 py-2.5 rounded-2xl border border-black/5 text-xs">
                  <span className="text-[#6B6F6B] font-medium">गहन ध्यान व एकाग्रता (Dhyāna Sanctuary)</span>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFocus();
                      setIsExpanded(false);
                    }}
                    className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#14213D] text-[#B6FF2E] pressable shadow-xs"
                  >
                    प्रारंभ करें
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
