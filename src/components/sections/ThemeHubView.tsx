import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionBotCompanion } from '../common/SectionBotCompanion';
import { ArrowLeft, CalendarHeart, ChevronRight, Play, Sparkles } from 'lucide-react';
import themeHubsData from '../../data/themeHubs.json';
import { SacredDatabase } from '../../services/sacredDatabase';
import { extractPurePadaTitle } from '../../utils/padaTitle';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';
import { seo } from '../../services/seoService';
import { IOSSpinner } from '../common/IOSActivityIndicator';
import { SacredPad } from '../../types/devotional';

interface ThemeHubEntry {
  slug: string;
  nameDevanagari: string;
  nameEnglish: string;
  description: string;
  padas: string[];
}

export interface ThemeHubViewProps {
  initialThemeSlug?: string;
  onSelectTheme?: (slug: string | null) => void;
  onSelectPad?: (slug: string, pad?: SacredPad) => void;
  onPlayPad?: (pad: SacredPad) => void;
  onNavigateHome?: () => void;
  onOpenFestivals?: () => void;
}

const RAW_THEME_HUBS = (
  (themeHubsData as any)?.default || themeHubsData || {}
) as Record<string, ThemeHubEntry>;

function humanizeSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ThemeHubView: React.FC<ThemeHubViewProps> = ({
  initialThemeSlug,
  onSelectTheme,
  onSelectPad,
  onPlayPad,
  onNavigateHome,
  onOpenFestivals,
}) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialThemeSlug || null);
  const [page, setPage] = useState(1);
  const [loadingPlaySlug, setLoadingPlaySlug] = useState<string | null>(null);
  const [, setDbTick] = useState(0);

  useEffect(() => {
    setActiveSlug(initialThemeSlug || null);
    setPage(1);
  }, [initialThemeSlug]);

  useEffect(() => {
    const unsub = SacredDatabase.subscribe(() => setDbTick((t) => t + 1));
    SacredDatabase.initialize().catch(() => {});
    SacredDatabase.ensureSearchCatalogLoaded().catch(() => {});
    return unsub;
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [activeSlug]);

  const allThemes = useMemo(() => Object.values(RAW_THEME_HUBS), []);
  const activeTheme = useMemo(
    () => (activeSlug ? RAW_THEME_HUBS[activeSlug] || allThemes.find((t) => t.slug === activeSlug) || null : null),
    [activeSlug, allThemes]
  );

  useEffect(() => {
    if (activeTheme) {
      seo.updateSEO({
        tab: 'padavali',
        ogType: 'website',
        title: `${activeTheme.nameDevanagari} (${activeTheme.padas.length} पावन पद) • ${activeTheme.nameEnglish} | वृन्दोपनिषद् 2.0`,
        description: activeTheme.description,
        canonicalUrl: `https://bhav.vrindopnishad.in/theme/${encodeURIComponent(activeTheme.slug)}`,
        collection: {
          name: activeTheme.nameDevanagari,
          description: activeTheme.description,
          url: `https://bhav.vrindopnishad.in/theme/${encodeURIComponent(activeTheme.slug)}`,
        },
      });
    } else {
      seo.updateSEO({
        tab: 'padavali',
        ogType: 'website',
        title: 'ब्रज उत्सव एवं लीला प्रसंग संग्रह (Themes & Festivals) | वृन्दोपनिषद् 2.0',
        description: 'होली-फाग, श्री राधाष्टमी, झूलन महोत्सव, शरद पूर्णिमा महारास, अष्टयाम सेवा एवं एकादशी व्रत के पावन पदों का विषयवार संग्रह।',
        canonicalUrl: 'https://bhav.vrindopnishad.in/themes',
        collection: {
          name: 'ब्रज उत्सव एवं लीला प्रसंग संग्रह',
          description: 'होली-फाग, राधाष्टमी, झूलन महोत्सव, शरद रास एवं अष्टयाम पदों के विषयवार केंद्र।',
          url: 'https://bhav.vrindopnishad.in/themes',
        },
      });
    }
  }, [activeTheme]);

  const handleOpenTheme = (e: React.MouseEvent<HTMLAnchorElement>, slug: string | null) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(slug);
    setPage(1);
    onSelectTheme?.(slug);
    resetScrollToTop();
  };

  if (activeTheme) {
    const pageSize = 48;
    const totalPages = Math.max(1, Math.ceil(activeTheme.padas.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const slice = activeTheme.padas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-5">
        <nav
          aria-label="Breadcrumb"
          className="rounded-[20px] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-serif text-neutral-500 min-w-0">
            <a
              href="/"
              onClick={(e) => {
                if (onNavigateHome && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="hover:text-amber-800 no-underline font-medium"
            >
              वृन्दोपनिषद् 2.0
            </a>
            <span aria-hidden="true">/</span>
            <a
              href="/themes"
              onClick={(e) => handleOpenTheme(e, null)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF8F4] hover:bg-[#FEF08A] text-[#78350F] font-bold no-underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>समस्त लीला प्रसंग</span>
            </a>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="hidden sm:inline font-bold text-[#18181B] truncate">
              {activeTheme.nameDevanagari}
            </span>
          </div>

          {onOpenFestivals && (
            <a
              href="/festivals"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onOpenFestivals();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold no-underline shrink-0"
            >
              <span>महोत्सव मार्गदर्शिका</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          )}
        </nav>

        <article className="rounded-[28px] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
              <CalendarHeart className="w-3.5 h-3.5" />
              <span>{activeTheme.nameEnglish}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FAF8F4] text-amber-900 text-xs font-mono font-bold">
              {formatDevanagariNumerals(activeTheme.padas.length)} संकलित पद
            </span>
          </div>

          <h1 className="font-rozha text-2xl sm:text-4xl text-[#18181B] leading-tight">
            {activeTheme.nameDevanagari}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 font-laila leading-relaxed max-w-3xl">
            {activeTheme.description}
          </p>
        </article>

        <section className="rounded-[28px] bg-white p-4 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap px-1">
            <h2 className="font-serif font-bold text-lg text-[#18181B]">
              प्रसंग पद सूची ({formatDevanagariNumerals(activeTheme.padas.length)} पद)
            </h2>
            {totalPages > 1 && (
              <span className="text-xs font-mono text-neutral-500">
                पृष्ठ {formatDevanagariNumerals(page)} / {formatDevanagariNumerals(totalPages)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slice.map((pSlug, idx) => {
              const pad = SacredDatabase.getPadById(pSlug);
              const pure = pad
                ? extractPurePadaTitle(pad.titleDevanagari).title
                : humanizeSlug(pSlug);
              const globalNum = (currentPage - 1) * pageSize + idx + 1;
              return (
                <div
                  key={`${pSlug}-${idx}`}
                  className="rounded-[16px] bg-[#FAF8F4] hover:bg-[#F5EFE3] p-4 flex items-center justify-between gap-3 transition-colors"
                >
                  <a
                    href={`/pad/${encodeURIComponent(pSlug)}`}
                    onClick={(e) => {
                      if (onSelectPad && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        onSelectPad(pSlug, pad || undefined);
                      }
                    }}
                    className="flex items-start gap-3 min-w-0 flex-1 no-underline"
                  >
                    <span className="w-8 h-8 rounded-[8px] bg-[#FEF08A] text-[#78350F] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {globalNum}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-sm sm:text-base text-[#18181B] leading-snug line-clamp-2">
                        {pure}
                      </h3>
                      <p className="text-xs text-neutral-500 font-laila mt-0.5 truncate">
                        {pad?.author || 'ब्रज रसिक संत'}{' '}
                        <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                          <span aria-hidden="true">•</span>
                          <span>{activeTheme.nameEnglish}</span>
                        </span>
                      </p>
                    </div>
                  </a>

                  {pad && onPlayPad && (
                    <button
                      type="button"
                      disabled={loadingPlaySlug === pSlug}
                      aria-busy={loadingPlaySlug === pSlug}
                      onClick={async () => {
                        if (loadingPlaySlug) return;
                        setLoadingPlaySlug(pSlug);
                        try {
                          const resolved = pad.isStub ? (await SacredDatabase.fetchPadBySlug(pSlug)) || pad : pad;
                          onPlayPad(resolved);
                        } finally {
                          setLoadingPlaySlug(null);
                        }
                      }}
                      aria-label={`Play ${pure}`}
                      className="w-8 h-8 rounded-full bg-white hover:bg-[#FEF08A] disabled:opacity-60 text-[#78350F] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      {loadingPlaySlug === pSlug ? (
                        <IOSSpinner size="xs" theme="amber" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  resetScrollToTop();
                }}
                className="px-4 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] disabled:opacity-40 text-xs font-serif font-bold text-amber-950 cursor-pointer"
              >
                ← पिछला पृष्ठ
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  resetScrollToTop();
                }}
                className="px-4 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] disabled:opacity-40 text-xs font-serif font-bold text-[#78350F] cursor-pointer"
              >
                अगला पृष्ठ →
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
      <div className="rounded-[28px] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-950 no-underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Sanctuary</span>
          </a>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formatDevanagariNumerals(allThemes.length)} लीला एवं उत्सव संग्रह</span>
          </span>
        </div>

        <h1 className="font-rozha text-2xl sm:text-4xl text-[#18181B] leading-tight">
          ब्रज उत्सव एवं लीला प्रसंग संग्रह
        </h1>
        <p className="text-sm text-neutral-600 font-laila max-w-3xl leading-relaxed">
          होली-फाग, श्री राधाष्टमी, झूलन यात्रा, शरद पूर्णिमा महारास, अष्टयाम सेवा एवं एकादशी माहात्म्य से जुड़े सभी पावन पदों का समर्पित प्रसंग-वार संग्रह।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allThemes.map((t) => (
          <a
            key={t.slug}
            href={`/theme/${encodeURIComponent(t.slug)}`}
            onClick={(e) => handleOpenTheme(e, t.slug)}
            className="rounded-[24px] bg-white hover:bg-[#FEFCE8] p-5 shadow-[0_2px_14px_rgba(24,24,27,0.025)] flex flex-col justify-between gap-4 no-underline transition-colors"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F4] text-[#78350F] text-[11px] font-mono font-bold">
                  <CalendarHeart className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.nameEnglish}</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-800">
                  {formatDevanagariNumerals(t.padas.length)} पद
                </span>
              </div>
              <h2 className="font-rozha text-xl text-[#18181B] leading-snug">
                {t.nameDevanagari}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-laila leading-relaxed line-clamp-3">
                {t.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-serif font-bold text-[#78350F] pt-1">
              <span>प्रसंग के पद पढ़ें</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </a>
        ))}
      </div>

      <SectionBotCompanion
        agentId="sita"
        heading="Sita • Rasa & Theme Curator"
        subtitle="Ask Sita about Seva, Nikunj Vihar, Ashtayama, or Virah Bhakti themes"
        quickPrompts={['Explain Nikunj Vihar theme', 'Explore Braj Glossary terms']}
      />
    </div>
  );
};
export default ThemeHubView;
