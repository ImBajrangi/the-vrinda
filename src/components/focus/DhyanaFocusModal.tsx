import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Volume2, VolumeX, Sparkles, Brain, Wind, Heart, RotateCcw, ShieldCheck, Flame, Compass, Check, BookMarked, Feather } from 'lucide-react';
import {
  formatDevanagariNumerals,
  recordDhyanaSession,
  saveSacredReflection,
  computeDhyanaFlowStage,
} from '../../services/cacheService';
import { DhyanaSessionRecord, SacredReflectionEntry } from '../../types/devotional';
import {
  getCachedDevotionalSummarySync,
  getDevotionalSummary,
  DevotionalSummaryRequest,
} from '../../services/devotionalSummaryService';
import { SacredDatabase } from '../../services/sacredDatabase';

interface DhyanaFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJapaMala?: (count: number) => void;
  onSessionComplete?: (session: DhyanaSessionRecord) => void;
  isLowSpec?: boolean;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

export const DhyanaFocusModal: React.FC<DhyanaFocusModalProps> = ({
  isOpen,
  onClose,
  onAddJapaMala,
  onSessionComplete,
  isLowSpec = false,
}) => {
  // Session Timer State
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [japaInSession, setJapaInSession] = useState(0);

  // Breathing Guide State (4s Inhale, 4s Hold, 4s Exhale, 2s Rest)
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [breathProgress, setBreathProgress] = useState(0); // 0 to 100%

  // Soundscape Synth (Web Audio API - 0 external files)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Focus Metric Tab: 'sanctuary' | 'impact'
  const [activeTab, setActiveTab] = useState<'sanctuary' | 'impact'>('sanctuary');

  // Sacred Reflection Journal State
  const [reflectionSentiment, setReflectionSentiment] = useState<'shanti' | 'bhava' | 'yugal' | 'sthirata'>('shanti');
  const [reflectionNote, setReflectionNote] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [activeAphorismIdx, setActiveAphorismIdx] = useState(0);

  const sentimentRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [sentimentPillStyle, setSentimentPillStyle] = useState<{ left: number; top: number; width: number; height: number; ready: boolean }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    const el = sentimentRefs.current[reflectionSentiment];
    if (el) {
      setSentimentPillStyle({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        ready: true,
      });
    }
  }, [reflectionSentiment]);

  // Contemplative Devotional Summary State
  const [isQuoteSummaryOpen, setIsQuoteSummaryOpen] = useState(false);
  const [isQuoteSummaryLoading, setIsQuoteSummaryLoading] = useState(false);
  const [quoteSummaryMap, setQuoteSummaryMap] = useState<Record<number, string>>({});

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isOpen) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isOpen]);

  // Breathing Cycle Effect (14 second full loop)
  useEffect(() => {
    if (!isActive || !isOpen) return;

    let cycleTime = 0;
    const interval = setInterval(() => {
      cycleTime = (cycleTime + 0.1) % 14;

      if (cycleTime < 4) {
        setBreathPhase('inhale');
        setBreathProgress((cycleTime / 4) * 100);
      } else if (cycleTime < 8) {
        setBreathPhase('hold');
        setBreathProgress(100);
      } else if (cycleTime < 12) {
        setBreathPhase('exhale');
        setBreathProgress(((12 - cycleTime) / 4) * 100);
      } else {
        setBreathPhase('pause');
        setBreathProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isOpen]);

  // Web Audio Pure Meditative Drone Synth (Sa-Pa Tanpura 108Hz Fundamental)
  const toggleSoundscape = () => {
    if (isAudioEnabled) {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
      }
      setIsAudioEnabled(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.exponentialRampToValueAtTime(0.08, now + 1.2);
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        // Warm Lowpass Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);
        filter.connect(masterGain);

        // Oscillator 1: Sa (108 Hz Fundamental)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(108, now);
        osc1.connect(filter);
        osc1.start(now);

        // Oscillator 2: Pa (162 Hz Fifth Harmonics)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(162, now);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.04, now);
        osc2.connect(gain2);
        gain2.connect(filter);
        osc2.start(now);

        setIsAudioEnabled(true);
      } catch (e) {
        console.warn('AudioContext not supported or blocked:', e);
      }
    }
  };

  // Cleanup Audio
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Smooth entrance & exit transition state
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered, isClosing]);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
    }, 240);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const incrementChant = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Safe vibration fallback
      }
    }
    setJapaInSession((prev) => {
      const next = prev + 1;
      if (next % 108 === 0 && onAddJapaMala) {
        onAddJapaMala(1);
      }
      return next;
    });
  };

  // Mental Focus Metrics Calculation
  const minutesPracticed = Math.floor(sessionSeconds / 60);
  const stillnessScore = Math.min(100, Math.round(20 + minutesPracticed * 8 + (japaInSession / 108) * 15));
  const betaWaveNoiseReduction = Math.min(95, Math.round(minutesPracticed * 12 + 10));

  const handleFinishSession = async () => {
    if (sessionSeconds > 0 || japaInSession > 0) {
      const record: DhyanaSessionRecord = {
        id: `dhyana_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        durationSeconds: sessionSeconds,
        japaCount: japaInSession,
        stillnessScore,
        coherenceScore: Math.min(100, Math.max(50, Math.round(75 + minutesPracticed * 2))),
        flowStageReached: computeDhyanaFlowStage(sessionSeconds),
        reflectionNote: reflectionNote.trim() || undefined,
        reflectionSentiment,
      };
      await recordDhyanaSession(record);
      onSessionComplete?.(record);
    }
    handleDismiss();
  };

  const handleSaveReflection = async () => {
    const entry: SacredReflectionEntry = {
      id: `refl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dateISO: new Date().toISOString(),
      sentiment: reflectionSentiment,
      note: reflectionNote.trim() || 'चित्त में असीम शांति व युगल ध्यान का अनुभव।',
      dhyanaMinutes: Math.max(1, minutesPracticed),
      mantraCount: japaInSession,
    };
    await saveSacredReflection(entry);
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2500);
  };

  const rasikAphorisms = SacredDatabase.getRasikAphorisms();
  const currentAphorism = rasikAphorisms[activeAphorismIdx % rasikAphorisms.length];
  const aphorismCanonicalId = currentAphorism.id;

  const aphorismReq: DevotionalSummaryRequest = {
    id: aphorismCanonicalId,
    text: currentAphorism.verse,
    source: currentAphorism.source,
    type: 'quote',
    fallbackText: currentAphorism.meaning,
    sourceSlug:
      currentAphorism.id === 'quote-hit-chaurasi-0'
        ? 'hit-chaurasi'
        : currentAphorism.id === 'quote-radha-sudha-nidhi-1'
        ? 'radha-sudha-nidhi'
        : 'kelimal',
    quoteIndex: activeAphorismIdx,
  };

  useEffect(() => {
    // Synchronous 0ms peek check against pre-bundled and cached aphorisms
    const peek = getCachedDevotionalSummarySync(aphorismReq);
    if (peek) {
      setQuoteSummaryMap((prev) => ({ ...prev, [activeAphorismIdx]: peek }));
    }
  }, [activeAphorismIdx]);

  const handleToggleQuoteSummary = () => {
    const nextOpen = !isQuoteSummaryOpen;
    setIsQuoteSummaryOpen(nextOpen);

    if (nextOpen && !quoteSummaryMap[activeAphorismIdx]) {
      const peek = getCachedDevotionalSummarySync(aphorismReq);
      if (peek) {
        setQuoteSummaryMap((prev) => ({ ...prev, [activeAphorismIdx]: peek }));
        return;
      }
      setIsQuoteSummaryLoading(true);
      getDevotionalSummary(aphorismReq)
        .then((res) => {
          setQuoteSummaryMap((prev) => ({ ...prev, [activeAphorismIdx]: res.summary }));
        })
        .catch(() => {
          setQuoteSummaryMap((prev) => ({
            ...prev,
            [activeAphorismIdx]: currentAphorism.meaning,
          }));
        })
        .finally(() => {
          setIsQuoteSummaryLoading(false);
        });
    }
  };

  const getBreathLabel = () => {
    switch (breathPhase) {
      case 'inhale':
        return { action: 'श्वास ग्रहण (Inhale)', mantra: 'श्री', sub: 'शांत मन से दिव्य प्रकाश भरें' };
      case 'hold':
        return { action: 'कुम्भक (Hold)', mantra: 'रा', sub: 'हृदय में युगल छवि का ध्यान' };
      case 'exhale':
        return { action: 'श्वास त्याग (Exhale)', mantra: 'धा', sub: 'समस्त मानसिक तनाव व विक्षेप विसर्जित' };
      case 'pause':
      default:
        return { action: 'विश्राम (Rest)', mantra: 'ॐ', sub: 'परम शान्ति का अनुभव' };
    }
  };

  const breath = getBreathLabel();

  // Lock body scroll and close on Escape while dhyana focus modal is displayed
  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDismiss();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isRendered]);

  if (!isRendered) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="गहन ध्यान व मानसिक एकाग्रता"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 transition-opacity ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl bg-white text-[#111111] rounded-[32px] flex flex-col max-h-[92vh] overflow-hidden ${
          isClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
        }`}
      >
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-1.5 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
              🧘
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-base sm:text-xl text-[#18181B] truncate">
                  गहन ध्यान व चित्त एकाग्रता
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono shrink-0">
                  Dhyāna Focus
                </span>
              </div>
              <p className="text-xs text-[#71717A] truncate">
                Cognitive Serenity & Sacred Pranayama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient Sound Drone Toggle */}
            <button
              type="button"
              onClick={toggleSoundscape}
              aria-label={isAudioEnabled ? 'Disable Meditative Drone' : 'Enable Meditative Drone'}
              title="108Hz Sacred Tanpura Drone"
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                isAudioEnabled
                  ? 'bg-[#FEF08A] text-[#78350F]'
                  : 'bg-[#FAF6EE] text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleFinishSession}
              aria-label="Close Focus Sanctuary"
              className="p-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#FEFCE8] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Pill Navigation Tabs (Clean, Single-Line, Zero Wrapping) */}
        <div className="px-4 pt-1 pb-3 bg-white flex items-center justify-center">
          <div className="relative w-full max-w-md grid grid-cols-2 p-1 bg-[#FAF6EE] rounded-full">
            {/* Dynamic Elastic Sliding Indicator Bar */}
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-[#FEF08A] pointer-events-none transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
              style={{
                width: 'calc((100% - 8px) / 2)',
                left: '4px',
                transform: `translateX(${activeTab === 'sanctuary' ? '0%' : '100%'})`,
              }}
            />

            <button
              type="button"
              onClick={() => setActiveTab('sanctuary')}
              className={`relative z-10 py-1.5 px-3 rounded-full text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sanctuary'
                  ? 'text-[#18181B]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>ध्यान कक्ष (Sanctuary)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('impact')}
              className={`relative z-10 py-1.5 px-3 rounded-full text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'impact'
                  ? 'text-[#18181B]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>चित्त प्रभाव (Impact)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'sanctuary' ? (
            /* TAB 1: LIVE FOCUS SANCTUARY */
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              
              {/* Pranayama Breathing Circle with Concentric Rings */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
                {/* Outer Glow Halo */}
                <div
                  className={`absolute inset-0 rounded-full border border-amber-200/50 transition-all duration-700 ${
                    isLowSpec ? '' : 'blur-md'
                  }`}
                  style={{
                    transform: `scale(${0.85 + (breathProgress / 100) * 0.25})`,
                    opacity: 0.3 + (breathProgress / 100) * 0.5,
                    background: 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0) 70%)',
                  }}
                />

                {/* Concentric Pulse Rings */}
                <div
                  className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-amber-300/40 transition-transform duration-700 ease-out"
                  style={{ transform: `scale(${0.9 + (breathProgress / 100) * 0.15})` }}
                />

                {/* Inner Sacred Center Core */}
                <div
                  onClick={incrementChant}
                  role="button"
                  tabIndex={0}
                  aria-label="Tap to Chant"
                  className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white border border-neutral-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center cursor-pointer active:opacity-90 select-none p-2"
                >
                  <span className="text-[11px] text-amber-700 font-bold tracking-wider uppercase">
                    {breath.action}
                  </span>
                  <span className="font-serif font-bold text-3xl sm:text-4xl text-[#18181B] my-0.5">
                    {breath.mantra}
                  </span>
                  <span className="text-[10px] text-[#71717A] font-mono">
                    स्पर्श करें (+१ जप)
                  </span>
                </div>
              </div>

              {/* Breath Guidance Subtitle */}
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-serif text-[#52525B]">
                  {breath.sub}
                </p>
                <p className="text-[11px] text-[#71717A] font-mono">
                  ४-४-४ समवृत्ति प्राणायाम (Rhythmic Balanced Respiration)
                </p>
              </div>

              {/* Session Live Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F]'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>विराम दें (Pause)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>ध्यान प्रारंभ (Begin Focus)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsActive(false);
                    setSessionSeconds(0);
                    setJapaInSession(0);
                  }}
                  title="Reset Timer"
                  className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real-time Session Metrics */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[10px] text-[#71717A] font-medium block">समय अवधि</span>
                  <span className="font-doto text-xl font-bold text-[#18181B] mt-0.5 block">
                    {formatTime(sessionSeconds)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[10px] text-[#71717A] font-medium block">सत्र जप संख्या</span>
                  <span className="font-doto text-xl font-bold text-amber-700 mt-0.5 block">
                    {formatDevanagariNumerals(japaInSession)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
                  <span className="text-[10px] text-[#71717A] font-medium block">चित्त शान्ति</span>
                  <span className="font-doto text-xl font-bold text-amber-600 mt-0.5 block">
                    {stillnessScore}%
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* TAB 2: COGNITIVE & SPIRITUAL IMPACT DASHBOARD */
            <div className="space-y-5">
              
              {/* Hero Impact Science Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-700 shrink-0" />
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-[#18181B]">
                      वैज्ञानिक प्रभाव
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
                    Neural Coherence
                  </span>
                </div>
                <p className="text-[11.5px] text-[#52525B] leading-relaxed font-serif">
                  "योगश्चित्तवृत्तिनिरोधः" — नाम ध्यान से मानसिक भटकाव शांत होकर निर्मल शांति का प्राकट्य होता है।
                </p>
              </div>

              {/* 4 Impact Visualizers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                
                {/* 1. Manas Shanti Index */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      मानसिक स्थिरता
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      {stillnessScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stillnessScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    एकाग्रता में वृद्धि एवं तनाव में प्रत्यक्ष कमी।
                  </p>
                </div>

                {/* 2. Beta Wave to Alpha-Theta Shift */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 truncate">
                      <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      तरंग रूपांतरण
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      -{betaWaveNoiseReduction}% Noise
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${betaWaveNoiseReduction}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    चंचल विचारों का गहन शांति में रूपांतरण।
                  </p>
                </div>

                {/* 3. Devotional Heart Coherence */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 truncate">
                      <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      हृदय समरसता
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full shrink-0">
                      उत्कृष्ट
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[85%] rounded-full" />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    हृदय गति व श्वास में पूर्ण संतुलन।
                  </p>
                </div>

                {/* 4. Daily Mindful Habit Streak */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 truncate">
                      <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      नित्य अभ्यास
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      १४ दिवस
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[90%] rounded-full" />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    नित्य ध्यान से संस्कारों की शुद्धि।
                  </p>
                </div>

              </div>

              {/* Contemplative Affirmation Banner */}
              <div className="p-3.5 rounded-2xl bg-[#FFFBF0] border border-amber-200/80 flex items-center gap-3 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#D97706] shrink-0" />
                <p className="text-xs font-devanagari text-[#78350F]">
                  "मन को जब संसार से हटाकर श्री राधा नाम में लगाया जाता है, तो समस्त मानसिक संताप स्वयंमेव शांत हो जाते हैं।"
                </p>
              </div>

              {/* Canonical Rasik Aphorism Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#E9D8B4] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                    <Feather className="w-4 h-4 text-[#D97706]" />
                    रसिक वाणी अनुशीलन ({currentAphorism.source})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rasikAphorisms.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveAphorismIdx(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          activeAphorismIdx === i ? 'bg-[#D97706]' : 'bg-black/15'
                        }`}
                        aria-label={`Aphorism ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <blockquote className="font-serif text-sm sm:text-base text-[#451A03] font-semibold italic border-l-2 border-[#D97706] pl-3 py-0.5">
                  "{currentAphorism.verse}"
                </blockquote>
                <p className="text-xs text-[#78350F] font-devanagari leading-relaxed">
                  {currentAphorism.meaning}
                </p>

                {/* Devotional Essence Action Button */}
                <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleToggleQuoteSummary}
                    title="Divine Essence Summary"
                    className="h-8 px-3 rounded-full bg-[#FFF9EE] border border-[#E9D8B4] text-[#B84A28] flex items-center gap-1.5 shadow-xs pressable font-semibold text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A359]" />
                    <span>Divine Essence</span>
                  </button>
                  {isQuoteSummaryOpen && (
                    <span className="text-[11px] text-[#92400E] font-medium">
                      ॥ Divine Purport (दिव्य मर्म) ॥
                    </span>
                  )}
                </div>

                {/* Contemplative Quote Essence Card */}
                {isQuoteSummaryOpen && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs space-y-1.5 apple-view-enter">
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-amber-200/60">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>॥ Divine Essence (दिव्य सार) ॥</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsQuoteSummaryOpen(false)}
                        className="text-[11px] text-[#6B6F6B] hover:text-[#111111] pressable font-medium"
                      >
                        Dismiss ×
                      </button>
                    </div>
                    {isQuoteSummaryLoading && !quoteSummaryMap[activeAphorismIdx] ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-[#D97706] font-medium min-h-[48px]">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4A359] animate-spin" />
                        <span>Revealing divine essence and spiritual theme...</span>
                      </div>
                    ) : (
                      <p className="text-xs font-devanagari text-[#451A03] leading-relaxed break-words">
                        {quoteSummaryMap[activeAphorismIdx] ||
                          getCachedDevotionalSummarySync(aphorismReq) ||
                          currentAphorism.meaning}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Post-Session Sacred Reflection Journal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">
                      मानसी अनुभूति एवं रस विचार (Sacred Reflection Journal)
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#71717A] font-mono">
                    १००% व्यक्तिगत व सुरक्षित
                  </span>
                </div>

                {/* Sentiment Selector with Elastic Sliding Pill */}
                <div>
                  <span className="text-[11px] text-[#71717A] block mb-1.5 font-medium">
                    ध्यानोपरांत मन की स्थिति:
                  </span>
                  <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-[#F4F4F5] rounded-2xl border border-neutral-200/60">
                    {/* Dynamic Elastic Sliding Sentiment Pill */}
                    {sentimentPillStyle.ready && (
                      <span
                        aria-hidden="true"
                        className="absolute rounded-xl bg-[#FEF08A] pointer-events-none transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.24,0.64,1)] will-change-transform"
                        style={{
                          transform: `translate(${sentimentPillStyle.left}px, ${sentimentPillStyle.top}px)`,
                          width: `${sentimentPillStyle.width}px`,
                          height: `${sentimentPillStyle.height}px`,
                          top: 0,
                          left: 0,
                        }}
                      />
                    )}

                    {(
                      [
                        { id: 'shanti', label: 'परम शान्ति', icon: '🕊️' },
                        { id: 'bhava', label: 'भाव अश्रु', icon: '💧' },
                        { id: 'yugal', label: 'युगल ध्यान', icon: '🌸' },
                        { id: 'sthirata', label: 'चित्त स्थिरता', icon: '💎' },
                      ] as const
                    ).map((s) => {
                      const isSelected = reflectionSentiment === s.id;
                      return (
                        <button
                          key={s.id}
                          ref={(el) => {
                            sentimentRefs.current[s.id] = el;
                          }}
                          type="button"
                          onClick={() => setReflectionSentiment(s.id)}
                          className={`relative z-10 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                            isSelected
                              ? 'text-[#18181B] font-bold'
                              : 'text-[#71717A] hover:text-[#18181B]'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reflection Notes Textarea */}
                <div>
                  <label htmlFor="dhyana-reflection-notes" className="text-[11px] text-[#71717A] block mb-1">
                    अन्तःकरण का भाव (Personal Contemplative Note):
                  </label>
                  <textarea
                    id="dhyana-reflection-notes"
                    rows={2}
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder="आज के ध्यान में युगल छवि का स्मरण, मन की शांति या कोई विशेष अनुभूति..."
                    className="w-full p-2.5 rounded-xl bg-[#FAFAFA] border border-neutral-200 text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    {reflectionSaved ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        अनुभूति सुरक्षित हुई
                      </span>
                    ) : (
                      <span>सत्र: {formatDevanagariNumerals(minutesPracticed)} मिनट, {formatDevanagariNumerals(japaInSession)} जप</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReflection}
                    className="px-4 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span>अनुभूति संचित करें</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-100 bg-white flex items-center justify-between text-xs text-[#71717A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>एकाग्रता साधना सक्रिय (०% भटकाव)</span>
          </span>
          <button
            type="button"
            onClick={handleFinishSession}
            className="px-4 py-1.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] font-bold transition-colors cursor-pointer"
          >
            पूर्ण करें (Done)
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
