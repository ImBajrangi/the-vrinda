import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  MapPin,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Scroll,
  Compass,
  X,
  Share2,
  Check,
  BookOpen
} from 'lucide-react';
import {
  SacredBiography,
  SacredBiographyPreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { seo } from '../../services/seoService';
import { chimeService } from '../../services/chimeService';

interface CharitraDarshanProps {
  initialSaintSlug?: string;
  onSelectSaint?: (slug: string) => void;
  onNavigateToPadavali?: (saintName?: string) => void;
}

export const CharitraDarshan: React.FC<CharitraDarshanProps> = ({
  initialSaintSlug,
  onSelectSaint,
  onNavigateToPadavali,
}) => {
  const [bios, setBios] = useState<SacredBiographyPreview[]>([]);
  const [selectedBio, setSelectedBio] = useState<SacredBiography | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTradition, setSelectedTradition] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Load directory previews
  useEffect(() => {
    let isMounted = true;
    SacredSectionService.getBiographiesIndex()
      .then((items) => {
        if (isMounted) {
          setBios(items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const loadBiography = useCallback(async (slugOrId: string) => {
    const bio = await SacredSectionService.getBiographyById(slugOrId);
    if (bio) {
      setSelectedBio(bio);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      chimeService.playChime('temple-bell');
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialSaintSlug) {
      loadBiography(initialSaintSlug);
    }
  }, [initialSaintSlug, loadBiography]);

  // Synchronize SEO metadata dynamically
  useEffect(() => {
    if (selectedBio) {
      seo.updateSEO({
        tab: 'biographies',
        title: `${selectedBio.nameDevanagari} (${selectedBio.tradition}) • पावन जीवन चरित्र, गुरु परंपरा व साहित्य | वृन्दोपनिषद् 2.0`,
        description: `${selectedBio.nameDevanagari} का पावन जीवन चरित, ${selectedBio.lineage?.sampradaya || selectedBio.tradition} परम्परा, रचित ग्रन्थ एवं समाधि स्थल दर्शन। ${selectedBio.lifeSummary}`,
      });
    } else {
      seo.updateSEO({
        tab: 'biographies',
        title: 'सनातन संत एवं रसिक आचार्य चरित्र दर्शन • जीवन वृत्त, गुरु परंपरा व साहित्य | वृन्दोपनिषद् 2.0',
        description: 'ब्रज रसिक आचार्यों, वारकरी सन्तों और सनातन ऋषि-मुनियों का दिव्य जीवन चरित्र, गुरु परम्परा, साहित्य साधना और पावन समाधि स्थल दर्शन।',
      });
    }
  }, [selectedBio]);

  const handleSelect = (slug: string) => {
    loadBiography(slug);
    if (onSelectSaint) {
      onSelectSaint(slug);
    }
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'biographies');
        url.searchParams.set('saint', slug);
        window.history.pushState({}, '', url.toString());
      } catch {}
    }
  };

  const handleBackToDirectory = () => {
    setSelectedBio(null);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('saint');
        window.history.pushState({}, '', url.toString());
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredBios = useMemo(() => {
    return bios.filter((b) => {
      const matchesTradition =
        selectedTradition === 'all' ||
        b.tradition.toLowerCase().includes(selectedTradition.toLowerCase());
      const matchesSearch =
        searchQuery.trim() === '' ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.nameDevanagari.includes(searchQuery) ||
        b.lifeSummary.includes(searchQuery) ||
        b.samadhiPlace.includes(searchQuery) ||
        b.tags.some((t) => t.includes(searchQuery));
      return matchesTradition && matchesSearch;
    });
  }, [bios, selectedTradition, searchQuery]);

  const traditionOptions = [
    { id: 'all', label: 'समस्त संत' },
    { id: 'हरिदासी', label: 'हरिदासी / सखी भाव' },
    { id: 'राधावल्लभ', label: 'श्री राधावल्लभ' },
    { id: 'वारकरी', label: 'वारकरी परंपरा' },
    { id: 'गौड़ीय', label: 'गौड़ीय वैष्णव' },
  ];

  // ==========================================
  // VIEW: Single Saint Biography Detail
  // ==========================================
  if (selectedBio) {
    return (
      <main
        role="main"
        aria-label={`${selectedBio.nameDevanagari} पावन जीवन चरित्र`}
        className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
      >
        {/* Top Navigation & Action Bar */}
        {/* Outer: rounded-[28px] p-4 -> Inner: rounded-[12px] (28 - 16 = 12) */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-4 shadow-2xs mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToDirectory}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-amber-300 active:bg-amber-300/90 rounded-[12px] transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>संत निर्देशिका</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-[#78350F] rounded-[12px] text-xs font-serif font-bold">
              {selectedBio.tradition}
            </span>
            <button
              type="button"
              onClick={handleShare}
              aria-label="शेयर लिंक कॉपी करें"
              className="p-2 rounded-[12px] bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Card */}
        {/* Outer: rounded-[28px] p-6 sm:p-8 -> Inner: rounded-[4px] (28 - 24 = 4) */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Saint Icon / Glyph Avatar Frame */}
            {/* Outer: rounded-[24px] p-3 -> Inner: rounded-[12px] (24 - 12 = 12) */}
            <div className="w-24 h-24 rounded-[24px] bg-[#FEF08A] p-3 shadow-2xs shrink-0 flex items-center justify-center border border-amber-300">
              <div className="w-full h-full rounded-[12px] bg-amber-200/60 flex items-center justify-center text-[#78350F] font-rozha font-bold text-3xl select-none">
                {selectedBio.nameDevanagari.charAt(0)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {selectedBio.titleHonorific && (
                  <span className="px-2.5 py-0.5 text-xs font-serif font-bold rounded-[6px] bg-[#FEF08A] text-[#78350F] border border-amber-300/40">
                    {selectedBio.titleHonorific}
                  </span>
                )}
                <span className="px-2.5 py-0.5 text-xs font-sans font-medium rounded-[6px] bg-stone-100 text-stone-600">
                  {selectedBio.period}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-serif font-semibold rounded-[6px] bg-amber-50 text-amber-800 border border-amber-200/60">
                  {selectedBio.samadhiLocation.dhamOrRegion}
                </span>
              </div>

              <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] leading-tight mt-1">
                {selectedBio.nameDevanagari}
              </h1>

              <div className="text-xs sm:text-sm font-sans text-neutral-500 mt-1">
                {selectedBio.name}
              </div>

              <div className="mt-4 p-4 rounded-[12px] bg-[#FAF6EE] border-l-4 border-amber-500">
                <p className="text-xs sm:text-sm text-neutral-800 font-serif italic leading-relaxed">
                  "{selectedBio.lifeSummary}"
                </p>
              </div>

              {/* Action Button: Navigate to Saint's Padavali / Vani */}
              {onNavigateToPadavali && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToPadavali(selectedBio.nameDevanagari)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] font-serif font-bold text-xs transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>संत के पद व वाणी पढ़ें</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid: Lineage Card & Samadhi Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Lineage Card (सम्प्रदाय एवं गुरु परम्परा) */}
          {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
          <section aria-label="सम्प्रदाय एवं गुरु परम्परा" className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-4 pb-2 border-b border-neutral-100">
              <Compass className="w-4 h-4 text-[#B45309]" />
              <span>सम्प्रदाय एवं गुरु परम्परा</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-serif">
              <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                <span className="text-neutral-500">सम्प्रदाय</span>
                <span className="font-bold text-[#18181B] text-right">
                  {selectedBio.lineage.sampradaya}
                </span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                <span className="text-neutral-500">दीक्षा गुरु</span>
                <span className="font-bold text-[#78350F] text-right">
                  {selectedBio.lineage.guru}
                </span>
              </div>

              {selectedBio.birthPlace && (
                <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                  <span className="text-neutral-500">प्राकट्य स्थल</span>
                  <span className="text-neutral-800 text-right">
                    {selectedBio.birthPlace}
                  </span>
                </div>
              )}

              {selectedBio.lineage.seatOrPeetham && (
                <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                  <span className="text-neutral-500">प्रधान पीठ / स्थली</span>
                  <span className="text-neutral-800 text-right font-medium">
                    {selectedBio.lineage.seatOrPeetham}
                  </span>
                </div>
              )}

              {selectedBio.lineage.prominentDisciples && selectedBio.lineage.prominentDisciples.length > 0 && (
                <div className="pt-2">
                  <span className="text-neutral-500 text-xs block mb-1.5">प्रमुख शिष्य मण्डल</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBio.lineage.prominentDisciples.map((disc, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 text-xs rounded-[6px] bg-stone-100 text-stone-700 font-sans"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Samadhi Location Card */}
          {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
          <section aria-label="पावन समाधि एवं धाम दर्शन" className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-4 pb-2 border-b border-neutral-100">
              <MapPin className="w-4 h-4 text-[#B45309]" />
              <span>पावन समाधि एवं धाम दर्शन</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-serif">
              <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                <span className="text-neutral-500">समाधि स्थान</span>
                <span className="font-bold text-[#18181B] text-right">
                  {selectedBio.samadhiLocation.place}
                </span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-stone-100">
                <span className="text-neutral-500">धाम क्षेत्र</span>
                <span className="font-bold text-[#78350F] text-right">
                  {selectedBio.samadhiLocation.dhamOrRegion}
                </span>
              </div>

              {selectedBio.samadhiLocation.darshanSignificance && (
                <div className="pt-2">
                  <span className="text-neutral-500 text-xs block mb-1.5">दर्शन महात्म्य</span>
                  {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
                  <div className="rounded-[8px] bg-[#FAF6EE] border border-amber-200/60 p-3 text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif">
                    {selectedBio.samadhiLocation.darshanSignificance}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Section 3: Literary Works (अमर ग्रन्थ एवं साहित्य) */}
        {selectedBio.literaryWorks && selectedBio.literaryWorks.length > 0 && (
          <section aria-label="रचित ग्रन्थ एवं अमर साहित्य" className="mb-8">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-4">
              <Scroll className="w-5 h-5 text-[#B45309]" />
              <span>रचित ग्रन्थ एवं अमर साहित्य ({formatDevanagariNumerals(selectedBio.literaryWorks.length)})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedBio.literaryWorks.map((work, idx) => (
                /* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */
                <div
                  key={idx}
                  className="rounded-[24px] bg-white border border-neutral-200/80 p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-serif font-bold text-base text-[#18181B]">
                        {work.titleDevanagari || work.title}
                      </span>
                      {work.language && (
                        <span className="px-2 py-0.5 text-[11px] font-sans font-medium rounded-[6px] bg-stone-100 text-stone-600">
                          {work.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 font-serif leading-relaxed">
                      {work.description}
                    </p>
                  </div>

                  {work.versesCount && (
                    <div className="mt-3 pt-2 border-t border-neutral-100 text-xs text-[#78350F] font-serif font-semibold">
                      {formatDevanagariNumerals(work.versesCount)} पद / श्लोक
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Key Leelas (दिव्य चरित्र एवं लीलाएं) */}
        {selectedBio.keyLeelas && selectedBio.keyLeelas.length > 0 && (
          <section aria-label="पावन लीलाएं एवं चरित्र प्रसंग" className="mb-8">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-4">
              <Sparkles className="w-5 h-5 text-[#B45309]" />
              <span>पावन लीलाएं एवं चरित्र प्रसंग</span>
            </div>

            <div className="space-y-4">
              {selectedBio.keyLeelas.map((leela, idx) => (
                /* Outer: rounded-[24px] p-5 -> Inner: rounded-[4px] (24 - 20 = 4) */
                <div
                  key={idx}
                  className="rounded-[24px] bg-white border border-neutral-200/80 p-5 shadow-2xs"
                >
                  <h2 className="font-serif font-bold text-base text-[#18181B] mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-[4px] bg-[#FEF08A] text-[#78350F] text-xs flex items-center justify-center font-bold">
                      {formatDevanagariNumerals(idx + 1)}
                    </span>
                    <span>{leela.title}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 font-serif leading-relaxed">
                    {leela.description}
                  </p>
                  {leela.shiksha && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 text-xs text-[#78350F] font-serif font-medium">
                      <span className="font-bold">शिक्षा:</span> {leela.shiksha}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  // ==========================================
  // VIEW: Directory List of Saints
  // ==========================================
  return (
    <main
      role="main"
      aria-label="सनातन संत एवं रसिक आचार्य चरित्र दर्शन"
      className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
    >
      {/* Directory Hero Deck */}
      {/* Outer: rounded-[28px] p-6 sm:p-7 -> Inner: rounded-[8px] (28 - 20 = 8) */}
      <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-7 shadow-2xs mb-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>॥ चरित्र दर्शन निर्देशिका ॥</span>
          </div>
          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
            सनातन संत एवं रसिक आचार्य
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-serif mt-1.5 leading-relaxed">
            ब्रज रसिक आचार्यों, वारकरी सन्तों और ऋषि-मुनियों का दिव्य जीवन चरित्र, गुरु परम्परा, साहित्य साधना और समाधि स्थल दर्शन।
          </p>
        </div>

        {/* Search & Tradition Filter Bar */}
        {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
        <div
          role="search"
          aria-label="संत चरित्र खोजें"
          className="mt-5 rounded-[20px] bg-[#FAF6EE] border border-amber-200/70 p-3 shadow-2xs space-y-3"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सन्त का नाम, सम्प्रदाय, तीर्थ या रचना खोजें..."
              aria-label="सन्त खोजें"
              className="w-full pl-10 pr-9 py-2.5 text-[16px] sm:text-sm bg-white border border-neutral-200 rounded-[8px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-[#18181B] placeholder-neutral-400 font-serif"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="खोज साफ़ करें"
                className="absolute right-3 text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-2 border-t border-amber-900/10">
            <div className="flex items-center gap-1.5">
              {traditionOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTradition(opt.id)}
                  className={`px-3 py-1.5 text-xs font-serif font-semibold whitespace-nowrap rounded-[8px] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selectedTradition === opt.id
                      ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-serif text-neutral-500 shrink-0 font-medium hidden sm:block">
              {formatDevanagariNumerals(filteredBios.length)} संत उपलब्ध
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredBios.length === 0 ? (
        /* Outer: rounded-[28px] p-8 -> Inner: rounded-[8px] (28 - 20 = 8) */
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-8 text-center space-y-2">
          <Users className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई संत चरित्र नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-serif">
            कृपया अन्य नाम या सम्प्रदाय से खोजें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredBios.map((saint) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <article
              key={saint.id}
              className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-[10.5px] font-serif font-bold rounded-[6px] bg-[#FEF08A] text-[#78350F]">
                    {saint.tradition}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-sans font-medium">
                    {saint.period}
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
                  <div className="w-12 h-12 rounded-[8px] bg-[#FEF08A] shrink-0 flex items-center justify-center border border-amber-300/40">
                    <span className="font-rozha font-bold text-[#78350F] text-lg select-none">
                      {saint.nameDevanagari.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2
                      onClick={() => handleSelect(saint.slug || saint.id)}
                      className="font-rozha text-base sm:text-lg font-bold text-[#18181B] hover:text-[#B45309] cursor-pointer transition-colors leading-snug truncate"
                    >
                      {saint.nameDevanagari}
                    </h2>
                    <div className="text-[11px] text-neutral-400 font-sans truncate">
                      {saint.name}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 font-serif line-clamp-3 leading-relaxed mb-4">
                  {saint.lifeSummary}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-serif min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">{saint.samadhiPlace}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(saint.slug || saint.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] transition-colors shadow-2xs shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span>दर्शन</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
