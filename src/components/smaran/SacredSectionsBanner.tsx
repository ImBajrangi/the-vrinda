import React from 'react';
import { Bell, BookMarked, Users, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { NavTab } from '../common/FloatingNavbar';

interface SacredSectionsBannerProps {
  onSelectTab: (tab: NavTab) => void;
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
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export const SacredSectionsBanner: React.FC<SacredSectionsBannerProps> = ({ onSelectTab }) => {
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
      icon: MapPin,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  return (
    <section
      aria-label="पावन संकलन एवं उपासना संग्रह"
      className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-xs mb-6 space-y-4"
    >
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
              पावन दर्शन एवं उपासना संग्रह
            </h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Sanatan Sanctuary
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-normal mt-1">
            दैनिक नित्य आरती, दिव्य आख्यान, संतों का पावन जीवन चरित एवं समस्त तीर्थों की प्रामाणिक महिमा।
          </p>
        </div>
      </div>

      {/* 4 Cards Grid - Strictly Concentric: R_inner = 32px - 24px = 8px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectTab(card.id)}
              className="group text-left p-4 rounded-[8px] bg-[#FFFDF9] border border-amber-900/10 hover:border-amber-300 hover:bg-amber-50/50 transition-colors duration-150 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <div className="space-y-3">
                {/* Top Row: Icon + Badge + Count */}
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-9 h-9 rounded-full ${card.iconBg} flex items-center justify-center shrink-0 border border-amber-200/50`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeBg} ${card.badgeText}`}>
                      {card.badge}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-500 font-mono">
                      {card.count}
                    </span>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 group-hover:text-amber-950 transition-colors leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Bottom Feature Pill & Action */}
              <div className="mt-3 pt-2.5 border-t border-amber-900/5 flex items-center justify-between gap-1 text-[10px] text-neutral-500">
                <span className="truncate">{card.features}</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700 shrink-0 group-hover:text-amber-900" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
