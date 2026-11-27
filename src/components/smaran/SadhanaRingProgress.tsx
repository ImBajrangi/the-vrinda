import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Music2, BookOpen, Wind, Disc3, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SadhanaState, SacredPad } from '../../types/devotional';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';
import { computePanchangForDate } from '../../services/panchangService';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';
import { useSoftPresence } from '../../hooks/useSoftPresence';

const NITYA_DARSHAN_PLATES = [
  {
    id: 'yugal',
    label: 'युगल दर्शन',
    caption: 'श्री राधारमण देव जू • नित्य शृंगार सिंहासन',
    mandir: 'श्री राधारमण मंदिर, वृन्दावन',
    pos: 'object-[center_45%]',
    src: '/assets/darshan/radharaman-yugal.webp',
  },
  {
    id: 'radhavallabh',
    label: 'राधावल्लभ',
    caption: 'श्री राधावल्लभ लाल • मोरपंख पीठिका दर्शन',
    mandir: 'श्री राधावल्लभ मंदिर, वृन्दावन',
    pos: 'object-[center_22%]',
    src: '/assets/darshan/radhavallabh-peacock.webp',
  },
  {
    id: 'barsana',
    label: 'श्री लाड़िली लाल',
    caption: 'श्री लाड़िली लाल • पावन बरसाना महल झांकी',
    mandir: 'श्रीजी मंदिर, बरसाना धाम',
    pos: 'object-[center_25%]',
    src: '/assets/darshan/barsana-ladili-lal.webp',
  },
  {
    id: 'panch-aarti',
    label: 'संध्या आरती',
    caption: 'पावन पंच-आरती ज्योति • नित्य संध्या आराधना',
    mandir: 'श्री राधारमण मंदिर, वृन्दावन',
    pos: 'object-[center_35%]',
    src: '/assets/darshan/radharaman-panch-aarti.webp',
  },
  {
    id: 'phoolbangla',
    label: 'फूल बंगला',
    caption: 'दिव्य पुष्प सज्जा • नित्य फूल बंगला झांकी',
    mandir: 'निकुञ्ज महोत्सव दर्शन',
    pos: 'object-[center_62%]',
    src: '/assets/darshan/radharaman-phoolbangla.webp',
  },
  {
    id: 'rajat-singhasan',
    label: 'रजत सिंहासन',
    caption: 'श्री राधारमण देव जू • श्वेत-सुवर्ण रजत सिंहासन',
    mandir: 'श्री राधारमण मंदिर, वृन्दावन',
    pos: 'object-[center_30%]',
    src: '/assets/darshan/radharaman-rajat-singhasan.webp',
  },
  {
    id: 'mayur-mukut',
    label: 'मोर मुकुट',
    caption: 'नील पाग व मोर मुकुट • रसभरी मुस्कान छवि',
    mandir: 'नित्य शृंगार दर्शन',
    pos: 'object-[center_18%]',
    src: '/assets/darshan/radharaman-mayur-mukut.webp',
  },
  {
    id: 'swarna-murali',
    label: 'वेणु माधुरी',
    caption: 'रत्नजड़ित स्वर्ण मुरली व कुण्डल शृंगार',
    mandir: 'श्री राधारमण लाल',
    pos: 'object-[center_35%]',
    src: '/assets/darshan/radharaman-swarna-murali.webp',
  },
  {
    id: 'nikunj-lata',
    label: 'निकुञ्ज लता',
    caption: 'हरित लता मण्डप • प्रिया-प्रियतम विहार छवि',
    mandir: 'श्री वृन्दावन निकुञ्ज',
    pos: 'object-[center_25%]',
    src: '/assets/darshan/barsana-nikunj-lata.webp',
  },
  {
    id: 'mukharavind',
    label: 'मुखारविंद',
    caption: 'श्री राधारमण लाल • निकट मुखारविंद दर्शन',
    mandir: 'नित्य शृंगार दर्शन',
    pos: 'object-[center_18%]',
    src: '/assets/darshan/radharaman-mukharavind.webp',
  },
  {
    id: 'bihari',
    label: 'बाँके बिहारी',
    caption: 'श्री बाँके बिहारी लाल जी • मंगला व संध्या झांकी',
    mandir: 'श्री बाँके बिहारी मंदिर, वृन्दावन',
    pos: 'object-[center_25%]',
    src: '/assets/temples/banke-bihari-v2.webp',
  },
  {
    id: 'mandapa',
    label: 'मण्डप सेवा',
    caption: 'गोस्वामी सेवक मण्डप • नित्य चंवर व पुष्प अर्पण',
    mandir: 'श्री वृन्दावन धाम सेवा',
    pos: 'object-[center_20%]',
    src: '/assets/darshan/mandapa-aarti-seva.webp',
  },
];

