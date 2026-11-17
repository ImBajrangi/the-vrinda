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
  X,
  Share2,
  Check
} from 'lucide-react';
import {
  SacredRitual,
  SacredRitualPreview,
} from '../../types/sacredSections';
import { SacredSectionService } from '../../services/sacredSectionService';
import { formatDevanagariNumerals } from '../../services/cacheService';
import { chimeService } from '../../services/chimeService';
import { seo } from '../../services/seoService';

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
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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
      chimeService.playChime('temple-bell');
    }
  }, []);

  // Handle deep link
  useEffect(() => {
    if (initialRitualSlug) {
      loadRitual(initialRitualSlug);
    }
  }, [initialRitualSlug, loadRitual]);

  // Synchronize SEO metadata dynamically
  useEffect(() => {
    if (selectedRitual) {
      seo.updateSEO({
        tab: 'rituals',
        title: `${selectedRitual.titleDevanagari} (${selectedRitual.categoryHindi}) • नित्य पाठ, पूजा विधि व आरती | वृन्दोपनिषद् 2.0`,
        description: `${selectedRitual.titleDevanagari}। आराध्य: ${selectedRitual.deityDevanagari}। देवनागरी संपूर्ण पाठ, पूजा-विधि, स्वचालित स्वाध्याय एवं शुभ घण्टी नाद।`,
      });
    } else {
      seo.updateSEO({
        tab: 'rituals',
        title: 'नित्य मंगल आरती, चालीसा एवं स्तोत्र संग्रह • दैनिक उपासना व पाठ | वृन्दोपनिषद् 2.0',
        description: 'दैनिक पूजा, संध्या आरती और नित्य उपासना हेतु शुद्ध देवनागरी पाठ, क्रमबद्ध पूजा-विधि, स्वचालित स्वाध्याय स्क्रॉल और पावन मन्दिर घण्टी नाद।',
      });
    }
  }, [selectedRitual]);

  const handleSelect = (slug: string) => {
    loadRitual(slug);
    if (onSelectRitual) {
      onSelectRitual(slug);
    }
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'rituals');
        url.searchParams.set('ritual', slug);
        window.history.pushState({}, '', url.toString());
      } catch {}
    }
  };

  const handleBackToDirectory = () => {
    setIsAutoScrolling(false);
    setSelectedRitual(null);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('ritual');
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
    chimeService.playChime('temple-bell');
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
    { id: 'all', label: 'समस्त उपासना' },
    { id: 'aarti', label: 'मंगल आरती' },
    { id: 'chalisa', label: 'चालीसा' },
    { id: 'ashtakam', label: 'अष्टकम' },
    { id: 'stotra', label: 'स्तोत्रम्' },
  ];

  const chantingFontSizeClasses = {
    normal: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    large: 'text-lg sm:text-xl leading-loose font-medium',
    huge: 'text-xl sm:text-2xl leading-loose sm:leading-loose font-semibold tracking-wide',
  }[fontSize];

  // ==========================================
  // VIEW: Active Ritual / Chanting Reader
  // ==========================================
  if (selectedRitual) {
    return (
      <main
        role="main"
        aria-label={`${selectedRitual.titleDevanagari} पाठ`}
        className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-36 text-[#18181B]"
      >
        {/* Sticky Control Header */}
        {/* Outer: rounded-[28px] p-3.5 sm:p-4 -> Inner: rounded-[12px] (28 - 16 = 12) */}
        <div className="sticky top-4 z-40 rounded-[28px] bg-white/95 backdrop-blur-md border border-neutral-200/90 p-3.5 sm:p-4 shadow-2xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleBackToDirectory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-amber-300 rounded-[10px] transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>उपासना सूची</span>
            </button>

            {/* Chanting & Sound Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Sacred Temple Bell Ring Button */}
              <button
                type="button"
                onClick={ringSacredBell}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-[#FEF08A] text-[#78350F] hover:bg-amber-300 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="शुभ मन्दिर घण्टी बजाएं"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">घण्टी नाद</span>
              </button>

              {/* Bell Mute Toggle */}
              <button
                type="button"
                onClick={toggleChimeMute}
                className={`p-1.5 rounded-[8px] border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isChimeMuted
                    ? 'text-neutral-400 border-neutral-200 bg-stone-100'
                    : 'text-[#78350F] border-amber-300 bg-amber-50'
                }`}
                title={isChimeMuted ? 'ध्वनि चालू करें' : 'ध्वनि म्यूट करें'}
              >
                {isChimeMuted ? <BellOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Hands-Free Auto Scroll Toggle */}
              <button
                type="button"
                onClick={toggleAutoScroll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isAutoScrolling
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-stone-50'
                }`}
                title="आरती थाल पकड़े-पकड़े स्वचालित स्वाध्याय"
              >
                {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">
                  {isAutoScrolling ? 'रोकें' : 'स्वचालित पाठ'}
                </span>
              </button>

              {/* Auto Scroll Speed selector if active */}
              {isAutoScrolling && (
                <div className="flex items-center bg-stone-100 rounded-[8px] p-0.5 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setScrollSpeed(1)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[4px] cursor-pointer ${
                      scrollSpeed === 1 ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrollSpeed(2)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[4px] cursor-pointer ${
                      scrollSpeed === 2 ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                    }`}
                  >
                    2x
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrollSpeed(3)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[4px] cursor-pointer ${
                      scrollSpeed === 3 ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                    }`}
                  >
                    3x
                  </button>
                </div>
              )}

              {/* Font Size Selector */}
              <div className="flex items-center bg-stone-100 rounded-[8px] p-0.5 border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 text-xs font-serif font-semibold rounded-[4px] cursor-pointer ${
                    fontSize === 'normal' ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                  }`}
                  title="सामान्य अक्षर"
                >
                  अ
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 text-xs font-serif font-semibold rounded-[4px] cursor-pointer ${
                    fontSize === 'large' ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                  }`}
                  title="मध्यम अक्षर"
                >
                  अ+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('huge')}
                  className={`px-2 py-0.5 text-xs font-serif font-semibold rounded-[4px] cursor-pointer ${
                    fontSize === 'huge' ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                  }`}
                  title="विशाल पाठ अक्षर"
                >
                  अ++
                </button>
              </div>

              {/* Puja Vidhi Toggle Button */}
              <button
                type="button"
                onClick={() => setShowVidhiDrawer((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  showVidhiDrawer
                    ? 'bg-[#FEF08A] text-[#78350F] border-amber-300'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-stone-50'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${showVidhiDrawer ? 'text-[#78350F]' : 'text-amber-700'}`} />
                <span>पूजा-विधि</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="शेयर लिंक कॉपी करें"
                className="p-1.5 rounded-[8px] bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Puja Vidhi Drawer / Modal Card */}
        {showVidhiDrawer && (
          /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
          <div className="rounded-[28px] bg-[#FAF6EE] border-2 border-amber-300/80 p-5 shadow-2xs mb-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-200/80">
              <div className="flex items-center gap-2 text-[#78350F] font-serif font-bold text-base">
                <Flame className="w-4 h-4 text-amber-700" />
                <span>पूजा-विधि, सामग्री एवं फलश्रुति</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVidhiDrawer(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded cursor-pointer"
              >
                बन्द करें ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm font-serif">
              {selectedRitual.pujaVidhi.timing && (
                <div>
                  <span className="font-bold text-[#18181B] block mb-0.5">
                    शुभ समय / मुहूर्त:
                  </span>
                  <p className="text-neutral-700">
                    {selectedRitual.pujaVidhi.timing}
                  </p>
                </div>
              )}

              {selectedRitual.pujaVidhi.requiredItems &&
                selectedRitual.pujaVidhi.requiredItems.length > 0 && (
                  <div>
                    <span className="font-bold text-[#18181B] block mb-1">
                      आवश्यक पूजन सामग्री:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRitual.pujaVidhi.requiredItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs rounded-[6px] bg-white text-[#78350F] border border-amber-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedRitual.pujaVidhi.steps && selectedRitual.pujaVidhi.steps.length > 0 && (
                <div>
                  <span className="font-bold text-[#18181B] block mb-1">
                    क्रमबद्ध पाठ व उपासना विधि:
                  </span>
                  <ol className="space-y-1.5 list-decimal list-inside text-neutral-700">
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
                <div className="rounded-[8px] bg-white border border-emerald-200 p-3">
                  <span className="font-bold text-emerald-800 block mb-0.5">
                    फलश्रुति एवं महात्म्य:
                  </span>
                  <p className="text-emerald-950 leading-relaxed">
                    {selectedRitual.pujaVidhi.benefits}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ritual Title Card */}
        {/* Outer: rounded-[28px] p-6 sm:p-7 -> Inner: rounded-[4px] (28 - 24 = 4) */}
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-7 shadow-2xs text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>{selectedRitual.categoryHindi}</span>
          </div>

          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] leading-snug">
            {selectedRitual.titleDevanagari}
          </h1>

          <div className="text-xs sm:text-sm font-serif text-neutral-500 mt-1.5">
            आराध्य: <span className="font-bold text-neutral-800">{selectedRitual.deityDevanagari}</span> {selectedRitual.author ? `• रचयिता: ${selectedRitual.author}` : ''}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs font-serif text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>लगभग {formatDevanagariNumerals(selectedRitual.durationMinutes)} मिनट</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Scroll className="w-3.5 h-3.5 text-amber-700" />
              <span>{formatDevanagariNumerals(selectedRitual.totalVerses)} पद / छंद</span>
            </span>
          </div>
        </div>

        {/* Stanzas Chanting List */}
        <div className="space-y-4 sm:space-y-5">
          {selectedRitual.stanzas.map((stanza) => (
            /* Outer: rounded-[28px] p-6 -> Inner: rounded-[4px] (28 - 24 = 4) */
            <article
              key={stanza.stanzaNumber}
              className="rounded-[28px] bg-white border border-neutral-200/80 p-5 sm:p-7 shadow-2xs text-center"
            >
              <div className="w-8 h-8 rounded-[4px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold flex items-center justify-center mx-auto mb-3">
                {formatDevanagariNumerals(stanza.stanzaNumber)}
              </div>

              {/* Chanting Devanagari Verses */}
              <div
                className={`font-serif text-[#18181B] space-y-1.5 ${chantingFontSizeClasses}`}
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
                <div className="mt-4 pt-3 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600 font-serif leading-relaxed">
                  <span className="font-bold text-[#78350F]">भावार्थ: </span>
                  {stanza.meaning}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Completion Card */}
        {/* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */}
        <div className="mt-8 rounded-[28px] bg-[#FAF6EE] border border-amber-200/80 p-5 shadow-2xs text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-800 font-serif font-bold text-base">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>आरती एवं पाठ सम्पूर्ण</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-700 font-serif">
            ॥ श्री बांके बिहारी राधा रमण लाल की जय ॥ श्री यमुना महारानी की जय ॥
          </p>
          <button
            type="button"
            onClick={() => {
              ringSacredBell();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-serif font-bold rounded-[8px] bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>आरती समर्पण एवं घण्टी नाद</span>
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW: Rituals Directory / Listing
  // ==========================================
  return (
    <main
      role="main"
      aria-label="नित्य उपासना एवं पाठ संग्रह"
      className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-28 text-[#18181B]"
    >
      {/* Directory Hero Deck */}
      {/* Outer: rounded-[28px] p-6 sm:p-7 -> Inner: rounded-[8px] (28 - 20 = 8) */}
      <div className="rounded-[28px] bg-white border border-neutral-200/80 p-6 sm:p-7 shadow-2xs mb-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>॥ नित्य उपासना एवं पाठ ॥</span>
          </div>
          <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
            मंगल आरती, चालीसा एवं स्तोत्र
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-serif mt-1.5 leading-relaxed">
            दैनिक पूजा, संध्या आरती और नित्य उपासना हेतु विशाल अक्षरों में शुद्ध देवनागरी पाठ, पूजा-विधि, स्वचालित स्वाध्याय स्क्रॉल और पावन मन्दिर घण्टी नाद।
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        {/* Outer: rounded-[20px] p-3 -> Inner: rounded-[8px] (20 - 12 = 8) */}
        <div
          role="search"
          aria-label="उपासना खोजें"
          className="mt-5 rounded-[20px] bg-[#FAF6EE] border border-amber-200/70 p-3 shadow-2xs space-y-3"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="आरती, चालीसा, स्तोत्र अथवा आराध्य खोजें..."
              aria-label="आरती अथवा स्तोत्र खोजें"
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
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-serif font-semibold whitespace-nowrap rounded-[8px] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selectedCategory === cat.id
                      ? 'bg-[#FEF08A] text-[#78350F] font-bold shadow-2xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-serif text-neutral-500 shrink-0 font-medium hidden sm:block">
              {formatDevanagariNumerals(filteredRituals.length)} स्तुतियाँ उपलब्ध
            </div>
          </div>
        </div>
      </div>

      {/* Rituals Grid */}
      {filteredRituals.length === 0 ? (
        /* Outer: rounded-[28px] p-8 -> Inner: rounded-[8px] (28 - 20 = 8) */
        <div className="rounded-[28px] bg-white border border-neutral-200/80 p-8 text-center space-y-2">
          <Scroll className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई उपासना पाठ नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-serif">
            कृपया अन्य शब्द खोजें अथवा फ़िल्टर बदलें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredRituals.map((ritual) => (
            /* Outer: rounded-[28px] p-5 -> Inner: rounded-[8px] (28 - 20 = 8) */
            <article
              key={ritual.id}
              className="rounded-[28px] bg-white border border-neutral-200/80 p-5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-[10.5px] font-serif font-bold rounded-[6px] bg-[#FEF08A] text-[#78350F]">
                    {ritual.categoryHindi}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-serif font-medium">
                    लगभग {formatDevanagariNumerals(ritual.durationMinutes)} मि.
                  </span>
                </div>

                <h2
                  onClick={() => handleSelect(ritual.slug || ritual.id)}
                  className="font-rozha text-base sm:text-lg font-bold text-[#18181B] hover:text-[#B45309] cursor-pointer transition-colors leading-snug"
                >
                  {ritual.titleDevanagari}
                </h2>

                <div className="text-xs text-neutral-500 font-serif mt-0.5">
                  आराध्य: <span className="font-semibold text-neutral-700">{ritual.deityDevanagari}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-serif">
                  <Scroll className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{formatDevanagariNumerals(ritual.totalVerses)} पद / छंद</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(ritual.slug || ritual.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-bold rounded-[8px] bg-[#FEF08A] hover:bg-amber-300 text-[#78350F] transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                >
                  <span>पाठ करें</span>
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
