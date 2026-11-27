import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  CalendarHeart,
  BookMarked,
  Award,
  Heart,
  MapPin,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import {
  KNOWLEDGE_CATALOG,
  KNOWLEDGE_CATEGORIES,
  KnowledgeCatalogItem,
  KnowledgeCategoryId,
} from '../../data/knowledgeCatalog';
import { formatDevanagariNumerals } from '../../services/cacheService';

export interface KnowledgeBaseHubViewProps {
  onNavigateHome?: () => void;
  onSelectGuide?: (slug: string) => void;
  onOpenGlossary?: () => void;
  onOpenFestivals?: () => void;
}

export const KnowledgeBaseHubView: React.FC<KnowledgeBaseHubViewProps> = ({
  onNavigateHome,
  onSelectGuide,
  onOpenGlossary,
  onOpenFestivals,
}) => {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategoryId>('all');

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return KNOWLEDGE_CATALOG.filter((art) => {
      const matchesCat = activeCategory === 'all' || art.category === activeCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        art.titleHi.toLowerCase().includes(q) ||
        art.titleEn.toLowerCase().includes(q) ||
        art.descHi.toLowerCase().includes(q) ||
        art.descEn.toLowerCase().includes(q) ||
        art.slug.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  const handleCardNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: KnowledgeCatalogItem
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (item.href === '/glossary' && onOpenGlossary) {
      e.preventDefault();
      onOpenGlossary();
    } else if (item.href.startsWith('/festivals') && onOpenFestivals && !item.isGuide) {
      e.preventDefault();
      // Pass full href or navigate smoothly via popstate/callback
      window.history.pushState({}, '', item.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else if (item.isGuide && onSelectGuide) {
      e.preventDefault();
      onSelectGuide(item.slug);
    }
  };

  const renderCategoryIcon = (cat: KnowledgeCatalogItem['category']) => {
    switch (cat) {
      case 'philosophy':
        return <Award className="w-4 h-4 text-amber-700" />;
      case 'traditions':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'concepts':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'guides':
        return <MapPin className="w-4 h-4 text-emerald-700" />;
      case 'festivals':
        return <CalendarHeart className="w-4 h-4 text-amber-700" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getCategoryLabel = (catId: KnowledgeCatalogItem['category']) => {
    const found = KNOWLEDGE_CATEGORIES.find((c) => c.id === catId);
    return lang === 'hi' ? found?.labelHi : found?.labelEn;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
      {/* Unified Borderless Sanctuary Header */}
      <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-serif font-bold transition-colors no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'होम सैंक्चुअरी' : 'Home Sanctuary'}</span>
          </a>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenGlossary && (
              <a
                href="/glossary"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onOpenGlossary();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 transition-colors no-underline"
              >
                <BookMarked className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'hi' ? 'ब्रज शब्दकोश' : 'Braj Glossary'}</span>
              </a>
            )}
            {onOpenFestivals && (
              <a
                href="/festivals"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onOpenFestivals();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 transition-colors no-underline"
              >
                <CalendarHeart className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'hi' ? 'ब्रज महोत्सव' : 'Sacred Festivals'}</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C140D] text-[#FEF08A] text-xs font-serif font-bold transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi'
                  ? `सनातन ज्ञानकोश एवं रसिक विकी • ${formatDevanagariNumerals(KNOWLEDGE_CATALOG.length)} प्रामाणिक मार्गदर्शिकाएँ`
                  : `Sanctuary Knowledge Base • ${KNOWLEDGE_CATALOG.length} Curated Guides`}
              </span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-neutral-900">
              {lang === 'hi' ? 'वृन्दोपनिषद् ज्ञानकोश व साधक निर्देशिका' : 'Vrindopnishad Vedic & Rasik Wiki'}
            </h1>
            <p className="text-xs sm:text-sm font-serif text-neutral-600 max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'रसिक सम्प्रदायों का इतिहास, अचिन्त्य भेदाभेद दर्शन, नित्य विहार, परिक्रमा मार्ग, उत्सव एवं आध्यात्मिक शब्दावली का सम्पूर्ण अध्ययन केन्द्र।'
                : 'Deep philosophical treatises, Braj lineages, festival heritage, temple parikrama routes, and Braj terminology crafted for contemplative study.'}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'दर्शन, संत या मार्गदर्शिका खोजें...' : 'Search guides, philosophy, festivals...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF8F4] text-sm font-serif text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F5B432]/60"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-serif font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FEF08A] text-[#78350F]'
                    : 'bg-[#FAF8F4] text-neutral-700 hover:bg-[#F5EFE3]'
                }`}
              >
                {lang === 'hi' ? cat.labelHi : cat.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-[24px] bg-white p-12 text-center shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-2">
          <BookOpen className="w-10 h-10 text-amber-300 mx-auto" />
          <p className="font-serif font-bold text-neutral-700">
            {lang === 'hi' ? 'खोज के अनुसार कोई लेख नहीं मिला।' : 'No knowledge articles matched your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((item) => (
            <a
              key={item.slug}
              href={item.href}
              onClick={(e) => handleCardNavigation(e, item)}
              className="rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] hover:bg-[#FFFDF9] transition-colors flex flex-col justify-between gap-4 no-underline group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#FAF8F4] text-[11px] font-serif font-bold text-amber-900">
                    {renderCategoryIcon(item.category)}
                    <span>{getCategoryLabel(item.category)}</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">{item.readTime}</span>
                </div>

                <h2 className="font-rozha text-lg sm:text-xl font-bold text-neutral-900 group-hover:text-amber-800 transition-colors leading-snug">
                  {lang === 'hi' ? item.titleHi : item.titleEn}
                </h2>

                <p className="text-xs sm:text-sm font-serif text-neutral-600 leading-relaxed line-clamp-3">
                  {lang === 'hi' ? item.descHi : item.descEn}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-serif text-neutral-400">
                  {lang === 'hi' ? item.titleEn : item.titleHi}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold shrink-0">
                  <span>{lang === 'hi' ? 'पढ़ें' : 'Read'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseHubView;
