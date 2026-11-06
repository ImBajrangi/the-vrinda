import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  MoreVertical,
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

export const MilestonesView: React.FC<MilestonesViewProps> = ({ onBack }) => {
  const [sadhana, setSadhana] = useState<SadhanaState>(() => loadCachedSadhanaSync());
  const [dhyanaImpact, setDhyanaImpact] = useState<DhyanaImpactState>(() => loadDhyanaImpactSync());
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [isBadgeClosing, setIsBadgeClosing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRulesClosing, setIsRulesClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCloseBadge = () => {
    setIsBadgeClosing(true);
    setTimeout(() => {
      setSelectedBadge(null);
      setIsBadgeClosing(false);
    }, 200);
  };

  const handleCloseRules = () => {
    setIsRulesClosing(true);
    setTimeout(() => {
      setIsRulesModalOpen(false);
      setIsRulesClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-milestones-menu]')) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

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

  const milestones: BadgeItem[] = [
    {
      id: '1-mala',
      value: 1,
      label: '1 Mala',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('1-mala') && sadhana.japaCompleted < 1,
      titleDevanagari: 'प्रथम नाम दीक्षा • १ माला',
      requirement: 'प्रतिदिन कम से कम १ माला पावन युगल नाम जप पूर्ण करना',
      blessing: 'श्रीजी के चरणारविन्द में प्रथम अनुराग की पावन ज्योति का प्राकट्य।',
      spiritualSignificance: 'नाम जप से अंतःकरण का मार्जन होता है और निकुंज रस का प्रवेश प्रारंभ होता है।',
    },
    {
      id: '5-mala',
      value: 5,
      label: '5 Mala',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('5-mala') && sadhana.japaCompleted < 5,
      titleDevanagari: 'पंच माला निष्ठा • ५ माला',
      requirement: '५ माला नियमित भगवन्नाम संकीर्तन पूर्ण करना',
      blessing: 'ठाकुर श्री बांके बिहारी लाल के नयनों की विशेष करुणा व संरक्षण।',
      spiritualSignificance: 'इंद्रिय संयम और चित्त में श्री वृन्दावन धाम की मधुर स्मृति का स्थायित्व।',
    },
    {
      id: '10-mala',
      value: 10,
      label: '10 Mala',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('10-mala') && sadhana.japaCompleted < 10,
      titleDevanagari: 'दश माला अनुष्ठान • १० माला',
      requirement: '१० माला नित्य प्रेम साधना पूर्ण करना',
      blessing: 'श्री स्वामी हरिदास जी महाराज का अहैतुक वात्सल्य एवं संगीत रस कृपा।',
      spiritualSignificance: 'संसार ताप का शमन और सहज समाधि रस का आंतरिक अनुभव।',
    },
    {
      id: '16-mala',
      value: 16,
      label: '16 Mala',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('16-mala') && sadhana.japaCompleted < 16,
      titleDevanagari: 'षोडश कला पूर्ण • १६ माला',
      requirement: '१६ माला पूर्ण वैधी एवं रागानुगा साधना पूर्ण करना',
      blessing: 'श्री हित हरिवंश महाप्रभु की कृपा से नित्य निकुंज विहार का रस।',
      spiritualSignificance: 'जीव का श्रीराधा-शरण में पूर्ण समर्पण और अखंड प्रेम की प्राप्ति।',
    },
    {
      id: '25-vrat',
      value: 25,
      label: '25 Vrat',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('25-vrat'),
      titleDevanagari: 'रजत एकादशी नियम • २५ व्रत',
      requirement: '२५ पावन एकादशी एवं प्रदोष निर्जल/फलाहार व्रत पूर्ण करना',
      blessing: 'श्री प्रिया-प्रियतम के युगल चरण कमलों में अनन्य प्रीति।',
      spiritualSignificance: 'तप और सेवा के समन्वय से भगवद्-रस का अखंड प्रवाह।',
    },
    {
      id: '50-vrat',
      value: 50,
      label: '50 Vrat',
      type: 'milestone',
      isLocked: !sadhana.completedMilestones.includes('50-vrat'),
      titleDevanagari: 'स्वर्ण अनुष्ठान व्रत • ५० व्रत',
      requirement: '५० एकादशी अखंड नियम पूर्णता',
      blessing: 'नित्य निकुंज धाम की सखी भाव सेवा का अधिकार।',
      spiritualSignificance: 'वैकुण्ठ एवं गोलोक से भी परे श्री वृन्दावन के नित्य विहार रस में स्थिति।',
    },
  ];

  const streaks: BadgeItem[] = [
    {
      id: '3-niyam',
      value: 3,
      label: '3-Day Niyam',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 3 && !sadhana.completedMilestones.includes('3-niyam'),
      titleDevanagari: 'त्रिदिवसीय पावन संकल्प',
      requirement: 'लगातार ३ दिन तक नित्य सेवा, जप एवं दर्शन',
      blessing: 'मन की चंचलता पर प्रथम विजय और भक्ति का अंकुर।',
      spiritualSignificance: 'भक्ति मार्ग का दृढ़ आरंभ और संकल्प शुद्धि।',
    },
    {
      id: '7-niyam',
      value: 7,
      label: '7-Day Niyam',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 7 && !sadhana.completedMilestones.includes('7-niyam'),
      titleDevanagari: 'सप्त दिवसीय अखण्ड सेवा',
      requirement: 'लगातार ७ दिन तक अखंड नियम पालन',
      blessing: 'सप्त ऋषियों और व्रज सखियों का अनुग्रह।',
      spiritualSignificance: 'साधना में एकाग्रता और आनंद का संचरण।',
    },
    {
      id: '14-niyam',
      value: 14,
      label: '14-Day Niyam',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 14 && !sadhana.completedMilestones.includes('14-niyam'),
      titleDevanagari: 'पक्ष नियम पूर्णता',
      requirement: 'लगातार १४ दिन तक नियम सेवा',
      blessing: 'श्री राधा वल्लभ लाल की सुमधुर मुस्कान का दर्शन।',
      spiritualSignificance: 'अंतःकरण में सतत नाम स्मरण का प्रभाव।',
    },
    {
      id: '21-niyam',
      value: 21,
      label: '21-Day Niyam',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 21 && !sadhana.completedMilestones.includes('21-niyam'),
      titleDevanagari: 'एकविंशति दिवस रस धारा',
      requirement: 'लगातार २१ दिन तक नित्य आराधना',
      blessing: 'नित्य निकुंज के अष्टप्रहर रस का सान्निध्य।',
      spiritualSignificance: 'संसार के प्रति अनासक्ति और युगल नाम में प्रगाढ़ रुचि।',
    },
    {
      id: '40-niyam',
      value: 40,
      label: '40-Day Niyam',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 40 && !sadhana.completedMilestones.includes('40-niyam'),
      titleDevanagari: 'मण्डल साधना सिद्धि',
      requirement: 'लगातार ४० दिन की अखंड नियम साधना',
      blessing: 'श्री वृन्दावन धाम वास की आंतरिक अनुभूति।',
      spiritualSignificance: 'एक मण्डल की निष्ठा से चित्त का पूर्ण शुद्धीकरण।',
    },
    {
      id: '108-ras',
      value: 108,
      label: '108-Day Ras',
      type: 'streak',
      isLocked: sadhana.currentStreakDays < 108 && !sadhana.completedMilestones.includes('108-ras'),
      titleDevanagari: 'अष्टोत्तरशत दिवस महा-अनुष्ठान',
      requirement: '१०८ दिन अखंड नाम-संकीर्तन एवं सेवा',
      blessing: 'श्री किशोरी जी के असीम कृपा-कटाक्ष की वर्षा।',
      spiritualSignificance: 'परम रस की प्राप्ति और नित्य दास्य भाव का प्राकट्य।',
    },
  ];

  const completedMilestonesCount = milestones.filter((m) => !m.isLocked).length;
  const activeStreaksCount = streaks.filter((s) => !s.isLocked).length;

  const antarangaBadges: BadgeItem[] = [
    {
      id: '15-dhyana',
      value: 15,
      label: '15 Min Dhyana',
      type: 'milestone',
      isLocked: !dhyanaImpact.unlockedAntarangaBadges.includes('15-dhyana') && (sadhana.dhyanaMinutesCompleted || 0) < 15,
      titleDevanagari: 'प्रथम चित्त शान्ति • १५ मिनट',
      requirement: '१५ मिनट अविरल मानसिक ध्यान एवं नाम स्मरण पूर्ण करना',
      blessing: 'श्रीजी के चरणारविन्द में मन की एकाग्रता और दिव्य प्रकाश का अनुभव।',
      spiritualSignificance: 'संसार के विक्षेप शांत होते हैं और अंतःकरण निर्मल दर्पण के समान हो जाता है।',
    },
    {
      id: '30-dhyana',
      value: 30,
      label: '30 Min Flow',
      type: 'milestone',
      isLocked: !dhyanaImpact.unlockedAntarangaBadges.includes('30-dhyana') && (sadhana.dhyanaMinutesCompleted || 0) < 30,
      titleDevanagari: 'अखंड ध्यान धारा • ३० मिनट',
      requirement: '३० मिनट अखंड तैलधारामिव सतत ध्यान में स्थिति',
      blessing: 'शांत निकुंज रस का आंतरिक दर्शन एवं युगल छवि में लीनता।',
      spiritualSignificance: 'डिफ़ॉल्ट मोड नेटवर्क (DMN) की पूर्ण शांति; जीव को सहज समाधि रस की अनुभूति।',
    },
    {
      id: '7-manasi',
      value: 7,
      label: '7-Day Manasi',
      type: 'streak',
      isLocked: !dhyanaImpact.unlockedAntarangaBadges.includes('7-manasi') && dhyanaImpact.metrics.unbrokenFocusStreakDays < 7,
      titleDevanagari: 'सप्त दिवसीय मानसी सेवा',
      requirement: 'लगातार ७ दिन तक नित्य अंतर्मुखी मानसी सेवा व ध्यान',
      blessing: 'श्री स्वामी हरिदास जी एवं रसिक सखियों का विशेष वात्सल्य अनुग्रह।',
      spiritualSignificance: 'वैखरी से मानसी जप में आरोहण और नित्य लीला में चित्त का प्रवेश।',
    },
    {
      id: '108-shanti',
      value: 108,
      label: '108 Sessions',
      type: 'milestone',
      isLocked: !dhyanaImpact.unlockedAntarangaBadges.includes('108-shanti') && dhyanaImpact.recentSessions.length < 108,
      titleDevanagari: 'परम एकाग्रता सिद्धि • १०८ सत्र',
      requirement: '१०८ पावन ध्यान सत्र सफलतापूर्वक पूर्ण करना',
      blessing: 'श्री हित हरिवंश महाप्रभु की कृपा से नित्य निकुंज विहार रस का पावन अधिकार।',
      spiritualSignificance: 'मन के समस्त पुराने संस्कारों (वासनाओं) की पूर्ण शुद्धि एवं अनन्य प्रेमाभक्ति।',
    },
  ];

  const completedAntarangaCount = antarangaBadges.filter((b) => !b.isLocked).length;

  const handleShareMilestones = async () => {
    setIsMenuOpen(false);
    const text = `🌸 वृन्दोपनिषद् २.० • साधना सिद्धि\nअखंड निष्ठा: ${sadhana.currentStreakDays} दिवस\nसिद्ध सोपान: ${completedMilestonesCount} / ${milestones.length}\nचित्त शान्ति सिद्धि: ${sadhana.chittaShantiScore || 98}%\nश्रीजी कृपा • नित्य नव निकुंज उपासना\nजय श्री राधे!`;
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
    setIsMenuOpen(false);
    const backupData = {
      app: 'Vrindopnisad 2.0',
      exportedAt: new Date().toISOString(),
      sadhana,
      dhyanaImpact,
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
    setIsMenuOpen(false);
    const cached = await loadCachedSadhana();
    if (cached) setSadhana(cached);
    const cachedImpact = await loadDhyanaImpact();
    if (cachedImpact) setDhyanaImpact(cachedImpact);
    setToastMessage('साधना डेटा सफलतापुर्वक सिंक हुआ!');
  };

  return (
    <div className="w-full pb-44 md:pb-32 pt-1 max-w-5xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to dashboard"
          className="w-10 h-10 rounded-full border border-white/90 shadow-xs flex items-center justify-center text-[#111111] pressable bg-white/70 backdrop-blur-md md:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-doto text-xs uppercase tracking-widest text-[#B84A28] font-bold bg-[#B84A28]/10 px-3 py-1 rounded-full">
            साधना सिद्धि व अनुष्ठान
          </span>
          <span className="text-xs text-[#6B6F6B] font-medium hidden sm:inline">
            • श्रीजी कृपा से प्राप्त अनुष्ठान
          </span>
        </div>

        {/* More Options Dropdown Container */}
        <div className="relative" data-milestones-menu>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="More options"
            aria-expanded={isMenuOpen}
            className="w-10 h-10 rounded-full border border-white/90 shadow-xs flex items-center justify-center text-[#111111] pressable bg-white/70 backdrop-blur-md hover:bg-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Glassmorphic Dropdown Popover */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-40 w-64 sm:w-72 bg-white border border-black/10 rounded-2xl shadow-2xl p-1.5 apple-dialog-enter text-left">
              <div className="px-3 py-2 border-b border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B84A28]">
                  साधना विकल्प एवं सेवा
                </span>
                <p className="text-xs font-semibold text-[#111111]">
                  नित्य निकुंज नियम प्रबंधन
                </p>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={handleShareMilestones}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-[#111111]">साधना सिद्धि साझा करें</span>
                    <span className="text-[10.5px] text-[#6B6F6B]">अखंड निष्ठा का संदेश भेजें</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsRulesModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-[#111111]">अनुष्ठान नियम व विधि</span>
                    <span className="text-[10.5px] text-[#6B6F6B]">जप, व्रत व अखंड सेवा नियम</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-[#111111]">डेटा बैकअप सहेजें</span>
                    <span className="text-[10.5px] text-[#6B6F6B]">साधना रिकॉर्ड सुरक्षित डाउनलोड करें</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshSync}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#222222] hover:bg-black/5 pressable transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-[#111111]">डेटा सिंक ताज़ा करें</span>
                    <span className="text-[10.5px] text-[#6B6F6B]">IndexedDB व बहु-टैब रीफ्रेश</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Header & Headline */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[28px] border border-white/80 shadow-card">
        <div>
          <h1 className="font-devanagari font-bold text-2xl sm:text-3xl lg:text-4xl text-[#111111] leading-tight">
            अखण्ड निष्ठा • नित्य रस प्रवाह
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-2 font-medium">
            पद-पद पर युगल कृपा • नित्य नव निकुंज उपासना
          </p>
        </div>

        {/* Bento Stats Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          <div className="bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs flex flex-col">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <Flame className="w-3 h-3 text-[#EF4444]" />
              अखंड निष्ठा
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              {sadhana.currentStreakDays} Days
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs flex flex-col">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <CalendarCheck className="w-3 h-3 text-[#22C55E]" />
              एकादशी व्रत
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              10 / 12
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs flex flex-col">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <BookOpen className="w-3 h-3 text-[#8B5CF6]" />
              कंठस्थ पद
            </span>
            <span className="font-doto font-bold text-lg text-[#111111] mt-0.5">
              {sadhana.svadhyayaPadas} Padas
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs flex flex-col">
            <span className="text-[10px] text-[#6B6F6B] font-semibold flex items-center gap-1 uppercase">
              <Crown className="w-3 h-3 text-[#D4A359]" />
              साधक श्रेणी
            </span>
            <span className="font-semibold text-xs text-[#111111] mt-1 truncate">
              रसिक शरण
            </span>
          </div>
        </div>
      </div>

      {/* Two Balanced Columns: Milestones on Left, Streaks on Right on Tablet & Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Milestones */}
        <div className="bg-[#F4F4F4] rounded-[28px] p-3.5 sm:p-6 border border-white/80 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                  नियम सेवा अनुष्ठान
                </h2>
                <span className="text-[11px] text-[#6B6F6B]">
                  एकादशी, प्रदोष एवं पावन नाम नियम पूर्णता
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#B84A28] bg-white px-2.5 py-1 rounded-full border border-black/5 shadow-xs">
              सिद्ध सोपान: {completedMilestonesCount} / {milestones.length}
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
        <div className="bg-[#F4F4F4] rounded-[28px] p-3.5 sm:p-6 border border-white/80 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                  अखण्ड भक्ति अनुष्ठान
                </h2>
                <span className="text-[11px] text-[#6B6F6B]">
                  अखंड नित्य सेवा एवं प्रतिदिन नाम संकीर्तन
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2E6B1B] bg-white px-2.5 py-1 rounded-full border border-black/5 shadow-xs">
              सक्रिय निष्ठा: {activeStreaksCount} / {streaks.length}
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
      <div className="mt-6 bg-[#F4F4F4] rounded-[28px] p-3.5 sm:p-6 border border-white/80 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Wind className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                अन्तरंग मानसी सोपान
              </h2>
              <span className="text-[11px] text-[#6B6F6B]">
                गहन ध्यान, चित्त शान्ति एवं मानसी सेवा अनुशीलन
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-black/5 shadow-xs">
            सिद्ध सोपान: {completedAntarangaCount} / {antarangaBadges.length}
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
          className={`fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none transition-opacity ${
            isBadgeClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseBadge}
        >
          <div
            className={`bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-md shadow-2xl relative max-h-[min(90vh,620px)] sm:max-h-[min(86vh,640px)] flex flex-col overflow-hidden ${
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

                <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-full mb-1">
                  {selectedBadge.type === 'milestone' ? 'पावन सोपान' : 'अखण्ड साधना'}
                </span>
                <h3 className="font-devanagari font-bold text-base sm:text-lg text-[#111111] mt-0.5 leading-snug">
                  {selectedBadge.titleDevanagari}
                </h3>

                <div className="mt-1">
                  {selectedBadge.isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                      साधनारत (प्रगति पर)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      सिद्ध सोपान (श्रीजी अनुग्रह)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Devotional blessing content - Flex-1 scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 space-y-2.5 text-left overscroll-contain">
              {/* Shriji Blessing */}
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border-l-[3px] border-[#D4A359]">
                <span className="text-[10.5px] font-bold text-[#C85A32] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A359]" />
                  श्रीजी का पावन आशीष
                </span>
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                  {selectedBadge.blessing}
                </p>
              </div>

              {/* Spiritual Significance */}
              <div className="bg-[#F8F9FA] p-3 rounded-2xl border border-black/5">
                <span className="text-[10.5px] font-bold text-[#14213D] uppercase tracking-wider block mb-1">
                  रसिक सम्प्रदाय भाव एवं महात्म्य
                </span>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {selectedBadge.spiritualSignificance}
                </p>
              </div>

              {/* Sadhana Requirement */}
              <div className="bg-white p-3 rounded-2xl border border-black/10">
                <span className="text-[10.5px] font-bold text-[#6B6F6B] uppercase tracking-wider block mb-1">
                  अनुष्ठान पूर्णता हेतु नियम
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
                className="w-full py-2.5 sm:py-3 rounded-2xl bg-[#14213D] text-[#B6FF2E] text-xs font-bold uppercase tracking-wider pressable shadow-xs"
              >
                जय श्री राधे • प्रणाम
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sacred Sadhana Rules & Discipline Modal */}
      {isRulesModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none transition-opacity ${
            isRulesClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseRules}
        >
          <div
            className={`bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-lg shadow-2xl relative max-h-[min(90vh,620px)] sm:max-h-[min(86vh,640px)] flex flex-col overflow-hidden ${
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
                रसिक सम्प्रदाय अनुशासन
              </span>
              <h3 className="font-devanagari font-bold text-lg sm:text-xl text-[#111111] mt-0.5">
                साधना सिद्धि व अनुष्ठान नियम
              </h3>
              <p className="text-xs text-[#6B6F6B] mt-0.5">
                श्री वृन्दावन धाम की नित्य निकुंज उपासना का पावन विधान
              </p>
            </div>

            {/* Scrollable Rules List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-3 text-left overscroll-contain">
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-l-[3px] border-[#D4A359]">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-[#C85A32]" />
                  <h4 className="font-devanagari font-bold text-sm text-[#111111]">
                    १. अखंड निष्ठा सूत्र (Daily Streak)
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  प्रतिदिन कम से कम १ माला जप अथवा ५ मिनट ध्यान साधना करने पर अखंड निष्ठा का सूत्र सक्रिय रहता है। निरंतरता ही रसिक साधना की प्राणशक्ति है।
                </p>
              </div>

              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-black/5">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-[#8B5CF6]" />
                  <h4 className="font-devanagari font-bold text-sm text-[#111111]">
                    २. जप माला गणना (1 Mala = 108 Beads)
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  १०८ बार पावन युगल नाम का एकाग्र उच्चारण। सुमेरु का उल्लंघन न करते हुए मन को श्रीजी के चरणारविन्द में एकाग्र रखना चाहिए।
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-l-[3px] border-emerald-500">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-devanagari font-bold text-sm text-[#111111]">
                    ३. अंतरंग मानसी सेवा व ध्यान (Dhyana Flow)
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  शांत निकुंज कक्ष में बैठकर सांसों के साथ नाम का स्मरण। चित्त वृत्ति निरोध द्वारा मन को सांसारिक विक्षेपों से मुक्त कर नित्य विहार रस में स्थित करना।
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-black/10">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck className="w-4 h-4 text-[#22C55E]" />
                  <h4 className="font-devanagari font-bold text-sm text-[#111111]">
                    ४. पावन एकादशी व प्रदोष नियम
                  </h4>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  पवित्र तिथियों पर सात्विक फलाहार या निर्जल व्रत, अतिरिक्त नाम संकीर्तन और संतों की वाणी का अध्ययन करना सिद्धि प्रदायक है।
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3.5 sm:p-5 pt-2 border-t border-black/[0.04] bg-white">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="w-full py-2.5 sm:py-3 rounded-2xl bg-[#14213D] text-[#B6FF2E] text-xs font-bold uppercase tracking-wider pressable shadow-xs"
              >
                सत्य संकल्प • जय श्री राधे
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Apple-grade Toast Notification */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-[#14213D] text-[#B6FF2E] px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 apple-dialog-enter border border-white/10 max-w-[90vw] truncate">
          <CheckCircle2 className="w-4 h-4 text-[#B6FF2E] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>,
        document.body
      )}
    </div>
  );
};
