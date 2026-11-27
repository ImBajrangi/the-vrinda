import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Globe,
  Sparkles,
  Check,
  Share2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  List,
} from 'lucide-react';
import topicalGuidesData from '../../data/topicalGuides.json';
import { BILINGUAL_FAQS } from '../../data/faqData';
import { KNOWLEDGE_CATALOG } from '../../data/knowledgeCatalog';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';

interface GuideLangContent {
  title: string;
  description: string;
  body: string;
}

interface TopicalGuideEntry {
  slug: string;
  hi: GuideLangContent;
  en: GuideLangContent;
}

interface HeadingItem {
  id: string;
  text: string;
}

const GUIDES_MAP = topicalGuidesData as Record<string, TopicalGuideEntry>;

const GUIDE_ITEMS = KNOWLEDGE_CATALOG.filter((k) => k.isGuide && GUIDES_MAP[k.slug]);

export interface TopicalGuideViewProps {
  slug: string;
  onNavigateHome?: () => void;
  onSelectGuide?: (slug: string) => void;
  onOpenKnowledgeBase?: () => void;
}

export const TopicalGuideView: React.FC<TopicalGuideViewProps> = ({
  slug,
  onNavigateHome,
  onSelectGuide,
  onOpenKnowledgeBase,
}) => {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [paperTone, setPaperTone] = useState<'porcelain' | 'chandan'>('porcelain');
  const [isZenMode, setIsZenMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const isFirstGuideRender = useRef(true);
  useEffect(() => {
    if (isFirstGuideRender.current) {
      isFirstGuideRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [slug]);

  const guide = GUIDES_MAP[slug] || GUIDES_MAP['what-is-vrindopnishad'];
  const content = guide[lang] || guide.hi;

  const catalogMeta = useMemo(
    () => GUIDE_ITEMS.find((i) => i.slug === guide.slug),
    [guide.slug]
  );

  const wordEstimate = useMemo(() => {
    const plain = content.body.replace(/<[^>]+>/g, ' ').trim();
    const words = plain ? plain.split(/\s+/).length : 200;
    return Math.max(2, Math.round(words / 180));
  }, [content.body]);

  // Inject deterministic IDs into <h2> headings so sticky Table of Contents works without layout jumps
  const processedBody = useMemo(() => {
    let idx = 0;
    return content.body.replace(/<h2([^>]*)>/gi, (_m, attrs) => {
      const id = `guide-sec-${idx++}`;
      if (/id\s*=/.test(attrs)) return `<h2${attrs}>`;
      return `<h2 id="${id}"${attrs}>`;
    });
  }, [content.body]);

  useEffect(() => {
    const container = document.getElementById('topical-guide-body');
    if (!container) return;
    const h2Els = Array.from(container.querySelectorAll('h2'));
    const extracted = h2Els
      .map((el, i) => ({
        id: el.id || `guide-sec-${i}`,
        text: (el.textContent || '').trim(),
      }))
      .filter((h) => h.text.length > 0);
    setHeadings(extracted);
    setActiveHeadingId(extracted[0]?.id || '');

    if (extracted.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveHeadingId(visible[0].target.id);
        }
      },
      { rootMargin: '-12% 0px -75% 0px' }
    );
    h2Els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [processedBody, slug, lang]);

  // Lightweight scroll progress hairline
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const total = Math.max(1, doc.scrollHeight - window.innerHeight);
        setScrollProgress(Math.min(100, Math.round((window.scrollY / total) * 100)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slug]);

  useEffect(() => {
    if (!isZenMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZenMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZenMode]);

  const currentIdx = GUIDE_ITEMS.findIndex((g) => g.slug === guide.slug);
  const prevGuide = currentIdx > 0 ? GUIDE_ITEMS[currentIdx - 1] : null;
  const nextGuide =
    currentIdx >= 0 && currentIdx < GUIDE_ITEMS.length - 1
      ? GUIDE_ITEMS[currentIdx + 1]
      : null;

  const relatedGuides = useMemo(
    () => GUIDE_ITEMS.filter((g) => g.slug !== guide.slug).slice(0, 6),
    [guide.slug]
  );

  const handleCopyShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigateGuide = (e: React.MouseEvent<HTMLAnchorElement>, targetSlug: string) => {
    if (onSelectGuide && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      onSelectGuide(targetSlug);
    }
  };

  const fontSizeProseClass =
    fontScale === 'sm'
      ? 'text-[15px] sm:text-[16px]'
      : fontScale === 'lg'
        ? 'text-[18px] sm:text-[20px]'
        : 'text-[16px] sm:text-[17.5px]';

  const articleSurfaceClass = paperTone === 'chandan' ? 'bg-[#FAF6EE]' : 'bg-white';

  const renderArticleContent = () => (
    <>
      {/* Editorial Article Shell */}
      <div
        className={`rounded-[24px] ${articleSurfaceClass} p-5 sm:p-8 lg:p-10 shadow-[0_2px_16px_rgba(24,24,27,0.025)] transition-colors duration-200`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'वृन्दोपनिषद् ज्ञानकोश' : 'Sanctuary Guide'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-[#FAF8F4] text-neutral-600 text-xs font-serif">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {lang === 'hi'
                  ? `${formatDevanagariNumerals(wordEstimate)} मिनट पाठ`
                  : `${wordEstimate} min read`}
              </span>
            </span>
          </div>

          {/* Reading Comfort Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center p-0.5 rounded-full bg-[#FAF8F4] text-xs font-serif">
              {([
                { id: 'sm', label: 'अ' },
                { id: 'md', label: 'आ' },
                { id: 'lg', label: 'बड़ा' },
              ] as const).map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setFontScale(sz.id)}
                  className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    fontScale === sz.id
                      ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Text Size"
                >
                  {sz.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPaperTone((t) => (t === 'porcelain' ? 'chandan' : 'porcelain'))}
              className="px-3 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 transition-colors cursor-pointer"
              title="Paper Tone"
            >
              {paperTone === 'porcelain' ? 'चन्दन पत्र' : 'श्वेत पत्र'}
            </button>

            <button
              type="button"
              onClick={handleCopyShare}
              className="p-2 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-neutral-700 transition-colors cursor-pointer"
              aria-label="Share article link"
              title="लिंक कॉपी करें"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {!isZenMode && (
              <button
                type="button"
                onClick={() => setIsZenMode(true)}
                className="p-2 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-neutral-700 transition-colors cursor-pointer"
                aria-label="Distraction-free Zen Reading"
                title="एकाग्र पाठ (Zen Mode)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm sm:text-base text-neutral-600 font-serif mb-6 leading-relaxed rounded-[14px] bg-[#FAF8F4] p-4">
          {content.description}
        </p>

        <div
          id="topical-guide-body"
          className={`vrind-guide-prose max-w-none font-serif ${fontSizeProseClass}`}
          dangerouslySetInnerHTML={{ __html: processedBody }}
        />

        {/* Interactive Bilingual FAQ Accordion on /faq Page */}
        {guide.slug === 'faq' && (
          <div className="mt-8 space-y-3 pt-4">
            <h2 className="font-rozha text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
              {lang === 'hi' ? 'साधक जिज्ञासा एवं समाधान' : 'Seeker Questions & Answers'}
            </h2>
            {BILINGUAL_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={item.id} className="rounded-[14px] bg-[#FAF8F4] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 font-serif font-bold text-sm sm:text-base text-neutral-900 cursor-pointer"
                  >
                    <span>{lang === 'hi' ? item.questionHi : item.questionEn}</span>
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
                        {lang === 'hi' ? item.answerHi : item.answerEn}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Editorial Verification & Author Mandate Trust Card (Adapted from Sant-Vaani AuthorCard) */}
        <div className="mt-8 rounded-[16px] bg-[#FAF8F4] p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#FEF08A] text-[#78350F] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-serif font-bold text-sm text-neutral-900">
              {lang === 'hi'
                ? 'वृन्दोपनिषद् आचार्य एवं पाण्डुलिपि संपादक मण्डल'
                : 'Vrindopnishad Acharya & Editorial Preservation Mandate'}
            </div>
            <p className="text-xs font-serif text-neutral-600 leading-relaxed">
              {lang === 'hi'
                ? 'सभी शास्त्रीय उद्धरण, ब्रज रसिक वाणी सन्दर्भ और इतिहास पारम्परिक मुद्रित संस्करणों तथा वृन्दावन शोध संस्थान के आचार्यों के मार्गदर्शन से सत्यापित हैं।'
                : 'Verified against traditional archival editions, Rasik temple manuscripts, and established Braj Bhasha scholarship.'}
            </p>
          </div>
        </div>
      </div>

      {/* Sequential Guide Prev/Next Bar */}
      {(prevGuide || nextGuide) && !isZenMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {prevGuide ? (
            <a
              href={prevGuide.href}
              onClick={(e) => navigateGuide(e, prevGuide.slug)}
              className="rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(24,24,27,0.025)] hover:bg-[#FFFDF9] flex items-center gap-3 no-underline transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-serif text-neutral-400 block">पिछला लेख</span>
                <span className="text-sm font-serif font-bold text-neutral-900 truncate block">
                  {lang === 'hi' ? prevGuide.titleHi : prevGuide.titleEn}
                </span>
              </div>
            </a>
          ) : (
            <div />
          )}

          {nextGuide && (
            <a
              href={nextGuide.href}
              onClick={(e) => navigateGuide(e, nextGuide.slug)}
              className="rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(24,24,27,0.025)] hover:bg-[#FFFDF9] flex items-center justify-between gap-3 no-underline transition-colors text-right"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-serif text-neutral-400 block">अगला लेख</span>
                <span className="text-sm font-serif font-bold text-neutral-900 truncate block">
                  {lang === 'hi' ? nextGuide.titleHi : nextGuide.titleEn}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
            </a>
          )}
        </div>
      )}
    </>
  );

  // Distraction-Free Zen Mode Overlay
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FAF8F4] overflow-y-auto px-4 sm:px-8 py-6 modal-backdrop-enter">
        <div className="max-w-3xl mx-auto space-y-5 apple-view-enter">
          <div className="flex items-center justify-between gap-3 rounded-full bg-white px-4 py-2 shadow-[0_2px_12px_rgba(24,24,27,0.04)] sticky top-4 z-20">
            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सामान्य मोड' : 'Exit Zen'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'hi' ? 'en' : 'hi'))}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F4] text-xs font-serif font-bold text-amber-900 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>
          </div>
          {renderArticleContent()}
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 font-serif space-y-6">
      {/* Top Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[#D97706] transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Breadcrumb Bar & Language Toggle */}
      <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-serif">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-bold transition-colors no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'होम सैंक्चुअरी' : 'Home'}</span>
          </a>

          {onOpenKnowledgeBase && (
            <a
              href="/knowledge-base"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  onOpenKnowledgeBase();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-neutral-800 font-bold transition-colors no-underline"
            >
              <span>{lang === 'hi' ? 'ज्ञानकोश विकी' : 'Knowledge Base'}</span>
            </a>
          )}

          {catalogMeta && (
            <span className="hidden md:inline text-neutral-500">
              › {lang === 'hi' ? catalogMeta.titleHi : catalogMeta.titleEn}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setLang((l) => (l === 'hi' ? 'en' : 'hi'))}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</span>
        </button>
      </div>

      {/* Main 2-Column Reading Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">{renderArticleContent()}</div>

        {/* Sticky Table of Contents & Related Links Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {headings.length > 0 && (
            <nav
              aria-label="अनुक्रम (Table of Contents)"
              className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-900">
                <List className="w-4 h-4 text-amber-700" />
                <span>{lang === 'hi' ? 'विषय अनुक्रम (Contents)' : 'Table of Contents'}</span>
              </div>
              <ul className="space-y-1.5">
                {headings.map((h) => {
                  const isActive = activeHeadingId === h.id;
                  return (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`block px-3 py-2 rounded-[10px] text-xs font-serif leading-snug no-underline transition-colors ${
                          isActive
                            ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                            : 'text-neutral-600 hover:bg-[#FAF8F4] hover:text-neutral-900'
                        }`}
                      >
                        {h.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Other Guides */}
          <section className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{lang === 'hi' ? 'अन्य प्रमुख मार्गदर्शिकाएँ' : 'Explore More Guides'}</span>
            </div>
            <div className="space-y-2">
              {relatedGuides.map((rel) => (
                <a
                  key={rel.slug}
                  href={rel.href}
                  onClick={(e) => navigateGuide(e, rel.slug)}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-[12px] bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-neutral-800 no-underline transition-colors"
                >
                  <span className="truncate">{lang === 'hi' ? rel.titleHi : rel.titleEn}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
};

export default TopicalGuideView;
