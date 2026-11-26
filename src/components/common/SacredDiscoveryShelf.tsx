import React, { useMemo } from 'react';
import {
  Sparkles,
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

export const SacredDiscoveryShelf: React.FC<SacredDiscoveryShelfProps> = ({
  currentPad,
  entityType,
  entitySlug,
  onSelectPad,
  title = 'सम्बन्धित पावन नेक्सस • Sacred Correlated Discoveries',
  className = '',
}) => {
  // Current Ashtayama Prahar info
  const prahar = useMemo(() => {
    return CorrelationService.getCurrentPrahar();
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
        return <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'saint':
        return <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'flute':
      case 'pad':
        return <Music className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'sparkle':
        return <Flame className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'sun':
        return <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />;
      default:
        return <Scroll className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getBadgeStyle = (color: CorrelatedDiscovery['badgeColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
      case 'cyan':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200/60 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40';
      case 'amber':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    }
  };

  return (
    <section
      aria-label="सम्बन्धित पावन नेक्सस"
      className={`mt-10 pt-6 border-t border-stone-200/70 dark:border-stone-800 select-none ${className}`}
    >
      {/* 
        Header with Ashtayama Prahar indicator 
        Concentric radii: Container Outer 24px -> Padding 16px -> Inner 8px
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            {title}
          </h3>
        </div>

        {/* Real-time Ashtayama Harmonic Pill */}
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-[6px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 font-sans">
          <Compass className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium">{prahar.nameHindi}</span>
          <span className="text-amber-700/60 dark:text-amber-400/60">•</span>
          <span className="text-[10px] opacity-80">{prahar.timeRange}</span>
        </div>
      </div>

      {/* 
        Grid of Correlated Discoveries
        Concentric Radius Rule:
        Card Outer = 18px (rounded-[18px])
        Card Padding = 12px (p-3)
        Inner Elements (Icon badge, Tag) = 18 - 12 = 6px (rounded-[6px])
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                if (isPadLink && onSelectPad && !e.metaKey && !e.ctrlKey) {
                  // If clicking another pad inside pad reader, handle in-place
                  // Otherwise let normal anchor navigation work seamlessly
                }
              }}
              className="group relative flex flex-col justify-between p-3 rounded-[18px] bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/70 hover:border-amber-500/40 dark:hover:border-amber-400/30 hover:bg-amber-500/[0.03] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <div>
                {/* Top Badge & Icon Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${getBadgeStyle(
                      item.badgeColor
                    )}`}
                  >
                    {renderIcon(item.iconType)}
                    {item.badge}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                </div>

                {/* Main Devanagari Title */}
                <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                  {item.titleDevanagari}
                </h4>

                {/* Subtitle / Tradition */}
                {item.subtitleDevanagari && (
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
                    {item.subtitleDevanagari}
                  </p>
                )}
              </div>

              {/* Bottom Correlation Reason */}
              <div className="mt-3 pt-2 border-t border-stone-200/50 dark:border-stone-800/50">
                <p className="text-[11px] text-amber-900/80 dark:text-amber-200/70 font-sans italic line-clamp-1">
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
