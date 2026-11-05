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
    <circle cx="3.8" cy="22" r="1" fill="#B6FF2E" />
    <circle cx="5" cy="20.5" r="0.75" fill="#F7E6D2" />

    {/* Flute Shaft (बांसुरी की नली) */}
    <line
      x1="4.5"
      y1="18.5"
      x2="17.5"
      y2="5.5"
      stroke="#F7E6D2"
      strokeWidth="2.4"
      strokeLinecap="round"
    />

    {/* Pitambari Gold Bamboo Nodes & Mouthpiece */}
    <line x1="4.5" y1="18.5" x2="6" y2="17" stroke="#D4A359" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="16" y1="7" x2="17.5" y2="5.5" stroke="#D4A359" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="10" y1="13" x2="10.8" y2="12.2" stroke="#D4A359" strokeWidth="2.6" />

    {/* Sacred Tone Holes (सा रे ग म प स्वर छिद्र) */}
    <circle cx="7.5" cy="15.5" r="0.75" fill="#14213D" />
    <circle cx="9.5" cy="13.5" r="0.75" fill="#14213D" />
    <circle cx="11.5" cy="11.5" r="0.75" fill="#14213D" />
    <circle cx="13.5" cy="9.5" r="0.75" fill="#14213D" />
    <circle cx="15.5" cy="7.5" r="0.75" fill="#14213D" />

    {/* Peacock Feather (मोरपंख चंद्रिका) at Flute Crown */}
    <path
      d="M17 6C16.8 2.8 19.2 1.5 21.2 2.5C22.5 3.8 21.8 6.5 17.5 6.8Z"
      fill="#22C55E"
      fillOpacity="0.9"
      stroke="#B6FF2E"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <path
      d="M18 5.2C18.2 3.6 19.8 3 20.5 3.8C21 4.5 20.2 5.8 18.5 5.6Z"
      fill="#38BDF8"
    />
    <circle cx="19.4" cy="4.2" r="0.9" fill="#14213D" />
    <circle cx="19.4" cy="4.2" r="0.4" fill="#B6FF2E" />

    {/* Ambient Sacred Sound Resonance Wave */}
    <path
      d="M11 4.5C12.5 3.5 14.5 3.8 15.5 4.8"
      stroke="#B6FF2E"
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
    { id: 'smaran' as NavTab, label: 'Home', icon: Home },
    { id: 'padavali' as NavTab, label: 'Vani', icon: BookOpen },
    { id: 'feed' as NavTab, label: 'Feed', icon: Users },
    { id: 'milestones' as NavTab, label: 'Badges', icon: Award },
  ];

  return (
    // Only displayed on mobile (< md). On tablet & desktop, top header navigation takes over.
    // Responsive container: scaled for 320px–430px viewports with zero horizontal overflow.
    <div className="md:hidden fixed bottom-3.5 min-[380px]:bottom-5 left-0 right-0 z-40 flex items-center justify-center gap-2 min-[380px]:gap-3 px-2 min-[380px]:px-3.5 max-w-[390px] w-full mx-auto pointer-events-none box-border">
      {/* Fluid responsive floating nav pill: scales gracefully on narrow screens (< 360px) up to 276px */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto flex-1 min-w-0 max-w-[240px] sm:max-w-[276px] h-[56px] min-[380px]:h-[66px] rounded-[28px] min-[380px]:rounded-[33px] bg-white dark:bg-[#14213D] shadow-[0_12px_36px_rgba(20,33,61,0.22)] border-2 border-white flex items-center justify-between px-1.5 min-[380px]:px-2 box-border"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`border-0 bg-transparent text-[9.5px] min-[380px]:text-[10.5px] font-sans flex-1 min-w-0 h-[46px] min-[380px]:h-[54px] flex flex-col items-center justify-center gap-0.5 min-[380px]:gap-1 py-1 px-0.5 rounded-[20px] min-[380px]:rounded-[24px] pressable-sm transition-all ${
                isActive
                  ? 'bg-[#14213D] text-[#B6FF2E] font-bold shadow-xs'
                  : 'text-[#333333] hover:text-[#111111] font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 stroke-[2.2] shrink-0 ${isActive ? 'text-[#B6FF2E]' : 'text-[#222222]'}`} />
              <span className="leading-none truncate w-full text-center px-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Responsive Devotional Audio FAB with Apple Glow and Krishna Murali icon */}
      <button
        type="button"
        onClick={onOpenFab}
        aria-label="Open Ras Shravan Player"
        title="Open Ras Shravan Player"
        className="pointer-events-auto relative w-[52px] h-[52px] min-[380px]:w-[66px] min-[380px]:h-[66px] rounded-full shrink-0 flex items-center justify-center text-white border-2 min-[380px]:border-[3px] border-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] min-[380px]:shadow-[0_12px_30px_rgba(0,0,0,0.2)] pressable-sm overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #8A9A86, #2F4A44 70%)',
        }}
      >
        {isPlayingAudio && (
          <span className="absolute inset-0 rounded-full animate-apple-glow bg-[#B6FF2E]/30 pointer-events-none" />
        )}
        <SacredFluteIcon className="w-5 h-5 min-[380px]:w-6 min-[380px]:h-6 shrink-0" />
      </button>
    </div>
  );
};
