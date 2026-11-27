import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarHeart,
  ChevronDown,
  ChevronRight,
  Globe,
  MapPin,
  Music,
  Sparkles,
} from 'lucide-react';
import { FESTIVALS_BY_SLUG, FESTIVALS_LIST, FestivalGuideEntry } from '../../data/festivalsData';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';

export interface FestivalGuideViewProps {
  initialFestivalSlug?: string;
  onSelectFestival?: (slug: string | null) => void;
  onNavigateHome?: () => void;
  onOpenKnowledgeBase?: () => void;
}

export const FestivalGuideView: React.FC<FestivalGuideViewProps> = ({
  initialFestivalSlug,
  onSelectFestival,
  onNavigateHome,
  onOpenKnowledgeBase,
}) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialFestivalSlug || null);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  React.useEffect(() => {
    setActiveSlug(initialFestivalSlug || null);
    setOpenFaqIdx(0);
  }, [initialFestivalSlug]);

  const activeFestival: FestivalGuideEntry | null = useMemo(
    () => (activeSlug ? FESTIVALS_BY_SLUG[activeSlug] || null : null),
    [activeSlug]
  );

  const isFirstFestivalRender = useRef(true);
  useEffect(() => {
    if (isFirstFestivalRender.current) {
      isFirstFestivalRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [activeSlug]);

  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(slug);
    onSelectFestival?.(slug);
    resetScrollToTop();
  };

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(null);
    onSelectFestival?.(null);
    resetScrollToTop();
  };

  if (activeFestival) {
    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
        <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-serif text-neutral-500">
            <a
              href="/festivals"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-bold no-underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'समस्त ब्रज उत्सव' : 'All Festivals'}</span>
            </a>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline font-medium text-neutral-800">{activeFestival.hindiName}</span>
          </div>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</span>
          </button>
        </div>

        {/* Hero Split */}
        <article className="rounded-[24px] bg-white p-5 sm:p-7 shadow-[0_2px_14px_rgba(24,24,27,0.025)] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 rounded-[14px] overflow-hidden aspect-[4/3] bg-[#EFE7D8]">
            <img
              src={activeFestival.plateImage}
              alt={activeFestival.hindiName}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="md:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-[10px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
                {activeFestival.seasonTag}
              </span>
              <span className="px-3 py-1 rounded-[10px] bg-[#FAF8F4] text-amber-900 text-xs font-serif font-medium flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-amber-700" />
                {activeFestival.recommendedRaga}
              </span>
            </div>

            <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              {lang === 'hi' ? activeFestival.hindiName : activeFestival.name}
            </h1>

            <p className="text-xs sm:text-sm font-serif text-neutral-700 leading-relaxed">
              {lang === 'hi' ? activeFestival.descriptionHi : activeFestival.descriptionEn}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div className="rounded-[12px] bg-[#FAF8F4] p-3">
                <div className="text-[11px] font-serif text-neutral-500">पावन तिथि / वेला</div>
                <div className="text-xs font-serif font-bold text-neutral-900 mt-0.5">
                  {lang === 'hi' ? activeFestival.timelineHi : activeFestival.timelineEn}
                </div>
              </div>
              <div className="rounded-[12px] bg-[#FAF8F4] p-3">
                <div className="text-[11px] font-serif text-neutral-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>प्रमुख देवालय</span>
                </div>
                <div className="text-xs font-serif font-bold text-neutral-900 mt-0.5">
                  {activeFestival.primaryTemple}
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Three Editorial Study Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: lang === 'hi' ? 'उत्सव एवं लीला इतिहास' : 'Origin & Pastime History',
              body: lang === 'hi' ? activeFestival.historyHi : activeFestival.historyEn,
            },
            {
              title: lang === 'hi' ? 'आध्यात्मिक व रसिक रहस्य' : 'Philosophical & Inner Meaning',
              body: lang === 'hi' ? activeFestival.meaningHi : activeFestival.meaningEn,
            },
            {
              title: lang === 'hi' ? 'मन्दिर सेवा व दर्शन विधि' : 'Vrindavan Temple Celebrations',
              body: lang === 'hi' ? activeFestival.celebrationHi : activeFestival.celebrationEn,
            },
          ].map((sec) => (
            <section
              key={sec.title}
              className="rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-2.5"
            >
              <h2 className="font-rozha text-lg font-bold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{sec.title}</span>
              </h2>
              <p className="text-xs sm:text-sm font-serif text-neutral-700 leading-relaxed">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        {/* Interactive Festival FAQs */}
        {activeFestival.faqs.length > 0 && (
          <section className="rounded-[24px] bg-white p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-3">
            <h2 className="font-rozha text-lg font-bold text-neutral-900">
              {lang === 'hi' ? 'उत्सव सम्बन्धी प्रमुख जिज्ञासाएँ' : 'Festival Seeker Questions'}
            </h2>
            <div className="space-y-2.5">
              {activeFestival.faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="rounded-[14px] bg-[#FAF8F4] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 font-serif font-bold text-sm text-neutral-900 cursor-pointer"
                    >
                      <span>{lang === 'hi' ? faq.questionHi : faq.questionEn}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-amber-700 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`accordion-slide-container ${isOpen ? 'is-open' : 'is-closed'}`}
                      aria-hidden={!isOpen}
                      inert={!isOpen ? true : undefined}
                    >
                      <div className="accordion-slide-content">
                        <div className="accordion-slide-card px-4 pb-4 text-xs sm:text-sm font-serif text-neutral-700 leading-relaxed">
                          {lang === 'hi' ? faq.answerHi : faq.answerEn}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
      <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <a
                href="/"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onNavigateHome();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-serif font-bold no-underline transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'होम सैंक्चुअरी' : 'Home'}</span>
              </a>
            )}
            {onOpenKnowledgeBase && (
              <a
                href="/knowledge-base"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onOpenKnowledgeBase();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-neutral-800 no-underline transition-colors"
              >
                <span>{lang === 'hi' ? 'ज्ञानकोश विकी' : 'Knowledge Base'}</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800">
            <CalendarHeart className="w-3.5 h-3.5" />
            <span>ब्रजमण्डल के पावन महोत्सव • {formatDevanagariNumerals(FESTIVALS_LIST.length)} प्रमुख उत्सव</span>
          </div>
          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-neutral-900">
            {lang === 'hi' ? 'श्री वृन्दावन एवं ब्रज महोत्सव धरोहर' : 'Sacred Festivals of Vrindavan & Braj'}
          </h1>
          <p className="text-xs sm:text-sm font-serif text-neutral-600 max-w-2xl leading-relaxed">
            {lang === 'hi'
              ? 'सावन झूला, श्री राधाष्टमी, शरद महारास, ब्रज होरी एवं श्री कृष्ण जन्माष्टमी के शास्त्रीय राग, लीला इतिहास और मंदिर सेवा परम्परा का वर्णन।'
              : 'Explore the liturgical calendar, seasonal ragas, temple seva traditions, and theological meaning of Braj’s beloved festivals.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FESTIVALS_LIST.map((f, idx) => (
          <a
            key={f.slug}
            href={`/festivals/${encodeURIComponent(f.slug)}`}
            onClick={(e) => handleOpen(e, f.slug)}
            className="rounded-[24px] bg-white p-3.5 shadow-[0_2px_14px_rgba(24,24,27,0.025)] hover:bg-[#FFFDF9] transition-colors flex flex-col justify-between gap-3.5 no-underline group"
          >
            <div className="space-y-3">
              <div className="rounded-[10px] overflow-hidden aspect-[16/10] bg-[#EFE7D8]">
                <img
                  src={f.plateImage}
                  alt={f.hindiName}
                  loading={idx < 3 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="px-1.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-serif">
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#FAF8F4] text-amber-900 font-bold">
                    {f.seasonTag}
                  </span>
                  <span className="text-neutral-500 truncate">{f.recommendedRaga}</span>
                </div>
                <h2 className="font-rozha text-lg sm:text-xl font-bold text-neutral-900 group-hover:text-amber-800 transition-colors leading-snug">
                  {lang === 'hi' ? f.hindiName : f.name}
                </h2>
                <p className="text-xs sm:text-sm font-serif text-neutral-600 line-clamp-2 leading-relaxed">
                  {lang === 'hi' ? f.descriptionHi : f.descriptionEn}
                </p>
              </div>
            </div>

            <div className="px-1.5 pb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-serif text-neutral-500 truncate">
                {lang === 'hi' ? f.timelineHi : f.timelineEn}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold shrink-0">
                <span>{lang === 'hi' ? 'दर्शन' : 'Explore'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default FestivalGuideView;
