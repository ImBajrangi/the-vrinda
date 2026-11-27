import React, { useState } from 'react';
import { Bell, BookMarked, Users, MapPin, ChevronRight } from 'lucide-react';
import { NavTab } from '../common/FloatingNavbar';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';

interface SacredSectionsBannerProps {
  onSelectTab: (tab: NavTab) => void;
  onSelectAuthor?: (authorName: string) => void;
}

interface SectionCardItem {
  id: NavTab;
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  subtitle: string;
  count: string;
  features: string;
  imageUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const FEATURED_SAINTS_GALLERY = [
  { name: 'श्री हित हरिवंश महाप्रभु', role: 'राधावल्लभ संस्थापक', img: '/assets/saints/hit-harivansh.webp' },
  { name: 'स्वामी श्री हरिदास जी', role: 'केलिमाल रसराशि', img: '/assets/saints/swami-haridas.webp' },
  { name: 'श्री चैतन्य महाप्रभु', role: 'गौड़ीय संकीर्तन', img: '/assets/saints/chaitanya.webp' },
  { name: 'संत मीरा बाई जी', role: 'माधुर्य भक्ति रत्न', img: '/assets/saints/meera.webp' },
  { name: 'महाकवि सूरदास जी', role: 'सूरसागर अमर स्वर', img: '/assets/saints/surdas.webp' },
  { name: 'श्री रसखान जी', role: 'प्रेम वाटिका', img: '/assets/saints/raskhan.webp' },
  { name: 'श्री ध्रुवदास जी', role: 'बयालीस लीला', img: '/assets/saints/dhruvdas.webp' },
  { name: 'श्री व्यास जी', role: 'व्यास वाणी रसिक', img: '/assets/saints/vyas.webp' },
];

export const SacredSectionsBanner: React.FC<SacredSectionsBannerProps> = ({ onSelectTab, onSelectAuthor }) => {
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const triggerNavigation = (id: string, fn: () => void) => {
    if (loadingTarget) return;
    setLoadingTarget(id);
    navigationProgress.start();
    requestAnimationFrame(() => {
      try {
        fn();
      } finally {
        setLoadingTarget(null);
      }
    });
  };
  const cards: SectionCardItem[] = [
    {
      id: 'rituals',
      badge: 'नित्य उपासना',
      badgeBg: 'bg-amber-100/80',
      badgeText: 'text-amber-900',
      title: 'नित्य आरती व चालीसा',
      subtitle: 'आरती, चालीसा, स्तोत्र व दैनिक पाठ विधि',
      count: '110+ स्तुतियाँ',
      features: 'अखंड वाचन • घंटी व शंख नाद • पूजा-विधि',
      imageUrl: '/assets/temples/diya-pujan.webp',
      icon: Bell,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      id: 'stories',
      badge: 'लीला अमृत',
      badgeBg: 'bg-orange-100/80',
      badgeText: 'text-orange-950',
      title: 'दिव्य कथा व लीला',
      subtitle: 'पौराणिक प्रसंग, प्रेरक आख्यान व शिक्षाएँ',
      count: '120+ कथाएँ',
      features: 'अध्याय क्रम • पात्र परिचय • दार्शनिक मर्म',
      imageUrl: '/assets/darshan/radharaman-yugal.webp',
      icon: BookMarked,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-700',
    },
    {
      id: 'biographies',
      badge: 'गुरु परंपरा',
      badgeBg: 'bg-rose-100/80',
      badgeText: 'text-rose-950',
      title: 'संत व ऋषि चरित्र',
      subtitle: 'रसिक संतों व आचार्यों का पावन जीवन दर्शन',
      count: '120+ चरित्र',
      features: 'जीवन वृत्त • समाधि स्थल • रचित ग्रंथावली',
      imageUrl: '/assets/saints/hit-harivansh.webp',
      icon: Users,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
    },
    {
      id: 'places',
      badge: 'धाम दर्शन',
      badgeBg: 'bg-emerald-100/80',
      badgeText: 'text-emerald-950',
      title: 'पावन तीर्थ व धाम',
      subtitle: 'ब्रज, अयोध्या, काशी, मंदिर व परिक्रमा मार्ग',
      count: '120+ तीर्थ स्थल',
      features: 'दर्शन समय • परिक्रमा दूरी • प्राकट्य इतिहास',
      imageUrl: '/assets/temples/keshi-ghat.webp',
      icon: MapPin,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  return (
    <section
      aria-label="पावन संकलन एवं उपासना संग्रह"
      className="w-full bg-white rounded-[32px] squircle-card p-5 sm:p-7 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-5"
    >
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-rozha text-xl sm:text-2xl text-[#1C1611] leading-tight">
              पावन दर्शन एवं उपासना संग्रह
            </h3>
          </div>
          <p className="text-xs font-laila text-[#71717A] mt-1">
            दैनिक नित्य आरती, दिव्य आख्यान, रसिक संतों का जीवन चरित एवं समस्त ब्रज तीर्थों की प्रामाणिक महिमा।
          </p>
        </div>
      </div>

      {/* 4 Clean Borderless Editorial Cards Grid - Pure Tonal Depth (R_outer = 32px, p = 20px -> R_inner = 12px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const isLoading = loadingTarget === card.id;
          return (
            <button
              key={card.id}
              type="button"
              disabled={loadingTarget !== null}
              aria-busy={isLoading}
              onClick={() => triggerNavigation(card.id, () => onSelectTab(card.id))}
              className="group text-left p-2.5 rounded-[12px] bg-[#FAF8F4] hover:bg-[#F5EFE3] transition-colors duration-150 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-75"
            >
              <div className="space-y-2.5">
                {/* Clean Unobscured WebP Photograph */}
                <div className="w-full aspect-[4/3] rounded-[8px] overflow-hidden bg-[#EFE7D8]">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover object-[center_20%]"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                {/* Title & Subtitle on Natural Ivory */}
                <div className="px-1">
                  <div className="flex items-center justify-between gap-2 text-[10.5px] font-laila text-amber-800 font-semibold mb-0.5">
                    <span>{card.badge}</span>
                    <span className="font-mono text-neutral-500 font-normal">{card.count}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 group-hover:text-amber-950 transition-colors leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-[11px] font-laila text-neutral-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Bottom Feature Caption */}
              <div className="mt-2.5 pt-2 px-1 flex items-center justify-between gap-1 text-[10px] font-laila text-neutral-500">
                <span className="truncate">{isLoading ? 'संकलित हो रहा है...' : card.features}</span>
                {isLoading ? (
                  <IOSSpinner size="xs" theme="amber" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-700 shrink-0 group-hover:text-amber-900" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Rasik Saints Portrait Strip */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-laila font-bold text-amber-900">
            प्रमुख रसिक संत दर्शन • <span className="font-normal text-neutral-500">स्पर्श कर सीधे वाणी पढ़ें</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectTab('biographies')}
            className="text-[11px] font-laila font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            सभी चरित्र →
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {FEATURED_SAINTS_GALLERY.map((saint) => {
            const isLoadingSaint = loadingTarget === saint.name;
            return (
              <button
                key={saint.name}
                type="button"
                disabled={loadingTarget !== null}
                aria-busy={isLoadingSaint}
                onClick={() =>
                  triggerNavigation(saint.name, () => {
                    if (onSelectAuthor) {
                      onSelectAuthor(saint.name);
                    } else {
                      onSelectTab('biographies');
                    }
                  })
                }
                className="group shrink-0 flex items-center gap-2.5 pr-3.5 pl-1.5 py-1.5 rounded-full bg-[#FAF8F3] hover:bg-[#FEF08A]/55 transition-colors cursor-pointer text-left disabled:opacity-75"
              >
                <img
                  src={saint.img}
                  alt={saint.name}
                  className="w-9 h-9 rounded-full object-cover object-top shrink-0"
                  loading="eager"
                  decoding="async"
                />
                <div className="min-w-0">
                  <div className="font-laila font-bold text-xs text-neutral-900 leading-tight whitespace-nowrap flex items-center gap-1.5">
                    <span>{saint.name}</span>
                    {isLoadingSaint && <IOSSpinner size="xs" theme="amber" />}
                  </div>
                  <div className="text-[10px] font-laila text-amber-800/80 whitespace-nowrap">
                    {saint.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