interface SadhanaRingProgressProps {
  sadhana: SadhanaState;
  mantraCountFormatted: string;
  mantraCountDevanagari: string;
  malasDevanagari: string;
  malasTargetDevanagari: string;
  beadInCurrentMala: number;
  counterTick: boolean;
  handleTapBead: () => void;
  incrementJapa: () => void;
  dhyanaStillnessScore?: number;
  isPlayingAudio: boolean;
  currentPad: SacredPad | null;
  onOpenPillar: (type: 'japa' | 'shravan' | 'svadhyaya') => void;
  onToggleAudio: () => void;
  onOpenReader: () => void;
  onOpenGuide: () => void;
  onOpenFocus: () => void;
  currentStreakDays?: number;
}

export const SadhanaRingProgress: React.FC<SadhanaRingProgressProps> = ({
  sadhana,
  mantraCountFormatted: _mantraCountFormatted,
  mantraCountDevanagari,
  malasDevanagari,
  malasTargetDevanagari,
  beadInCurrentMala,
  counterTick,
  handleTapBead,
  incrementJapa,
  dhyanaStillnessScore: _dhyanaStillnessScore = 88,
  isPlayingAudio: _isPlayingAudio,
  currentPad: _currentPad,
  onOpenPillar,
  onToggleAudio: _onToggleAudio,
  onOpenReader,
  onOpenGuide: _onOpenGuide,
  onOpenFocus,
  currentStreakDays: _currentStreakDays = 1,
}) => {
  const [plateIndex, setPlateIndex] = useState(0);
  const [isOpeningReader, setIsOpeningReader] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null);
  const [cachedLightbox, setCachedLightbox] = useState<{ src: string; caption: string } | null>(null);
  useEffect(() => {
    if (lightboxImage) setCachedLightbox(lightboxImage);
  }, [lightboxImage]);
  const { isRendered: isLightboxRendered, isClosing: isLightboxClosing } = useSoftPresence(Boolean(lightboxImage), 280);
  const activeLightbox = lightboxImage || cachedLightbox;

  const ssrBaseline = useMemo(() => new Date('2026-01-01T19:00:00+05:30'), []);
  const [livePrahar, setLivePrahar] = useState(() => computeAshtayamaPhase(ssrBaseline));
  const [livePanchang, setLivePanchang] = useState(() => computePanchangForDate(ssrBaseline));

  useEffect(() => {
    const syncHeroClock = () => {
      const now = new Date();
      setLivePrahar(computeAshtayamaPhase(now));
      setLivePanchang(computePanchangForDate(now));
    };
    syncHeroClock();
    const timer = setInterval(syncHeroClock, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImage]);

  const handleEnterReader = () => {
    if (isOpeningReader) return;
    setIsOpeningReader(true);
    navigationProgress.start();
    requestAnimationFrame(() => {
      try {
        onOpenReader();
      } finally {
        setIsOpeningReader(false);
      }
    });
  };

  const activePlate = NITYA_DARSHAN_PLATES[plateIndex];
  const selectPlate = (idx: number) => {
    setPlateIndex((idx + NITYA_DARSHAN_PLATES.length) % NITYA_DARSHAN_PLATES.length);
  };

  // 27 radial marker beads around the Tulsi Japamala
  const totalMalaMarkers = 27;
  const activeMarkerIndex = Math.floor((beadInCurrentMala / 108) * totalMalaMarkers);
  const beadPositions = useMemo(() => {
    const radiusPercent = 41.5;
    return Array.from({ length: totalMalaMarkers }).map((_, idx) => {
      const slot = idx + 1;
      const angle = -Math.PI / 2 + (slot / 28) * 2 * Math.PI;
      return {
        x: 50 + radiusPercent * Math.cos(angle),
        y: 50 + radiusPercent * Math.sin(angle),
      };
    });
  }, [totalMalaMarkers]);

  const japaProgressPct = Math.min(
    100,
    Math.round((sadhana.japaCompleted / Math.max(1, sadhana.japaTarget)) * 100)
  );
  const shravanProgressPct = Math.min(
    100,
    Math.round((sadhana.shravanMinutes / Math.max(1, sadhana.shravanTarget)) * 100)
  );
  const svadhyayaProgressPct = Math.min(
    100,
    Math.round((sadhana.svadhyayaPadas / Math.max(1, sadhana.svadhyayaTarget)) * 100)
  );

  return (
    <div className="w-full space-y-4">
      {/* 1. Light, Airy Unified Sanctuary Hero (Fits Comfortably Above the Fold on All Screens) */}
      <section
        aria-label="श्री वृन्दावन नित्य संदर्शन"
        className="w-full bg-white rounded-[28px] sm:rounded-[32px] squircle-card p-4 sm:p-5 lg:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-7 items-stretch">
          {/* Left Column (7 cols): Placed BELOW visual Darshan on < lg so mobile opens with Thakur Ji imagery + compact inline Japa */}
          <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-1.5 hidden lg:block">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 text-xs font-laila text-neutral-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <span className="font-semibold text-amber-950">{livePrahar.nameDevanagari} प्रहर</span>
                  <span className="text-neutral-300">·</span>
                  <span>
                    {livePanchang.masaDevanagari} {livePanchang.pakshaDevanagari}{' '}
                    {livePanchang.tithiNameDevanagari}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenFocus}
                    className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-[#FAF6EE] hover:bg-[#EFE7D8] text-[#1C140D] text-[11.5px] font-laila font-semibold transition-colors cursor-pointer"
                    title="Open Dhyāna Sanctuary (ध्यान कक्ष)"
                  >
                    <Wind className="w-3.5 h-3.5 text-amber-800" />
                    <span>ध्यान कक्ष</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEnterReader}
                    disabled={isOpeningReader}
                    aria-busy={isOpeningReader}
                    className="h-8 inline-flex items-center gap-1 px-3 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-[11.5px] font-laila font-bold transition-colors cursor-pointer disabled:opacity-65"
                  >
                    {isOpeningReader ? (
                      <>
                        <IOSSpinner size="xs" theme="current" />
                        <span>खुल रहा है</span>
                      </>
                    ) : (
                      <span>रसिक वाणी →</span>
                    )}
                  </button>
                </div>
              </div>

              <h1 className="font-rozha text-[26px] sm:text-[32px] lg:text-[36px] text-[#1A120B] leading-[1.15] tracking-tight">
                नित्य निकुञ्ज संदर्शन
              </h1>
              <p className="text-xs sm:text-[13px] font-laila text-neutral-600 leading-relaxed max-w-xl">
                श्री राधावल्लभ व राधारमण रसिक उपासना — नाम जप, वाणी श्रवण एवं ग्रंथ स्वाध्याय का नित्य संयोग।
              </p>
            </div>

            {/* Compact Interactive Tulsi Mala & Counter Module (Side-by-side even on phones!) */}
            <div className="flex-1 rounded-[18px] bg-[#FAF8F3] p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-5">
              {/* Compact Tactile Rosary Ring */}
              <div className="relative w-[112px] h-[112px] sm:w-44 sm:h-44 flex items-center justify-center select-none shrink-0">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="41.5"
                    fill="none"
                    stroke="#E6DCCA"
                    strokeWidth="0.85"
                    strokeDasharray="1.5 1.5"
                  />
                </svg>

                {/* Apex Meru Bead */}
                <div
                  title="सुमेरु मनका (Meru Bead)"
                  className="absolute w-4 h-4 rounded-full meru-bead border border-amber-400 flex items-center justify-center text-[8px] text-white font-bold z-20 shadow-2xs"
                  style={{ top: '8.5%', left: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  ✦
                </div>

                {/* 27 Radial Beads */}
                {beadPositions.map((pos, idx) => {
                  const isChanted = idx < activeMarkerIndex;
                  const isActive = idx === activeMarkerIndex && beadInCurrentMala > 0;
                  return (
                    <div
                      key={idx}
                      title={`मनका खंड ${(idx + 1) * 4} / १०८`}
                      className={`absolute rounded-full aspect-square shrink-0 transition-all duration-200 z-10 ${
                        isActive
                          ? 'w-3 h-3 tulsi-bead-active ring-2 ring-amber-300'
                          : isChanted
                          ? 'w-2.5 h-2.5 tulsi-bead-chanted'
                          : 'w-2 h-2 tulsi-bead-pending'
                      }`}
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  );
                })}

                {/* Center Touch Medallion */}
                <button
                  type="button"
                  onClick={handleTapBead}
                  aria-label="Count 1 bead on Tulsi Mala"
                  className="relative w-[72px] h-[72px] sm:w-[104px] sm:h-[104px] rounded-full bg-gradient-to-b from-white via-[#FCFAF5] to-[#F5EEDB] border border-amber-300/90 shadow-[0_8px_20px_rgba(217,119,6,0.12),inset_0_1px_3px_rgba(255,255,255,1)] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform z-20"
                >
                  <div className="hidden sm:block absolute inset-1.5 rounded-full border border-amber-200/60 pointer-events-none" />
                  <span className="text-[8px] sm:text-[9px] font-laila font-semibold text-amber-800/80 leading-none mb-0.5">
                    नित्य जप
                  </span>
                  <span
                    className={`font-rozha text-lg sm:text-[26px] text-amber-900 leading-none transition-transform duration-150 ${
                      counterTick ? 'scale-110' : ''
                    }`}
                  >
                    राधे
                  </span>
                  <span className="mt-0.5 sm:mt-1 font-laila text-[8.5px] sm:text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/70 px-1.5 sm:px-2 py-0.5 rounded-full">
                    +१
                  </span>
                </button>
              </div>

              {/* Clean Live Metrics + Japa Buttons */}
              <div className="flex-1 min-w-0 w-full space-y-3">
                <div className="flex items-end justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[11px] font-laila font-bold text-amber-800 block">
                      पवित्र तुलसी माला साधना
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span
                        className={`font-rozha text-3xl sm:text-4xl text-[#18181B] leading-none ${
                          counterTick ? 'animate-number-tick' : ''
                        }`}
                      >
                        {mantraCountDevanagari}
                      </span>
                      <span className="font-laila text-xs sm:text-[13px] font-bold text-amber-900">
                        मंत्र जप पूर्ण
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-laila font-semibold text-amber-900 bg-white px-2.5 py-1 rounded-full shadow-2xs">
                    {malasDevanagari} / {malasTargetDevanagari} माला
                  </span>
                </div>

                {/* Progress Strip */}
                <div className="bg-white rounded-[10px] px-3 py-2 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-laila">
                    <span className="text-neutral-600">
                      वर्तमान चक्र: मनका{' '}
                      <strong className="text-neutral-900">
                        {formatDevanagariNumerals(beadInCurrentMala)}
                      </strong>{' '}
                      / १०८
                    </span>
                    <span className="font-semibold text-amber-800">
                      {formatDevanagariNumerals(Math.round((beadInCurrentMala / 108) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((beadInCurrentMala / 108) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Compact Paired Japa Buttons */}
                <div className="grid grid-cols-2 gap-2 font-laila">
                  <button
                    type="button"
                    onClick={handleTapBead}
                    className="py-2.5 px-2 sm:px-3 rounded-full bg-white hover:bg-[#FEFCE8] text-[#18181B] shadow-2xs flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer active:scale-95 transition-colors"
                  >
                    <Disc3 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>+१ मनका जप</span>
                  </button>

                  <button
                    type="button"
                    onClick={incrementJapa}
                    className="py-2.5 px-2 sm:px-3 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer active:scale-95 transition-colors"
                  >
                    <span>+१ माला</span>
                    <span className="font-mono text-[10px] sm:text-[10.5px] bg-white/75 px-1.5 py-0.5 rounded-full">
                      १०८
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Editorial Masthead + Actions (< lg, renders above visual Darshan Plate) */}
          <div className="lg:hidden space-y-2 order-0">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-laila text-neutral-600 min-w-0 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span className="font-semibold text-amber-950 shrink-0">{livePrahar.nameDevanagari}</span>
                <span className="text-neutral-300">·</span>
                <span className="truncate">{livePanchang.tithiNameDevanagari}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenFocus}
                  className="h-7 inline-flex items-center gap-1 px-2.5 rounded-full bg-[#FAF6EE] text-[#1C140D] text-[11px] font-laila font-semibold cursor-pointer"
                >
                  <Wind className="w-3 h-3 text-amber-800" />
                  <span>ध्यान</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnterReader}
                  disabled={isOpeningReader}
                  aria-busy={isOpeningReader}
                  className="h-7 inline-flex items-center gap-1 px-2.5 rounded-full bg-[#FEF08A] text-[#78350F] text-[11px] font-laila font-bold cursor-pointer disabled:opacity-65"
                >
                  <span>{isOpeningReader ? 'खुल रहा...' : 'रसिक वाणी →'}</span>
                </button>
              </div>
            </div>
            <h1 className="font-rozha text-[24px] text-[#1A120B] leading-tight">
              नित्य निकुञ्ज संदर्शन
            </h1>
          </div>

          {/* Right Column (5 cols): Ordered FIRST on mobile (< lg) below compact headline */}
          <div className="order-1 lg:order-2 lg:col-span-5 min-w-0">
            <div className="rounded-[20px] bg-[#FAF8F3] p-2.5 space-y-2.5">
              {/* Unobscured Sacred Photograph — Zero Text Stamped Over ठाकुर जी */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setLightboxImage({ src: activePlate.src, caption: activePlate.caption })
                }
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') &&
                  setLightboxImage({ src: activePlate.src, caption: activePlate.caption })
                }
                aria-label={`पूर्ण दर्शन देखें: ${activePlate.caption}`}
                className="aspect-[16/11] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8] cursor-pointer"
              >
                <img
                  src={activePlate.src}
                  alt={activePlate.caption}
                  className={`w-full h-full object-cover ${activePlate.pos}`}
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Clean Ivory Matte Caption Bar + Controls Below Frame */}
              <div className="px-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-serif font-bold text-xs sm:text-[13px] text-[#18181B] truncate">
                    {activePlate.caption}
                  </div>
                  <div className="text-[11px] font-laila text-amber-800/85 truncate">
                    {formatDevanagariNumerals(plateIndex + 1)}/{formatDevanagariNumerals(NITYA_DARSHAN_PLATES.length)} · {activePlate.mandir}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => selectPlate(plateIndex - 1)}
                    aria-label="पिछला दर्शन"
                    className="w-7 h-7 rounded-full bg-white hover:bg-amber-50 shadow-2xs text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPlate(plateIndex + 1)}
                    aria-label="अगला दर्शन"
                    className="w-7 h-7 rounded-full bg-white hover:bg-amber-50 shadow-2xs text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({ src: activePlate.src, caption: activePlate.caption })
                    }
                    aria-label="पूर्ण दर्शन खोलें"
                    title="पूर्ण दर्शन"
                    className="w-7 h-7 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Clean 12-Thumbnail Visual Selector Strip (2x6 Crisp Grid) */}
              <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                {NITYA_DARSHAN_PLATES.map((plate, idx) => {
                  const isSelected = idx === plateIndex;
                  return (
                    <button
                      key={plate.id}
                      type="button"
                      onClick={() => selectPlate(idx)}
                      aria-label={plate.label}
                      title={plate.label}
                      className={`h-9 rounded-[6px] overflow-hidden bg-[#EFE7D8] cursor-pointer transition-opacity ${
                        isSelected
                          ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-[#FAF8F3] opacity-100'
                          : 'opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={plate.src}
                        alt={plate.label}
                        className={`w-full h-full object-cover ${plate.pos}`}
                        loading="eager"
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Sacred Nitya Darshan Lightbox Portal */}
      {isLightboxRendered &&
        activeLightbox &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeLightbox.caption}
            onClick={() => setLightboxImage(null)}
            className={`fixed inset-0 z-[100] bg-[#0D0805]/95 flex flex-col items-center justify-center p-4 sm:p-8 ${
              isLightboxClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="दर्शन बंद करें"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-2xl w-full flex flex-col items-center gap-3 ${
                isLightboxClosing ? 'modal-dialog-exit' : 'modal-dialog-enter'
              }`}
            >
              <div className="relative w-full max-h-[78vh] rounded-[16px] overflow-hidden bg-black border border-amber-200/20 shadow-2xl flex items-center justify-center">
                <img
                  src={activeLightbox.src}
                  alt={activeLightbox.caption}
                  className="max-h-[78vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between w-full px-2 text-amber-100 font-laila text-xs sm:text-sm gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const prev =
                      (plateIndex - 1 + NITYA_DARSHAN_PLATES.length) % NITYA_DARSHAN_PLATES.length;
                    selectPlate(prev);
                    setLightboxImage({
                      src: NITYA_DARSHAN_PLATES[prev].src,
                      caption: NITYA_DARSHAN_PLATES[prev].caption,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>पिछला</span>
                </button>
                <span className="text-center font-semibold truncate">{activeLightbox.caption}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (plateIndex + 1) % NITYA_DARSHAN_PLATES.length;
                    selectPlate(next);
                    setLightboxImage({
                      src: NITYA_DARSHAN_PLATES[next].src,
                      caption: NITYA_DARSHAN_PLATES[next].caption,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <span>अगला</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2. Lightweight 3-Pillar Interactive Row (R_outer=20px, p=10px -> inner img R_inner=10px) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            type: 'japa' as const,
            title: '१. युगल नाम जप',
            value: `${formatDevanagariNumerals(sadhana.japaCompleted)} / ${formatDevanagariNumerals(sadhana.japaTarget)} माला`,
            sub: '१०८ मनका पावन जप',
            pct: japaProgressPct,
            img: '/assets/darshan/radharaman-charan.webp',
            pos: 'object-[center_30%]',
            icon: <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />,
          },
          {
            type: 'shravan' as const,
            title: '२. रसिक वाणी श्रवण',
            value: `${formatDevanagariNumerals(sadhana.shravanMinutes)} / ${formatDevanagariNumerals(sadhana.shravanTarget)} मिनट`,
            sub: 'शास्त्रीय राग कीर्तन',
            pct: shravanProgressPct,
            img: '/assets/darshan/radharaman-venu.webp',
            pos: 'object-[center_20%]',
            icon: <Music2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />,
          },
          {
            type: 'svadhyaya' as const,
            title: '३. ग्रंथ स्वाध्याय',
            value: `${formatDevanagariNumerals(sadhana.svadhyayaPadas)} / ${formatDevanagariNumerals(sadhana.svadhyayaTarget)} पद`,
            sub: 'श्री हित चौरासी व रसिक वाणी',
            pct: svadhyayaProgressPct,
            img: '/assets/darshan/radharaman-shriji.webp',
            pos: 'object-[center_35%]',
            icon: <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />,
          },
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onOpenPillar(item.type)}
            className="group text-left p-2.5 rounded-[20px] bg-white hover:bg-[#FAF8F3] shadow-[0_2px_12px_rgba(24,24,27,0.025)] transition-colors cursor-pointer flex items-center gap-3.5 min-w-0"
          >
            <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-[#EFE7D8] shrink-0">
              <img
                src={item.img}
                alt={item.title}
                className={`w-full h-full object-cover ${item.pos}`}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-laila font-semibold text-amber-800 inline-flex items-center gap-1 truncate">
                  {item.icon}
                  <span className="truncate">{item.title}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-800 shrink-0" />
              </div>

              <div className="font-serif font-bold text-sm sm:text-[15px] text-[#18181B] leading-tight truncate">
                {item.value}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-laila text-neutral-500 truncate">{item.sub}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
