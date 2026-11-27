import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { getSaintPortrait, getArtworkObjectPosition } from '../../services/devotionalVisuals';
import {
  SacredBiography,
  SacredBiographyPreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { seo } from '../../services/seoService';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';
import { resetScrollToTop } from '../../utils/scrollTop';

interface CharitraDarshanProps {
  initialSaintSlug?: string;
  initialBio?: SacredBiography | null;
  onSelectSaint?: (slug: string) => void;
  onNavigateToPadavali?: (saintName?: string) => void;
}

export const CharitraDarshan: React.FC<CharitraDarshanProps> = ({
  initialSaintSlug,
  initialBio = null,
  onSelectSaint,
  onNavigateToPadavali,
}) => {
  const [bios, setBios] = useState<SacredBiographyPreview[]>([]);
  const [selectedBio, setSelectedBio] = useState<SacredBiography | null>(() => initialBio || null);
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
      resetScrollToTop();
    }
  }, []);

  const isFirstBioRender = useRef(true);
  useEffect(() => {
    if (isFirstBioRender.current) {
      isFirstBioRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [selectedBio?.id]);

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
        window.history.pushState({}, '', `/bio/${encodeURIComponent(slug)}`);
      } catch {}
    }
  };

  const handleBackToDirectory = () => {
    setSelectedBio(null);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/biographies');
      } catch {}
    }
    resetScrollToTop();
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = selectedBio
        ? `${window.location.origin}/bio/${encodeURIComponent(selectedBio.slug || selectedBio.id)}`
        : window.location.href;
      navigator.clipboard?.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredBios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bios.filter((b) => {
      const trad = (b.tradition || '').normalize('NFC');
      const matchesTradition =
        selectedTradition === 'all' ||
        (selectedTradition === 'braj' &&
          (trad.includes('राधावल्लभ') || trad.includes('हरिदास'))) ||
        (selectedTradition === 'vaishnava' &&
          (trad.includes('वैष्णव') || trad.includes('पुष्टिमार्ग') || trad.includes('निम्बार्क') || trad.includes('गौड़ीय') || trad.includes('श्री संप्रदाय'))) ||
        (selectedTradition === 'varkari' &&
          (trad.includes('वारकरी') || trad.includes('समर्थ'))) ||
        (selectedTradition === 'rishi' &&
          (trad.includes('वैदिक') || trad.includes('ऋषि') || trad.includes('सप्तर्षि') || trad.includes('आर्ष') || trad.includes('अद्वैत') || trad.includes('निर्गुण') || trad.includes('कबीर') || trad.includes('रामानंद') || trad.includes('रामानन्दी') || trad.includes('गुरु परम्परा')));

      const matchesSearch =
        q === '' ||
        (b.name || '').toLowerCase().includes(q) ||
        (b.nameDevanagari || '').includes(searchQuery) ||
        (b.titleHonorific || '').includes(searchQuery) ||
        (b.tradition || '').includes(searchQuery) ||
        (b.lifeSummary || '').includes(searchQuery) ||
        (b.samadhiPlace || '').includes(searchQuery) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesTradition && matchesSearch;
    });
  }, [bios, selectedTradition, searchQuery]);

  const traditionOptions = [
    { id: 'all', label: 'समस्त संत' },
    { id: 'braj', label: 'राधावल्लभ व हरिदासी' },
    { id: 'vaishnava', label: 'वैष्णव आचार्य' },
    { id: 'varkari', label: 'वारकरी परंपरा' },
    { id: 'rishi', label: 'ऋषि व निर्गुण संत' },
  ];

  // ==========================================
  // VIEW: Single Saint Biography Detail
  // ==========================================
  if (selectedBio) {
    const detailPortrait = getSaintPortrait({
      slug: selectedBio.slug,
      name: selectedBio.nameDevanagari,
      tradition: selectedBio.tradition,
    });
    return (
      <main
        role="main"
        aria-label={`${selectedBio.nameDevanagari} पावन जीवन चरित्र`}
        className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
      >
        {/* Top Navigation & Action Bar */}
        <div className="rounded-[24px] bg-white p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToDirectory}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>संत निर्देशिका</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FAF6EE] text-[#78350F] rounded-full text-xs font-serif font-bold">
              {selectedBio.tradition}
            </span>
            <button
              type="button"
              onClick={handleShare}
              aria-label="शेयर लिंक कॉपी करें"
              className="p-2 rounded-full bg-[#FAF6EE] hover:bg-[#EFE7D8] text-stone-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="rounded-[28px] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(24,24,27,0.03)] mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-[14px] bg-[#FAF6EE] p-1.5 shrink-0">
              <img
                src={detailPortrait}
                alt={selectedBio.nameDevanagari}
                className={`w-full h-full object-cover ${getArtworkObjectPosition(detailPortrait)} rounded-[10px]`}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {selectedBio.titleHonorific && (
                  <span className="px-2.5 py-0.5 text-xs font-serif font-bold rounded-full bg-[#FEF08A] text-[#78350F]">
                    {selectedBio.titleHonorific}
                  </span>
                )}
                <span className="px-2.5 py-0.5 text-xs font-sans font-medium rounded-full bg-[#FAF6EE] text-stone-600">
                  {selectedBio.period}
                </span>
                {selectedBio.samadhiLocation?.dhamOrRegion && (
                  <span className="px-2.5 py-0.5 text-xs font-serif font-semibold rounded-full bg-amber-50 text-amber-800">
                    {selectedBio.samadhiLocation.dhamOrRegion}
                  </span>
                )}
              </div>

              <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] leading-tight mt-1">
                {selectedBio.nameDevanagari}
              </h1>

              <div className="text-xs sm:text-sm font-sans text-neutral-500 mt-1">
                {selectedBio.name}
              </div>

              <div className="mt-4 p-4 rounded-[14px] bg-[#FAF8F4]">
                <p className="text-xs sm:text-sm text-neutral-800 font-serif italic leading-relaxed">
                  "{selectedBio.lifeSummary}"
                </p>
              </div>

              {onNavigateToPadavali && (
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToPadavali(selectedBio.nameDevanagari)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-serif font-bold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <section aria-label="सम्प्रदाय एवं गुरु परम्परा" className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)]">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-3">
              <Compass className="w-4 h-4 text-[#B45309]" />
              <span>सम्प्रदाय एवं गुरु परम्परा</span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm font-serif">
              <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
                <span className="text-neutral-500">सम्प्रदाय</span>
                <span className="font-bold text-[#18181B] text-right">
                  {selectedBio.lineage.sampradaya}
                </span>
              </div>

              <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
                <span className="text-neutral-500">दीक्षा गुरु</span>
                <span className="font-bold text-[#78350F] text-right">
                  {selectedBio.lineage.guru}
                </span>
              </div>

              {selectedBio.birthPlace && (
                <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
                  <span className="text-neutral-500">प्राकट्य स्थल</span>
                  <span className="text-neutral-800 text-right">
                    {selectedBio.birthPlace}
                  </span>
                </div>
              )}

              {selectedBio.lineage.seatOrPeetham && (
                <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
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
                        className="px-2.5 py-0.5 text-xs rounded-full bg-[#FAF6EE] text-stone-700 font-sans"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section aria-label="पावन समाधि एवं धाम दर्शन" className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)]">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-3">
              <MapPin className="w-4 h-4 text-[#B45309]" />
              <span>पावन समाधि एवं धाम दर्शन</span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm font-serif">
              <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
                <span className="text-neutral-500">समाधि स्थान</span>
                <span className="font-bold text-[#18181B] text-right">
                  {selectedBio.samadhiLocation.place}
                </span>
              </div>

              <div className="flex items-start justify-between py-1.5 rounded-[10px] px-2.5 bg-[#FAF8F4]">
                <span className="text-neutral-500">धाम क्षेत्र</span>
                <span className="font-bold text-[#78350F] text-right">
                  {selectedBio.samadhiLocation.dhamOrRegion}
                </span>
              </div>

              {selectedBio.samadhiLocation.darshanSignificance && (
                <div className="pt-1">
                  <span className="text-neutral-500 text-xs block mb-1.5">दर्शन महात्म्य</span>
                  <div className="rounded-[12px] bg-[#FAF8F4] p-3 text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif">
                    {selectedBio.samadhiLocation.darshanSignificance}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Section 3: Literary Works */}
        {selectedBio.literaryWorks && selectedBio.literaryWorks.length > 0 && (
          <section aria-label="रचित ग्रन्थ एवं अमर साहित्य" className="mb-6">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-3 px-1">
              <Scroll className="w-5 h-5 text-[#B45309]" />
              <span>रचित ग्रन्थ एवं अमर साहित्य ({formatDevanagariNumerals(selectedBio.literaryWorks.length)})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedBio.literaryWorks.map((work, idx) => (
                <div
                  key={idx}
                  className="rounded-[22px] bg-white p-4 shadow-[0_2px_12px_rgba(24,24,27,0.025)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-serif font-bold text-base text-[#18181B]">
                        {work.titleDevanagari || work.title}
                      </span>
                      {work.language && (
                        <span className="px-2.5 py-0.5 text-[11px] font-sans font-medium rounded-full bg-[#FAF6EE] text-stone-600">
                          {work.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 font-serif leading-relaxed">
                      {work.description}
                    </p>
                  </div>

                  {work.versesCount && (
                    <div className="mt-3 text-xs text-[#78350F] font-serif font-semibold">
                      {formatDevanagariNumerals(work.versesCount)} पद / श्लोक
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Key Leelas */}
        {selectedBio.keyLeelas && selectedBio.keyLeelas.length > 0 && (
          <section aria-label="पावन लीलाएं एवं चरित्र प्रसंग" className="mb-6">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-3 px-1">
              <Sparkles className="w-5 h-5 text-[#B45309]" />
              <span>पावन लीलाएं एवं चरित्र प्रसंग</span>
            </div>

            <div className="space-y-3.5">
              {selectedBio.keyLeelas.map((leela, idx) => (
                <div
                  key={idx}
                  className="rounded-[22px] bg-white p-5 shadow-[0_2px_12px_rgba(24,24,27,0.025)]"
                >
                  <h2 className="font-serif font-bold text-base text-[#18181B] mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FEF08A] text-[#78350F] text-xs flex items-center justify-center font-bold shrink-0">
                      {formatDevanagariNumerals(idx + 1)}
                    </span>
                    <span>{leela.title}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 font-serif leading-relaxed">
                    {leela.description}
                  </p>
                  {leela.shiksha && (
                    <div className="mt-3 rounded-[10px] bg-[#FAF8F4] px-3 py-2 text-xs text-[#78350F] font-serif font-medium">
                      <span className="font-bold">शिक्षा:</span> {leela.shiksha}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <SacredDiscoveryShelf
          entityType="bio"
          entitySlug={selectedBio.slug}
          title={`${selectedBio.nameDevanagari} • रचित वाणी व लीला स्थल`}
        />
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
      className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-28 text-[#18181B]"
    >
      {/* Compact Borderless Header + Inline Filter Bar */}
      <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-laila font-bold text-amber-800">
              <Users className="w-3.5 h-3.5" />
              <span>चरित्र दर्शन निर्देशिका</span>
              <span className="text-neutral-300">·</span>
              <span>{formatDevanagariNumerals(filteredBios.length)} संत</span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-3xl text-[#18181B] leading-tight">
              सनातन संत एवं रसिक आचार्य
            </h1>
            <p className="text-xs sm:text-[13px] text-neutral-600 font-laila leading-relaxed">
              ब्रज रसिक आचार्यों, वैष्णव आचार्यों और वारकरी सन्तों का दिव्य जीवन चरित्र, गुरु परम्परा एवं रचित ग्रंथावली।
            </p>
          </div>

          <div role="search" aria-label="संत चरित्र खोजें" className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सन्त, सम्प्रदाय या उपाधि खोजें..."
              aria-label="सन्त खोजें"
              className="w-full pl-10 pr-9 py-2.5 text-[16px] sm:text-xs bg-[#FAF8F4] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-[#18181B] placeholder-neutral-400 font-laila"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="खोज साफ़ करें"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {traditionOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedTradition(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-laila whitespace-nowrap rounded-full transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                selectedTradition === opt.id
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#FAF8F4] text-neutral-600 hover:bg-[#F3ECE0] font-medium'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {filteredBios.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center space-y-2 shadow-[0_2px_14px_rgba(24,24,27,0.025)]">
          <Users className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई संत चरित्र नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-laila">
            कृपया अन्य नाम या सम्प्रदाय से खोजें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredBios.map((saint, idx) => {
            const portrait = getSaintPortrait({
              slug: saint.slug,
              name: saint.nameDevanagari,
              tradition: saint.tradition,
            });
            const summaryText = saint.lifeSummary || saint.titleHonorific || saint.tradition;
            const footerMeta = saint.samadhiPlace || saint.tags?.[0] || saint.name;
            return (
              <article
                key={saint.id}
                onClick={() => handleSelect(saint.slug || saint.id)}
                className="group rounded-[24px] bg-white hover:bg-[#FFFDF9] p-3.5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  {/* Clean Concentric Portrait Plate (24 - 14 = 10px) */}
                  <div className="w-full aspect-[4/3] rounded-[10px] overflow-hidden bg-[#EFE7D8] mb-3.5">
                    <img
                      src={portrait}
                      alt={saint.nameDevanagari}
                      className={`w-full h-full object-cover ${getArtworkObjectPosition(portrait)}`}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10.5px] font-laila font-bold rounded-full bg-[#FAF6EE] text-[#78350F] truncate max-w-[60%]">
                        {saint.tradition}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-laila truncate">
                        {saint.period}
                      </span>
                    </div>

                    <h2 className="font-rozha text-lg text-[#18181B] group-hover:text-[#B45309] transition-colors leading-snug line-clamp-1">
                      {saint.nameDevanagari}
                    </h2>

                    <p className="text-xs text-neutral-600 font-laila mt-1.5 line-clamp-2 leading-relaxed">
                      {summaryText}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 px-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-laila min-w-0">
                    {saint.samadhiPlace ? (
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="truncate">{footerMeta}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(saint.slug || saint.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-laila font-bold rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <span>चरित्र दर्शन</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
