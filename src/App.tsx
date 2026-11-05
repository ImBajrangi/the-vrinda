import { useState, useEffect } from 'react';
import { Flame, Radio, Sun, Compass, Heart, Waves, Music2, Wind } from 'lucide-react';
import { FloatingNavbar, NavTab } from './components/common/FloatingNavbar';
import { DynamicNotchNavbar } from './components/common/DynamicNotchNavbar';
import { DateStrip, DayItem } from './components/smaran/DateStrip';
import { DotGridChart } from './components/smaran/DotGridChart';
import { MacroRow } from './components/smaran/MacroRow';
import { CategoryCircle } from './components/smaran/CategoryCircle';
import { NityaSevaCard } from './components/smaran/NityaSevaCard';
import { FeedCard } from './components/feed/FeedCard';
import { MilestonesView } from './components/milestones/MilestonesView';
import { PadavaliReader } from './components/reader/PadavaliReader';
import { FloatingAudioPlayer } from './components/player/FloatingAudioPlayer';
import { SpotlightSearchModal } from './components/common/SpotlightSearchModal';
import { SaintsDirectoryModal } from './components/common/SaintsDirectoryModal';
import { DhyanaFocusModal } from './components/focus/DhyanaFocusModal';
import { SACRED_FEED_POSTS } from './data/feed';
import { SACRED_PADS } from './data/padas';
import { SacredPad, SadhanaState, DhyanaImpactState, DhyanaSessionRecord } from './types/devotional';
import {
  loadCachedSadhanaSync,
  loadCachedSadhana,
  persistSadhana,
  computeMantraCount,
  computeProgressPercent,
  formatDevanagariNumerals,
  getFeedInteractionsSync,
  initMultiTabSync,
  computeAshtayamaPhase,
  loadDhyanaImpactSync,
  loadDhyanaImpact,
  recordDhyanaSession,
} from './services/cacheService';

export type FeedTabType = 'विशेष दर्शन' | 'उत्सव धारा' | 'सेवक मंडल' | 'उर धरे' | 'धाम वार्ता';

const BRAJ_FEED_TABS: { id: FeedTabType; label: string; sublabel: string }[] = [
  { id: 'विशेष दर्शन', label: 'विशेष दर्शन', sublabel: 'Vishesh Darshan' },
  { id: 'उत्सव धारा', label: 'उत्सव धारा', sublabel: 'Utsav Dhara' },
  { id: 'सेवक मंडल', label: 'सेवक मंडल', sublabel: 'Sevak Mandal' },
  { id: 'उर धरे', label: 'उर धरे', sublabel: 'Ur Dhare' },
  { id: 'धाम वार्ता', label: 'धाम वार्ता', sublabel: 'Dham Varta' },
];

