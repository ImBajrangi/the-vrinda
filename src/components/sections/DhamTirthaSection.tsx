import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { getDhamArtwork, getArtworkObjectPosition } from '../../services/devotionalVisuals';
import {
  SacredPlace,
  SacredPlacePreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { seo } from '../../services/seoService';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';
import { resetScrollToTop } from '../../utils/scrollTop';

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
      resetScrollToTop();
    }
  }, []);

  const isFirstPlaceRender = useRef(true);
  useEffect(() => {
    if (isFirstPlaceRender.current) {
      isFirstPlaceRender.current = false;
      return;
    }
    resetScrollToTop();
  }, [selectedPlace?.id]);

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
    resetScrollToTop();
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
    const q = searchQuery.trim().toLowerCase();
    return places.filter((p) => {
      const regionTokens = selectedRegion.split(',');
      const matchesRegion = selectedRegion === 'all' || regionTokens.includes(p.dhamRegion);
      const matchesSearch =
        q === '' ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.nameDevanagari || '').includes(searchQuery) ||
        (p.briefSignificance || '').includes(searchQuery) ||
        (p.deity || '').toLowerCase().includes(q) ||
        (p.deityDevanagari && p.deityDevanagari.includes(searchQuery)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesRegion && matchesSearch;
    });
  }, [places, selectedRegion, searchQuery]);

  const regionFilters = [
    { id: 'all', label: 'समस्त धाम' },
    { id: 'vrindavan', label: 'श्रीधाम वृन्दावन' },
    { id: 'govardhan,nandgaon', label: 'गोवर्धन व नंदगाँव' },
    { id: 'barsana', label: 'श्री बरसाना' },
    { id: 'gokul,mathura,braj-mandal', label: 'गोकुल व मथुरा' },
    { id: 'ayodhya,kashi,puri,dwarka,char-dham,himalayas,saurashtra,malwa,south-india', label: 'सनातन महातीर्थ' },
  ];

  // ==========================================
  // VIEW: Place Detail & Darshan Timings
  // ==========================================
  if (selectedPlace) {
    const detailArt = getDhamArtwork(selectedPlace);
    return (
      <main
        role="main"
        aria-label={`${selectedPlace.nameDevanagari} तीर्थ दर्शन`}
        className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
      >
        {/* Navigation bar */}
        <div className="rounded-[24px] bg-white p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToDirectory}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>तीर्थ निर्देशिका</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FAF6EE] text-[#78350F] rounded-full text-xs font-serif font-bold">
              {selectedPlace.regionNameHindi}
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

        {/* Hero Card with Split Visual Darshan Frame */}
        <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.03)] mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5">
              <div className="aspect-[4/3] w-full rounded-[14px] overflow-hidden bg-[#EFE7D8]">
                <img
                  src={detailArt}
                  alt={selectedPlace.nameDevanagari}
                  className={`w-full h-full object-cover ${getArtworkObjectPosition(detailArt)}`}
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-xs font-serif font-bold rounded-full bg-[#FEF08A] text-[#78350F]">
                  {selectedPlace.regionNameHindi}
                </span>
                {selectedPlace.parikramaKm && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-serif font-semibold rounded-full bg-[#FAF6EE] text-stone-700">
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

              <div className="mt-4 p-4 rounded-[14px] bg-[#FAF8F4]">
                <p className="text-xs sm:text-sm text-neutral-800 font-serif leading-relaxed">
                  {selectedPlace.briefSignificance}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Darshan Timings & Aarti Schedule */}
        <section aria-label="दर्शन समय एवं आरती सारणी" className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-6">
          <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base sm:text-lg mb-4">
            <Clock className="w-5 h-5 text-[#B45309]" />
            <span>पावन दर्शन समय एवं आरती सारणी</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedPlace.darshanTimings.morning && (
              <div className="rounded-[14px] bg-[#FAF8F4] p-4">
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

            {selectedPlace.darshanTimings.evening && (
              <div className="rounded-[14px] bg-[#FAF8F4] p-4">
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
            <div className="mt-4 rounded-[12px] bg-[#FAF8F4] p-3 flex items-start gap-2 text-xs text-neutral-600 font-serif">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{selectedPlace.darshanTimings.specialNotes}</span>
            </div>
          )}
        </section>

        {/* Section: Associated Leelas */}
        {selectedPlace.associatedLeelas && selectedPlace.associatedLeelas.length > 0 && (
          <section aria-label="तीर्थ सम्बद्ध दिव्य लीलाएं" className="mb-6">
            <div className="flex items-center gap-2 text-[#18181B] font-rozha font-bold text-xl mb-3 px-1">
              <Sparkles className="w-5 h-5 text-[#B45309]" />
              <span>तीर्थ सम्बद्ध दिव्य लीलाएं</span>
            </div>

            <div className="space-y-3.5">
              {selectedPlace.associatedLeelas.map((leela, idx) => (
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Nearby Kunds & Samadhis */}
        {((selectedPlace.nearbyKundsOrShilats && selectedPlace.nearbyKundsOrShilats.length > 0) ||
          (selectedPlace.samadhisNearby && selectedPlace.samadhisNearby.length > 0)) && (
          <section aria-label="समीपवर्ती पावन कुण्ड एवं समाधि स्थल" className="rounded-[24px] bg-white p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-6">
            <div className="flex items-center gap-2 text-[#B45309] font-serif font-bold text-base mb-4">
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
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-[#FAF6EE] text-stone-800"
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
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-[#78350F]"
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

        <SacredDiscoveryShelf
          entityType="place"
          entitySlug={selectedPlace.slug}
          title={`${selectedPlace.nameDevanagari} • जुड़े तीर्थ, संत व वाणी`}
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
      className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-28 text-[#18181B]"
    >
      {/* Compact Borderless Header + Search + Region Pills */}
      <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-laila font-bold text-amber-800">
              <Compass className="w-3.5 h-3.5" />
              <span>पावन धाम एवं तीर्थ अन्वेषण</span>
              <span className="text-neutral-300">·</span>
              <span>{formatDevanagariNumerals(filteredPlaces.length)} तीर्थ</span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-3xl text-[#18181B] leading-tight">
              श्री ब्रजमंडल एवं सनातन तीर्थ
            </h1>
            <p className="text-xs sm:text-[13px] text-neutral-600 font-laila leading-relaxed">
              वृन्दावन, गोवर्धन, बरसाना और सनातन धामों के पावन मन्दिर, दर्शन एवं आरती समय तथा परिक्रमा मार्ग।
            </p>
          </div>

          <div role="search" aria-label="तीर्थ खोजें" className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="मन्दिर, तीर्थ या विग्रह खोजें..."
              aria-label="तीर्थ अथवा मन्दिर खोजें"
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
          {regionFilters.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => setSelectedRegion(reg.id)}
              className={`px-3.5 py-1.5 text-xs font-laila whitespace-nowrap rounded-full transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                selectedRegion === reg.id
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#FAF8F4] text-neutral-600 hover:bg-[#F3ECE0] font-medium'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Places Cards Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center space-y-2 shadow-[0_2px_14px_rgba(24,24,27,0.025)]">
          <MapPin className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई तीर्थ स्थल नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-laila">
            कृपया अन्य नाम अथवा क्षेत्र का चयन करें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPlaces.map((place, idx) => {
            const art = getDhamArtwork(place);
            return (
              <article
                key={place.id}
                onClick={() => handleSelect(place.slug || place.id)}
                className="group rounded-[24px] bg-white hover:bg-[#FFFDF9] p-3.5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  {/* Clean Tirtha / Mandir Darshan Plate (24 - 14 = 10px) */}
                  <div className="aspect-[16/10] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8] mb-3.5">
                    <img
                      src={art}
                      alt={place.nameDevanagari}
                      className={`w-full h-full object-cover ${getArtworkObjectPosition(art)}`}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10.5px] font-laila font-bold rounded-full bg-[#FAF6EE] text-[#78350F] truncate max-w-[65%]">
                        {place.regionNameHindi}
                      </span>
                      {place.parikramaKm && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-laila shrink-0">
                          <Footprints className="w-3 h-3 text-amber-700" />
                          <span>{formatDevanagariNumerals(place.parikramaKm)} किमी</span>
                        </span>
                      )}
                    </div>

                    <h2 className="font-rozha text-lg text-[#18181B] group-hover:text-[#B45309] transition-colors leading-snug line-clamp-1">
                      {place.nameDevanagari}
                    </h2>

                    <div className="text-[11px] text-neutral-500 font-laila mt-0.5 truncate">
                      विग्रह: <span className="font-semibold text-neutral-700">{place.deityDevanagari || place.deity}</span>
                    </div>

                    <p className="text-xs text-neutral-600 font-laila mt-1.5 line-clamp-2 leading-relaxed">
                      {place.briefSignificance}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 px-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-laila">
                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>दर्शन व आरती समय</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(place.slug || place.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-laila font-bold rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                  >
                    <span>दर्शन विवरण</span>
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
