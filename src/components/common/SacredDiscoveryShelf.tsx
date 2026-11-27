import React, { useMemo, useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  User,
  BookOpen,
  Scroll,
  Sun,
  Flame,
  Music,
  ChevronRight,
} from 'lucide-react';
import { SacredPad } from '../../types/devotional';
import { CorrelationService, CorrelatedDiscovery } from '../../services/correlationService';

interface SacredDiscoveryShelfProps {
  currentPad?: SacredPad | null;
  entityType?: 'story' | 'place' | 'bio' | 'ritual';
  entitySlug?: string;
  onSelectPad?: (pad: SacredPad) => void;
  title?: string;
  className?: string;
}

const SSR_PRAHAR_DATE = new Date('2026-01-01T19:00:00+05:30');

export const SacredDiscoveryShelf: React.FC<SacredDiscoveryShelfProps> = ({
  currentPad,
  entityType,
  entitySlug,
  onSelectPad,
  title = 'आगे की साधना यात्रा • इससे जुड़े पावन प्रसंग',
  className = '',
}) => {
  // Deterministic on SSR & initial paint, synced to live clock after mount (0 hydration drift)
  const [prahar, setPrahar] = useState(() => CorrelationService.getCurrentPrahar(SSR_PRAHAR_DATE));

  useEffect(() => {
    setPrahar(CorrelationService.getCurrentPrahar(new Date()));
  }, []);

  // Compute correlated items in 0ms using in-memory graph
  const discoveries = useMemo<CorrelatedDiscovery[]>(() => {
    if (currentPad) {
      return CorrelationService.getRecommendationsForPad(currentPad, 4);
    }
    if (entityType && entitySlug) {
      return CorrelationService.getRecommendationsForEntity(entityType, entitySlug, 4);
    }
    return [];
  }, [currentPad, entityType, entitySlug]);

  if (!discoveries || discoveries.length === 0) {
    return null;
  }

  const renderIcon = (type: CorrelatedDiscovery['iconType']) => {
    switch (type) {
      case 'temple':
        return <MapPin className="w-3 h-3 text-emerald-700 dark:text-emerald-300 shrink-0" />;
      case 'saint':
        return <User className="w-3 h-3 text-amber-800 dark:text-amber-300 shrink-0" />;
      case 'book':
        return <BookOpen className="w-3 h-3 text-rose-700 dark:text-rose-300 shrink-0" />;
      case 'flute':
      case 'pad':
        return <Music className="w-3 h-3 text-amber-800 dark:text-amber-300 shrink-0" />;
      case 'sparkle':
        return <Flame className="w-3 h-3 text-amber-700 dark:text-amber-300 shrink-0" />;
      case 'sun':
        return <Sun className="w-3 h-3 text-amber-700 dark:text-amber-300 shrink-0" />;
      default:
        return <Scroll className="w-3 h-3 text-amber-700 dark:text-amber-300 shrink-0" />;
    }
  };

  return (
    <section
      aria-label="आगे की साधना यात्रा"
      className={`mt-10 pt-6 select-none space-y-4 ${className}`}
    >
      {/* Clear, Human & Helpful Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 px-1">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-base sm:text-lg font-rozha text-[#18181B] dark:text-stone-100 leading-snug">
            {title}
          </h3>
          <p className="text-xs font-laila text-neutral-500 dark:text-stone-400">
            पठन आगे बढ़ाएं या इससे जुड़े लीला-धाम, रचयिता संत और दैनिक आरती का दर्शन करें
          </p>
        </div>

        {/* Live Ashtayama Prahar & Active Raga Pill */}
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-[#FAF6EE] dark:bg-amber-950/40 text-[11px] font-laila text-amber-900 dark:text-amber-200 shrink-0">
          <Compass className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">{prahar.nameHindi}</span>
          {prahar.activeRagas?.[0] && (
            <>
              <span className="text-amber-700/45">·</span>
              <span>राग {prahar.activeRagas[0]}</span>
            </>
          )}
        </div>
      </div>

      {/* 2-Column Borderless Tonal Bento (Ample Room for Devanagari Titles & Helpful Context — R_outer=20px, p=12px -> inner img R=8px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {discoveries.map((item) => {
          const isPadLink = item.type === 'pad';
          const resolvedHref =
            typeof window !== 'undefined' &&
            window.location.hostname.startsWith('path.') &&
            item.url.startsWith('/') &&
            !item.url.startsWith('/grantha/')
              ? `https://bhav.vrindopnishad.in${item.url}`
              : item.url;

          return (
            <a
              key={item.id}
              href={resolvedHref}
              onClick={(e) => {
                if (isPadLink && item.padRef && onSelectPad && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  onSelectPad(item.padRef);
                }
              }}
              className={`group flex items-stretch gap-3 p-3 rounded-[20px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400/50 no-underline ${
                item.isPrimaryNext
                  ? 'bg-[#FEF9C3]/70 hover:bg-[#FEF08A]/70 dark:bg-amber-950/35 dark:hover:bg-amber-950/55'
                  : 'bg-[#FAF8F4] hover:bg-[#F3ECE0] dark:bg-stone-900/60 dark:hover:bg-stone-800/75'
              }`}
            >
              {/* Crisp Authentic Visual Thumbnail (Concentric 20 - 12 = 8px) */}
              {item.imageUrl ? (
                <div className="w-16 sm:w-[72px] shrink-0 rounded-[8px] overflow-hidden bg-[#EFE7D8] dark:bg-stone-800 self-stretch min-h-[68px]">
                  <img
                    src={item.imageUrl}
                    alt={item.titleDevanagari}
                    className={`w-full h-full object-cover ${
                      item.type === 'bio' || item.type === 'pad' ? 'object-top' : 'object-center'
                    }`}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="w-14 shrink-0 rounded-[8px] bg-amber-100/70 dark:bg-amber-950/60 flex items-center justify-center self-stretch">
                  {renderIcon(item.iconType)}
                </div>
              )}

              {/* Rich Understandable Context & Clear Next Step */}
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-laila font-bold text-amber-800 dark:text-amber-300 truncate">
                      {renderIcon(item.iconType)}
                      <span className="truncate">{item.badge}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-laila font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                      <span>{item.actionLabel || 'पढ़ें'}</span>
                      <ChevronRight className="w-3 h-3 text-amber-700 group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors shrink-0" />
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-[15px] font-serif font-bold text-[#18181B] dark:text-stone-100 leading-snug line-clamp-2 group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                    {item.titleDevanagari}
                  </h4>

                  {item.subtitleDevanagari && (
                    <p className="mt-0.5 text-[11.5px] font-laila text-neutral-600 dark:text-stone-400 line-clamp-1">
                      {item.subtitleDevanagari}
                    </p>
                  )}
                </div>

                <p className="text-[11px] font-laila text-neutral-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {item.reason}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};
