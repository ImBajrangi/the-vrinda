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
} from 'lucide-react';
import {
  SacredPlace,
  SacredPlacePreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';

interface DhamTirthaSectionProps {
  initialPlaceSlug?: string;
  onSelectPlace?: (slug: string) => void;
}

export const DhamTirthaSection: React.FC<DhamTirthaSectionProps> = ({
  initialPlaceSlug,
  onSelectPlace,
}) => {
  const [places, setPlaces] = useState<SacredPlacePreview[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SacredPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

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
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialPlaceSlug) {
      loadPlace(initialPlaceSlug);
    }
  }, [initialPlaceSlug, loadPlace]);

  const handleSelect = (slug: string) => {
    loadPlace(slug);
    if (onSelectPlace) {
      onSelectPlace(slug);
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
    { id: 'all', label: 'समस्त पावन धाम (All Dhams)' },
    { id: 'vrindavan', label: 'श्रीधाम वृन्दावन' },
    { id: 'govardhan', label: 'गिरिराज गोवर्धन' },
    { id: 'barsana', label: 'श्री बरसाना धाम' },
    { id: 'mathura', label: 'श्री मथुरा पुरी' },
  ];

  // ==========================================
  // VIEW: Place Detail & Darshan Timings
  // ==========================================
  if (selectedPlace) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
        {/* Navigation bar */}
        {/* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */}
        <div className="rounded-[24px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm mb-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedPlace(null)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-sacred-kesar hover:bg-sacred-kesar/10 rounded-[8px] transition-colors"
          >
            <ArrowLeft size={18} />
            <span>तीर्थ निर्देशिका (All Tirthas)</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 rounded-[8px]">
            {selectedPlace.regionNameHindi}
          </span>
        </div>

        {/* Hero Card */}
        {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
        <div className="rounded-[32px] bg-gradient-to-b from-amber-50 via-white to-orange-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar border border-sacred-kesar/20">
              {selectedPlace.regionNameHindi}
            </span>
            {selectedPlace.parikramaKm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <Footprints size={13} className="text-sacred-kesar" />
                <span>{selectedPlace.parikramaKm} किमी परिक्रमा</span>
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug">
            {selectedPlace.nameDevanagari}
          </h1>

          <div className="text-sm font-sans text-neutral-500 mt-1">
            {selectedPlace.name} • मुख्य विग्रह: {selectedPlace.deityDevanagari || selectedPlace.deity}
          </div>

          <p className="mt-4 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed border-l-2 border-sacred-kesar pl-3">
            {selectedPlace.briefSignificance}
          </p>
        </div>

        {/* Section: Darshan Timings & Aarti Schedule */}
        {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
        <div className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card mb-8">
          <div className="flex items-center gap-2 text-sacred-kesar font-serif font-bold text-base sm:text-lg mb-4">
            <Clock size={20} />
            <span>पावन दर्शन समय एवं आरती सारणी (Darshan Timings)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Morning Slot - Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
            {selectedPlace.darshanTimings.morning && (
              <div className="rounded-[8px] bg-amber-50/70 dark:bg-neutral-800/80 border border-amber-200/60 dark:border-neutral-700 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                  प्रातः कालीन दर्शन (Morning Darshan)
                </span>
                <div className="font-serif font-bold text-xl text-neutral-900 dark:text-neutral-100">
                  {selectedPlace.darshanTimings.morning.open} — {selectedPlace.darshanTimings.morning.close}
                </div>
                {selectedPlace.darshanTimings.morning.aartiName && (
                  <div className="text-xs text-sacred-kesar font-semibold mt-1">
                    {selectedPlace.darshanTimings.morning.aartiName}
                  </div>
                )}
              </div>
            )}

            {/* Evening Slot - Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
            {selectedPlace.darshanTimings.evening && (
              <div className="rounded-[8px] bg-orange-50/70 dark:bg-neutral-800/80 border border-orange-200/60 dark:border-neutral-700 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 block mb-1">
                  सायं कालीन दर्शन (Evening Darshan)
                </span>
                <div className="font-serif font-bold text-xl text-neutral-900 dark:text-neutral-100">
                  {selectedPlace.darshanTimings.evening.open} — {selectedPlace.darshanTimings.evening.close}
                </div>
                {selectedPlace.darshanTimings.evening.aartiName && (
                  <div className="text-xs text-sacred-kesar font-semibold mt-1">
                    {selectedPlace.darshanTimings.evening.aartiName}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedPlace.darshanTimings.specialNotes && (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <div className="mt-4 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 p-3 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300 font-sans">
              <Info size={16} className="text-sacred-kesar shrink-0 mt-0.5" />
              <span>{selectedPlace.darshanTimings.specialNotes}</span>
            </div>
          )}
        </div>

        {/* Section: Associated Leelas (सम्बद्ध दिव्य लीलाएं) */}
        {selectedPlace.associatedLeelas && selectedPlace.associatedLeelas.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-serif font-bold text-xl mb-4">
              <Sparkles size={20} className="text-sacred-kesar" />
              <span>तीर्थ सम्बद्ध दिव्य लीलाएं (Associated Leelas)</span>
            </div>

            <div className="space-y-4">
              {selectedPlace.associatedLeelas.map((leela, idx) => (
                /* Outer: rounded-[24px] p-5 -> Inner: rounded-[4px] (24 - 20 = 4) */
                <div
                  key={idx}
                  className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card"
                >
                  <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-[4px] bg-sacred-kesar text-white text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{leela.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed">
                    {leela.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Nearby Kunds & Samadhis */}
        {((selectedPlace.nearbyKundsOrShilats && selectedPlace.nearbyKundsOrShilats.length > 0) ||
          (selectedPlace.samadhisNearby && selectedPlace.samadhisNearby.length > 0)) && (
          /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
          <div className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-card mb-8">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-serif font-bold text-base mb-4">
              <Layers size={18} className="text-sacred-kesar" />
              <span>समीपवर्ती पावन कुण्ड, शिलाएं एवं समाधि स्थल</span>
            </div>

            <div className="space-y-4">
              {selectedPlace.nearbyKundsOrShilats && selectedPlace.nearbyKundsOrShilats.length > 0 && (
                <div>
                  <span className="text-xs text-neutral-500 block mb-2 font-medium">
                    पावन कुण्ड एवं शिलाएं
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.nearbyKundsOrShilats.map((kund, kIdx) => (
                      <span
                        key={kIdx}
                        className="px-3 py-1 text-xs font-semibold rounded-[8px] bg-sky-50 dark:bg-neutral-800 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-neutral-700"
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
                        className="px-3 py-1 text-xs font-semibold rounded-[8px] bg-amber-50 dark:bg-neutral-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-neutral-700"
                      >
                        {samadhi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: Places Explorer Directory
  // ==========================================
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
      {/* Explorer Hero */}
      {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
      <div className="rounded-[32px] bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar text-xs font-bold uppercase tracking-wider mb-3">
            <Compass size={14} />
            <span>पावन धाम एवं तीर्थ अन्वेषण (Dham & Tirtha Explorer)</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            श्री ब्रजमंडल एवं सनातन तीर्थ
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-sans mt-2 leading-relaxed">
            वृन्दावन, गिरिराज गोवर्धन, बरसाना और पावन धामों के मन्दिर, दर्शन एवं आरती समय, लीला प्रसंग तथा परिक्रमा पथ का सम्पूर्ण विवरण।
          </p>
        </div>

        {/* Search & Region Filter Bar */}
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
              placeholder="मन्दिर, तीर्थ, विग्रह अथवा लीला खोजें..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-sacred-kesar/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-700">
            {regionFilters.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-[8px] transition-colors ${
                  selectedRegion === reg.id
                    ? 'bg-sacred-kesar text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Places Cards Grid */}
      {filteredPlaces.length === 0 ? (
        /* Outer: rounded-[24px] p-8 -> Inner: rounded-[8px] (24 - 16 = 8) */
        <div className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <MapPin size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="font-serif text-lg font-bold text-neutral-700 dark:text-neutral-300">
            कोई तीर्थ स्थल नहीं मिला
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            कृपया अन्य नाम अथवा क्षेत्र का चयन करें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlaces.map((place) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <div
              key={place.id}
              className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-card flex flex-col justify-between hover:border-amber-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar">
                    {place.regionNameHindi}
                  </span>
                  {place.parikramaKm && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                      <Footprints size={12} className="text-sacred-kesar" />
                      <span>{place.parikramaKm} किमी परिक्रमा</span>
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => handleSelect(place.slug || place.id)}
                  className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:text-sacred-kesar cursor-pointer transition-colors leading-snug"
                >
                  {place.nameDevanagari}
                </h3>

                <div className="text-xs text-neutral-500 mt-0.5">
                  विग्रह: {place.deityDevanagari || place.deity}
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans mt-2 line-clamp-3 leading-relaxed">
                  {place.briefSignificance}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock size={12} className="text-sacred-kesar" />
                  <span>दर्शन व आरती समय उपलब्ध</span>
                </div>

                <button
                  onClick={() => handleSelect(place.slug || place.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-2xs"
                >
                  <span>दर्शन विवरण</span>
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
