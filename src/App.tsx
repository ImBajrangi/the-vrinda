import { useState, useEffect } from 'react';
import { Radio, Sun, Heart, Check, Sparkles, ExternalLink } from 'lucide-react';
import { FloatingNavbar, NavTab } from './components/common/FloatingNavbar';
import { DynamicNotchNavbar } from './components/common/DynamicNotchNavbar';
import { DateStrip, DayItem } from './components/smaran/DateStrip';
import { CategoriesRow } from './components/smaran/CategoriesRow';
import { NityaSevaCard } from './components/smaran/NityaSevaCard';
import { ArtworkGraphicSlot } from './components/common/ArtworkGraphicSlot';
import { FeedCard } from './components/feed/FeedCard';
import { MilestonesView } from './components/milestones/MilestonesView';
import { PadavaliReader } from './components/reader/PadavaliReader';
import { FloatingAudioPlayer } from './components/player/FloatingAudioPlayer';
import { SpotlightSearchModal } from './components/common/SpotlightSearchModal';
import { SaintsDirectoryModal } from './components/common/SaintsDirectoryModal';
import { DhyanaFocusModal } from './components/focus/DhyanaFocusModal';
import { SadhanaPillarModal, PillarType } from './components/smaran/SadhanaPillarModal';
import { SadhanaRingProgress } from './components/smaran/SadhanaRingProgress';
import { AshtayamaTimelineDeck } from './components/smaran/AshtayamaTimelineDeck';
import { BeginnerGuideModal } from './components/smaran/BeginnerGuideModal';
import { SACRED_FEED_POSTS } from './data/feed';
import { SacredPad, SadhanaState, DhyanaImpactState, DhyanaSessionRecord } from './types/devotional';
import { SacredDatabase } from './services/sacredDatabase';
import { seo } from './services/seoService';
import { CMSEditorialBadge } from './components/common/CMSEditorialBadge';
import {
  loadCachedSadhanaSync,
  loadCachedSadhana,
  persistSadhana,
  computeMantraCount,
  formatDevanagariNumerals,
  getFeedInteractionsSync,
  initMultiTabSync,
  loadDhyanaImpactSync,
  loadDhyanaImpact,
  recordDhyanaSession,
} from './services/cacheService';

export type FeedTabType = 'विशेष दर्शन' | 'उत्सव धारा' | 'सेवक मंडल' | 'उर धरे' | 'धाम वार्ता';

function getDynamicWeekDays(): DayItem[] {
  const days: DayItem[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const tithis = ['नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      dayName: dayNames[i],
      dateNum: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
      tithiLabel: tithis[i],
    });
  }
  return days;
}

export interface AppProps {
  initialTab?: NavTab;
  initialPadId?: string;
}

