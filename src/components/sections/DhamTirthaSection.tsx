import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Clock,
  Search,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Compass,
  Footprints,
  Layers,
  Info,
  X,
  Share2,
  Check
} from 'lucide-react';
import {
  SacredPlace,
  SacredPlacePreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { seo } from '../../services/seoService';
import { chimeService } from '../../services/chimeService';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';

interface DhamTirthaSectionProps {
  initialPlaceSlug?: string;
  initialPlace?: SacredPlace | null;
  onSelectPlace?: (slug: string) => void;
}

export const DhamTirthaSection: React.FC<DhamTirthaSectionProps> = ({
  initialPlaceSlug,
  initialPlace = null,
  onSelectPlace,
}) => {
  const [places, setPlaces] = useState<SacredPlacePreview[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SacredPlace | null>(() => initialPlace || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Load places index
  useEffect(() => {
    let isMounted = true;
    SacredSectionService.getPlacesIndex()
      .then((items) => {
        if (isMounted) {
          setPlaces(items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const loadPlace = useCallback(async (slugOrId: string) => {
    const place = await SacredSectionService.getPlaceById(slugOrId);
    if (place) {
      setSelectedPlace(place);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      chimeService.playChime('temple-bell');
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialPlaceSlug) {
      loadPlace(initialPlaceSlug);
    }
  }, [initialPlaceSlug, loadPlace]);

  // Synchronize dynamic SEO updates
  useEffect(() => {
    if (selectedPlace) {
      seo.updateSEO({
        tab: 'places',
        title: `${selectedPlace.nameDevanagari} (${selectedPlace.regionNameHindi}) • दर्शन समय, आरती सारणी व तीर्थ महिमा | वृन्दोपनिषद् 2.0`,
        description: `${selectedPlace.nameDevanagari}। मुख्य विग्रह: ${selectedPlace.deityDevanagari || selectedPlace.deity}। प्रातः व सायं आरती एवं दर्शन समय, परिक्रमा मार्ग और लीला महात्म्य।`,
      });
    } else {
      seo.updateSEO({
        tab: 'places',
        title: 'श्री ब्रजमंडल एवं पावन धाम तीर्थ दर्शन • दर्शन व आरती समय, परिक्रमा मार्ग | वृन्दोपनिषद् 2.0',
        description: 'वृन्दावन, गिरिराज गोवर्धन, बरसाना और सनातन धामों के पावन मन्दिर, दर्शन एवं आरती समय, लीला प्रसंग तथा परिक्रमा पथ का सम्पूर्ण विवरण।',
      });
    }
  }, [selectedPlace]);

  const handleSelect = (slug: string) => {
    loadPlace(slug);
    if (onSelectPlace) {
      onSelectPlace(slug);
    }
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', `/place/${encodeURIComponent(slug)}`);
      } catch {}
    }
  };

  const handleBackToDirectory = () => {
    setSelectedPlace(null);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/places');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = selectedPlace
        ? `${window.location.origin}/place/${encodeURIComponent(selectedPlace.slug || selectedPlace.id)}`
        : window.location.href;
      navigator.clipboard?.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesRegion = selectedRegion === 'all' || p.dhamRegion === selectedRegion;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameDevanagari.includes(searchQuery) ||
        p.briefSignificance.includes(searchQuery) ||
        p.deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.deityDevanagari && p.deityDevanagari.includes(searchQuery)) ||
        p.tags.some((t) => t.includes(searchQuery));
      return matchesRegion && matchesSearch;
    });
  }, [places, selectedRegion, searchQuery]);

  const regionFilters = [
    { id: 'all', label: 'समस्त धाम' },
    { id: 'vrindavan', label: 'श्रीधाम वृन्दावन' },
    { id: 'govardhan', label: 'गिरिराज गोवर्धन' },
    { id: 'barsana', label: 'श्री बरसाना' },
    { id: 'mathura', label: 'श्री मथुरा' },
  ];

  // ==========================================
  // VIEW: Place Detail & Darshan Timings
  // ==========================================
  if (selectedPlace) {
    return (
      <main
        role="main"
        aria-label={`${selectedPlace.nameDevanagari} तीर्थ दर्शन`}
        className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
      >
        {/* Navigation bar */}
        {/* Outer: rounded-[28px] p-4 -> Inner: rounded-[12px] (28 - 16 = 12) */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-4 shadow-2xs mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToDirectory}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-amber-300 active:bg-amber-300/90 rounded-[12px] transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>तीर्थ निर्देशिका</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-[#78350F] rounded-[12px] text-xs font-serif font-bold">
              {selectedPlace.regionNameHindi}
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
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 text-xs font-serif font-bold rounded-[6px] bg-[#FEF08A] text-[#78350F] border border-amber-300/40">
              {selectedPlace.regionNameHindi}
            </span>
            {selectedPlace.parikramaKm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-serif font-semibold rounded-[6px] bg-stone-100 text-stone-700">
                <Footprints className="w-3.5 h-3.5 text-amber-700" />
                <span>{formatDevanagariNumerals(selectedPlace.parikramaKm)} किमी परिक्रमा</span>
              </span>
            )}
          </div>

          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] leading-tight">
            {selectedPlace.nameDevanagari}
          </h1>

          <div className="text-xs sm:text-sm font-sans text-neutral-500 mt-1">
            {selectedPlace.name} • मुख्य विग्रह: <span className="font-serif font-bold text-neutral-800">{selectedPlace.deityDevanagari || selectedPlace.deity}</span>
          </div>

          <div className="mt-4 p-4 rounded-[12px] bg-[#FAF6EE] border-l-4 border-amber-500">
            <p className="text-xs sm:text-sm text-neutral-800 font-serif leading-relaxed">
              {selectedPlace.briefSignificance}
            </p>
          </div>
        </div>

        {/* Section: Darshan Timings & Aarti Schedule */}
        {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
        <section aria-label="दर्शन समय एवं आरती सारणी" className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs mb-8">
          <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base sm:text-lg mb-4 pb-2 border-b border-neutral-100">
            <Clock className="w-5 h-5 text-[#B45309]" />
            <span>पावन दर्शन समय एवं आरती सारणी</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Morning Slot - Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
            {selectedPlace.darshanTimings.morning && (
              <div className="rounded-[8px] bg-[#FAF6EE] border border-amber-200/60 p-4">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#78350F] block mb-1">
                  प्रातः कालीन दर्शन
                </span>
                <div className="font-rozha font-bold text-xl sm:text-2xl text-[#18181B]">
                  {selectedPlace.darshanTimings.morning.open} — {selectedPlace.darshanTimings.morning.close}
                </div>
                {selectedPlace.darshanTimings.morning.aartiName && (
                  <div className="text-xs text-[#B45309] font-serif font-semibold mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#B45309]" />
                    <span>{selectedPlace.darshanTimings.morning.aartiName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Evening Slot - Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
            {selectedPlace.darshanTimings.evening && (
              <div className="rounded-[8px] bg-[#FAF6EE] border border-amber-200/60 p-4">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#78350F] block mb-1">
                  सायं कालीन दर्शन
                </span>
                <div className="font-rozha font-bold text-xl sm:text-2xl text-[#18181B]">
                  {selectedPlace.darshanTimings.evening.open} — {selectedPlace.darshanTimings.evening.close}
                </div>
                {selectedPlace.darshanTimings.evening.aartiName && (
                  <div className="text-xs text-[#B45309] font-serif font-semibold mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#B45309]" />
                    <span>{selectedPlace.darshanTimings.evening.aartiName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedPlace.darshanTimings.specialNotes && (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <div className="mt-4 rounded-[8px] bg-stone-50 border border-stone-200 p-3 flex items-start gap-2 text-xs text-neutral-600 font-serif">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{selectedPlace.darshanTimings.specialNotes}</span>
            </div>
          )}
        </section>

        {/* Section: Associated Leelas (सम्बद्ध दिव्य लीलाएं) */}
        {selectedPlace.associatedLeelas && selectedPlace.associatedLeelas.length > 0 && (
          <section aria-label="तीर्थ सम्बद्ध दिव्य लीलाएं" className="mb-8">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-4">
              <Sparkles className="w-5 h-5 text-[#B45309]" />
              <span>तीर्थ सम्बद्ध दिव्य लीलाएं</span>
            </div>

            <div className="space-y-4">
              {selectedPlace.associatedLeelas.map((leela, idx) => (
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Nearby Kunds & Samadhis */}
        {((selectedPlace.nearbyKundsOrShilats && selectedPlace.nearbyKundsOrShilats.length > 0) ||
          (selectedPlace.samadhisNearby && selectedPlace.samadhisNearby.length > 0)) && (
          /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
          <section aria-label="समीपवर्ती पावन कुण्ड एवं समाधि स्थल" className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs mb-8">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-4 pb-2 border-b border-neutral-100">
              <Layers className="w-4 h-4 text-[#B45309]" />
              <span>समीपवर्ती पावन कुण्ड, शिलाएं एवं समाधि स्थल</span>
            </div>

            <div className="space-y-4 font-serif">
              {selectedPlace.nearbyKundsOrShilats && selectedPlace.nearbyKundsOrShilats.length > 0 && (
                <div>
                  <span className="text-xs text-neutral-500 block mb-2 font-medium">
                    पावन कुण्ड एवं शिलाएं
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.nearbyKundsOrShilats.map((kund, kIdx) => (
                      <span
                        key={kIdx}
                        className="px-3 py-1 text-xs font-semibold rounded-[6px] bg-stone-100 text-stone-800 border border-stone-200"
                      >
                        {kund}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlace.samadhisNearby && selectedPlace.samadhisNearby.length > 0 && (
                <div>
                  <span className="text-xs text-neutral-500 block mb-2 font-medium">
                    निकटवर्ती सिद्ध संतों की समाधि
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.samadhisNearby.map((samadhi, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-3 py-1 text-xs font-semibold rounded-[6px] bg-amber-50 text-[#78350F] border border-amber-200"
                      >
                        {samadhi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sacred Correlated Discovery Nexus */}
        <SacredDiscoveryShelf
          entityType="place"
          entitySlug={selectedPlace.slug}
          title={`${selectedPlace.nameDevanagari} • सम्बन्धित पावन नेक्सस`}
        />
      </main>
    );
  }

  // ==========================================
  // VIEW: Places Explorer Directory
  // ==========================================
  return (
    <main
      role="main"
      aria-label="पावन धाम एवं तीर्थ अन्वेषण"
      className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
    >
      {/* Explorer Hero Deck */}
      {/* Outer: rounded-[28px] p-6 sm:p-7 -> Inner: rounded-[8px] (28 - 20 = 8) */}
      <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-7 shadow-2xs mb-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>॥ पावन धाम एवं तीर्थ अन्वेषण ॥</span>
          </div>
          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
            श्री ब्रजमंडल एवं सनातन तीर्थ
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-serif mt-1.5 leading-relaxed">
            वृन्दावन, गिरिराज गोवर्धन, बरसाना और सनातन धामों के पावन मन्दिर, दर्शन एवं आरती समय, लीला प्रसंग तथा परिक्रमा पथ का सम्पूर्ण विवरण।
          </p>
        </div>

        {/* Search & Region Filter Bar */}
        {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
        <div
          role="search"
          aria-label="तीर्थ खोजें"
          className="mt-5 rounded-[20px] bg-[#FAF6EE] border border-amber-200/70 p-3 shadow-2xs space-y-3"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="मन्दिर, तीर्थ, विग्रह अथवा लीला खोजें..."
              aria-label="तीर्थ अथवा मन्दिर खोजें"
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
              {regionFilters.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-3 py-1.5 text-xs font-serif font-semibold whitespace-nowrap rounded-[8px] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selectedRegion === reg.id
                      ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200/60'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-serif text-neutral-500 shrink-0 font-medium hidden sm:block">
              {formatDevanagariNumerals(filteredPlaces.length)} तीर्थ उपलब्ध
            </div>
          </div>
        </div>
      </div>

      {/* Places Cards Grid */}
      {filteredPlaces.length === 0 ? (
        /* Outer: rounded-[28px] p-8 -> Inner: rounded-[8px] (28 - 20 = 8) */
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-8 text-center space-y-2">
          <MapPin className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई तीर्थ स्थल नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-serif">
            कृपया अन्य नाम अथवा क्षेत्र का चयन करें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredPlaces.map((place) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <article
              key={place.id}
              className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 text-[10.5px] font-serif font-bold rounded-[6px] bg-[#FEF08A] text-[#78350F]">
                    {place.regionNameHindi}
                  </span>
                  {place.parikramaKm && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-serif font-medium">
                      <Footprints className="w-3.5 h-3.5 text-amber-700" />
                      <span>{formatDevanagariNumerals(place.parikramaKm)} किमी परिक्रमा</span>
                    </span>
                  )}
                </div>

                <h2
                  onClick={() => handleSelect(place.slug || place.id)}
                  className="font-rozha text-lg sm:text-xl font-bold text-[#18181B] hover:text-[#B45309] cursor-pointer transition-colors leading-snug"
                >
                  {place.nameDevanagari}
                </h2>

                <div className="text-xs text-neutral-500 font-serif mt-0.5">
                  विग्रह: <span className="font-semibold text-neutral-700">{place.deityDevanagari || place.deity}</span>
                </div>

                <p className="text-xs text-neutral-600 font-serif mt-2 line-clamp-3 leading-relaxed">
                  {place.briefSignificance}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-serif">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>दर्शन व आरती समय उपलब्ध</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(place.slug || place.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                >
                  <span>दर्शन विवरण</span>
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
