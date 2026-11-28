import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Sparkles,
  Quote,
  User,
  Link2,
  Globe,
  ChevronRight,
  BookMarked,
  X,
} from 'lucide-react';
import { SectionBotCompanion } from '../common/SectionBotCompanion';
import brajGlossaryRaw from '../../data/brajGlossary.json';
import { BRAJ_DICTIONARY } from '../../data/brajDictionary';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { resetScrollToTop } from '../../utils/scrollTop';

export interface GlossaryEntry {
  id: string;
  term: string;
  termEn?: string;
  transliteration: string;
  category?: string;
  meaningDevanagari: string;
  definitionEn?: string;
  etymology?: string;
  context?: string;
  theologicalContextHi?: string;
  theologicalContextEn?: string;
  references?: string;
  relatedSaints?: { name: string; slug: string }[];
  relatedGranthas?: { name: string; slug: string }[];
}

const GLOSSARY_LIST = brajGlossaryRaw as GlossaryEntry[];

export interface GlossaryViewProps {
  initialTermSlug?: string;
  onSelectTerm?: (slug: string | null) => void;
  onNavigateHome?: () => void;
  onOpenKnowledgeBase?: () => void;
  onNavigateSaint?: (slug: string) => void;
  onNavigateGrantha?: (slug: string) => void;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({
  initialTermSlug,
  onSelectTerm,
  onNavigateHome,
  onOpenKnowledgeBase,
  onNavigateSaint,
  onNavigateGrantha,
}) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialTermSlug || null);
  const [activeMode, setActiveMode] = useState<'concepts' | 'words'>('concepts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  React.useEffect(() => {
    setActiveSlug(initialTermSlug || null);
  }, [initialTermSlug]);

  const activeTerm = useMemo(
    () => (activeSlug ? GLOSSARY_LIST.find((g) => g.id === activeSlug) || null : null),
    [activeSlug]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    GLOSSARY_LIST.forEach((g) => {
      if (g.category) cats.add(g.category);
    });
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOSSARY_LIST.filter((g) => {
      const catMatch = selectedCategory === 'All' || (g.category || 'Theology') === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        g.term.toLowerCase().includes(q) ||
        (g.termEn || '').toLowerCase().includes(q) ||
        g.transliteration.toLowerCase().includes(q) ||
        g.meaningDevanagari.toLowerCase().includes(q) ||
        (g.definitionEn || '').toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const filteredWordBank = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.values(BRAJ_DICTIONARY).filter((w) => {
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.translit.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const isFirstGlossaryRender = useRef(true);
  useEffect(() => {
    if (isFirstGlossaryRender.current) {
      isFirstGlossaryRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [activeSlug]);

  const handleOpenTerm = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(slug);
    onSelectTerm?.(slug);
    resetScrollToTop();
  };

  const handleBackToIndex = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setActiveSlug(null);
    onSelectTerm?.(null);
    resetScrollToTop();
  };

  // ---------------------------------------------------------------------------
  // Detail View: Specific Glossary Concept Encyclopedia Page
  // ---------------------------------------------------------------------------
  if (activeTerm) {
    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
        {/* Top Bar & Breadcrumbs */}
        <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-serif text-neutral-500">
            <a
              href="/glossary"
              onClick={handleBackToIndex}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-bold no-underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'ब्रज शब्दकोश' : 'All Glossary Terms'}</span>
            </a>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline font-medium text-neutral-800">{activeTerm.term}</span>
          </div>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-amber-900 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</span>
          </button>
        </div>

        {/* Hero Card */}
        <header className="rounded-[24px] bg-white p-6 sm:p-8 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-[10px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold">
              {activeTerm.category || 'Braj Ras Philosophy'}
            </span>
            <span className="px-3 py-1 rounded-[10px] bg-[#FAF8F4] text-neutral-600 text-xs font-mono">
              {activeTerm.transliteration}
            </span>
          </div>

          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-neutral-900 leading-tight">
            {activeTerm.term}
            {activeTerm.termEn && activeTerm.termEn !== activeTerm.term && (
              <span className="block sm:inline sm:ml-3 font-serif font-medium text-lg sm:text-xl text-amber-800">
                ({activeTerm.termEn})
              </span>
            )}
          </h1>

          <div className="rounded-[14px] bg-[#FAF8F4] p-4 sm:p-5 text-neutral-800 font-serif text-sm sm:text-base leading-relaxed">
            {lang === 'hi' || !activeTerm.definitionEn
              ? activeTerm.meaningDevanagari
              : activeTerm.definitionEn}
          </div>
        </header>

        {/* Two-Column Theological Deep Dive + Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-5">
            <section className="rounded-[24px] bg-white p-6 sm:p-8 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-rozha text-lg sm:text-xl">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h2>
                  {lang === 'hi'
                    ? 'विस्तृत दार्शनिक एवं तात्त्विक विवेचन'
                    : 'Theological Context & Devotional Meaning'}
                </h2>
              </div>
              <p className="font-serif text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
                {lang === 'hi'
                  ? activeTerm.theologicalContextHi || activeTerm.meaningDevanagari
                  : activeTerm.theologicalContextEn ||
                    activeTerm.definitionEn ||
                    activeTerm.meaningDevanagari}
              </p>
            </section>

            {(activeTerm.context || activeTerm.references) && (
              <section className="rounded-[24px] bg-[#FAF8F4] p-6 shadow-[0_2px_12px_rgba(24,24,27,0.025)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-900">
                  <Quote className="w-4 h-4 text-amber-700" />
                  <span>{lang === 'hi' ? 'शास्त्र प्रमाण व वाणी सन्दर्भ' : 'Scriptural References'}</span>
                </div>
                <p className="font-serif text-sm sm:text-base text-neutral-800 italic leading-relaxed">
                  {activeTerm.references || activeTerm.context}
                </p>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-5">
            {activeTerm.etymology && (
              <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-900">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>{lang === 'hi' ? 'व्युत्पत्ति एवं शब्द मूल' : 'Sanskrit Etymology'}</span>
                </div>
                <p className="font-serif text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {activeTerm.etymology}
                </p>
              </div>
            )}

            {(activeTerm.relatedSaints?.length || activeTerm.relatedGranthas?.length) ? (
              <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-4">
                <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-900">
                  <Link2 className="w-4 h-4 text-amber-700" />
                  <span>{lang === 'hi' ? 'सम्बद्ध रसिक सन्त व ग्रन्थ' : 'Connected Saints & Texts'}</span>
                </div>

                {activeTerm.relatedSaints && activeTerm.relatedSaints.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-serif text-neutral-500 block">
                      {lang === 'hi' ? 'रसिक आचार्य' : 'Saints'}
                    </span>
                    <div className="space-y-1.5">
                      {activeTerm.relatedSaints.map((s) => (
                        <a
                          key={s.slug}
                          href={`/sant/${encodeURIComponent(s.slug)}`}
                          onClick={(e) => {
                            if (onNavigateSaint && !e.metaKey && !e.ctrlKey) {
                              e.preventDefault();
                              onNavigateSaint(s.slug);
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-neutral-800 no-underline transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-amber-700" />
                            {s.name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeTerm.relatedGranthas && activeTerm.relatedGranthas.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-serif text-neutral-500 block">
                      {lang === 'hi' ? 'सम्बद्ध ग्रन्थ' : 'Scriptures'}
                    </span>
                    <div className="space-y-1.5">
                      {activeTerm.relatedGranthas.map((g) => (
                        <a
                          key={g.slug}
                          href={`/grantha/${encodeURIComponent(g.slug)}`}
                          onClick={(e) => {
                            if (onNavigateGrantha && !e.metaKey && !e.ctrlKey) {
                              e.preventDefault();
                              onNavigateGrantha(g.slug);
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-neutral-800 no-underline transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                            {g.name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </aside>
        </div>

        {/* Explore Other Glossary Terms */}
        <section className="rounded-[24px] bg-white p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-4">
          <h2 className="font-rozha text-lg font-bold text-neutral-900">
            {lang === 'hi' ? 'अन्य पारिभाषिक शब्द' : 'Other Theological Terms'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GLOSSARY_LIST.filter((g) => g.id !== activeTerm.id)
              .slice(0, 6)
              .map((g) => (
                <a
                  key={g.id}
                  href={`/glossary/${encodeURIComponent(g.id)}`}
                  onClick={(e) => handleOpenTerm(e, g.id)}
                  className="p-3.5 rounded-[14px] bg-[#FAF8F4] hover:bg-[#F5EFE3] transition-colors no-underline block"
                >
                  <div className="font-serif font-bold text-sm text-neutral-900">{g.term}</div>
                  <div className="text-[11px] font-mono text-amber-800 mt-0.5">{g.transliteration}</div>
                </a>
              ))}
          </div>
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Directory View: Glossary & Braj Word-Bank Dictionary
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-20 space-y-6">
      <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-[0_2px_14px_rgba(24,24,27,0.025)] space-y-5">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-serif font-bold transition-colors no-underline"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F4] hover:bg-[#F5EFE3] text-xs font-serif font-bold text-neutral-800 transition-colors no-underline"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
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

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800">
              <BookMarked className="w-3.5 h-3.5" />
              <span>
                ब्रज रस पारिभाषिक शब्दकोश • {formatDevanagariNumerals(GLOSSARY_LIST.length)} सिद्धांत एवं{' '}
                {formatDevanagariNumerals(Object.keys(BRAJ_DICTIONARY).length)}+ ब्रज शब्द
              </span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-neutral-900">
              {lang === 'hi' ? 'श्री वृन्दावाणि एवं ब्रजभाषा शब्दकोश' : 'Vrindavan Devotional Glossary & Braj Dictionary'}
            </h1>
            <p className="text-xs sm:text-sm font-serif text-neutral-600 max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'रसिक साहित्य, नित्य निकुंज उपासना और मध्यकालीन ब्रजभाषा पदों में प्रयुक्त होने वाले गूढ़ पारिभाषिक एवं काव्यात्मक शब्दों का प्रामाणिक कोष।'
                : 'Authoritative spiritual encyclopedia of Rasik theology and an instant lookup dictionary for poetic Braj Bhasha vocabulary.'}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'शब्द या अर्थ खोजें...' : 'Search term, Devanagari or meaning...'}
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-[#FAF8F4] text-[16px] sm:text-sm font-serif text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F5B432]/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher + Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center p-1 rounded-[14px] bg-[#FAF8F4] gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('concepts')}
              className={`px-4 py-1.5 rounded-[10px] text-xs font-serif font-bold transition-colors cursor-pointer ${
                activeMode === 'concepts' ? 'bg-[#FEF08A] text-[#78350F]' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              तात्त्विक शब्दकोश ({formatDevanagariNumerals(GLOSSARY_LIST.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('words')}
              className={`px-4 py-1.5 rounded-[10px] text-xs font-serif font-bold transition-colors cursor-pointer ${
                activeMode === 'words' ? 'bg-[#FEF08A] text-[#78350F]' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              ब्रज पद शब्दार्थ ({formatDevanagariNumerals(Object.keys(BRAJ_DICTIONARY).length)}+)
            </button>
          </div>

          {activeMode === 'concepts' && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-serif font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1C140D] text-[#FEF08A]'
                      : 'bg-[#FAF8F4] text-neutral-600 hover:bg-[#F5EFE3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeMode === 'concepts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTerms.map((term) => (
            <a
              key={term.id}
              href={`/glossary/${encodeURIComponent(term.id)}`}
              onClick={(e) => handleOpenTerm(e, term.id)}
              className="rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_14px_rgba(24,24,27,0.025)] hover:bg-[#FFFDF9] transition-colors flex flex-col justify-between gap-4 no-underline group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-[8px] bg-[#FAF8F4] text-[11px] font-serif font-bold text-amber-900">
                    {term.category || 'Theology'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[140px]">
                    {term.transliteration}
                  </span>
                </div>

                <h2 className="font-rozha text-xl font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
                  {term.term}
                </h2>
                {term.termEn && (
                  <div className="text-xs font-sans font-medium text-neutral-500">{term.termEn}</div>
                )}

                <p className="text-xs sm:text-sm font-serif text-neutral-700 leading-relaxed line-clamp-3">
                  {lang === 'en' && term.definitionEn ? term.definitionEn : term.meaningDevanagari}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-serif text-neutral-400 truncate max-w-[180px]">
                  {term.references || term.context}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold shrink-0">
                  <span>{lang === 'hi' ? 'विवरण' : 'Explore'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWordBank.map((w) => (
            <div
              key={w.word}
              className="rounded-[20px] bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(24,24,27,0.025)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-rozha text-xl font-bold text-neutral-900">{w.word}</span>
                <span className="px-2.5 py-0.5 rounded-[8px] bg-[#FEF08A] text-[#78350F] text-[10px] font-serif font-bold">
                  {w.category}
                </span>
              </div>
              <div className="text-xs font-mono text-amber-800">{w.translit}</div>
              <p className="text-xs sm:text-sm font-serif text-neutral-800 leading-relaxed">{w.meaning}</p>
              <p className="text-[11px] font-sans text-neutral-500 italic">{w.english}</p>
            </div>
          ))}
        </div>
      )}

      <SectionBotCompanion
        agentId="sita"
        heading="Sita • Braj Vocabulary & Siddhanta"
        subtitle="Ask Sita to explain Nikunj, Keli Vilas, Rasopasana, or any archaic Braj word"
        quickPrompts={['Explain Nitya Nikunj & Keli Vilas', 'What does Sahachari Bhava mean?']}
      />
    </div>
  );
};

export default GlossaryView;
