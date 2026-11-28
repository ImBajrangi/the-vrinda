import React, { useMemo } from 'react';
import { BookOpen, ChevronRight, Sparkles, User } from 'lucide-react';
import { SacredDatabase } from '../../services/sacredDatabase';
import { extractPurePadaTitle } from '../../utils/padaTitle';
import { getSaintPortrait } from '../../services/devotionalVisuals';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { SacredPad } from '../../types/devotional';

export interface EntityOverviewBannerProps {
  mode: 'saint' | 'grantha';
  saintName?: string | null;
  granthaId?: string;
  samplePadas?: SacredPad[];
  onSelectPadSlug?: (slug: string, pad?: SacredPad) => void;
  onBrowseAllSaints?: () => void;
}

export const EntityOverviewBanner: React.FC<EntityOverviewBannerProps> = ({
  mode,
  saintName,
  granthaId,
  samplePadas = [],
  onSelectPadSlug,
  onBrowseAllSaints,
}) => {
  const saint = useMemo(
    () => (mode === 'saint' && saintName ? SacredDatabase.getSaintBySlugOrName(saintName) : undefined),
    [mode, saintName]
  );

  const grantha = useMemo(
    () => (mode === 'grantha' && granthaId && granthaId !== 'all' ? SacredDatabase.getGranthaById(granthaId) : undefined),
    [mode, granthaId]
  );

  const previewItems = useMemo(() => {
    return samplePadas.slice(0, 6);
  }, [samplePadas]);

  if (mode === 'saint' && saintName) {
    const saintLabel = saint?.name || saintName;
    const portrait = getSaintPortrait({
      slug: saint?.slug,
      name: saintLabel,
      tradition: saint?.tradition,
    });
    return (
      <section
        aria-label={`${saintLabel} संक्षिप्त परिचय`}
        className="rounded-[24px] bg-white p-4 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] mb-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={portrait}
            alt={saintLabel}
            className="w-16 h-16 rounded-[14px] object-cover object-top bg-[#EFE7D8] shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF08A] text-[#78350F] text-[11px] font-serif font-bold">
                <User className="w-3 h-3" />
                <span>{saint?.tradition || 'रसिक संत परंपरा'}</span>
              </span>
              {samplePadas.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-amber-900 text-[11px] font-mono font-bold">
                  {formatDevanagariNumerals(samplePadas.length)} पावन पद
                </span>
              )}
            </div>
            <h1 className="font-rozha text-xl sm:text-2xl text-[#18181B] leading-snug">
              {saintLabel} — पावन जीवन चरित्र एवं वाणी संग्रह
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-laila leading-relaxed line-clamp-2">
              {saint?.biography || `${saintLabel} जी की श्री धाम वृन्दावन रसिक परंपरा की अनमोल वाणियाँ व पद।`}
            </p>
          </div>

          {onBrowseAllSaints && (
            <button
              type="button"
              onClick={onBrowseAllSaints}
              className="self-start sm:self-center inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold shrink-0 cursor-pointer transition-colors"
            >
              <span>सभी संत मंडल</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {previewItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {previewItems.map((p) => {
              const pure = extractPurePadaTitle(p.titleDevanagari).title;
              return (
                <a
                  key={p.id}
                  href={`/pad/${encodeURIComponent(p.slug || p.id)}`}
                  onClick={(e) => {
                    if (onSelectPadSlug && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onSelectPadSlug(p.slug || p.id, p);
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif text-amber-950 no-underline truncate max-w-[230px] transition-colors"
                >
                  {pure}
                </a>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  if (mode === 'grantha' && grantha) {
    return (
      <section
        aria-label={`${grantha.name} परिचय`}
        className="rounded-[24px] bg-white p-4 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] mb-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF08A] text-[#78350F] text-[11px] font-serif font-bold">
              <BookOpen className="w-3 h-3" />
              <span>प्रामाणिक वाणी ग्रंथ</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-amber-900 text-[11px] font-serif font-semibold">
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>प्रणेता: {grantha.author}</span>
            </span>
          </div>
        </div>
        <h1 className="font-rozha text-xl sm:text-2xl text-[#18181B] leading-snug">
          {grantha.name} — मूल पाठ व पद अनुक्रमणिका
        </h1>
        {grantha.description && (
          <p className="text-xs sm:text-sm text-neutral-600 font-laila leading-relaxed">
            {grantha.description}
          </p>
        )}
        {previewItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {previewItems.map((p) => {
              const pure = extractPurePadaTitle(p.titleDevanagari).title;
              return (
                <a
                  key={p.id}
                  href={`/pad/${encodeURIComponent(p.slug || p.id)}`}
                  onClick={(e) => {
                    if (onSelectPadSlug && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onSelectPadSlug(p.slug || p.id, p);
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif text-amber-950 no-underline truncate max-w-[230px] transition-colors"
                >
                  {pure}
                </a>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return null;
};
export default EntityOverviewBanner;
