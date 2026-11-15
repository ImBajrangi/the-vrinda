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
} from 'lucide-react';
import {
  SacredBiography,
  SacredBiographyPreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';

interface CharitraDarshanProps {
  initialSaintSlug?: string;
  onSelectSaint?: (slug: string) => void;
  onNavigateToPadavali?: () => void;
}

export const CharitraDarshan: React.FC<CharitraDarshanProps> = ({
  initialSaintSlug,
  onSelectSaint,
}) => {
  const [bios, setBios] = useState<SacredBiographyPreview[]>([]);
  const [selectedBio, setSelectedBio] = useState<SacredBiography | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTradition, setSelectedTradition] = useState<string>('all');

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
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialSaintSlug) {
      loadBiography(initialSaintSlug);
    }
  }, [initialSaintSlug, loadBiography]);

  const handleSelect = (slug: string) => {
    loadBiography(slug);
    if (onSelectSaint) {
      onSelectSaint(slug);
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
    { id: 'all', label: 'सभी संत (All Saints)' },
    { id: 'हरिदासी', label: 'हरिदासी / सखी भाव' },
    { id: 'राधावल्लभ', label: 'राधावल्लभ' },
    { id: 'वारकरी', label: 'वारकरी परम्परा' },
    { id: 'गौड़ीय', label: 'गौड़ीय वैष्णव' },
  ];

  // ==========================================
  // VIEW: Single Saint Biography Detail
  // ==========================================
  if (selectedBio) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
        {/* Top Navigation */}
        {/* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */}
        <div className="rounded-[24px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm mb-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedBio(null)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-sacred-kesar hover:bg-sacred-kesar/10 rounded-[8px] transition-colors"
          >
            <ArrowLeft size={18} />
            <span>संत निर्देशिका (All Saints)</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 rounded-[8px]">
            {selectedBio.tradition}
          </span>
        </div>

        {/* Hero Card */}
        {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
        <div className="rounded-[32px] bg-gradient-to-b from-amber-50 via-white to-orange-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Saint Icon / Avatar Frame */}
            {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
            <div className="w-24 h-24 rounded-[20px] bg-gradient-to-br from-sacred-kesar to-amber-600 p-3 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[8px] bg-white/10 flex items-center justify-center text-white font-serif font-black text-3xl">
                {selectedBio.nameDevanagari.charAt(0)}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {selectedBio.titleHonorific && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar border border-sacred-kesar/20">
                    {selectedBio.titleHonorific}
                  </span>
                )}
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {selectedBio.period}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug">
                {selectedBio.nameDevanagari}
              </h1>

              <div className="text-sm font-sans text-neutral-500 mt-1">
                {selectedBio.name}
              </div>

              <p className="mt-4 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed italic border-l-2 border-sacred-kesar pl-3">
                "{selectedBio.lifeSummary}"
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid: Lineage Card & Samadhi Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Lineage Card (सम्प्रदाय एवं गुरु परम्परा) */}
          {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
          <div className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card">
            <div className="flex items-center gap-2 text-sacred-kesar font-serif font-bold text-base mb-4">
              <Compass size={18} />
              <span>सम्प्रदाय एवं गुरु परम्परा (Lineage)</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 text-xs">सम्प्रदाय</span>
                <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100 text-right">
                  {selectedBio.lineage.sampradaya}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 text-xs">दीक्षा गुरु</span>
                <span className="font-serif font-semibold text-sacred-kesar text-right">
                  {selectedBio.lineage.guru}
                </span>
              </div>

              {selectedBio.birthPlace && (
                <div className="flex items-start justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 text-xs">प्राकट्य स्थल</span>
                  <span className="text-neutral-800 dark:text-neutral-200 text-right">
                    {selectedBio.birthPlace}
                  </span>
                </div>
              )}

              {selectedBio.lineage.seatOrPeetham && (
                <div className="flex items-start justify-between py-2">
                  <span className="text-neutral-500 text-xs">प्रधान पीठ / स्थली</span>
                  <span className="text-neutral-800 dark:text-neutral-200 text-right font-medium">
                    {selectedBio.lineage.seatOrPeetham}
                  </span>
                </div>
              )}

              {selectedBio.lineage.prominentDisciples && selectedBio.lineage.prominentDisciples.length > 0 && (
                <div className="pt-2">
                  <span className="text-neutral-500 text-xs block mb-1">प्रमुख शिष्य मण्डल</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBio.lineage.prominentDisciples.map((disc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Samadhi Location Card */}
          {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
          <div className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card">
            <div className="flex items-center gap-2 text-sacred-kesar font-serif font-bold text-base mb-4">
              <MapPin size={18} />
              <span>पावन समाधि एवं धाम दर्शन</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 text-xs">समाधि स्थान</span>
                <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100 text-right">
                  {selectedBio.samadhiLocation.place}
                </span>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 text-xs">धाम क्षेत्र</span>
                <span className="font-semibold text-sacred-kesar text-right">
                  {selectedBio.samadhiLocation.dhamOrRegion}
                </span>
              </div>

              {selectedBio.samadhiLocation.darshanSignificance && (
                <div className="pt-2">
                  <span className="text-neutral-500 text-xs block mb-1">दर्शन महात्म्य</span>
                  {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
                  <div className="rounded-[8px] bg-amber-50/70 dark:bg-neutral-800/70 border border-amber-200/50 dark:border-neutral-700 p-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif">
                    {selectedBio.samadhiLocation.darshanSignificance}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Literary Works (अमर ग्रन्थ एवं साहित्य) */}
        {selectedBio.literaryWorks && selectedBio.literaryWorks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-serif font-bold text-xl mb-4">
              <Scroll size={20} className="text-sacred-kesar" />
              <span>रचित ग्रन्थ एवं अमर साहित्य ({selectedBio.literaryWorks.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedBio.literaryWorks.map((work, idx) => (
                /* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */
                <div
                  key={idx}
                  className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-50">
                        {work.titleDevanagari || work.title}
                      </span>
                      {work.language && (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {work.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                      {work.description}
                    </p>
                  </div>

                  {work.versesCount && (
                    <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-sacred-kesar font-semibold">
                      {work.versesCount} पद / श्लोक
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Key Leelas (दिव्य चरित्र एवं लीलाएं) */}
        {selectedBio.keyLeelas && selectedBio.keyLeelas.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-serif font-bold text-xl mb-4">
              <Sparkles size={20} className="text-sacred-kesar" />
              <span>पावन लीलाएं एवं चरित्र प्रसंग</span>
            </div>

            <div className="space-y-4">
              {selectedBio.keyLeelas.map((leela, idx) => (
                /* Outer: rounded-[24px] p-5 -> Inner: rounded-[4px] (24 - 20 = 4) */
                <div
                  key={idx}
                  className="rounded-[24px] bg-gradient-to-r from-amber-50/50 via-white to-orange-50/30 dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card"
                >
                  <h4 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-[4px] bg-sacred-kesar text-white text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{leela.title}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed">
                    {leela.description}
                  </p>
                  {leela.shiksha && (
                    <div className="mt-2 text-xs text-sacred-kesar font-medium">
                      शिक्षा: {leela.shiksha}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: Directory List of Saints
  // ==========================================
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
      {/* Directory Hero */}
      {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
      <div className="rounded-[32px] bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar text-xs font-bold uppercase tracking-wider mb-3">
            <Users size={14} />
            <span>चरित्र दर्शन (Saint & Rishi Directory)</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            सनातन संत एवं रसिक आचार्य
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-sans mt-2 leading-relaxed">
            ब्रज रसिक आचार्यों, वारकरी सन्तों और ऋषि-मुनियों का दिव्य जीवन चरित्र, गुरु परम्परा, साहित्य साधना और समाधि स्थल दर्शन।
          </p>
        </div>

        {/* Search & Filters */}
        {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
        <div className="mt-6 rounded-[20px] bg-white/95 dark:bg-neutral-800/95 border border-amber-200 dark:border-neutral-700 p-3 shadow-xs">
          <div className="relative w-full flex items-center">
            <Search
              size={18}
              className="absolute left-3.5 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सन्त का नाम, सम्प्रदाय अथवा ग्रन्थ खोजें..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-sacred-kesar/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-700">
            {traditionOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedTradition(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-[8px] transition-colors ${
                  selectedTradition === opt.id
                    ? 'bg-sacred-kesar text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredBios.length === 0 ? (
        /* Outer: rounded-[24px] p-8 -> Inner: rounded-[8px] (24 - 16 = 8) */
        <div className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <Users size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="font-serif text-lg font-bold text-neutral-700 dark:text-neutral-300">
            कोई सन्त चरित्र नहीं मिला
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            कृपया अन्य नाम या सम्प्रदाय से खोजें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBios.map((saint) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <div
              key={saint.id}
              className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-card flex flex-col justify-between hover:border-amber-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar">
                    {saint.tradition}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {saint.period}
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  {/* Outer card: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
                  <div className="w-12 h-12 rounded-[8px] bg-amber-100 dark:bg-neutral-800 p-2 shrink-0 flex items-center justify-center">
                    <span className="font-serif font-black text-sacred-kesar text-lg">
                      {saint.nameDevanagari.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3
                      onClick={() => handleSelect(saint.slug || saint.id)}
                      className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 hover:text-sacred-kesar cursor-pointer transition-colors leading-snug"
                    >
                      {saint.nameDevanagari}
                    </h3>
                    <div className="text-xs text-neutral-500">
                      {saint.name}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans line-clamp-3 leading-relaxed mb-4">
                  {saint.lifeSummary}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin size={13} className="text-sacred-kesar" />
                  <span className="truncate max-w-[120px]">{saint.samadhiPlace}</span>
                </div>

                <button
                  onClick={() => handleSelect(saint.slug || saint.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-2xs"
                >
                  <span>दर्शन करें</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
