import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Award,
  Flame,
  CalendarCheck,
  BookOpen,
  Crown,
  X,
  Sparkles,
  CheckCircle2,
  Wind,
  Share2,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { ScallopedBadge } from '../common/ScallopedBadge';
import {
  loadCachedSadhanaSync,
  loadCachedSadhana,
  initMultiTabSync,
  loadDhyanaImpactSync,
  loadDhyanaImpact,
} from '../../services/cacheService';
import { SadhanaState, DhyanaImpactState } from '../../types/devotional';
import { SacredDatabase } from '../../services/sacredDatabase';

interface MilestonesViewProps {
  onBack: () => void;
}

interface BadgeItem {
  id: string;
  value: number;
  label: string;
  type: 'milestone' | 'streak';
  isLocked: boolean;
  titleDevanagari: string;
  requirement: string;
  blessing: string;
  spiritualSignificance: string;
}

const getDevotionalStage = (
  streakDays: number,
  completedBadges: number,
  japaCount: number,
  dhyanaMinutes: number
): { title: string; subtitle: string } => {
  // Stage 4: Rasik Sharana (Deep absorption in Nikunj Lila & unbroken devotion)
  if (streakDays >= 30 || completedBadges >= 8 || japaCount >= 108 || dhyanaMinutes >= 180) {
    return { title: 'रसिक आश्रय', subtitle: 'Rasik Sharana' };
  }
  // Stage 3: Ananya Sevi (Dedicated daily practice & sustained focus)
  if (streakDays >= 14 || completedBadges >= 5 || japaCount >= 48 || dhyanaMinutes >= 60) {
    return { title: 'अनन्य सेवी', subtitle: 'Ananya Sevi' };
  }
  // Stage 2: Nitya Sadhak (Regular committed daily rhythm)
  if (streakDays >= 7 || completedBadges >= 2 || japaCount >= 16 || dhyanaMinutes >= 20) {
    return { title: 'नित्य साधक', subtitle: 'Nitya Sadhak' };
  }
  // Stage 1: Anuragi Aspirant (Actively begun regular japa, reading, or streak)
  if (streakDays >= 1 || japaCount > 0 || dhyanaMinutes > 0) {
    return { title: 'अनुरागी साधक', subtitle: 'Anuragi Sadhak' };
  }
  // Base Stage: Jigyasu Sadhak (Initial seeker stepping onto the sacred path)
  return { title: 'जिज्ञासु साधक', subtitle: 'Jigyasu Sadhak' };
};

