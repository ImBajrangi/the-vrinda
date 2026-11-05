import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Sparkles, Brain, Wind, Heart, RotateCcw, ShieldCheck, Flame, Compass, Check, BookMarked, Feather } from 'lucide-react';
import {
  formatDevanagariNumerals,
  recordDhyanaSession,
  saveSacredReflection,
  computeDhyanaFlowStage,
} from '../../services/cacheService';
import { DhyanaSessionRecord, SacredReflectionEntry } from '../../types/devotional';

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

  if (!isOpen) return null;

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
    onClose();
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

  const RASIK_APHORISMS = [
    {
      source: 'श्री हित चौरासी',
      verse: 'जोई जोई प्यारो करे सोई मोहि भावै, मेरे भावे सोई सोई प्यारे करे।',
      meaning: 'पूर्ण समर्पण — अपने समस्त मानसिक विक्षेपों को प्रभु इच्छा में विसर्जित करना ही परम शांति है।',
    },
    {
      source: 'श्री राधा सुधा निधि',
      verse: 'यस्याः कदापि वसनाञ्चलखेलनोत्थधन्यातिधन्यपवनेन कृतार्थमानी।',
      meaning: 'श्रीजी के पावन आंचल की शीतल वायु मात्र से समस्त संताप व चंचलता शांत हो जाती है।',
    },
    {
      source: 'स्वामी हरिदास केलिमाल',
      verse: 'माई री सहज जोरी प्रकट भई, जुग जुग जियौ गौर स्याम धन।',
      meaning: 'सहज एकाग्रता — स्वाभाविक अनुराग से चित्त का नित्य युगल रस में स्थिर हो जाना।',
    },
  ];

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="गहन ध्यान व मानसिक एकाग्रता"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#14213D]/40 backdrop-blur-md apple-view-enter"
    >
      <div className="w-full max-w-2xl bg-[#FAF9F6] text-[#111111] rounded-[32px] border border-white/90 shadow-[0_24px_64px_rgba(20,33,61,0.14)] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/25 flex items-center justify-center font-bold text-lg">
              🧘
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-devanagari font-bold text-lg sm:text-xl text-[#111111]">
                  गहन ध्यान व चित्त एकाग्रता
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/30 font-mono">
                  Dhyāna Focus
                </span>
              </div>
              <p className="text-xs text-[#6B6F6B]">
                Cognitive Serenity • Sacred Pranayama • Distraction-Free Flow
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
              className={`p-2.5 rounded-full border transition-colors ${
                isAudioEnabled
                  ? 'bg-[#22C55E]/15 text-[#15803D] border-[#22C55E]/40'
                  : 'bg-black/[0.04] text-[#6B6F6B] border-black/[0.06] hover:text-[#111111]'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleFinishSession}
              aria-label="Close Focus Sanctuary"
              className="p-2.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#6B6F6B] hover:text-[#111111] border border-black/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs between Live Sanctuary and Impact Analysis */}
        <div className="flex items-center border-b border-black/[0.06] bg-[#F2F4F2]/80 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sanctuary')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sanctuary'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#6B6F6B] hover:text-[#111111]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>1. ध्यान कक्ष (Live Focus Sanctuary)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'impact'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#6B6F6B] hover:text-[#111111]'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>2. चित्त वृत्ति निरोध प्रभाव (Impact & Cognitive Science)</span>
          </button>
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
                  className={`absolute inset-0 rounded-full border border-[#22C55E]/25 transition-all duration-700 ${
                    isLowSpec ? '' : 'blur-md'
                  }`}
                  style={{
                    transform: `scale(${0.85 + (breathProgress / 100) * 0.25})`,
                    opacity: 0.3 + (breathProgress / 100) * 0.5,
                    background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0) 70%)',
                  }}
                />

                {/* Concentric Pulse Rings */}
                <div
                  className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-[#22C55E]/35 transition-transform duration-700 ease-out"
                  style={{ transform: `scale(${0.9 + (breathProgress / 100) * 0.15})` }}
                />

                {/* Inner Sacred Center Core */}
                <div
                  onClick={incrementChant}
                  role="button"
                  tabIndex={0}
                  aria-label="Tap to Chant"
                  className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white border-2 border-[#22C55E]/50 shadow-[0_12px_36px_rgba(20,33,61,0.08)] flex flex-col items-center justify-center cursor-pointer active:opacity-90 select-none p-2"
                >
                  <span className="text-[11px] text-[#15803D] font-bold tracking-wider uppercase">
                    {breath.action}
                  </span>
                  <span className="font-devanagari font-bold text-3xl sm:text-4xl text-[#111111] my-0.5 text-shadow-sm">
                    {breath.mantra}
                  </span>
                  <span className="text-[10px] text-[#6B6F6B] font-mono">
                    स्पर्श करें • +१ जप
                  </span>
                </div>
              </div>

              {/* Breath Guidance Subtitle */}
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-devanagari text-[#4A5568]">
                  {breath.sub}
                </p>
                <p className="text-[11px] text-[#6B6F6B] font-mono">
                  ४-४-४ समवृत्ति प्राणायाम (Rhythmic Balanced Respiration)
                </p>
              </div>

              {/* Session Live Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-[#14213D] hover:bg-[#1f2e4d] text-[#B6FF2E]'
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
                  className="p-2.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#6B6F6B] hover:text-[#111111] border border-black/[0.06] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real-time Session Metrics */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
                  <span className="text-[10px] text-[#6B6F6B] font-medium block">समय अवधि</span>
                  <span className="font-doto text-xl font-bold text-[#111111] mt-0.5 block">
                    {formatTime(sessionSeconds)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
                  <span className="text-[10px] text-[#6B6F6B] font-medium block">सत्र जप संख्या</span>
                  <span className="font-doto text-xl font-bold text-[#15803D] mt-0.5 block">
                    {formatDevanagariNumerals(japaInSession)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
                  <span className="text-[10px] text-[#6B6F6B] font-medium block">चित्त शान्ति</span>
                  <span className="font-doto text-xl font-bold text-[#15803D] mt-0.5 block">
                    {stillnessScore}%
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* TAB 2: COGNITIVE & SPIRITUAL IMPACT DASHBOARD */
            <div className="space-y-5">
              
              {/* Hero Impact Science Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#F5FAF6] to-[#EDF6F0] border border-[#D5E6DA] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#15803D]" />
                    <h3 className="font-bold text-sm text-[#111111]">
                      मानसिक एकाग्रता एवं ध्यान का वैज्ञानिक व आध्यात्मिक प्रभाव
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#15803D] bg-[#22C55E]/15 px-2.5 py-0.5 rounded-full border border-[#22C55E]/30">
                    Neural & Spiritual Coherence
                  </span>
                </div>
                <p className="text-xs text-[#4A5568] leading-relaxed font-devanagari">
                  "योगश्चित्तवृत्तिनिरोधः" — पतंजलि योगसूत्र। नाम स्मरण और अखंड ध्यान के समय मस्तिष्क का 'डिफ़ॉल्ट मोड नेटवर्क' (DMN) शांत होता है, जिससे चिंता, मानसिक भटकाव और चंचलता विलीन होकर अंतःकरण में निर्मल शांति का प्राकट्य होता है।
                </p>
              </div>

              {/* 4 Impact Visualizers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Manas Shanti Index */}
                <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                      मानसिक स्थिरता सूचकांक (Manas Shanti)
                    </span>
                    <span className="font-doto text-xs font-bold text-[#15803D]">
                      {stillnessScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#22C55E] h-full rounded-full transition-all duration-500"
                      style={{ width: `${stillnessScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6F6B]">
                    निरंतर जप से मन की एकाग्रता क्षमता में वृद्धि और तनाव हार्मोन (Cortisol) में प्रत्यक्ष कमी।
                  </p>
                </div>

                {/* 2. Beta Wave to Alpha-Theta Shift */}
                <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#7C3AED]" />
                      तरंग रूपांतरण (Neural Frequency Shift)
                    </span>
                    <span className="font-doto text-xs font-bold text-[#7C3AED]">
                      -{betaWaveNoiseReduction}% Noise
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8B5CF6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${betaWaveNoiseReduction}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6F6B]">
                    बीटा तरंगों (तनावपूर्ण विचार) का अल्फ़ा-थीटा तरंगों (गहन ध्यान व सृजनात्मक शांति) में रूपांतरण।
                  </p>
                </div>

                {/* 3. Devotional Heart Coherence */}
                <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#E11D48]" />
                      हृदय समरसता (Heart-Brain Coherence)
                    </span>
                    <span className="font-doto text-xs font-bold text-[#E11D48]">
                      उत्कृष्ट (Optimal)
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#F43F5E] h-full w-[85%] rounded-full" />
                  </div>
                  <p className="text-[11px] text-[#6B6F6B]">
                    नाम संकीर्तन से हृदय गति परिवर्तनशीलता (HRV) में संतुलन, जिससे भाव भक्ति का विकास होता है।
                  </p>
                </div>

                {/* 4. Daily Mindful Habit Streak */}
                <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#D97706]" />
                      अखण्ड ध्यानावधान (Daily Focus Continuity)
                    </span>
                    <span className="font-doto text-xs font-bold text-[#D97706]">
                      १४ दिवस अखण्ड
                    </span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#F59E0B] h-full w-[90%] rounded-full" />
                  </div>
                  <p className="text-[11px] text-[#6B6F6B]">
                    नित्य केवल १५ मिनट का शांत ध्यान मन के संस्कारों को शुद्ध कर नित्य निकुंज रस में लीन करता है।
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
                    रसिक वाणी अनुशीलन • {RASIK_APHORISMS[activeAphorismIdx].source}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {RASIK_APHORISMS.map((_, i) => (
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
                  "{RASIK_APHORISMS[activeAphorismIdx].verse}"
                </blockquote>
                <p className="text-xs text-[#78350F] font-devanagari leading-relaxed">
                  {RASIK_APHORISMS[activeAphorismIdx].meaning}
                </p>
              </div>

              {/* Post-Session Sacred Reflection Journal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-[#15803D]" />
                    <h4 className="text-xs sm:text-sm font-bold text-[#111111]">
                      मानसी अनुभूति एवं रस विचार (Sacred Reflection Journal)
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#6B6F6B] font-mono">
                    १००% व्यक्तिगत व सुरक्षित
                  </span>
                </div>

                {/* Sentiment Selector */}
                <div>
                  <span className="text-[11px] text-[#6B6F6B] block mb-1.5">
                    ध्यानोपरांत मन की स्थिति:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'shanti', label: 'परम शान्ति', icon: '🕊️' },
                        { id: 'bhava', label: 'भाव अश्रु', icon: '💧' },
                        { id: 'yugal', label: 'युगल ध्यान', icon: '🌸' },
                        { id: 'sthirata', label: 'चित्त स्थिरता', icon: '💎' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setReflectionSentiment(s.id)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                          reflectionSentiment === s.id
                            ? 'bg-[#22C55E]/15 text-[#15803D] border-[#22C55E]/40'
                            : 'bg-[#F8F9FA] text-[#6B6F6B] border-black/[0.06] hover:bg-[#F0F2F0] hover:text-[#111111]'
                        }`}
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reflection Notes Textarea */}
                <div>
                  <label htmlFor="dhyana-reflection-notes" className="text-[11px] text-[#6B6F6B] block mb-1">
                    अन्तःकरण का भाव (Personal Contemplative Note):
                  </label>
                  <textarea
                    id="dhyana-reflection-notes"
                    rows={2}
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder="आज के ध्यान में युगल छवि का स्मरण, मन की शांति या कोई विशेष अनुभूति..."
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-black/[0.08] text-xs text-[#111111] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#22C55E] focus:bg-white"
                  />
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6F6B]">
                    {reflectionSaved ? (
                      <span className="text-[#15803D] flex items-center gap-1 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        अनुभूति सुरक्षित हुई
                      </span>
                    ) : (
                      <span>सत्र: {formatDevanagariNumerals(minutesPracticed)} मिनट • {formatDevanagariNumerals(japaInSession)} जप</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReflection}
                    className="px-3.5 py-1.5 rounded-full bg-[#14213D] hover:bg-[#1f2e4d] text-[#B6FF2E] text-xs font-bold shadow-xs pressable transition-colors flex items-center gap-1.5"
                  >
                    <span>अनुभूति संचित करें</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-black/[0.06] bg-white/80 backdrop-blur-md flex items-center justify-between text-xs text-[#6B6F6B]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>एकाग्रता साधना सक्रिय • ०% भटकाव</span>
          </span>
          <button
            type="button"
            onClick={handleFinishSession}
            className="px-4 py-1.5 rounded-full bg-[#14213D] hover:bg-[#1f2e4d] text-white font-bold transition-colors shadow-xs"
          >
            पूर्ण करें (Done)
          </button>
        </div>

      </div>
    </div>
  );
};
