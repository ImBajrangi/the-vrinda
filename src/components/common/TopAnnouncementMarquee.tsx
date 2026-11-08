import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Flame,
  Clock,
  Compass,
  Radio,
} from 'lucide-react';
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
  tag: string;
  tagColor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  highlight?: string;
  suffix?: string;
  action?: () => void;
}

export const TopAnnouncementMarquee: React.FC<TopAnnouncementMarqueeProps> = ({
  isScrolled,
  onSelectTab,
  onOpenSaintsDirectory,
  streakDays = 14,
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
      tag: 'अष्टयाम सेवा',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
      title: `${ashtayama.nameDevanagari} प्रहर (${ashtayama.timeRange})`,
      highlight: ashtayama.descriptionDevanagari,
      action: () => onSelectTab('smaran'),
    },
    {
      id: 'live-darshan',
      tag: 'LIVE SEVA',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Radio,
      title: 'श्री बांके बिहारी मंदिर व श्री राधावल्लभ लाल',
      highlight: 'नित्य दर्शन व आरती सेवा',
      suffix: 'दर्शन करें →',
      action: () => onSelectTab('feed'),
    },
    {
      id: 'literature',
      tag: 'रसिक वाणी',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: BookOpen,
      title: '४२०४ निकुंज पद संग्रह',
      highlight: '१५ मूल ग्रंथ • प्रामाणिक पाठ',
      suffix: 'अध्ययन करें →',
      action: () => onSelectTab('padavali'),
    },
    {
      id: 'saints',
      tag: 'संत मंडल',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Compass,
      title: '१३१ रसिक संत नामावली',
      highlight: 'श्री हरिवंश, स्वामी हरिदास, श्री व्यास जी',
      suffix: 'नामावली →',
      action: onOpenSaintsDirectory,
    },
    {
      id: 'panchang',
      tag: 'पंचांग',
      tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: Sparkles,
      title: 'श्री धाम वृंदावन नित्य पंचांग',
      highlight: 'पावन अष्टयाम समय-चक्र एवं उत्सव धारा',
      action: () => onSelectTab('feed'),
    },
    {
      id: 'sadhana',
      tag: 'नित्य साधना',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Flame,
      title: 'युगल नाम जप व चिंतन',
      highlight: `${streakDays}-दिवसीय अखंड निष्ठा`,
      action: () => onSelectTab('milestones'),
    },
  ];

  const renderItemSet = (setKey: string) => (
    <div key={setKey} className="inline-flex items-center">
      {marqueeItems.map((item) => {
        const Icon = item.icon;
        return (
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
            className={`inline-flex items-center gap-2 px-3 py-1 text-xs select-none ${item.action ? 'cursor-pointer hover:opacity-90' : ''
              }`}
          >
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagColor}`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0" />
              <span>{item.tag}</span>
            </span>

            {/* Title / Description */}
            <span className="font-laila font-medium text-stone-200 whitespace-nowrap">
              {item.title}
            </span>

            {item.highlight && (
              <span className="font-laila font-semibold text-amber-300 whitespace-nowrap">
                • {item.highlight}
              </span>
            )}

            {item.suffix && (
              <span className="font-laila font-semibold text-amber-400 hover:text-amber-200 transition-colors whitespace-nowrap text-[11px] underline decoration-amber-500/40 underline-offset-2">
                {item.suffix}
              </span>
            )}

            {/* Glowing Amber Dot Separator */}
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.8)] mx-3 shrink-0"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <aside
      aria-label="Vrindavan Live Announcements Ticker"
      className={`fixed top-0 left-0 right-0 z-[60] w-full bg-[#0C0A09]/95 backdrop-blur-md text-stone-200 select-none overflow-hidden border-b border-amber-500/20 announcement-banner-transition ${
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