const SAMPLE_DAYS: DayItem[] = [
  { dayName: 'Mon', dateNum: 24, tithiLabel: 'नवमी' },
  { dayName: 'Tue', dateNum: 25, tithiLabel: 'दशमी' },
  { dayName: 'Wed', dateNum: 26, tithiLabel: 'एकादशी' },
  { dayName: 'Thu', dateNum: 27, isToday: true, tithiLabel: 'द्वादशी' },
  { dayName: 'Fri', dateNum: 28 },
  { dayName: 'Sat', dateNum: 29 },
  { dayName: 'Sun', dateNum: 30, tithiLabel: 'पूर्णिमा' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab') as NavTab;
        if (t && ['smaran', 'padavali', 'feed', 'milestones'].includes(t)) {
          return t;
        }
      }
    } catch {}
    return 'smaran';
  });
  const [selectedDate, setSelectedDate] = useState<number>(27);
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTabType>('विशेष दर्शन');
  // Two-tier cache: synchronous initial pre-warm (0ms cold render) prevents null flash / layout shift
  const [sadhana, setSadhana] = useState<SadhanaState>(() => loadCachedSadhanaSync());
  const [feedVersion, setFeedVersion] = useState<number>(0);
  const [currentPad, setCurrentPad] = useState<SacredPad | null>(SACRED_PADS[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLowSpecMode, setIsLowSpecMode] = useState(false);
  const [counterTick, setCounterTick] = useState(false);
  const [beadInCurrentMala, setBeadInCurrentMala] = useState<number>(0);
  const [dhyanaImpact, setDhyanaImpact] = useState<DhyanaImpactState>(() => loadDhyanaImpactSync());
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isSaintsModalOpen, setIsSaintsModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const currentAshtayama = computeAshtayamaPhase();

  // Global Spotlight Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    let isMounted = true;
    // Reconcile with persistent IndexedDB L2 cache
    loadCachedSadhana().then((cached) => {
      if (isMounted && cached) {
        setSadhana(cached);
      }
    });

    loadDhyanaImpact().then((cachedImpact) => {
      if (isMounted && cachedImpact) {
        setDhyanaImpact(cachedImpact);
      }
    });

    // Real-time synchronization across browser tabs
    const cleanupSync = initMultiTabSync((event) => {
      if (!isMounted) return;
      if (event.type === 'SADHANA_UPDATED' && event.payload) {
        setSadhana(event.payload as SadhanaState);
      } else if (event.type === 'FEED_INTERACTION_UPDATED' || event.type === 'BOOKMARKS_UPDATED') {
        setFeedVersion((v) => v + 1);
      } else if (event.type === 'DHYANA_SESSION_COMPLETED' && event.payload) {
        setDhyanaImpact(event.payload as DhyanaImpactState);
      }
    });

    return () => {
      isMounted = false;
      cleanupSync();
    };
  }, []);

  const handlePlayPad = (pad: SacredPad) => {
    setCurrentPad(pad);
    setIsPlayingAudio(true);
    setShowPlayer(true);
  };

  const handleSelectSearchedPad = (pad: SacredPad) => {
    setCurrentPad(pad);
    setActiveTab('padavali');
    setIsSpotlightOpen(false);
  };

  const handleSelectSearchedSaint = () => {
    setActiveTab('padavali');
    setIsSaintsModalOpen(false);
    setIsSpotlightOpen(false);
  };

  const handleTogglePlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleFabClick = () => {
    setShowPlayer(prev => !prev);
    if (!isPlayingAudio && !showPlayer) {
      setIsPlayingAudio(true);
    }
  };

  const incrementJapa = () => {
    const updated: SadhanaState = {
      ...sadhana,
      japaCompleted: sadhana.japaCompleted + 1,
    };
    setSadhana(updated);
    persistSadhana(updated);
    setCounterTick(true);
    setTimeout(() => setCounterTick(false), 320);
    setBeadInCurrentMala(0);
  };

  const handleTapBead = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Safe vibration fallback
      }
    }
    setCounterTick(true);
    setTimeout(() => setCounterTick(false), 320);

    setBeadInCurrentMala((prev) => {
      const next = prev + 1;
      if (next >= 108) {
        incrementJapa();
        return 0;
      }
      return next;
    });
  };

  const getScreenBackground = () => {
    switch (activeTab) {
      case 'smaran':
      case 'padavali':
        return 'linear-gradient(180deg, #F8E9D6 0%, #E4EFE8 20%, #DAE8DE 100%)';
      case 'feed':
        return 'linear-gradient(180deg, #BFD3C2 0%, #E1ECE5 24%, #EEF1EE 100%)';
      case 'milestones':
        return 'linear-gradient(180deg, #F1F1F1 0%, #E2E8E0 40%, #A9BBA3 78%, #7E9A78 100%)';
    }
  };

  const getScrimGradient = () => {
    switch (activeTab) {
      case 'smaran':
      case 'padavali':
        return 'from-[#DAE8DE] via-[#DAE8DE]/80 to-transparent';
      case 'feed':
        return 'from-[#EEF1EE] via-[#EEF1EE]/80 to-transparent';
      case 'milestones':
        return 'from-[#7E9A78] via-[#7E9A78]/85 to-transparent';
    }
  };

  // Dynamic Sadhana & Hero Pillar metrics (computes live numbers with zero hardcoding)
  const mantraCount = computeMantraCount(sadhana) + beadInCurrentMala;
  const mantraCountFormatted = mantraCount.toLocaleString('en-IN');
  const mantraCountDevanagari = formatDevanagariNumerals(mantraCount);
  const malasDevanagari = formatDevanagariNumerals(sadhana.japaCompleted);
  const malasTargetDevanagari = formatDevanagariNumerals(sadhana.japaTarget);
  const japaPercent = computeProgressPercent(sadhana.japaCompleted, sadhana.japaTarget);
  const shravanPercent = computeProgressPercent(sadhana.shravanMinutes, sadhana.shravanTarget);
  const svadhyayaPercent = computeProgressPercent(sadhana.svadhyayaPadas, sadhana.svadhyayaTarget);

  // Dynamic Braj feed filtering (reacts to feedVersion and live IndexedDB interactions)
  const currentInteractions = getFeedInteractionsSync();
  const filteredFeedPosts = SACRED_FEED_POSTS.filter((post) => {
    // Reference feedVersion so reactive state updates trigger filtering
    if (feedVersion < 0) return true;
    const interaction = currentInteractions[post.id];
    const isBookmarked = interaction?.isBookmarked ?? post.isBookmarked ?? false;
    const isFollowing = interaction?.isFollowing ?? false;

    switch (activeFeedTab) {
      case 'विशेष दर्शन':
        return true;
      case 'उत्सव धारा':
        return (
          post.hashtags.some((tag) =>
            ['#UtsavDhara', '#MangalaDarshan', '#NikunjaRas', '#BrajParikrama', '#KartikMahotsav', '#VisheshDarshan'].includes(tag)
          ) || post.timestamp.includes('आरती') || post.timestamp.includes('राजभोग')
        );
      case 'सेवक मंडल':
        return isFollowing;
      case 'उर धरे':
        return isBookmarked;
      case 'धाम वार्ता':
        return (
          post.hashtags.some((tag) =>
            ['#DhamVarta', '#KartikMahotsav', '#BrajParikrama', '#VrindavanDham'].includes(tag)
          ) || post.id === 'post-5' || post.authorName.includes('वार्ता')
        );
      default:
        return true;
    }
  });

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 flex flex-col items-center ${isLowSpecMode ? 'low-spec' : ''}`}
      style={{ background: getScreenBackground() }}
    >
      {/* Outer Adaptive Wrapper:
          - Mobile & Small Windows (< 768px): Fluid w-full with comfortable 16px-20px padding (ZERO awkward side gaps)
          - Tablet (768px - 1024px): max-w-4xl with balanced gutters
          - Desktop (1024px+): max-w-6xl xl:max-w-7xl
      */}
      <div className="w-full max-w-full md:max-w-5xl xl:max-w-7xl min-h-screen relative px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-20 lg:pt-22 pb-36 md:pb-24 box-border">
        {/* Apple Dynamic Notch / Dynamic Island Navbar (Fixed Floating Top Island) */}
        <DynamicNotchNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          streakDays={sadhana?.currentStreakDays ?? 14}
          isPlayingAudio={isPlayingAudio}
          currentTrackTitle={currentPad?.titleDevanagari}
          onToggleAudio={handleTogglePlay}
          onOpenPlayer={handleFabClick}
          isLowSpec={isLowSpecMode}
          onToggleLowSpec={() => setIsLowSpecMode(!isLowSpecMode)}
          onOpenSearch={() => setIsSpotlightOpen(true)}
          onOpenFocus={() => setIsFocusModalOpen(true)}
        />

        {/* Main Tab Content with Apple-grade View Transitions */}
        <main className="w-full">
          <div key={activeTab} className="apple-view-enter">
          {/* Tab 1: Smaran (Dashboard) - Adaptive 3-Column on Desktop (xl:), 2-Column on Tablet, 1-Column on Mobile */}
          {activeTab === 'smaran' && (
            <div className="w-full pb-44 md:pb-28">
              <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-12 gap-5 xl:gap-6 items-start">
                {/* Column 1: Hero Sadhana Tracker (4 cols on xl:, 6 cols on md:) */}
                <div className="md:col-span-6 xl:col-span-4 space-y-4 flex flex-col">
                  {/* Hero Card `.cd` with 28px radius, #F3F3F3 */}
                  <div className="bg-[#F3F3F3] rounded-[28px] p-5 sm:p-6 shadow-card border border-white/80">
                    {/* Header with Title and Quick Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E]/15 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-[#22C55E] fill-[#22C55E]" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D] block">
                            नित्य नाम संकीर्तन
                          </span>
                          <span className="text-xs text-[#6B6F6B] font-medium">
                            Daily Japa Remembrance
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Dhyana Sanctuary Gateway Button */}
                        <button
                          type="button"
                          onClick={() => setIsFocusModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 text-xs font-bold border border-emerald-500/30 pressable transition-colors"
                          title="गहन ध्यान कक्ष (Dhyāna Sanctuary)"
                        >
                          <Wind className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ध्यान कक्ष</span>
                        </button>

                        <button
                          type="button"
                          onClick={incrementJapa}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#14213D] hover:bg-[#1E2E52] text-white text-xs font-bold shadow-xs pressable transition-all"
                        >
                          <span className="text-[#B6FF2E] font-doto font-bold text-sm">+1</span>
                          <span>माला</span>
                        </button>
                      </div>
                    </div>

                    {/* Big Doto Number Display with live animated counter & bead pacing */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleTapBead}
                      title="स्पर्श करें • +१ मन्त्र मनका जप"
                      aria-label="Tap to count individual bead"
                      className="my-2.5 p-2 rounded-2xl cursor-pointer select-none pressable-sm hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className={`font-doto font-light text-4xl sm:text-5xl text-[#111111] leading-none inline-block ${counterTick ? 'animate-number-tick' : ''}`}>
                          {mantraCountFormatted}
                        </span>
                        <span className="text-xs font-semibold text-[#6B6F6B]">
                          मन्त्र जप
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          +१ स्पर्श
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6F6B] font-medium mt-1">
                        {mantraCountDevanagari} मन्त्र पूर्ण • {malasDevanagari} माला समर्पित
                        {beadInCurrentMala > 0 && (
                          <span className="text-[#15803D] font-bold">
                            {' '}• मनका {formatDevanagariNumerals(beadInCurrentMala)}/१०८
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Subtle Breath Pulse Rhythm Aura beneath Mantra Counter */}
                    <div className="my-2 py-1.5 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-dhyana-breath" />
                        <span className="text-[11px] text-emerald-800 font-medium">
                          समवृत्ति श्वास प्रवाह • शांत चित्त
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700">
                        {dhyanaImpact?.metrics?.averageStillnessScore ?? 82}% शान्ति • ४-४-४
                      </span>
                    </div>

                    {/* 3 Sacred Devotional Pillars with Micro-Progress Bars */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 my-2.5 bg-white/70 backdrop-blur-sm rounded-2xl border border-white">
                      <div>
                        <MacroRow
                          label="नाम जप"
                          value={`${malasDevanagari}/${malasTargetDevanagari}`}
                          sublabel="माला"
                          accentColor="#22C55E"
                        />
                        <div className="w-full bg-black/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#22C55E] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${japaPercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <MacroRow
                          label="पद श्रवण"
                          value={`${formatDevanagariNumerals(sadhana.shravanMinutes)}/${formatDevanagariNumerals(sadhana.shravanTarget)}`}
                          sublabel="मिनट"
                          accentColor="#8B5CF6"
                        />
                        <div className="w-full bg-black/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#8B5CF6] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${shravanPercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <MacroRow
                          label="ग्रंथ स्वाध्याय"
                          value={`${formatDevanagariNumerals(sadhana.svadhyayaPadas)}/${formatDevanagariNumerals(sadhana.svadhyayaTarget)}`}
                          sublabel="पद"
                          accentColor="#A3C71F"
                        />
                        <div className="w-full bg-black/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-[#A3C71F] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${svadhyayaPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SVG Dot Grid Visualizer with Weekday Context */}
                    <div className="mt-3 pt-3 border-t border-black/5">
                      <div className="text-[11px] text-[#6B6F6B] font-medium mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <img src="/assets/icons/grid.svg" alt="Grid" className="w-3.5 h-3.5 inline-block opacity-70" />
                          साप्ताहिक साधना तीव्रता (Intensity Matrix)
                        </span>
                        <span className="text-[#22C55E] font-semibold text-[10px] uppercase tracking-wider bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                          अखण्ड प्रवाह
                        </span>
                      </div>
                      <DotGridChart />
                      <div className="flex justify-between text-[9px] text-[#888888] font-medium px-2 mt-1">
                        <span>सोम</span>
                        <span>मंगल</span>
                        <span>बुध</span>
                        <span className="text-[#14213D] font-bold">गुरु (आज)</span>
                        <span>शुक्र</span>
                        <span>शनि</span>
                        <span>रवि</span>
                      </div>
                    </div>
                  </div>

                  {/* Ras & Dham Categories ( भाव एवं रस केंद्र ) */}
                  <div className="bg-white/65 backdrop-blur-md rounded-[28px] p-5 border border-white/80 shadow-card">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[15px] sm:text-base font-semibold text-[#111111] flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-[#B84A28]" />
                        भाव एवं रस केंद्र
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSaintsModalOpen(true)}
                        className="text-xs text-[#B84A28] hover:underline font-semibold"
                        title="समस्त रसिक संत नामावली देखें"
                      >
                        संत नामावली (131) →
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      <CategoryCircle
                        label="श्रीजी"
                        sublabel="बरसाना"
                        iconType="shriji"
                        isActive
                        onClick={() => setActiveTab('feed')}
                      />
                      <CategoryCircle
                        label="बाँके बिहारी"
                        sublabel="वृन्दावन"
                        iconType="bihari"
                        onClick={() => setActiveTab('feed')}
                      />
                      <CategoryCircle
                        label="राधा वल्लभ"
                        sublabel="हित वाणी"
                        iconType="chaurasi"
                        onClick={() => setActiveTab('padavali')}
                      />
                      <CategoryCircle
                        label="स्वामी हरिदास"
                        sublabel="केलिमाल"
                        iconType="kelimal"
                        onClick={() => setActiveTab('padavali')}
                      />
                      <CategoryCircle
                        label="अष्टयाम"
                        sublabel="नित्य लीला"
                        iconType="ashtayama"
                        onClick={() => setActiveTab('smaran')}
                      />
                    </div>
                  </div>

                  {/* Daily Devotional Sankalpa Box (Balances Column 1 Height) */}
                  <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-4 border border-white/90 shadow-card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#B84A28]/10 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-[#B84A28] fill-[#B84A28]/20" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#B84A28] uppercase tracking-wider block">
                          आज का पावन संकल्प
                        </span>
                        <p className="font-devanagari font-semibold text-xs sm:text-[13px] text-[#111111] truncate">
                          "श्री राधा नाम ही मेरो सर्वस्व, वृन्दावन ही मेरो धाम"
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full shrink-0">
                      अखण्ड नियम
                    </span>
                  </div>
                </div>

                {/* Column 2: Date Strip & Nitya Seva Schedule (Unified Grand Panel: 5 cols on xl:, 6 cols on md:) */}
                <div className="md:col-span-6 xl:col-span-5 space-y-4">
                  <div className="bg-white/70 backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white/90 shadow-card">
                    {/* Header with Today's Tithi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-black/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <img src="/assets/icons/calendar-meeting.svg" alt="Calendar" className="w-4 h-4 inline-block opacity-75" />
                          <span className="text-[15px] sm:text-base font-semibold text-[#111111]">
                            दैनिक सेवा पञ्चाङ्ग एवं दर्शन मुहूर्त
                          </span>
                          <span className="text-[10px] font-bold text-[#B84A28] bg-[#B84A28]/10 px-2 py-0.5 rounded-full">
                            द्वादशी
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6F6B] mt-0.5">
                          मार्गशीर्ष शुक्ल द्वादशी • श्री राधा वल्लभ प्राकट्य उत्सव
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('feed')}
                        className="text-xs text-[#666666] hover:text-[#111111] font-medium self-start sm:self-auto"
                      >
                        दर्शन दीर्घा
                      </button>
                    </div>

                    {/* Integrated 7-Day Date & Tithi Strip */}
                    <div className="mb-4 bg-[#F4F4F4] rounded-2xl p-1.5 border border-black/5">
                      <DateStrip
                        days={SAMPLE_DAYS}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                      />
                    </div>

                    {/* Seva Timeline Cards (Devotional Details with ZERO Truncation) */}
                    <div className="space-y-3">
                      <NityaSevaCard
                        templeName="श्री बाँके बिहारी मन्दिर"
                        sevaTitle="मंगला दर्शन आरती"
                        time="07:15 AM - 12:00 PM"
                        sevaDetails={['दीप दर्शन', 'चन्दन व तुलसी अर्पण', 'राग विभास']}
                        statusLabel="पट खुले हैं"
                        statusType="active"
                        imageUrl="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=300&q=80"
                        onOpen={() => setActiveTab('feed')}
                      />
                      <NityaSevaCard
                        templeName="श्री राधा वल्लभ लाल मन्दिर"
                        sevaTitle="राजभोग दर्शन एवं आरती"
                        time="12:30 PM - 03:00 PM"
                        sevaDetails={['हित चौरासी पद गायन', 'मधुर भोग निवेदन']}
                        statusLabel="राजभोग बेला"
                        statusType="upcoming"
                        imageUrl="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80"
                        onOpen={() => setActiveTab('padavali')}
                      />
                      <NityaSevaCard
                        templeName="श्री राधा रमण जी मन्दिर"
                        sevaTitle="संध्या आरती एवं शृंगार दर्शन"
                        time="06:45 PM - 08:30 PM"
                        sevaDetails={['नित्य सन्ध्या महाआरती', 'रजत सिंहासन दर्शन']}
                        statusLabel="संध्या आरती"
                        statusType="upcoming"
                        imageUrl="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80"
                        onOpen={() => setActiveTab('feed')}
                      />
                      <NityaSevaCard
                        templeName="बरसाना लाड़िली लाल जी (महल)"
                        sevaTitle="शयन दर्शन एवं चँवर सेवा"
                        time="09:15 PM"
                        sevaDetails={['सुगन्धित पुष्प शृंगार', 'प्रिया-प्रियतम विश्राम']}
                        statusLabel="निशीथ काल"
                        statusType="upcoming"
                        imageUrl="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80"
                        onOpen={() => setActiveTab('feed')}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 3: Dedicated Spiritual Companion & Rasik Atmosphere (3 cols on xl:, 12 cols on md:) */}
                <div className="col-span-1 md:col-span-12 xl:col-span-3 space-y-4 md:grid md:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-col xl:space-y-4">
                  {/* Card 1: Current Ashtayama Bhava contemplation box */}
                  <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FBF5ED] rounded-[28px] p-5 border border-[#E9D9C3] shadow-card relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#C85A32] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                        वर्तमान अष्टयाम भाव
                      </span>
                      <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-full">
                        {currentAshtayama.nameDevanagari} लीला
                      </span>
                    </div>

                    <h4 className="font-devanagari font-bold text-sm sm:text-[15px] text-[#111111] mb-1">
                      {currentAshtayama.nameDevanagari} • {currentAshtayama.bhava}
                    </h4>

                    <p className="text-xs text-[#555555] leading-relaxed mb-3">
                      {currentAshtayama.descriptionDevanagari}
                    </p>

                    {/* 8-Period Timeline Mini Bar */}
                    <div className="py-1.5 px-2 bg-white/70 rounded-xl mb-2.5 border border-[#E9D9C3]/70">
                      <div className="flex justify-between items-center text-[9px] text-[#888888] font-medium">
                        <span>निशंत</span>
                        <span>प्रातः</span>
                        <span>पूर्वाह्न</span>
                        <span className="bg-[#14213D] text-[#B6FF2E] px-1.5 py-0.5 rounded-md font-bold">{currentAshtayama.nameDevanagari}</span>
                        <span>अपराह्न</span>
                        <span>सायं</span>
                        <span>शयन</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E9D9C3]/60 flex items-center justify-between text-[11px] text-[#6B6F6B]">
                      <span>समय: {currentAshtayama.timeRange}</span>
                      <span className="text-[#C85A32] font-semibold">राग सारंग</span>
                    </div>
                  </div>

                  {/* Card 2: Vrindavan Dham Atmosphere & Weather */}
                  <div className="bg-white/70 backdrop-blur-md rounded-[28px] p-5 border border-white/90 shadow-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#111111] flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-[#D4A359]" />
                        धाम वातावरण • आज
                      </span>
                      <span className="text-[11px] font-bold text-[#B84A28] bg-[#B84A28]/10 px-2.5 py-0.5 rounded-full">
                        सुहावना
                      </span>
                    </div>
                    <div className="text-xs text-[#555555] space-y-2">
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span className="text-[#6B6F6B]">तापमान व वायु:</span>
                        <span className="font-semibold text-[#111111]">26°C • मन्द पवन</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span className="text-[#6B6F6B]">यमुना जी जल स्तर:</span>
                        <span className="font-semibold text-[#22C55E]">निर्मल व शांत प्रवाह</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span className="text-[#6B6F6B]">श्री परिक्रमा मार्ग:</span>
                        <span className="font-semibold text-[#111111]">सुगम व भक्तिमय</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B6F6B]">विशेष उत्सव:</span>
                        <span className="font-semibold text-[#B84A28]">रंगभरी एकादशी</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Featured Nitya Pad Shravan Audio Deck */}
                  <div className="bg-[#14213D] text-white rounded-[28px] p-5 shadow-card border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#B6FF2E] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Music2 className="w-3 h-3" />
                          नित्य पद श्रवण
                        </span>
                        <span className="text-[10px] text-white/60 font-medium">
                          राग विभास
                        </span>
                      </div>
                      <h4 className="font-devanagari font-bold text-sm sm:text-base text-white mb-1 leading-snug">
                        जोई जोई प्यारो करे सोई मोहि भावै
                      </h4>
                      <p className="text-[11px] text-white/70 leading-relaxed mb-3">
                        श्री हित हरिवंश महाप्रभु प्रणीत अगाध प्रेम रस की पराकाष्ठा।
                      </p>

                      {/* Mini Audio Visualizer Equalizer */}
                      <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-xl mb-3 border border-white/10">
                        <div className="flex items-center gap-1">
                          <span className={`w-1 h-3 rounded-full bg-[#B6FF2E] ${isPlayingAudio ? 'animate-pulse' : 'opacity-40'}`} />
                          <span className={`w-1 h-5 rounded-full bg-[#B6FF2E] ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} />
                          <span className={`w-1 h-2 rounded-full bg-[#B6FF2E] ${isPlayingAudio ? 'animate-pulse' : 'opacity-40'}`} />
                          <span className={`w-1 h-4 rounded-full bg-[#B6FF2E] ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} />
                          <span className={`w-1 h-2 rounded-full bg-[#B6FF2E] ${isPlayingAudio ? 'animate-pulse' : 'opacity-40'}`} />
                        </div>
                        <span className="text-[10px] text-white/60 font-mono">
                          03:45 / 08:30
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayPad(SACRED_PADS[0])}
                      className="w-full py-2.5 rounded-full bg-[#B6FF2E] hover:bg-[#a7ed24] text-[#14213D] text-xs font-bold shadow-xs pressable flex items-center justify-center gap-2 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio ? 'वादन हो रहा है' : 'अभी श्रवण करें'}</span>
                    </button>
                  </div>

                  {/* Mental Focus & Dhyāna Impact Sanctuary Bento Card */}
                  <div
                    onClick={() => setIsFocusModalOpen(true)}
                    className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 border border-white/90 shadow-card flex flex-col justify-between cursor-pointer pressable select-none text-[#111111]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#15803D] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                          Dhyāna & Mental Focus
                        </span>
                        <span className="text-[10px] font-bold text-[#15803D] bg-[#22C55E]/15 px-2 py-0.5 rounded-full border border-[#22C55E]/30">
                          चित्त शान्ति
                        </span>
                      </div>
                      <h4 className="font-devanagari font-bold text-sm sm:text-base text-[#111111] mb-1 leading-snug">
                        गहन ध्यान व प्राणायाम कक्ष
                      </h4>
                      <p className="text-[11px] text-[#6B6F6B] leading-relaxed mb-3">
                        ४-४-४ समवृत्ति श्वसन, १०८Hz तानपूरा ध्यान नाद, और मानसिक एकाग्रता का प्रत्यक्ष प्रभाव देखें।
                      </p>

                      <div className="flex items-center justify-between p-2.5 bg-[#F5F8F6] rounded-xl border border-black/[0.04] text-xs">
                        <span className="text-[#6B6F6B]">मानसिक स्थिरता सूचकांक:</span>
                        <span className="font-doto font-bold text-[#15803D]">८८/१०० शान्ति</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFocusModalOpen(true);
                      }}
                      className="mt-3.5 w-full py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1f2e4d] text-[#B6FF2E] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>कक्ष में प्रवेश करें (Enter Sanctuary)</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Card 4: Sacred Parikrama & Holy Dham Presence (Completes Column 3 Balance) */}
                  <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-4 border border-white/90 shadow-card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                        <Waves className="w-5 h-5 text-[#22C55E]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                          श्री गिरिराज व यमुना सेवा
                        </span>
                        <p className="font-devanagari font-semibold text-xs text-[#111111] truncate">
                          सप्तकोसीय परिक्रमा व केशी घाट दीपदान
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full shrink-0">
                      पावन बेला
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Sacred Padavali Reader (3-Column Desktop Desk, 2-Column Tablet, 1-Column Mobile) */}
          {activeTab === 'padavali' && (
            <PadavaliReader
              onPlayPad={handlePlayPad}
              activePlayingPadId={currentPad?.id}
              isPlaying={isPlayingAudio}
            />
          )}

          {/* Tab 3: Devotional Darshan Feed */}
          {activeTab === 'feed' && (
            <div className="w-full pt-1 pb-48 md:pb-28">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Main Feed Column (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  {/* Header Banner */}
                  <div className="relative rounded-[24px] overflow-hidden mb-3 aspect-[21/9] bg-[#14213D] shadow-card">
                    <img
                      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                      alt="Divine Vrindavan"
                      className="w-full h-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                      <span className="text-[10px] uppercase font-bold text-[#B6FF2E] tracking-wider">
                        नित्य निकुंज रस
                      </span>
                      <h2 className="text-white font-display text-lg sm:text-2xl font-bold">
                        दिव्य दर्शन एवं सत्संग प्रवाह
                      </h2>
                    </div>
                  </div>

                  {/* Horizontal Braj Filter Tabs: Smoothly scrollable on mobile without wrapping */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap text-[13.5px] text-[#6B6F6B] px-2 py-1.5 mb-2 bg-white/70 rounded-full border border-white/90 shadow-xs">
                    {BRAJ_FEED_TABS.map((tab) => {
                      const isActive = activeFeedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveFeedTab(tab.id)}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors pressable shrink-0 text-xs sm:text-[13px] ${
                            isActive
                              ? 'text-[#111111] font-semibold bg-white shadow-xs'
                              : 'hover:text-[#111111]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filtered Devotional Feed Cards */}
                  <div className="space-y-4">
                    {filteredFeedPosts.length > 0 ? (
                      filteredFeedPosts.map((post) => (
                        <FeedCard key={post.id} post={post} />
                      ))
                    ) : (
                      <div className="bg-[#F3F3F3] rounded-[24px] p-8 text-center border border-white/80 shadow-card">
                        <div className="w-12 h-12 rounded-full bg-[#14213D]/10 flex items-center justify-center mx-auto mb-3">
                          <Heart className="w-6 h-6 text-[#14213D]" />
                        </div>
                        <h4 className="font-devanagari font-bold text-base text-[#111111] mb-1">
                          {activeFeedTab === 'सेवक मंडल'
                            ? 'अभी किसी मंदिर की शरण नहीं ली है'
                            : activeFeedTab === 'उर धरे'
                            ? 'अभी कोई दर्शन उर धरे (सहेजे) नहीं हैं'
                            : 'इस पावन धारा में कोई दर्शन उपलब्ध नहीं है'}
                        </h4>
                        <p className="text-xs text-[#666666] max-w-sm mx-auto mb-4 leading-relaxed">
                          {activeFeedTab === 'सेवक मंडल'
                            ? "मन्दिर कार्ड पर 'सेवक बनें' दबाकर अपने प्रिय मन्दिर की शरण लें और उनके विशेष दर्शन यहाँ पाएं।"
                            : activeFeedTab === 'उर धरे'
                            ? "दर्शन कार्ड पर बुकमार्क चिह्न दबाकर अपने प्रिय दर्शन हृदय में सहेजें।"
                            : 'कृपया विशेष दर्शन धारा देखें।'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveFeedTab('विशेष दर्शन')}
                          className="px-4 py-2 rounded-full bg-[#14213D] text-[#B6FF2E] text-xs font-bold pressable"
                        >
                          विशेष दर्शन देखें
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar on Tablet & Desktop (4 cols) */}
                <div className="hidden md:block md:col-span-4 space-y-4 sticky top-24">
                  <div className="bg-[#F3F3F3] rounded-[24px] p-5 border border-white/80 shadow-card">
                    <h3 className="font-semibold text-sm text-[#111111] mb-2 flex items-center justify-between">
                      <span>वृन्दावन धाम पंचांग</span>
                      <span className="text-[10px] bg-[#B84A28]/10 text-[#B84A28] px-2 py-0.5 rounded-full font-bold">
                        आज
                      </span>
                    </h3>
                    <div className="text-xs text-[#555555] space-y-2.5">
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span>तिथि:</span>
                        <span className="font-semibold text-[#111111]">शुक्ल द्वादशी</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span>नक्षत्र:</span>
                        <span className="font-semibold text-[#111111]">रोहिणी</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>आगामी उत्सव:</span>
                        <span className="font-semibold text-[#B84A28]">शरद पूर्णिमा</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#14213D] text-white rounded-[24px] p-5 shadow-sm border border-white/10">
                    <span className="text-[10px] text-[#B6FF2E] font-bold uppercase tracking-wider block mb-1">
                      नित्य दर्शन नियम
                    </span>
                    <p className="text-xs leading-relaxed text-white/90">
                      प्रतिदिन मंगला एवं राजभोग दर्शन के उपरांत कम से कम एक पद का सस्वर पाठ नित्य रस की वृद्धि करता है।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Milestones & Streaks */}
          {activeTab === 'milestones' && (
            <MilestonesView onBack={() => setActiveTab('smaran')} />
          )}
          </div>
        </main>

        {/* Floating Ambient Shravan Player (Responsive Workstation Bar) */}
        {showPlayer && (
          <FloatingAudioPlayer
            currentPad={currentPad}
            isPlaying={isPlayingAudio}
            onTogglePlay={handleTogglePlay}
            onClose={() => setShowPlayer(false)}
            onOpenLyrics={() => setActiveTab('padavali')}
          />
        )}

        {/* Mobile Floating Bottom Protective Scrim: Dynamically matches active tab background */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 ${showPlayer ? 'h-40' : 'h-32'} bg-gradient-to-t ${getScrimGradient()} pointer-events-none z-30 transition-colors duration-500`}
        />

        {/* Floating Navbar (Mobile Only < md) */}
        <FloatingNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenFab={handleFabClick}
          isPlayingAudio={isPlayingAudio}
        />

        {/* Global Apple Spotlight Search Modal (Cmd+K) */}
        <SpotlightSearchModal
          isOpen={isSpotlightOpen}
          onClose={() => setIsSpotlightOpen(false)}
          onSelectPad={handleSelectSearchedPad}
          onSelectSaint={handleSelectSearchedSaint}
        />

        {/* Rasik Saints Directory Modal (131 Saints) */}
        <SaintsDirectoryModal
          isOpen={isSaintsModalOpen}
          onClose={() => setIsSaintsModalOpen(false)}
          onSelectSaint={handleSelectSearchedSaint}
        />

        {/* Dhyana Mental Focus Sanctuary Modal & Cognitive Impact */}
        <DhyanaFocusModal
          isOpen={isFocusModalOpen}
          onClose={() => setIsFocusModalOpen(false)}
          onAddJapaMala={incrementJapa}
          onSessionComplete={async (session: DhyanaSessionRecord) => {
            const updatedImpact = await recordDhyanaSession(session);
            setDhyanaImpact(updatedImpact);
            const sessionMins = Math.round(session.durationSeconds / 60);
            const updated: SadhanaState = {
              ...sadhana,
              dhyanaMinutesCompleted: (sadhana.dhyanaMinutesCompleted || 0) + sessionMins,
              chittaShantiScore: session.stillnessScore,
              manasiSewaMinutes: (sadhana.manasiSewaMinutes || 0) + sessionMins,
            };
            setSadhana(updated);
            persistSadhana(updated);
          }}
          isLowSpec={isLowSpecMode}
        />
      </div>
    </div>
  );
}
export default App;