export const MilestonesView: React.FC<MilestonesViewProps> = ({ onBack }) => {
  const [sadhana, setSadhana] = useState<SadhanaState>(() => loadCachedSadhanaSync());
  const [dhyanaImpact, setDhyanaImpact] = useState<DhyanaImpactState>(() => loadDhyanaImpactSync());
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [isBadgeClosing, setIsBadgeClosing] = useState(false);
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRulesClosing, setIsRulesClosing] = useState(false);
  const rulesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      if (rulesTimerRef.current) clearTimeout(rulesTimerRef.current);
    };
  }, []);

  // Lock body scroll and close on Escape when blessing sheet or rules modal is active
  useEffect(() => {
    if (selectedBadge || isRulesModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedBadge) handleCloseBadge();
          if (isRulesModalOpen) handleCloseRules();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedBadge, isRulesModalOpen, isBadgeClosing, isRulesClosing]);

  const handleCloseBadge = () => {
    if (isBadgeClosing) return;
    setIsBadgeClosing(true);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => {
      setSelectedBadge(null);
      setIsBadgeClosing(false);
      badgeTimerRef.current = null;
    }, 240);
  };

  const handleCloseRules = () => {
    if (isRulesClosing) return;
    setIsRulesClosing(true);
    if (rulesTimerRef.current) clearTimeout(rulesTimerRef.current);
    rulesTimerRef.current = setTimeout(() => {
      setIsRulesModalOpen(false);
      setIsRulesClosing(false);
      rulesTimerRef.current = null;
    }, 240);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    let isMounted = true;
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

    const cleanupSync = initMultiTabSync((event) => {
      if (!isMounted) return;
      if (event.type === 'SADHANA_UPDATED' && event.payload) {
        setSadhana(event.payload as SadhanaState);
      } else if (event.type === 'DHYANA_SESSION_COMPLETED' && event.payload) {
        setDhyanaImpact(event.payload as DhyanaImpactState);
      }
    });

    return () => {
      isMounted = false;
      cleanupSync();
    };
  }, []);

  const badgeDefs = SacredDatabase.getSadhanaBadgeDefs();

  const milestones: BadgeItem[] = badgeDefs.milestones.map((m) => ({
    ...m,
    isLocked: m.id.includes('mala')
      ? !sadhana.completedMilestones.includes(m.id) && sadhana.japaCompleted < m.value
      : !sadhana.completedMilestones.includes(m.id),
  }));

  const streaks: BadgeItem[] = badgeDefs.streaks.map((s) => ({
    ...s,
    isLocked: sadhana.currentStreakDays < s.value && !sadhana.completedMilestones.includes(s.id),
  }));

  const completedMilestonesCount = milestones.filter((m) => !m.isLocked).length;
  const activeStreaksCount = streaks.filter((s) => !s.isLocked).length;

  const antarangaBadges: BadgeItem[] = badgeDefs.antarangaBadges.map((b) => {
    let isLocked = false;
    if (b.id === '15-dhyana') {
      isLocked = !dhyanaImpact.unlockedAntarangaBadges.includes('15-dhyana') && (sadhana.dhyanaMinutesCompleted || 0) < 15;
    } else if (b.id === '30-dhyana') {
      isLocked = !dhyanaImpact.unlockedAntarangaBadges.includes('30-dhyana') && (sadhana.dhyanaMinutesCompleted || 0) < 30;
    } else if (b.id === '7-manasi') {
      isLocked = !dhyanaImpact.unlockedAntarangaBadges.includes('7-manasi') && dhyanaImpact.metrics.unbrokenFocusStreakDays < 7;
    } else if (b.id === '108-shanti') {
      isLocked = !dhyanaImpact.unlockedAntarangaBadges.includes('108-shanti') && dhyanaImpact.recentSessions.length < 108;
    }
    return { ...b, isLocked };
  });

  const completedAntarangaCount = antarangaBadges.filter((b) => !b.isLocked).length;

  const devotionalStage = getDevotionalStage(
    sadhana.currentStreakDays,
    completedMilestonesCount + completedAntarangaCount,
    sadhana.japaCompleted,
    sadhana.dhyanaMinutesCompleted || 0
  );

  const handleShareMilestones = async () => {
    const text = `🌸 वृन्दोपनिषद् २.० • साधना सिद्धि\nसाधना सोपान: ${devotionalStage.title} (${devotionalStage.subtitle})\nअखंड निष्ठा: ${sadhana.currentStreakDays} ${sadhana.currentStreakDays === 1 ? 'दिवस' : 'दिवस'}\nनाम जप: ${sadhana.japaCompleted} माला\nसिद्ध सोपान: ${completedMilestonesCount + completedAntarangaCount} / ${milestones.length + antarangaBadges.length}\nश्रीजी कृपा • नित्य नव निकुंज उपासना\nजय श्री राधे!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'वृन्दोपनिषद् साधना सिद्धि',
          text,
          url: window.location.href,
        });
        setToastMessage('श्रीजी कृपा संदेश साझा किया गया!');
        return;
      } catch (e) {
        // User cancelled share
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setToastMessage('साधना सिद्धि विवरण कॉपी हो गया!');
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'Vrindopnisad 2.0',
      exportedAt: new Date().toISOString(),
      sadhana,
      dhyanaImpact,
      devotionalStage,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vrindopnisad-sadhana-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage('साधना रिकॉर्ड सुरक्षित डाउनलोड हो गया!');
  };

  const handleRefreshSync = async () => {
    const cached = await loadCachedSadhana();
    if (cached) setSadhana(cached);
    const cachedImpact = await loadDhyanaImpact();
    if (cachedImpact) setDhyanaImpact(cachedImpact);
    setToastMessage('साधना डेटा सफलतापुर्वक सिंक हुआ!');
  };

  return (
    <div className="w-full pb-44 md:pb-32 pt-1 max-w-5xl mx-auto">
      {/* Top Header Bar with Spontaneous Devotional Action Controls */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dashboard"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-200/80 shadow-2xs flex items-center justify-center text-[#111111] pressable bg-white md:hidden shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-doto text-[11px] sm:text-xs uppercase tracking-widest text-[#B84A28] font-bold bg-[#B84A28]/10 px-2.5 sm:px-3 py-1 rounded-full shrink-0">
              Milestones
            </span>
            <span className="text-xs text-[#6B6F6B] font-medium hidden sm:inline truncate">
              • Spiritual Milestones by Shriji's Grace
            </span>
          </div>
        </div>

        {/* Spontaneous Devotional Quick Actions (Replaces sterile 3-dots button) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rules & Guidelines Pill */}
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs text-xs font-semibold text-[#111111] hover:bg-[#FAF9F5] transition-colors pressable"
            title="साधना नियम व मर्यादा (Spiritual Rules & Guidelines)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#B84A28] shrink-0" />
            <span className="hidden xs:inline">नियम</span>
            <span className="hidden md:inline">व मर्यादा</span>
          </button>

          {/* Share Grace Pill */}
          <button
            type="button"
            onClick={handleShareMilestones}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs text-xs font-semibold text-[#111111] hover:bg-[#FAF9F5] transition-colors pressable"
            title="साधना सिद्धि साझा करें (Share Milestones)"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden xs:inline">साझा</span>
            <span className="hidden md:inline">करें</span>
          </button>

          {/* Sync & Backup Quick Group */}
          <div className="flex items-center bg-white border border-neutral-200/80 rounded-full p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleRefreshSync}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 transition-colors pressable"
              title="साधना डेटा सिंक करें (Sync Sadhana Records)"
              aria-label="Sync Sadhana"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 transition-colors pressable"
              title="साधना रिकॉर्ड बैकअप डाउनलोड करें (Export Backup)"
              aria-label="Export Data Backup"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header & Headline */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#111111] leading-tight">
            Unbroken Devotion • अखंड निष्ठा
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-2 font-medium">
            Grace at every step • Eternal Nikunj Remembrance
          </p>
        </div>

        {/* Bento Stats Summary Pills - 100% Real Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          {/* 1. Streak with grammatical pluralization */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <Flame className="w-3 h-3 text-[#EF4444]" />
              Streak
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              {sadhana.currentStreakDays} {sadhana.currentStreakDays === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-[10px] text-[#6B6F6B] font-medium font-devanagari mt-0.5">
              {sadhana.currentStreakDays > 0 ? 'अखंड निष्ठा' : 'साधना प्रारंभ'}
            </span>
          </div>

          {/* 2. Real Live Naam Japa Malas (Replacing fake Ekadashi Vrats 10 / 12) */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Naam Japa
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              {sadhana.japaCompleted} / {sadhana.japaTarget || 16}
            </span>
            <span className="text-[10px] text-[#6B6F6B] font-medium font-devanagari mt-0.5">
              {sadhana.japaCompleted === 1 ? '१ माला पूर्ण' : `${sadhana.japaCompleted} मालाएं पूर्ण`}
            </span>
          </div>

          {/* 3. Real Svadhyaya Padas with grammatical pluralization */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <BookOpen className="w-3 h-3 text-amber-700" />
              Svadhyaya
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              {sadhana.svadhyayaPadas || 0} {(sadhana.svadhyayaPadas || 0) === 1 ? 'Pada' : 'Padas'}
            </span>
            <span className="text-[10px] text-[#6B6F6B] font-medium font-devanagari mt-0.5">
              स्वाध्याय अनुशीलन
            </span>
          </div>

          {/* 4. Real Dynamic Devotional Stage (Replacing hardcoded static Rasik Sharana) */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <Crown className="w-3 h-3 text-[#D4A359]" />
              Sadhana Stage
            </span>
            <span className="font-semibold text-sm text-[#111111] mt-1 truncate font-devanagari">
              {devotionalStage.title}
            </span>
            <span className="text-[10px] text-[#6B6F6B] font-medium truncate mt-0.5">
              {devotionalStage.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Two Balanced Columns: Milestones on Left, Streaks on Right on Tablet & Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Milestones */}
        <div className="bg-[#FAF9F5] rounded-[28px] p-3.5 sm:p-6 border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                  Sadhana Milestones
                </h2>
                <span className="text-[11px] text-[#6B6F6B]">
                  Ekadashi, Pradosh & sacred Japa completions
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#78350F] bg-[#FEF08A] px-2.5 py-1 rounded-full font-bold">
              Achieved: {completedMilestonesCount} / {milestones.length}
            </span>
          </div>

          {/* 3x2 Grid */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-1.5 sm:gap-x-3">
            {milestones.map((m) => (
              <ScallopedBadge
                key={m.id}
                value={m.value}
                label={m.label}
                type="milestone"
                isLocked={m.isLocked}
                onClick={() => setSelectedBadge(m)}
              />
            ))}
          </div>
        </div>

        {/* Card 2: Consecutive Streaks */}
        <div className="bg-[#FAF9F5] rounded-[28px] p-3.5 sm:p-6 border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                  Consecutive Day Streaks
                </h2>
                <span className="text-[11px] text-[#6B6F6B]">
                  Unbroken daily remembrance and japa flow
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#78350F] bg-[#FEF08A] px-2.5 py-1 rounded-full font-bold">
              Active: {activeStreaksCount} / {streaks.length}
            </span>
          </div>

          {/* 3x2 Grid */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-1.5 sm:gap-x-3">
            {streaks.map((s) => (
              <ScallopedBadge
                key={s.id}
                value={s.value}
                label={s.label}
                type="streak"
                isLocked={s.isLocked}
                onClick={() => setSelectedBadge(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Antaranga Sewa (Contemplative & Mental Stillness Milestones) */}
      <div className="mt-6 bg-[#FAF9F5] rounded-[28px] p-3.5 sm:p-6 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Wind className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#18181B]">
                Antaranga Dhyana Mastery
              </h2>
              <span className="text-[11px] text-[#71717A]">
                Mindful meditation, stillness, and inner manasi seva
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#78350F] bg-[#FEF08A] px-3 py-1 rounded-full font-mono font-bold">
            Mastered: {completedAntarangaCount} / {antarangaBadges.length}
          </span>
        </div>

        {/* 4-Rosette Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-4">
          {antarangaBadges.map((b) => (
            <ScallopedBadge
              key={b.id}
              value={b.value}
              label={b.label}
              type={b.type}
              isLocked={b.isLocked}
              onClick={() => setSelectedBadge(b)}
            />
          ))}
        </div>
      </div>

      {/* Interactive Sacred Blessing Sheet Modal rendered at root via Portal */}
      {selectedBadge && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none transition-opacity ${
            isBadgeClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseBadge}
        >
          <div
            className={`bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-md relative max-h-[min(90vh,620px)] sm:max-h-[min(86vh,640px)] flex flex-col overflow-hidden ${
              isBadgeClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed / Non-collapsing) */}
            <div className="shrink-0 p-4 sm:p-5 pb-2 text-center relative border-b border-black/[0.04]">
              {/* Close button */}
              <button
                type="button"
                onClick={handleCloseBadge}
                aria-label="Close blessing sheet"
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111] pressable hover:bg-black/10 z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badge Rosette visual */}
              <div className="flex flex-col items-center">
                <div className="mb-1.5 sm:mb-2">
                  <ScallopedBadge
                    value={selectedBadge.value}
                    label={selectedBadge.label}
                    type={selectedBadge.type}
                    isLocked={selectedBadge.isLocked}
                  />
                </div>

                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full mb-1">
                  {selectedBadge.type === 'milestone' ? 'Sacred Milestone' : 'Unbroken Sadhana'}
                </span>
                <h3 className="font-devanagari font-bold text-base sm:text-lg text-[#111111] mt-0.5 leading-snug">
                  {selectedBadge.titleDevanagari}
                </h3>

                <div className="mt-1">
                  {selectedBadge.isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-mono">
                      In Progress (साधनारत)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Achieved • Shriji's Grace (सिद्ध सोपान)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Devotional blessing content - Flex-1 scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 space-y-2.5 text-left overscroll-contain">
              {/* Shriji Blessing */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Divine Blessing (श्रीजी का पावन आशीष)
                </span>
                <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed">
                  {selectedBadge.blessing}
                </p>
              </div>

              {/* Spiritual Significance */}
              <div className="bg-[#FAF9F5] p-3 rounded-2xl">
                <span className="text-[10.5px] font-bold text-[#18181B] uppercase tracking-wider block mb-1">
                  Spiritual Significance & Lineage Context
                </span>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {selectedBadge.spiritualSignificance}
                </p>
              </div>

              {/* Sadhana Requirement */}
              <div className="bg-[#FAF9F5] p-3 rounded-2xl">
                <span className="text-[10.5px] font-bold text-[#6B6F6B] uppercase tracking-wider block mb-1">
                  Completion Requirement
                </span>
                <p className="text-xs text-[#333333] font-medium leading-relaxed">
                  {selectedBadge.requirement}
                </p>
              </div>
            </div>

            {/* Bottom Dismiss Button - Fixed anchored footer */}
            <div className="shrink-0 p-3.5 sm:p-5 pt-2 border-t border-black/[0.04] bg-white">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 sm:py-3 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sacred Sadhana Rules & Discipline Modal */}
      {isRulesModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none transition-opacity ${
            isRulesClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseRules}
        >
          <div
            className={`bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-lg relative max-h-[min(90vh,620px)] sm:max-h-[min(86vh,640px)] flex flex-col overflow-hidden ${
              isRulesClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 pb-3 text-center relative border-b border-black/[0.04]">
              <button
                type="button"
                onClick={handleCloseRules}
                aria-label="Close rules sheet"
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111] pressable hover:bg-black/10 z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#B84A28]/10 text-[#B84A28] flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#B84A28] uppercase tracking-wider bg-[#B84A28]/10 px-2.5 py-0.5 rounded-full mb-1">
                Spiritual Discipline • रसिक अनुशासन
              </span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#111111] mt-0.5">
                Sadhana Guidelines & Rules
              </h3>
              <p className="text-xs text-[#6B6F6B] mt-0.5">
                Sacred principles of eternal Nikunj devotional remembrance
              </p>
            </div>

            {/* Scrollable Rules List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-3 text-left overscroll-contain">
              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-sm text-[#18181B]">
                    1. Unbroken Streak Principle (अखंड निष्ठा)
                  </h4>
                </div>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Offering at least 1 mala of Naam Japa or 5 minutes of focused Dhyana daily maintains your unbroken streak. Consistency is the heartbeat of devotional life.
                </p>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-amber-700" />
                  <h4 className="font-semibold text-sm text-[#111111]">
                    2. Japa Counting (1 Mala = 108 Beads)
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  108 mindful repetitions of the sacred Yugal Mantra. Keep the mind absorbed in the lotus feet of Shriji without crossing the Sumeru bead.
                </p>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="w-4 h-4 text-amber-700" />
                  <h4 className="font-semibold text-sm text-[#18181B]">
                    3. Inner Manasi Seva & Meditation (Dhyāna Flow)
                  </h4>
                </div>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Sitting in quiet contemplation, aligning breath with the divine name, gently calming worldly distractions into sacred serenity.
                </p>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck className="w-4 h-4 text-amber-700" />
                  <h4 className="font-semibold text-sm text-[#111111]">
                    4. Sacred Ekadashi & Pradosh Observance
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Observing pure sattvic fasting on holy tithis, supplemented with extra kirtan and study of saints' vanis, deepens inner realization.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3.5 sm:p-5 pt-2 border-t border-black/[0.04] bg-white">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="w-full py-2.5 sm:py-3 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Acknowledge • जय श्री राधे
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Apple-grade Toast Notification */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-[#FEF08A] text-[#78350F] px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 apple-dialog-enter max-w-[90vw] truncate">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>,
        document.body
      )}
    </div>
  );
};

