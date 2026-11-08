import React, { useState, useEffect } from 'react';
import { computeAshtayamaPhase } from '../../services/cacheService';
import { NavTab } from './FloatingNavbar';

interface TopAnnouncementMarqueeProps {
  isScrolled: boolean;
  onSelectTab: (tab: NavTab) => void;
  onOpenSaintsDirectory: () => void;
  streakDays?: number;
}

interface MarqueeItemData {
  id: string;
  lead?: string;
  text: string;
  action?: () => void;
}

export const TopAnnouncementMarquee: React.FC<TopAnnouncementMarqueeProps> = ({
  isScrolled,
  onSelectTab,
  onOpenSaintsDirectory,
  streakDays = 1,
}) => {
  // Real-time Ashtayama calculation that refreshes every minute
  const [ashtayama, setAshtayama] = useState(() => computeAshtayamaPhase());

  useEffect(() => {
    const timer = setInterval(() => {
      setAshtayama(computeAshtayamaPhase());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const marqueeItems: MarqueeItemData[] = [
    {
      id: 'ashtayama',
      lead: 'श्री धाम वृन्दावन अष्टयाम',
      text: `${ashtayama.nameDevanagari} प्रहर (${ashtayama.timeRange}) • ${ashtayama.descriptionDevanagari}`,
      action: () => onSelectTab('smaran'),
    },
    {
      id: 'panchang',
      lead: 'नित्य पंचांग',
      text: 'पावन अष्टयाम समय-चक्र एवं उत्सव धारा',
      action: () => onSelectTab('feed'),
    },
    {
      id: 'live-darshan',
      lead: 'श्री दर्शन सेवा',
      text: 'श्री बांके बिहारी मंदिर व श्री राधावल्लभ लाल नित्य दर्शन एवं आरती',
      action: () => onSelectTab('feed'),
    },
    {
      id: 'literature',
      lead: 'पावन ग्रंथ संग्रह',
      text: '४,२०४ निकुंज रस पद संग्रह • १५ मूल प्रामाणिक वाणी ग्रंथ',
      action: () => onSelectTab('padavali'),
    },
    {
      id: 'saints',
      lead: 'रसिक संत मंडल',
      text: '१३१ रसिक संत नामावली, पावन जीवन चरित्र व वाणी',
      action: onOpenSaintsDirectory,
    },
    {
      id: 'sadhana',
      lead: 'नित्य साधना',
      text: `युगल नाम जप व चिंतन • ${streakDays}-दिवसीय अखंड निष्ठा`,
      action: () => onSelectTab('milestones'),
    },
  ];

  const renderItemSet = (setKey: string) => (
    <div key={setKey} className="inline-flex items-center">
      {marqueeItems.map((item) => (
        <div
          key={`${setKey}-${item.id}`}
          role={item.action ? 'button' : undefined}
          tabIndex={item.action ? 0 : undefined}
          onClick={item.action}
          onKeyDown={(e) => {
            if (item.action && (e.key === 'Enter' || e.key === ' ')) {
              item.action();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs select-none ${
            item.action ? 'cursor-pointer hover:text-amber-800 transition-colors' : ''
          }`}
        >
          {item.lead && (
            <span className="font-laila font-bold text-amber-900 whitespace-nowrap">
              {item.lead}:
            </span>
          )}

          <span className="font-laila font-medium text-stone-700 whitespace-nowrap">
            {item.text}
          </span>

          {/* Golden Diamond Separator */}
          <span
            aria-hidden="true"
            className="text-amber-500/70 text-[10px] mx-3 shrink-0 select-none"
          >
            ✦
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <aside
      aria-label="Vrindavan Live Announcements Ticker"
      className={`fixed top-0 left-0 right-0 z-[60] w-full bg-[#FFFDF5]/95 backdrop-blur-md text-stone-800 select-none overflow-hidden border-b border-amber-200/90 shadow-[0_1px_3px_rgba(217,119,6,0.03)] announcement-banner-transition ${
        isScrolled
          ? 'h-0 opacity-0 border-b-0 pointer-events-none'
          : 'h-8 sm:h-9 opacity-100 pointer-events-auto'
      }`}
    >
      <div className="w-full h-8 sm:h-9 flex items-center top-marquee-mask">
        {/* Infinite Track with 2 identical sets for seamless -50% loop */}
        <div className="top-marquee-track">
          {renderItemSet('set-a')}
          {renderItemSet('set-b')}
        </div>
      </div>
    </aside>
  );
};

