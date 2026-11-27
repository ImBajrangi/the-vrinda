import React from 'react';
import { Home, BookOpen, Users, Award, Feather } from 'lucide-react';

export type NavTab =
  | 'smaran'
  | 'granthas'
  | 'padavali'
  | 'feed'
  | 'milestones'
  | 'stories'
  | 'biographies'
  | 'places'
  | 'rituals';

interface FloatingNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenFab: () => void;
  isPlayingAudio?: boolean;
  isVisible?: boolean;
}

/**
 * Authentic Braj Devotional Icon: Krishna's Sacred Flute (मुरली / वेणु)
 * Adorned with Pitambari gold nodes, sacred tone holes, silk tassel,
 * and crown peacock feather (मयूर चंद्रिका).
 */
export const SacredFluteIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Silk Tassel (रेशमी लटकन / गुंडरी) */}
    <path
      d="M5 18.5C3.8 20 3.2 21.2 3.8 22C4.5 22 5.2 20.8 5.5 19.2"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="3.8" cy="22" r="1" fill="#F59E0B" />
    <circle cx="5" cy="20.5" r="0.75" fill="#FEF3C7" />

    {/* Flute Shaft (बांसुरी की नली) */}
    <line
      x1="4.5"
      y1="18.5"
      x2="17.5"
      y2="5.5"
      stroke="#FDE68A"
      strokeWidth="2.4"
      strokeLinecap="round"
    />

    {/* Pitambari Gold Bamboo Nodes & Mouthpiece */}
    <line x1="4.5" y1="18.5" x2="6" y2="17" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="16" y1="7" x2="17.5" y2="5.5" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="10" y1="13" x2="10.8" y2="12.2" stroke="#D97706" strokeWidth="2.6" />

    {/* Sacred Tone Holes (सा रे ग म प स्वर छिद्र) */}
    <circle cx="7.5" cy="15.5" r="0.75" fill="#18181B" />
    <circle cx="9.5" cy="13.5" r="0.75" fill="#18181B" />
    <circle cx="11.5" cy="11.5" r="0.75" fill="#18181B" />
    <circle cx="13.5" cy="9.5" r="0.75" fill="#18181B" />
    <circle cx="15.5" cy="7.5" r="0.75" fill="#18181B" />

    {/* Peacock Feather (मोरपंख चंद्रिका) at Flute Crown */}
    <path
      d="M17 6C16.8 2.8 19.2 1.5 21.2 2.5C22.5 3.8 21.8 6.5 17.5 6.8Z"
      fill="#047857"
      fillOpacity="0.9"
      stroke="#F59E0B"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <path
      d="M18 5.2C18.2 3.6 19.8 3 20.5 3.8C21 4.5 20.2 5.8 18.5 5.6Z"
      fill="#38BDF8"
    />
    <circle cx="19.4" cy="4.2" r="0.9" fill="#18181B" />
    <circle cx="19.4" cy="4.2" r="0.4" fill="#F59E0B" />

    {/* Ambient Sacred Sound Resonance Wave */}
    <path
      d="M11 4.5C12.5 3.5 14.5 3.8 15.5 4.8"
      stroke="#F59E0B"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.85"
    />
  </svg>
);

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenFab,
  isPlayingAudio = false,
  isVisible = true,
}) => {
  const tabs = [
    { id: 'smaran' as NavTab, label: 'Sadhana', icon: Home },
    { id: 'granthas' as NavTab, label: 'Epics', icon: BookOpen },
    { id: 'padavali' as NavTab, label: 'Padavali', icon: Feather },
    { id: 'feed' as NavTab, label: 'Darshan', icon: Users },
    { id: 'milestones' as NavTab, label: 'Streaks', icon: Award },
  ];

  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  return (
    // Single unified compact bottom pill on mobile (< md) with inline flush Shravan button
    <div className={`md:hidden fixed bottom-2.5 min-[380px]:bottom-3.5 left-0 right-0 z-40 flex items-center justify-center px-3 max-w-md w-full mx-auto pointer-events-none box-border transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      isVisible ? 'translate-y-0' : 'translate-y-24'
    }`}>
      {/* Fluid responsive unified nav + audio capsule (26px outer / 4px pad => 22px concentric pills) */}
      <nav
        aria-label="Mobile Navigation"
        className="relative pointer-events-auto w-full max-w-[376px] h-[52px] rounded-[26px] bg-white border border-neutral-900/[0.06] shadow-[0_8px_28px_rgba(24,24,27,0.10),0_2px_6px_rgba(0,0,0,0.03)] flex items-center p-1 gap-1 box-border transform-gpu touch-manipulation select-none"
      >
        <div className="relative flex-1 min-w-0 h-full flex items-center">
          {/* Sliding Indicator Bar across the 5 route tabs */}
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 rounded-[22px] bg-[#FEF08A] shadow-2xs pointer-events-none transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={{
              width: '20%',
              left: 0,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onPointerDown={() => {
                  if (activeTab !== tab.id) {
                    onSelectTab(tab.id);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTab !== tab.id) {
                    onSelectTab(tab.id);
                  }
                }}
                className={`relative z-10 border-0 text-[9.5px] font-sans flex-1 min-w-0 h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-[22px] transition-colors duration-100 cursor-pointer touch-manipulation select-none active:scale-95 active:opacity-75 ${
                  isActive
                    ? 'text-[#18181B] font-bold'
                    : 'text-[#52525B] hover:text-[#18181B] font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[2.2] shrink-0 transition-colors duration-100 ${isActive ? 'text-[#B45309]' : 'text-[#71717A]'}`} />
                <span className="leading-none truncate w-full text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Flush Inline Sacred Shravan / Audio Trigger */}
        <button
          type="button"
          onClick={onOpenFab}
          aria-label="Open Sacred Audio Player"
          title="Open Sacred Audio Player"
          className={`relative w-[42px] h-[42px] rounded-[21px] shrink-0 flex items-center justify-center text-[#78350F] transition-colors active:scale-95 cursor-pointer ${
            isPlayingAudio
              ? 'bg-[#1C140D] text-[#FEF08A]'
              : 'bg-[#FAF6EE] hover:bg-[#FEF08A]'
          }`}
        >
          <SacredFluteIcon className="w-4.5 h-4.5 shrink-0" />
        </button>
      </nav>
    </div>
  );
};
