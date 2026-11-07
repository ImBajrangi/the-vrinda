import React from 'react';
import { Home, BookOpen, Users, Award } from 'lucide-react';

export type NavTab = 'smaran' | 'padavali' | 'feed' | 'milestones';

interface FloatingNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenFab: () => void;
  isPlayingAudio?: boolean;
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
}) => {
  const tabs = [
    { id: 'smaran' as NavTab, label: 'Sadhana', icon: Home },
    { id: 'padavali' as NavTab, label: 'Vani', icon: BookOpen },
    { id: 'feed' as NavTab, label: 'Darshan', icon: Users },
    { id: 'milestones' as NavTab, label: 'Streaks', icon: Award },
  ];

  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  return (
    // Only displayed on mobile (< md). On tablet & desktop, top header navigation takes over.
    <div className="md:hidden fixed bottom-3.5 min-[380px]:bottom-5 left-0 right-0 z-40 flex items-center justify-center gap-2 px-2.5 max-w-sm w-full mx-auto pointer-events-none box-border">
      {/* Fluid responsive floating nav pill: Minimalist, power-efficient frosted glass */}
      <nav
        aria-label="Mobile Navigation"
        className="relative pointer-events-auto flex-1 min-w-0 max-w-[290px] h-[54px] rounded-[28px] bg-[#FFFDF9]/96 backdrop-blur-md border border-neutral-900/[0.07] shadow-[0_8px_24px_-4px_rgba(24,24,27,0.08),0_2px_6px_-1px_rgba(24,24,27,0.03)] flex items-center justify-between p-1 box-border transform-gpu will-change-transform"
      >
        {/* Dynamic Elastic Sliding Indicator Bar */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-[22px] bg-[#FEF08A] shadow-2xs pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
          style={{
            width: 'calc((100% - 8px) / 4)',
            left: '4px',
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
              onClick={() => onSelectTab(tab.id)}
              className={`relative z-10 border-0 text-[10px] font-sans flex-1 min-w-0 h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-[22px] transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#18181B] font-bold'
                  : 'text-[#71717A] hover:text-[#18181B] font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 stroke-[2.2] shrink-0 transition-colors duration-200 ${isActive ? 'text-[#B45309]' : 'text-[#71717A]'}`} />
              <span className="leading-none truncate w-full text-center">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Devotional Audio FAB with Golden Flute */}
      <button
        type="button"
        onClick={onOpenFab}
        aria-label="Open Sacred Audio Player"
        title="Open Sacred Audio Player"
        className="pointer-events-auto relative w-[48px] h-[48px] rounded-full shrink-0 flex items-center justify-center text-[#18181B] bg-[#FACC15] hover:bg-[#FDE047] border border-amber-300/60 shadow-[0_8px_20px_-2px_rgba(245,158,11,0.28),0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden transition-transform active:scale-95 cursor-pointer transform-gpu will-change-transform"
      >
        {isPlayingAudio && (
          <span className="absolute inset-0 rounded-full animate-pulse bg-amber-400/30 pointer-events-none" />
        )}
        <SacredFluteIcon className="w-5 h-5 shrink-0" />
      </button>
    </div>
  );
};
