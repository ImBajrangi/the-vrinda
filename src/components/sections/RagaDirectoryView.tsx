import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Music, Play, Search, Sparkles, X } from 'lucide-react';
import { SectionBotCompanion } from '../common/SectionBotCompanion';
import ragaIndexData from '../../data/ragaIndex.json';
import { SacredDatabase } from '../../services/sacredDatabase';
import { extractPurePadaTitle } from '../../utils/padaTitle';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';
import { seo } from '../../services/seoService';
import { IOSSpinner } from '../common/IOSActivityIndicator';
import { SacredPad } from '../../types/devotional';

interface RagaEntry {
  slug: string;
  name: string;
  padas: string[];
}

export interface RagaDirectoryViewProps {
  initialRagaSlug?: string;
  onSelectRaga?: (slug: string | null) => void;
  onSelectPad?: (slug: string, pad?: SacredPad) => void;
  onPlayPad?: (pad: SacredPad) => void;
  onNavigateHome?: () => void;
  onOpenPadavali?: () => void;
}

const RAW_RAGA_INDEX = (
  (ragaIndexData as any)?.default || ragaIndexData || {}
) as Record<string, { name: string; padas: string[] }>;

function humanizeSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const RagaDirectoryView: React.FC<RagaDirectoryViewProps> = ({
  initialRagaSlug,
  onSelectRaga,
  onSelectPad,
  onPlayPad,
  onNavigateHome,
  onOpenPadavali,
}) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialRagaSlug || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loadingPlaySlug, setLoadingPlaySlug] = useState<string | null>(null);
  const [, setDbTick] = useState(0);

  useEffect(() => {
    setActiveSlug(initialRagaSlug || null);
    setPage(1);
  }, [initialRagaSlug]);

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

  const allRagas = useMemo<RagaEntry[]>(() => {
    return Object.entries(RAW_RAGA_INDEX)
      .map(([slug, val]) => ({
        slug,
        name: val.name,
        padas: Array.isArray(val.padas) ? val.padas : [],
      }))
      .sort((a, b) => b.padas.length - a.padas.length);
  }, []);

  const activeRaga = useMemo(
    () => (activeSlug ? allRagas.find((r) => r.slug === activeSlug) || null : null),
    [activeSlug, allRagas]
  );

  const ashtayama = useMemo(() => computeAshtayamaPhase(new Date()), []);

  // Synchronize document SEO metadata when navigating inside Raga Hub
  useEffect(() => {
    if (activeRaga) {
      seo.updateSEO({
        tab: 'padavali',
        ogType: 'website',
        title: `राग ${activeRaga.name} के पावन पद (${activeRaga.padas.length} पद) • ब्रज रसिक संगीत | वृन्दोपनिषद् 2.0`,
        description: `शास्त्रीय राग ${activeRaga.name} में निबद्ध ${activeRaga.padas.length} प्रामाणिक ब्रज रसिक पदों का मूल पाठ, रचयिता एवं भावार्थ संग्रह।`,
        canonicalUrl: `https://bhav.vrindopnishad.in/raga/${encodeURIComponent(activeRaga.slug)}`,
        collection: {
          name: `राग ${activeRaga.name} पद संग्रह`,
          description: `शास्त्रीय राग ${activeRaga.name} में निबद्ध ${activeRaga.padas.length} ब्रज रसिक पद।`,
          url: `https://bhav.vrindopnishad.in/raga/${encodeURIComponent(activeRaga.slug)}`,
        },
      });
    } else {
      seo.updateSEO({
        tab: 'padavali',
        ogType: 'website',
        title: `शास्त्रीय राग कोष (${allRagas.length} राग) • ब्रज रस पदावली | वृन्दोपनिषद् 2.0`,
        description: `श्री वृन्दावन रसिक वाणी में निबद्ध ${allRagas.length} शास्त्रीय एवं ब्रज लोक रागों (विभास, कल्याण, केदार, बिलावल, सारंग, मलार) के समस्त पावन पदों का संग्रह।`,
        canonicalUrl: 'https://bhav.vrindopnishad.in/ragas',
        collection: {
          name: `शास्त्रीय राग एवं ब्रज संगीत कोष (${allRagas.length} राग)`,
          description: `श्री वृन्दावन रसिक वाणी के ${allRagas.length} शास्त्रीय एवं ब्रज लोक राग।`,
          url: 'https://bhav.vrindopnishad.in/ragas',
        },
      });
    }
  }, [activeRaga, allRagas.length]);

  const filteredRagas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRagas;
    return allRagas.filter(
      (r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
    );
  }, [allRagas, searchQuery]);

  const handleOpenRaga = (e: React.MouseEvent<HTMLAnchorElement>, slug: string | null) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(slug);
    setPage(1);
    onSelectRaga?.(slug);
    resetScrollToTop();
  };

  if (activeRaga) {
    const pageSize = 48;
    const totalPages = Math.max(1, Math.ceil(activeRaga.padas.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const slice = activeRaga.padas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-5">
        {/* Top Breadcrumb Bar */}
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
              href="/ragas"
              onClick={(e) => handleOpenRaga(e, null)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF8F4] hover:bg-[#FEF08A] text-[#78350F] font-bold no-underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>समस्त राग कोष</span>
            </a>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="hidden sm:inline font-bold text-[#18181B] truncate">
              राग {activeRaga.name}
            </span>
          </div>

          <a
            href="/padavali"
            onClick={(e) => {
              if (onOpenPadavali && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                onOpenPadavali();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold no-underline shrink-0"
          >
            <span>पूर्ण ग्रंथ कक्ष</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* Raga Hero Card (Concentric: 28px -> 24px -> 12px) */}
        <article className="rounded-[28px] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
              <Music className="w-3.5 h-3.5" />
              <span>शास्त्रीय ब्रज संगीत राग</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FAF8F4] text-amber-900 text-xs font-mono font-bold">
              {formatDevanagariNumerals(activeRaga.padas.length)} पावन पद
            </span>
          </div>

          <h1 className="font-rozha text-2xl sm:text-4xl text-[#18181B] leading-tight">
            राग {activeRaga.name} — पावन पद संग्रह
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 font-laila leading-relaxed max-w-3xl">
            श्री धाम वृन्दावन की रसिक परंपरा में शास्त्रीय <strong>राग {activeRaga.name}</strong> के अंतर्गत संकलित समस्त प्रामाणिक पद। किसी भी पद को मूल पाठ, शब्दार्थ एवं भावार्थ सहित पढ़ने के लिए स्पर्श करें।
          </p>
        </article>

        {/* Padas Grid with Canonical <a href="/pad/..."> Mesh */}
        <section className="rounded-[28px] bg-white p-4 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap px-1">
            <h2 className="font-serif font-bold text-lg text-[#18181B]">
              पद अनुक्रमणिका ({formatDevanagariNumerals(activeRaga.padas.length)} पद)
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
                  key={pSlug}
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
                          <span>राग {activeRaga.name}</span>
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

        {/* Cross-Links */}
        <div className="rounded-[24px] bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-laila text-neutral-600">
            वर्तमान अष्टयाम वेला: <strong className="text-amber-900">{ashtayama.nameDevanagari}</strong> ({ashtayama.timeRange})
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/themes"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                onSelectRaga?.(null);
              }}
              className="hidden"
            >
              Themes
            </a>
            <a
              href="/ragas"
              onClick={(e) => handleOpenRaga(e, null)}
              className="px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 no-underline"
            >
              समस्त {formatDevanagariNumerals(allRagas.length)} राग देखें →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Index View (/ragas — 294 Classical Ragas)
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
            <span>{formatDevanagariNumerals(allRagas.length)} शास्त्रीय राग</span>
          </span>
        </div>

        <h1 className="font-rozha text-2xl sm:text-4xl text-[#18181B] leading-tight">
          शास्त्रीय राग एवं ब्रज संगीत कोष ({formatDevanagariNumerals(allRagas.length)} राग)
        </h1>
        <p className="text-sm text-neutral-600 font-laila max-w-3xl leading-relaxed">
          वृन्दावन की अष्टयाम सेवा एवं रसिक वाणी में प्रयुक्त शास्त्रीय और ब्रज लोक राग। विभास, बिलावल, सारंग, कान्हरौ, कल्याण व मल्हार सहित समस्त रागों के पद अलग-अलग पठन पृष्ठ पर देखें।
        </p>

        {/* Raga Search */}
        <label className="relative block max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="राग खोजें (जैसे: विभास, मल्हार, बिलावल, vibhas)..."
            aria-label="राग खोजें"
            className="w-full h-10 pl-10 pr-9 rounded-full bg-[#FAF8F4] text-[16px] sm:text-sm text-[#18181B] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="राग खोज साफ़ करें"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
      </div>

      {/* Ragas Grid (28px container -> 16px p -> 12px tiles) */}
      <div className="rounded-[28px] bg-white p-4 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRagas.map((r) => (
            <a
              key={r.slug}
              href={`/raga/${encodeURIComponent(r.slug)}`}
              onClick={(e) => handleOpenRaga(e, r.slug)}
              className="rounded-[12px] bg-[#FAF8F4] hover:bg-[#FEFCE8] p-4 flex items-center justify-between gap-3 no-underline transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[8px] bg-[#FEF08A] text-[#78350F] flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif font-bold text-sm sm:text-base text-[#18181B] truncate">
                    राग {r.name}
                  </h2>
                  <p className="text-[11px] font-mono text-neutral-500 truncate">
                    {formatDevanagariNumerals(r.padas.length)} पावन पद
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-800/60 shrink-0" />
            </a>
          ))}
        </div>

        {filteredRagas.length === 0 && (
          <p className="text-center text-sm text-neutral-500 font-laila py-8">
            कोई मिलता राग नहीं मिला। कृपया अन्य राग का नाम लिखें।
          </p>
        )}
      </div>

      <SectionBotCompanion
        agentId="tara"
        heading="Tara • Raga & Pad Sahayak"
        subtitle={
          activeSlug
            ? `Ask Tara for Ashtayama time, mood & verses in Raga ${humanizeSlug(activeSlug)}`
            : 'Ask Tara which Raga fits the current Ashtayama watch or explore any Rasik pad'
        }
        quickPrompts={
          activeSlug
            ? [`Explain Raga ${humanizeSlug(activeSlug)} mood`, 'Which Ashtayama phase is active now?']
            : ['Which Raga fits morning Vibhas seva?', 'Show Hit Chaurasi Pad 1']
        }
      />
    </div>
  );
};
export default RagaDirectoryView;