export function App({ initialTab, initialPadId }: AppProps = {}) {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (initialTab && ['smaran', 'padavali', 'feed', 'milestones'].includes(initialTab)) {
      return initialTab;
    }
    if (initialPadId) {
      return 'padavali';
    }
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab') as NavTab;
        if (t && ['smaran', 'padavali', 'feed', 'milestones'].includes(t)) {
          return t;
        }
        if (params.get('pad')) {
          return 'padavali';
        }
      }
    } catch {}
    return 'smaran';
  });
  const [selectedDate, setSelectedDate] = useState<number>(() => new Date().getDate());
  const [activeFeedTab, setActiveFeedTab] = useState<FeedTabType>('विशेष दर्शन');
  // Two-tier cache: synchronous initial pre-warm (0ms cold render) prevents null flash / layout shift
  const [sadhana, setSadhana] = useState<SadhanaState>(() => loadCachedSadhanaSync());
  const [feedVersion, setFeedVersion] = useState<number>(0);
  const [currentPad, setCurrentPad] = useState<SacredPad | null>(() => {
    const padIdToFind =
      initialPadId ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('pad') || undefined
        : undefined);
    if (padIdToFind) {
      const found = SacredDatabase.getPadById(padIdToFind);
      if (found) return found;
    }
    return SacredDatabase.getAllPadas()[0] || null;
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLowSpecMode, setIsLowSpecMode] = useState(false);
  const [counterTick, setCounterTick] = useState(false);
  const [beadInCurrentMala, setBeadInCurrentMala] = useState<number>(0);
  const [dhyanaImpact, setDhyanaImpact] = useState<DhyanaImpactState>(() => loadDhyanaImpactSync());
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isSaintsModalOpen, setIsSaintsModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activePillarModal, setActivePillarModal] = useState<PillarType | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAffirmedSankalpa, setIsAffirmedSankalpa] = useState(false);
  const [selectedGranthaFilter, setSelectedGranthaFilter] = useState<string>('all');
  const [readerSearchQuery, setReaderSearchQuery] = useState<string>('');
  const [activeSanctuaryStream, setActiveSanctuaryStream] = useState<'ashtayama' | 'audio' | 'dhyana'>('ashtayama');
  const [templeFilter, setTempleFilter] = useState<'all' | 'open' | 'rajbhog' | 'evening'>('all');

  const [weekDays] = useState<DayItem[]>(() => getDynamicWeekDays());
  const featuredPad = SacredDatabase.getAllPadas()[0];

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

  // Real-time Dynamic SEO & URL Permalinks Synchronization
  useEffect(() => {
    switch (activeTab) {
      case 'smaran':
        seo.updateSEO({
          tab: 'smaran',
          title: 'Home Sanctuary • दैनिक स्मरण व नित्य सेवा',
          description: 'दैनिक अष्टयाम लीला, नाम जप, वाणी श्रवण और स्वाध्याय का पावन साधना स्थल।',
        });
        break;
      case 'padavali':
        seo.updateSEO({
          tab: 'padavali',
          title: 'Scriptures Repository • ४२००+ पावन पद वाणी संग्रह',
          description: 'हित चौरासी, राधा सुधा निधि, केलिमाल, सूरसागर, रसखान पदावली सहित समस्त रसिक वाणियों का अगाध संग्रह।',
        });
        break;
      case 'feed':
        seo.updateSEO({
          tab: 'feed',
          title: 'Darshan Feed • नित्य वृन्दावन धाम दर्शन',
          description: 'श्री वृन्दावन धाम के प्रमुख मंदिरों के प्रत्यक्ष दर्शन, उत्सव, आरती व नित्य विलास।',
        });
        break;
      case 'milestones':
        seo.updateSEO({
          tab: 'milestones',
          title: 'Devotion Milestones • अखंड निष्ठा व साधना सोपान',
          description: 'अखंड साधना स्ट्रीक, अंतरंग ध्यान सिद्धि एवं श्रीजी कृपा के पावन सोपान।',
        });
        break;
    }
  }, [activeTab]);

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

  const handleSelectBook = (granthaId: string) => {
    setSelectedGranthaFilter(granthaId);
    setReaderSearchQuery('');
    setActiveTab('padavali');
  };

  const handleSelectAuthor = (authorName: string) => {
    setSelectedGranthaFilter('all');
    setReaderSearchQuery(authorName);
    setActiveTab('padavali');
  };

  const handleSelectRelation = (relationId: string) => {
    if (relationId === 'ashtayama' || relationId === 'ragas') {
      const el = document.getElementById('ashtayama-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setActiveTab('feed');
    }
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

  const handleUpdateSadhana = (updated: SadhanaState) => {
    setSadhana(updated);
    persistSadhana(updated);
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
      <div className="w-full max-w-full md:max-w-5xl xl:max-w-7xl min-h-screen relative px-3.5 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-36 md:pb-24 box-border">
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
              {/* Daily Sadhana Sanctuary Hero Workstation (Unified Apple/Calm-Grade Station) */}
              <div className="mb-6">
                <SadhanaRingProgress
                  sadhana={sadhana}
                  mantraCountFormatted={mantraCountFormatted}
                  mantraCountDevanagari={mantraCountDevanagari}
                  malasDevanagari={malasDevanagari}
                  malasTargetDevanagari={malasTargetDevanagari}
                  beadInCurrentMala={beadInCurrentMala}
                  counterTick={counterTick}
                  handleTapBead={handleTapBead}
                  incrementJapa={incrementJapa}
                  dhyanaStillnessScore={dhyanaImpact?.metrics?.averageStillnessScore ?? 88}
                  isPlayingAudio={isPlayingAudio}
                  currentPad={currentPad}
                  onOpenPillar={(type) => setActivePillarModal(type)}
                  onToggleAudio={handleTogglePlay}
                  onOpenReader={() => setActiveTab('padavali')}
                  onOpenGuide={() => setIsGuideModalOpen(true)}
                  onOpenFocus={() => setIsFocusModalOpen(true)}
                  currentStreakDays={sadhana.currentStreakDays || 7}
                />
              </div>

              {/* Sanctuary Hero Panoramic Art Frame (Empty & ready for user's Vrindavan Dham artwork) */}
              <div className="w-full mb-6">
                <ArtworkGraphicSlot
                  src={null}
                  aspectRatio="banner"
                  theme="purple"
                  placeholderLabel="श्री वृन्दावन धाम पावन लीला"
                  placeholderCategory="dham"
                  badge="वृन्दावन धाम दर्शन"
                  roundedClassName="rounded-[28px]"
                />
              </div>

              {/* Daily Contemplation & Dham Atmosphere Bar (Crisp Pure White & Off-White) */}
              <div className="w-full bg-white rounded-[24px] p-3.5 sm:p-4 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 shadow-2xs">
                    <Heart className={`w-5 h-5 text-amber-600 ${isAffirmedSankalpa ? 'fill-amber-600' : 'fill-amber-600/20'} transition-all`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider font-mono">
                        Daily Resolve (नित्य संकल्प)
                      </span>
                      <span className="text-xs text-[#71717A]">
                        • Sri Hit Harivansh Amrit Vachan
                      </span>
                    </div>
                    <p className="font-serif font-bold text-sm sm:text-base text-[#18181B] truncate mt-0.5">
                      "श्री राधा नाम ही मेरो सर्वस्व, वृन्दावन ही मेरो धाम"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsAffirmedSankalpa(!isAffirmedSankalpa)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer ${
                      isAffirmedSankalpa
                        ? 'bg-[#7C3AED] text-white'
                        : 'bg-[#18181B] text-white hover:bg-[#27272A]'
                    }`}
                  >
                    {isAffirmedSankalpa ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Affirmed ✓</span>
                      </>
                    ) : (
                      <span>Affirm Resolve</span>
                    )}
                  </button>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F5] text-[#18181B] font-mono">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Vrindavan 26°C • Pleasant</span>
                  </span>
                </div>
              </div>

              {/* Section 1: Daily Temple Seva & Darshan Schedule (Crisp Pure White Porcelain) */}
              <div className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4 mb-6">
                {/* Header with Today's Tithi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
                      <h3 className="font-serif font-bold text-xl sm:text-[22px] text-[#18181B] leading-tight">
                        Daily Temple Seva & Darshan Schedule
                      </h3>
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
                        Margashirsha Dvadashi
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#71717A] font-normal mt-1">
                      Live timings and sacred seva rituals across holy mandirs of Vrindavan & Barsana.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('feed')}
                    className="text-xs sm:text-sm font-semibold text-[#7C3AED] hover:underline self-start sm:self-auto cursor-pointer"
                  >
                    Darshan Gallery →
                  </button>
                </div>

                {/* 7-Day Date & Tithi Strip */}
                <DateStrip
                  days={weekDays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />

                {/* Interactive Temple Seva Filter Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
                  <button
                    type="button"
                    onClick={() => setTempleFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                      templeFilter === 'all'
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    All Sacred Mandirs (4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempleFilter('open')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                      templeFilter === 'open'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Doors Open Now (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempleFilter('rajbhog')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                      templeFilter === 'rajbhog'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    Rajbhog Darshan (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempleFilter('evening')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                      templeFilter === 'evening'
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    Sandhya & Shayana (2)
                  </button>
                </div>

                {/* Seva Timeline Cards (Filtered dynamically) */}
                <div className="space-y-3 pt-1">
                  {(templeFilter === 'all' || templeFilter === 'open') && (
                    <NityaSevaCard
                      templeName="Shri Banke Bihari Temple (श्री बाँके बिहारी)"
                      sevaTitle="Mangala Darshan Aarti"
                      time="07:15 AM - 12:00 PM"
                      sevaDetails={['Deep Darshan', 'Chandan & Tulsi Offering', 'Raga Vibhas']}
                      statusLabel="DOORS OPEN NOW"
                      statusType="active"
                      countdownLabel="Open for 2h 45m"
                      imageUrl=""
                      onOpen={() => setActiveTab('feed')}
                    />
                  )}
                  {(templeFilter === 'all' || templeFilter === 'rajbhog') && (
                    <NityaSevaCard
                      templeName="Shri Radha Vallabh Lal (श्री राधा वल्लभ)"
                      sevaTitle="Rajbhog Darshan & Feast"
                      time="12:30 PM - 03:00 PM"
                      sevaDetails={['Hit Chaurasi Pad Recitation', 'Sweet Bhog Offering']}
                      statusLabel="Rajbhog Hour"
                      statusType="upcoming"
                      countdownLabel="Midday Seva"
                      imageUrl=""
                      onOpen={() => setActiveTab('padavali')}
                    />
                  )}
                  {(templeFilter === 'all' || templeFilter === 'evening') && (
                    <>
                      <NityaSevaCard
                        templeName="Shri Radha Raman Ji (श्री राधा रमण)"
                        sevaTitle="Sandhya Aarti & Shringar Darshan"
                        time="06:45 PM - 08:30 PM"
                        sevaDetails={['Evening Maha Aarti', 'Silver Throne Darshan']}
                        statusLabel="Evening Aarti"
                        statusType="upcoming"
                        countdownLabel="Twilight Darshan"
                        imageUrl=""
                        onOpen={() => setActiveTab('feed')}
                      />
                      <NityaSevaCard
                        templeName="Barsana Ladili Lal Ji (बरसाना श्रीजी)"
                        sevaTitle="Shayana Darshan & Chamara Seva"
                        time="09:15 PM"
                        sevaDetails={['Fragrant Floral Shringar', 'Priya-Priyatam Repose']}
                        statusLabel="Night Repose"
                        statusType="upcoming"
                        countdownLabel="Night Rest"
                        imageUrl=""
                        onOpen={() => setActiveTab('feed')}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Section 2: Dedicated Categories Row (Distributed: Books, Authors, Relations) */}
              <CategoriesRow
                onSelectBook={handleSelectBook}
                onSelectAuthor={handleSelectAuthor}
                onSelectRelation={handleSelectRelation}
                onOpenSaintsDirectory={() => setIsSaintsModalOpen(true)}
              />

              {/* Section 3: Sacred Contemplation & Sanctuary Streams Deck (Pure White & Off-White) */}
              <div id="sanctuary-streams-section" className="w-full bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4 mb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-[#18181B] leading-tight">
                        Sacred Contemplation & Sanctuary Streams
                      </h3>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
                        Margashirsha Bhav
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] font-normal mt-1">
                      Immerse in the 24-hour Ashtayama cycle, sacred pad recordings, and dhyana stillness.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('padavali')}
                    className="text-xs sm:text-sm font-semibold text-[#7C3AED] hover:underline self-start sm:self-auto cursor-pointer"
                  >
                    Scripture Reader →
                  </button>
                </div>

                {/* 3-Stream Segmented Switcher in Soft Off-White */}
                <div className="w-full flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#F4F4F5]/70 rounded-[22px] border border-neutral-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveSanctuaryStream('ashtayama')}
                    className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                      activeSanctuaryStream === 'ashtayama'
                        ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                    }`}
                  >
                    <span>Ashtayama 8-Watch Timeline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSanctuaryStream('audio')}
                    className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                      activeSanctuaryStream === 'audio'
                        ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                    }`}
                  >
                    <span>Featured Pad Shravan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSanctuaryStream('dhyana')}
                    className={`flex-1 py-2.5 px-3 rounded-[16px] text-xs font-bold transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                      activeSanctuaryStream === 'dhyana'
                        ? 'bg-white text-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                    }`}
                  >
                    <span>Dhyāna & Focus Sanctuary</span>
                  </button>
                </div>

                {/* Stream Content 1: Ashtayama Timeline */}
                {activeSanctuaryStream === 'ashtayama' && (
                  <AshtayamaTimelineDeck />
                )}

                {/* Stream Content 2: Featured Audio Deck */}
                {activeSanctuaryStream === 'audio' && (
                  <div className="space-y-3 pt-1">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePlayPad(featuredPad)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayPad(featuredPad)}
                      className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                        {/* Featured Pad Artwork Slot: Empty & ready for cover art */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                          <ArtworkGraphicSlot
                            src={null}
                            aspectRatio="square"
                            theme="purple"
                            placeholderLabel="पद आवरण"
                            placeholderCategory="music"
                            roundedClassName="rounded-[18px]"
                          />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[11px] sm:text-xs font-bold text-[#7C3AED] uppercase tracking-wider truncate">
                              {featuredPad?.titleEnglish || 'SHRI HIT CHAURASI'} • PAD 01
                            </span>
                            <div className="sm:hidden">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700">
                                {isPlayingAudio ? 'PLAYING' : 'AUDIO'}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
                            {featuredPad?.titleDevanagari || 'जोई जोई प्यारो करे सोई मोहि भावै'}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">
                              By {featuredPad?.author || 'श्री हित हरिवंश महाप्रभु'} • Eternal Nikunj Ras
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
                        <div className="hidden sm:flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isPlayingAudio
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {isPlayingAudio ? 'NOW STREAMING' : 'READY TO PLAY'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        </div>

                        <div className="flex items-center gap-2 mt-auto font-mono text-xs sm:text-sm font-semibold text-[#18181B]">
                          <div className="flex items-center gap-1">
                            <span className={`w-1 h-3 rounded-full bg-[#7C3AED] ${isPlayingAudio ? 'animate-pulse' : 'opacity-40'}`} />
                            <span className={`w-1 h-4 rounded-full bg-[#7C3AED] ${isPlayingAudio ? 'animate-bounce' : 'opacity-40'}`} />
                            <span className={`w-1 h-2 rounded-full bg-[#7C3AED] ${isPlayingAudio ? 'animate-pulse' : 'opacity-40'}`} />
                          </div>
                          <span>{isPlayingAudio ? '03:45 / 08:30' : '08:30 Mins'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayPad(featuredPad)}
                      className="w-full py-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-purple-200" />
                      <span>{isPlayingAudio ? 'Pause Sacred Audio' : 'Listen Now (श्रवण करें)'}</span>
                    </button>
                  </div>
                )}

                {/* Stream Content 3: Dhyāna Focus Room */}
                {activeSanctuaryStream === 'dhyana' && (
                  <div className="space-y-3 pt-1">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setIsFocusModalOpen(true)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFocusModalOpen(true)}
                      className="w-full bg-white rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 border border-neutral-200/80 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                        {/* Dhyana Atmosphere Graphic Slot: Empty & ready for artwork */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                          <ArtworkGraphicSlot
                            src={null}
                            aspectRatio="square"
                            theme="sky"
                            placeholderLabel="ध्यान वातावरण"
                            placeholderCategory="general"
                            roundedClassName="rounded-[18px]"
                          />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                          <span className="text-[11px] sm:text-xs font-bold text-[#0284C7] uppercase tracking-wider truncate mb-0.5 font-mono">
                            गहन ध्यान कक्ष • PRANAYAMA SANCTUARY
                          </span>
                          <h4 className="font-serif font-bold text-base sm:text-lg text-[#18181B] leading-tight truncate">
                            गहन ध्यान एवं शांत तानपूरा नाद साधना
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-[#71717A] mt-1 overflow-hidden whitespace-nowrap font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">
                              श्वास-प्रश्वास तालबद्ध प्राणायाम • १०८Hz तानपूरा ध्यान
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 pl-2">
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700">
                            SANCTUARY OPEN
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-[#0284C7] font-mono mt-auto">
                          Session: 12 Mins
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFocusModalOpen(true)}
                      className="w-full py-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      <span>Enter Sanctuary (ध्यान कक्ष)</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Sacred Padavali Reader (3-Column Desktop Desk, 2-Column Tablet, 1-Column Mobile) */}
          {activeTab === 'padavali' && (
            <PadavaliReader
              onPlayPad={handlePlayPad}
              activePlayingPadId={currentPad?.id}
              isPlaying={isPlayingAudio}
              selectedGranthaId={selectedGranthaFilter}
              selectedSearchQuery={readerSearchQuery}
              initialPadId={
                initialPadId ||
                (typeof window !== 'undefined'
                  ? new URLSearchParams(window.location.search).get('pad') || undefined
                  : undefined)
              }
            />
          )}

          {/* Tab 3: Devotional Darshan Feed */}
          {activeTab === 'feed' && (
            <div className="w-full pt-1 pb-48 md:pb-28">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Main Feed Column (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  {/* Header Banner */}
                  <div className="relative rounded-[24px] overflow-hidden mb-3 aspect-[21/9] bg-[#18181B] shadow-card">
                    <img
                      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                      alt="Divine Vrindavan"
                      className="w-full h-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider font-mono">
                        ETERNAL NIKUNJ RAS • नित्य निकुंज रस
                      </span>
                      <h2 className="text-white font-serif text-lg sm:text-2xl font-bold">
                        Divine Darshan & Daily Satsang Feed
                      </h2>
                    </div>
                  </div>

                  {/* Horizontal Braj Filter Tabs: Smoothly scrollable on mobile without wrapping */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap text-[13.5px] text-[#71717A] px-2 py-1.5 mb-2 bg-white rounded-full border border-neutral-200/80 shadow-xs">
                    {SacredDatabase.getFeedTabs().map((tab) => {
                      const isActive = activeFeedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveFeedTab(tab.id)}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 text-xs sm:text-[13px] ${
                            isActive
                              ? 'text-[#18181B] font-bold bg-[#F4F4F5] shadow-xs'
                              : 'hover:text-[#18181B]'
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
                      <div className="bg-white rounded-[24px] p-8 text-center border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                          <Heart className="w-6 h-6 text-[#7C3AED]" />
                        </div>
                        <h4 className="font-serif font-bold text-base text-[#18181B] mb-1">
                          {activeFeedTab === 'सेवक मंडल'
                            ? 'No Followed Temples Yet'
                            : activeFeedTab === 'उर धरे'
                            ? 'No Saved Darshan Yet'
                            : 'No darshan available in this stream'}
                        </h4>
                        <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-4 leading-relaxed font-normal">
                          {activeFeedTab === 'सेवक मंडल'
                            ? "Click 'Follow' on any temple card to receive their live darshan and festival updates directly in your feed."
                            : activeFeedTab === 'उर धरे'
                            ? "Tap the bookmark icon on any darshan card to save divine moments to your personal sanctuary."
                            : 'Explore special darshan and festival highlights in the main feed.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveFeedTab('विशेष दर्शन')}
                          className="px-5 py-2.5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Explore Special Darshan →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar on Tablet & Desktop (4 cols) */}
                <div className="hidden md:block md:col-span-4 space-y-4 sticky top-24">
                  <div className="bg-white rounded-[24px] p-5 border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                    <h3 className="font-serif font-bold text-sm text-[#18181B] mb-2 flex items-center justify-between">
                      <span>Vrindavan Dham Calendar (पंचांग)</span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold font-mono">
                        Today
                      </span>
                    </h3>
                    <div className="text-xs text-[#52525B] space-y-2.5">
                      <div className="flex justify-between py-1 border-b border-neutral-100">
                        <span className="text-[#71717A]">Tithi:</span>
                        <span className="font-semibold text-[#18181B]">Shukla Dvadashi (शुक्ल द्वादशी)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-100">
                        <span className="text-[#71717A]">Nakshatra:</span>
                        <span className="font-semibold text-[#18181B]">Rohini (रोहिणी)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#71717A]">Upcoming Festival:</span>
                        <span className="font-semibold text-purple-700">Sharad Purnima</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50/70 text-[#18181B] rounded-[24px] p-5 shadow-xs border border-neutral-200/70">
                    <span className="text-[10.5px] text-purple-700 font-bold uppercase tracking-wider block mb-1 font-mono">
                      Daily Darshan Niyam
                    </span>
                    <p className="text-xs leading-relaxed text-[#52525B]">
                      Reciting or listening to at least one sacred pad after morning and afternoon darshan deepens inner stillness and joy.
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
          className={`md:hidden fixed bottom-0 left-0 right-0 ${showPlayer ? 'h-28' : 'h-20'} bg-gradient-to-t ${getScrimGradient()} pointer-events-none z-30 transition-colors duration-500`}
        />

        {/* Floating Navbar (Mobile Only < md) */}
        <FloatingNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenFab={handleFabClick}
          isPlayingAudio={isPlayingAudio}
        />

        {/* Sacred Devotional Pillar Control Modal */}
        <SadhanaPillarModal
          isOpen={activePillarModal !== null}
          pillarType={activePillarModal}
          onClose={() => setActivePillarModal(null)}
          sadhana={sadhana}
          onUpdateSadhana={handleUpdateSadhana}
          onOpenFocusModal={() => setIsFocusModalOpen(true)}
          onOpenPadavaliReader={() => setActiveTab('padavali')}
          onToggleAudio={handleTogglePlay}
          isPlayingAudio={isPlayingAudio}
          currentPad={currentPad}
          onOpenPlayer={handleFabClick}
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

        {/* Beginner Sacred Sadhana Quick Guide Modal */}
        <BeginnerGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          onStartChanting={() => {
            setIsGuideModalOpen(false);
            setActivePillarModal('japa');
          }}
          onOpenPlayer={() => {
            setIsGuideModalOpen(false);
            setShowPlayer(true);
            setIsPlayingAudio(true);
          }}
          onOpenReader={() => {
            setIsGuideModalOpen(false);
            setActiveTab('padavali');
          }}
        />
        {/* CMS, SEO & Headless Architecture Manager */}
        <CMSEditorialBadge currentPad={currentPad} activeTab={activeTab} />
      </div>
    </div>
  );
}
export default App;
