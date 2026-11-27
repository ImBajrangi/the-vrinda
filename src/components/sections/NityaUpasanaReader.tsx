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
import { getRitualArtwork, getArtworkObjectPosition } from '../../services/devotionalVisuals';
import { SacredDiscoveryShelf } from '../common/SacredDiscoveryShelf';

interface NityaUpasanaReaderProps {
  initialRitualSlug?: string;
  initialRitual?: SacredRitual | null;
  onSelectRitual?: (slug: string) => void;
}

export const NityaUpasanaReader: React.FC<NityaUpasanaReaderProps> = ({
  initialRitualSlug,
  initialRitual = null,
  onSelectRitual,
}) => {
  const [rituals, setRituals] = useState<SacredRitualPreview[]>([]);
  const [selectedRitual, setSelectedRitual] = useState<SacredRitual | null>(() => initialRitual || null);
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

  // Subscribe to chime mute changes and stop any ringing chime on unmount
  useEffect(() => {
    const unsub = chimeService.subscribe((muted) => {
      setIsChimeMuted(muted);
    });
    return () => {
      unsub();
      chimeService.stop();
    };
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
        window.history.pushState({}, '', `/ritual/${encodeURIComponent(slug)}`);
      } catch {}
    }
  };

  const handleBackToDirectory = () => {
    chimeService.stop();
    setIsAutoScrolling(false);
    setSelectedRitual(null);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', '/rituals');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = selectedRitual
        ? `${window.location.origin}/ritual/${encodeURIComponent(selectedRitual.slug || selectedRitual.id)}`
        : window.location.href;
      navigator.clipboard?.writeText(shareUrl);
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
    const q = searchQuery.trim().toLowerCase();
    return rituals.filter((r) => {
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesSearch =
        q === '' ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.titleDevanagari || '').includes(searchQuery) ||
        (r.deity || '').toLowerCase().includes(q) ||
        (r.deityDevanagari || '').includes(searchQuery) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(q));
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
    const ritualArt = getRitualArtwork(selectedRitual);
    return (
      <main
        role="main"
        aria-label={`${selectedRitual.titleDevanagari} पाठ`}
        className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-36 text-[#18181B]"
      >
        {/* Sticky Control Header */}
        <div className="sticky top-4 z-40 rounded-[24px] bg-white/[0.98] p-3.5 sm:p-4 shadow-[0_6px_24px_rgba(24,24,27,0.06)] mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleBackToDirectory}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif font-bold text-[#78350F] bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>उपासना सूची</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={ringSacredBell}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-full bg-[#FEF08A] text-[#78350F] hover:bg-[#FDE047] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="शुभ मन्दिर घण्टी बजाएं"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">घण्टी नाद</span>
              </button>

              <button
                type="button"
                onClick={toggleChimeMute}
                className={`p-2 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isChimeMuted
                    ? 'text-neutral-400 bg-[#FAF6EE]'
                    : 'text-[#78350F] bg-amber-50'
                }`}
                title={isChimeMuted ? 'ध्वनि चालू करें' : 'ध्वनि म्यूट करें'}
              >
                {isChimeMuted ? <BellOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleAutoScroll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isAutoScrolling
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FAF6EE] text-neutral-700 hover:bg-[#EFE7D8]'
                }`}
                title="आरती थाल पकड़े-पकड़े स्वचालित स्वाध्याय"
              >
                {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">
                  {isAutoScrolling ? 'रोकें' : 'स्वचालित पाठ'}
                </span>
              </button>

              {isAutoScrolling && (
                <div className="flex items-center bg-[#FAF6EE] rounded-full p-0.5">
                  {[1, 2, 3].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setScrollSpeed(spd)}
                      className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full cursor-pointer ${
                        scrollSpeed === spd ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center bg-[#FAF6EE] rounded-full p-0.5">
                {(['normal', 'large', 'huge'] as const).map((sz, i) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontSize(sz)}
                    className={`px-2 py-0.5 text-xs font-serif font-semibold rounded-full cursor-pointer ${
                      fontSize === sz ? 'bg-white text-[#78350F] shadow-2xs' : 'text-neutral-500'
                    }`}
                  >
                    {i === 0 ? 'अ' : i === 1 ? 'अ+' : 'अ++'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowVidhiDrawer((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  showVidhiDrawer
                    ? 'bg-[#FEF08A] text-[#78350F]'
                    : 'bg-[#FAF6EE] text-neutral-700 hover:bg-[#EFE7D8]'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${showVidhiDrawer ? 'text-[#78350F]' : 'text-amber-700'}`} />
                <span>पूजा-विधि</span>
              </button>

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
        </div>

        {/* Puja Vidhi Drawer */}
        {showVidhiDrawer && (
          <div className="rounded-[24px] bg-[#FAF8F4] p-5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#78350F] font-serif font-bold text-base">
                <Flame className="w-4 h-4 text-amber-700" />
                <span>पूजा-विधि, सामग्री एवं फलश्रुति</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVidhiDrawer(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded-full cursor-pointer"
              >
                बन्द करें ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm font-serif">
              {selectedRitual.pujaVidhi.timing && (
                <div>
                  <span className="font-bold text-[#18181B] block mb-0.5">शुभ समय / मुहूर्त:</span>
                  <p className="text-neutral-700">{selectedRitual.pujaVidhi.timing}</p>
                </div>
              )}

              {selectedRitual.pujaVidhi.requiredItems &&
                selectedRitual.pujaVidhi.requiredItems.length > 0 && (
                  <div>
                    <span className="font-bold text-[#18181B] block mb-1.5">आवश्यक पूजन सामग्री:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRitual.pujaVidhi.requiredItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs rounded-full bg-white text-[#78350F] shadow-2xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedRitual.pujaVidhi.steps && selectedRitual.pujaVidhi.steps.length > 0 && (
                <div>
                  <span className="font-bold text-[#18181B] block mb-1">क्रमबद्ध पाठ व उपासना विधि:</span>
                  <ol className="space-y-1.5 list-decimal list-inside text-neutral-700">
                    {selectedRitual.pujaVidhi.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedRitual.pujaVidhi.benefits && (
                <div className="rounded-[12px] bg-white p-3.5">
                  <span className="font-bold text-emerald-800 block mb-0.5">फलश्रुति एवं महात्म्य:</span>
                  <p className="text-emerald-950 leading-relaxed">{selectedRitual.pujaVidhi.benefits}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ritual Title Card */}
        <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.03)] mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[14px] overflow-hidden bg-[#EFE7D8] shrink-0">
              <img
                src={ritualArt}
                alt={selectedRitual.deityDevanagari}
                className={`w-full h-full object-cover ${getArtworkObjectPosition(ritualArt)}`}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>{selectedRitual.categoryHindi}</span>
              </div>

              <h1 className="font-rozha text-2xl sm:text-4xl font-bold text-[#18181B] leading-snug">
                {selectedRitual.titleDevanagari}
              </h1>

              <div className="text-xs sm:text-sm font-serif text-neutral-500 mt-1.5">
                आराध्य: <span className="font-bold text-neutral-800">{selectedRitual.deityDevanagari}</span>{' '}
                {selectedRitual.author ? `• रचयिता: ${selectedRitual.author}` : ''}
              </div>

              <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-xs font-serif text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{formatDevanagariNumerals(selectedRitual.durationMinutes)} मिनट</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Scroll className="w-3.5 h-3.5 text-amber-700" />
                  <span>{formatDevanagariNumerals(selectedRitual.totalVerses)} पद / छंद</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stanzas Chanting List */}
        <div className="space-y-4">
          {selectedRitual.stanzas.map((stanza) => (
            <article
              key={stanza.stanzaNumber}
              className="rounded-[24px] bg-white p-5 sm:p-7 shadow-[0_2px_14px_rgba(24,24,27,0.03)] text-center"
            >
              <div className="w-8 h-8 rounded-full bg-[#FEF08A] text-[#78350F] text-xs font-serif font-bold flex items-center justify-center mx-auto mb-3">
                {formatDevanagariNumerals(stanza.stanzaNumber)}
              </div>

              <div className={`font-serif text-[#18181B] space-y-1.5 ${chantingFontSizeClasses}`}>
                {stanza.textDevanagari.map((line, lIdx) => (
                  <div key={lIdx} className="tracking-wide">{line}</div>
                ))}
              </div>

              {stanza.meaning && (
                <div className="mt-4 rounded-[12px] bg-[#FAF8F4] px-4 py-2.5 text-xs sm:text-sm text-neutral-600 font-serif leading-relaxed">
                  <span className="font-bold text-[#78350F]">भावार्थ: </span>
                  {stanza.meaning}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Completion Card */}
        <div className="mt-6 rounded-[24px] bg-[#FAF8F4] p-5 text-center space-y-2">
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
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-serif font-bold rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>आरती समर्पण एवं घण्टी नाद</span>
          </button>
        </div>

        <SacredDiscoveryShelf
          entityType="ritual"
          entitySlug={selectedRitual.slug}
          title={`${selectedRitual.titleDevanagari} • आगे की उपासना यात्रा`}
        />
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
      className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-28 text-[#18181B]"
    >
      {/* Compact Borderless Header + Search + Category Filter Bar */}
      <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-laila font-bold text-amber-800">
              <Flame className="w-3.5 h-3.5" />
              <span>नित्य उपासना एवं पाठ</span>
              <span className="text-neutral-300">·</span>
              <span>{formatDevanagariNumerals(filteredRituals.length)} स्तुतियाँ</span>
            </div>
            <h1 className="font-rozha text-2xl sm:text-3xl text-[#18181B] leading-tight">
              मंगल आरती, चालीसा एवं स्तोत्र
            </h1>
            <p className="text-xs sm:text-[13px] text-neutral-600 font-laila leading-relaxed">
              दैनिक पूजा व नित्य उपासना हेतु शुद्ध देवनागरी पाठ, पूजा-विधि, स्वचालित स्वाध्याय और शुभ घण्टी नाद।
            </p>
          </div>

          <div role="search" aria-label="उपासना खोजें" className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="आरती, चालीसा या आराध्य खोजें..."
              aria-label="आरती अथवा स्तोत्र खोजें"
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
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-laila whitespace-nowrap rounded-full transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                selectedCategory === cat.id
                  ? 'bg-[#FEF08A] text-[#78350F] font-bold'
                  : 'bg-[#FAF8F4] text-neutral-600 hover:bg-[#F3ECE0] font-medium'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rituals Grid */}
      {filteredRituals.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center space-y-2 shadow-[0_2px_14px_rgba(24,24,27,0.025)]">
          <Scroll className="mx-auto w-10 h-10 text-neutral-300 mb-2" />
          <h2 className="font-rozha text-lg font-bold text-neutral-800">
            कोई उपासना पाठ नहीं मिला
          </h2>
          <p className="text-xs text-neutral-500 font-laila">
            कृपया अन्य शब्द खोजें अथवा फ़िल्टर बदलें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredRituals.map((ritual, idx) => {
            const art = getRitualArtwork(ritual);
            return (
              <article
                key={ritual.id}
                onClick={() => handleSelect(ritual.slug || ritual.id)}
                className="group rounded-[24px] bg-white hover:bg-[#FFFDF9] p-3.5 shadow-[0_2px_14px_rgba(24,24,27,0.03)] flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  {/* Clean Concentric Deity / Aarti Plate (24 - 14 = 10px) */}
                  <div className="aspect-[16/10] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8] mb-3.5">
                    <img
                      src={art}
                      alt={ritual.titleDevanagari}
                      className={`w-full h-full object-cover ${getArtworkObjectPosition(art)}`}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>

                  <div className="px-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10.5px] font-laila font-bold rounded-full bg-[#FAF6EE] text-[#78350F] truncate">
                        {ritual.categoryHindi}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-laila shrink-0">
                        {formatDevanagariNumerals(ritual.durationMinutes)} मि.
                      </span>
                    </div>

                    <h2 className="font-rozha text-lg text-[#18181B] group-hover:text-[#B45309] transition-colors leading-snug line-clamp-2">
                      {ritual.titleDevanagari}
                    </h2>

                    <div className="text-xs text-neutral-500 font-laila mt-1 truncate">
                      आराध्य: <span className="font-semibold text-neutral-700">{ritual.deityDevanagari}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 px-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-laila">
                    <Scroll className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{formatDevanagariNumerals(ritual.totalVerses)} पद / छंद</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(ritual.slug || ritual.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-laila font-bold rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                  >
                    <span>पाठ करें</span>
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
