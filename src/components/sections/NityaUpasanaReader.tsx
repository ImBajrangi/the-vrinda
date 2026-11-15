import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Flame,
  Bell,
  BellOff,
  Scroll,
  Search,
  ArrowLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Volume2,
} from 'lucide-react';
import {
  SacredRitual,
  SacredRitualPreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { chimeService } from '../../services/chimeService';

interface NityaUpasanaReaderProps {
  initialRitualSlug?: string;
  onSelectRitual?: (slug: string) => void;
}

export const NityaUpasanaReader: React.FC<NityaUpasanaReaderProps> = ({
  initialRitualSlug,
  onSelectRitual,
}) => {
  const [rituals, setRituals] = useState<SacredRitualPreview[]>([]);
  const [selectedRitual, setSelectedRitual] = useState<SacredRitual | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Reader state
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [showVidhiDrawer, setShowVidhiDrawer] = useState<boolean>(false);
  const [isChimeMuted, setIsChimeMuted] = useState<boolean>(() => chimeService.getMuted());
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 1 = slow, 2 = medium, 3 = fast
  const scrollIntervalRef = useRef<number | null>(null);

  // Subscribe to chime mute changes
  useEffect(() => {
    const unsub = chimeService.subscribe((muted) => {
      setIsChimeMuted(muted);
    });
    return unsub;
  }, []);

  // Load rituals index
  useEffect(() => {
    let isMounted = true;
    SacredSectionService.getRitualsIndex()
      .then((items) => {
        if (isMounted) {
          setRituals(items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const loadRitual = useCallback(async (slugOrId: string) => {
    const ritual = await SacredSectionService.getRitualById(slugOrId);
    if (ritual) {
      setSelectedRitual(ritual);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialRitualSlug) {
      loadRitual(initialRitualSlug);
    }
  }, [initialRitualSlug, loadRitual]);

  const handleSelect = (slug: string) => {
    loadRitual(slug);
    if (onSelectRitual) {
      onSelectRitual(slug);
    }
  };

  // Continuous Auto-Scroll Engine for Hands-Free Aarti / Chanting
  useEffect(() => {
    if (isAutoScrolling) {
      const stepPixels = scrollSpeed === 1 ? 1 : scrollSpeed === 2 ? 2 : 3;
      const intervalMs = scrollSpeed === 1 ? 40 : scrollSpeed === 2 ? 35 : 30;

      scrollIntervalRef.current = window.setInterval(() => {
        const atBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
        if (atBottom) {
          setIsAutoScrolling(false);
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
          }
        } else {
          window.scrollBy({ top: stepPixels, behavior: 'auto' });
        }
      }, intervalMs);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  const toggleAutoScroll = () => {
    setIsAutoScrolling((prev) => !prev);
  };

  const ringSacredBell = () => {
    chimeService.play('temple-bell', 0.6);
  };

  const toggleChimeMute = () => {
    const next = chimeService.toggleMuted();
    setIsChimeMuted(next);
  };

  const filteredRituals = useMemo(() => {
    return rituals.filter((r) => {
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.titleDevanagari.includes(searchQuery) ||
        r.deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.deityDevanagari.includes(searchQuery) ||
        r.tags.some((t) => t.includes(searchQuery));
      return matchesCat && matchesSearch;
    });
  }, [rituals, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'समस्त उपासना (All Rituals)' },
    { id: 'aarti', label: 'मंगल आरती' },
    { id: 'chalisa', label: 'चालीसा' },
    { id: 'ashtakam', label: 'अष्टकम' },
    { id: 'stotra', label: 'स्तोत्रम्' },
  ];

  const chantingFontSizeClasses = {
    normal: 'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    large: 'text-xl sm:text-2xl leading-loose font-medium',
    huge: 'text-2xl sm:text-3xl leading-loose sm:leading-loose font-semibold tracking-wide',
  }[fontSize];

  // ==========================================
  // VIEW: Active Ritual / Chanting Reader
  // ==========================================
  if (selectedRitual) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-36 text-sacred-ink dark:text-neutral-100">
        {/* Sticky Control Header */}
        {/* Outer: rounded-[24px] p-4 -> Inner: rounded-[8px] (24 - 16 = 8) */}
        <div className="sticky top-4 z-40 rounded-[24px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-4 shadow-nav mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setIsAutoScrolling(false);
                setSelectedRitual(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-sacred-kesar hover:bg-sacred-kesar/10 rounded-[8px] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>उपासना सूची</span>
            </button>

            {/* Chanting & Sound Tools */}
            <div className="flex items-center gap-2">
              {/* Sacred Temple Bell Ring Button */}
              <button
                onClick={ringSacredBell}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded-[8px] bg-gradient-to-r from-amber-500 to-sacred-kesar text-white hover:from-amber-600 hover:to-orange-700 transition-colors shadow-2xs"
                title="शुभ मन्दिर घण्टी बजाएं (Ring Temple Bell)"
              >
                <Bell size={15} />
                <span className="hidden sm:inline">दिव्य घण्टी</span>
              </button>

              {/* Bell Mute Toggle */}
              <button
                onClick={toggleChimeMute}
                className={`p-2 rounded-[8px] border transition-colors ${
                  isChimeMuted
                    ? 'text-neutral-400 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800'
                    : 'text-sacred-kesar border-sacred-kesar/30 bg-sacred-kesar/10'
                }`}
                title={isChimeMuted ? 'ध्वनि चालू करें' : 'ध्वनि म्यूट करें'}
              >
                {isChimeMuted ? <BellOff size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Hands-Free Auto Scroll Toggle */}
              <button
                onClick={toggleAutoScroll}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] border transition-colors ${
                  isAutoScrolling
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
                title="आरती थाल पकड़े-पकड़े स्वाचालित स्क्रॉल (Hands-free Continuous Scroll)"
              >
                {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
                <span className="hidden xs:inline">
                  {isAutoScrolling ? 'रोकें' : 'स्वचालित पाठ'}
                </span>
              </button>

              {/* Auto Scroll Speed selector if active */}
              {isAutoScrolling && (
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-[8px] p-0.5 border border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setScrollSpeed(1)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-[4px] ${
                      scrollSpeed === 1 ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setScrollSpeed(2)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-[4px] ${
                      scrollSpeed === 2 ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                    }`}
                  >
                    2x
                  </button>
                  <button
                    onClick={() => setScrollSpeed(3)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-[4px] ${
                      scrollSpeed === 3 ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                    }`}
                  >
                    3x
                  </button>
                </div>
              )}

              {/* Font Size Selector */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-[8px] p-0.5 border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] ${
                    fontSize === 'normal' ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                  }`}
                  title="सामान्य अक्षर"
                >
                  अ
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] ${
                    fontSize === 'large' ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                  }`}
                  title="मध्यम अक्षर"
                >
                  अ+
                </button>
                <button
                  onClick={() => setFontSize('huge')}
                  className={`px-2 py-1 text-xs font-semibold rounded-[4px] ${
                    fontSize === 'huge' ? 'bg-white dark:bg-neutral-900 text-sacred-kesar' : 'text-neutral-500'
                  }`}
                  title="विशाल पाठ अक्षर"
                >
                  अ++
                </button>
              </div>

              {/* Puja Vidhi Toggle Button */}
              <button
                onClick={() => setShowVidhiDrawer((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[8px] border transition-colors ${
                  showVidhiDrawer
                    ? 'bg-sacred-kesar text-white border-sacred-kesar'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                <Flame size={14} className={showVidhiDrawer ? 'text-white' : 'text-sacred-kesar'} />
                <span>पूजा-विधि</span>
              </button>
            </div>
          </div>
        </div>

        {/* Puja Vidhi Drawer / Modal Card */}
        {showVidhiDrawer && (
          /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
          <div className="rounded-[28px] bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-neutral-900 dark:to-neutral-950 border-2 border-sacred-kesar/40 p-5 shadow-card mb-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sacred-kesar font-serif font-bold text-base">
                <Flame size={18} />
                <span>पूजा-विधि, सामग्री एवं फलश्रुति (Puja Vidhi & Procedure)</span>
              </div>
              <button
                onClick={() => setShowVidhiDrawer(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 px-2 py-1 rounded-[4px]"
              >
                बन्द करें ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {selectedRitual.pujaVidhi.timing && (
                <div>
                  <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100 block mb-0.5">
                    शुभ समय / मुहूर्त:
                  </span>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {selectedRitual.pujaVidhi.timing}
                  </p>
                </div>
              )}

              {selectedRitual.pujaVidhi.requiredItems &&
                selectedRitual.pujaVidhi.requiredItems.length > 0 && (
                  <div>
                    <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100 block mb-1">
                      आवश्यक पूजन सामग्री:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRitual.pujaVidhi.requiredItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs rounded-[8px] bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedRitual.pujaVidhi.steps && selectedRitual.pujaVidhi.steps.length > 0 && (
                <div>
                  <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100 block mb-1">
                    क्रमबद्ध पाठ व उपासना विधि:
                  </span>
                  <ol className="space-y-1.5 list-decimal list-inside text-neutral-700 dark:text-neutral-300">
                    {selectedRitual.pujaVidhi.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedRitual.pujaVidhi.benefits && (
                /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
                <div className="rounded-[8px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3">
                  <span className="font-serif font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    फलश्रुति एवं महात्म्य:
                  </span>
                  <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    {selectedRitual.pujaVidhi.benefits}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ritual Title Card */}
        {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
        <div className="rounded-[32px] bg-gradient-to-b from-amber-50 via-white to-orange-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar text-xs font-bold uppercase tracking-wider mb-2">
            <Flame size={14} />
            <span>{selectedRitual.categoryHindi}</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug">
            {selectedRitual.titleDevanagari}
          </h1>

          <div className="text-sm font-sans text-neutral-500 mt-2">
            आराध्य: {selectedRitual.deityDevanagari} {selectedRitual.author ? `• रचयिता: ${selectedRitual.author}` : ''}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} />
              <span>लगभग {selectedRitual.durationMinutes} मिनट</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Scroll size={13} />
              <span>{selectedRitual.totalVerses} पद / छंद</span>
            </span>
          </div>
        </div>

        {/* Stanzas Chanting List */}
        <div className="space-y-6">
          {selectedRitual.stanzas.map((stanza) => (
            /* Outer: rounded-[28px] p-6 -> Inner: rounded-[4px] (28 - 24 = 4) */
            <div
              key={stanza.stanzaNumber}
              className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-card text-center"
            >
              <div className="w-8 h-8 rounded-[4px] bg-amber-100 dark:bg-neutral-800 text-sacred-kesar text-xs font-bold flex items-center justify-center mx-auto mb-4">
                {stanza.stanzaNumber}
              </div>

              {/* Chanting Devanagari Verses */}
              <div
                className={`font-serif text-neutral-900 dark:text-amber-50 space-y-1.5 ${chantingFontSizeClasses}`}
              >
                {stanza.textDevanagari.map((line, lIdx) => (
                  <div key={lIdx} className="tracking-wide">
                    {line}
                  </div>
                ))}
              </div>

              {/* Hindi Meaning / Bhava if available */}
              {stanza.meaning && (
                /* Outer: rounded-[16px] p-3 -> Inner: rounded-[4px] (16 - 12 = 4) */
                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                  <span className="font-semibold text-sacred-kesar">भावार्थ: </span>
                  {stanza.meaning}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Completion Card */}
        {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
        <div className="mt-8 rounded-[28px] bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-emerald-200 dark:border-emerald-900/40 p-5 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 font-serif font-bold text-base mb-1">
            <CheckCircle2 size={18} />
            <span>आरती एवं पाठ सम्पूर्ण</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-sans">
            ॥ श्री बांके बिहारी राधा रमण लाल की जय ॥ श्री यमुना महारानी की जय ॥
          </p>
          <button
            onClick={() => {
              ringSacredBell();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-serif font-bold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-2xs"
          >
            <Bell size={14} />
            <span>आरती समर्पण एवं घण्टी नाद</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: Rituals Directory / Listing
  // ==========================================
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 text-sacred-ink dark:text-neutral-100">
      {/* Directory Hero */}
      {/* Outer: rounded-[32px] p-6 -> Inner: rounded-[8px] (32 - 24 = 8) */}
      <div className="rounded-[32px] bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-amber-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-card mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar text-xs font-bold uppercase tracking-wider mb-3">
            <Flame size={14} />
            <span>नित्य उपासना एवं पाठ (Nitya Upasana & Chanting)</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            मंगल आरती, चालीसा एवं स्तोत्र
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-sans mt-2 leading-relaxed">
            दैनिक पूजा, संध्या आरती और नित्य उपासना हेतु विशाल अक्षरों में देवनागरी पाठ, पूजा-विधि, स्वचालित स्क्रॉल और पावन मन्दिर घण्टी नाद।
          </p>
        </div>

        {/* Search & Category Filter */}
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
              placeholder="आरती, चालीसा, स्तोत्र अथवा आराध्य खोजें..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-sacred-kesar/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-700">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-[8px] transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-sacred-kesar text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rituals Grid */}
      {filteredRituals.length === 0 ? (
        /* Outer: rounded-[24px] p-8 -> Inner: rounded-[8px] (24 - 16 = 8) */
        <div className="rounded-[24px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <Scroll size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="font-serif text-lg font-bold text-neutral-700 dark:text-neutral-300">
            कोई उपासना पाठ नहीं मिला
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            कृपया अन्य शब्द खोजें अथवा फ़िल्टर बदलें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRituals.map((ritual) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <div
              key={ritual.id}
              className="rounded-[28px] bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-card flex flex-col justify-between hover:border-amber-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-[8px] bg-sacred-kesar/10 text-sacred-kesar">
                    {ritual.categoryHindi}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    लगभग {ritual.durationMinutes} मि.
                  </span>
                </div>

                <h3
                  onClick={() => handleSelect(ritual.slug || ritual.id)}
                  className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 hover:text-sacred-kesar cursor-pointer transition-colors leading-snug"
                >
                  {ritual.titleDevanagari}
                </h3>

                <div className="text-xs text-neutral-500 mt-1">
                  आराध्य: {ritual.deityDevanagari}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Scroll size={13} className="text-sacred-kesar" />
                    <span>{ritual.totalVerses} पद / छंद</span>
                  </span>
                  <span>•</span>
                  <span>पूजा-विधि सहित</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => ringSacredBell()}
                  className="p-1.5 rounded-[8px] text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-800 transition-colors"
                  title="घण्टी बजाएं"
                >
                  <Bell size={16} />
                </button>

                <button
                  onClick={() => handleSelect(ritual.slug || ritual.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-sacred-kesar text-white hover:bg-orange-700 transition-colors shadow-2xs"
                >
                  <Flame size={13} />
                  <span>पाठ प्रारम्भ</span>
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
