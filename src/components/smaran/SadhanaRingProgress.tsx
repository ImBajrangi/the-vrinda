import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Music2, BookOpen, Wind, Disc3, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SadhanaState, SacredPad } from '../../types/devotional';
import { ArtworkGraphicSlot } from '../common/ArtworkGraphicSlot';
import { computeAshtayamaPhase, formatDevanagariNumerals } from '../../services/cacheService';
import { computePanchangForDate } from '../../services/panchangService';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';

const NITYA_DARSHAN_PLATES = [
  {
    id: 'yugal',
    label: 'युगल दर्शन',
    caption: 'श्री राधारमण देव जू • नित्य शृंगार सिंहासन',
    mandir: 'श्री राधारमण मंदिर, वृन्दावन',
    pos: 'object-[center_52%]',
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
    id: 'phoolbangla',
    label: 'फूल बंगला',
    caption: 'दिव्य पुष्प सज्जा • नित्य फूल बंगला झांकी',
    mandir: 'निकुञ्ज महोत्सव दर्शन',
    pos: 'object-[center_72%]',
    src: '/assets/darshan/radharaman-phoolbangla.webp',
  },
  {
    id: 'mukharavind',
    label: 'मुखारविंद',
    caption: 'श्री राधारमण लाल • मोर मुकुट छवि',
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
  const [plateOrder, setPlateOrder] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const plateIndex = plateOrder[0];
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isOpeningReader, setIsOpeningReader] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null);

  // Refs for GPU-only FLIP spatial morphing across the 3 visible darshan gallery blocks
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFlipRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const morphAnimGenRef = useRef<number>(0);

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

  const selectPlate = (nextIndex: number) => {
    const normalized = (nextIndex + NITYA_DARSHAN_PLATES.length) % NITYA_DARSHAN_PLATES.length;
    if (normalized === plateOrder[0]) return;

    // Capture FIRST bounding rects of all currently mounted darshan blocks before React updates
    const rects = new Map<string, DOMRect>();
    plateOrder.slice(0, 3).forEach((pIdx) => {
      const id = NITYA_DARSHAN_PLATES[pIdx].id;
      const el = blockRefs.current.get(id);
      if (el) rects.set(id, el.getBoundingClientRect());
    });
    pendingFlipRectsRef.current = rects;

    // Show plate spinner only when bringing an unvisited plate into focus; instant morph on visible swap
    const clickedPos = plateOrder.indexOf(normalized);
    if (clickedPos > 2) {
      setIsPlateLoading(true);
    }

    setPlateOrder((prev) => {
      const pos = prev.indexOf(normalized);
      if (pos === 1 || pos === 2) {
        // Direct symmetric swap: clicked companion flies smoothly into Main & Main glides to clicked slot
        const swapped = [...prev];
        swapped[0] = normalized;
        swapped[pos] = prev[0];
        return swapped;
      }
      // Off-stage plate selected: promote to Main, glide previous Main & Companion 1 down cleanly
      return [normalized, ...prev.filter((i) => i !== normalized)];
    });
  };

  // INVERT & PLAY: Hardware-accelerated FLIP spatial morph after React commits the swapped grid positions
  useLayoutEffect(() => {
    const prevRects = pendingFlipRectsRef.current;
    if (prevRects.size === 0) return;
    pendingFlipRectsRef.current = new Map();

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const animGen = ++morphAnimGenRef.current;
    const primaryId = NITYA_DARSHAN_PLATES[plateOrder[0]].id;
    const movingEls: HTMLElement[] = [];

    // 1. Apply inverted transforms synchronously before paint
    plateOrder.slice(0, 3).forEach((pIdx) => {
      const id = NITYA_DARSHAN_PLATES[pIdx].id;
      const el = blockRefs.current.get(id);
      if (!el) return;

      const lastRect = el.getBoundingClientRect();
      const firstRect = prevRects.get(id);

      el.style.transition = 'none';
      el.style.willChange = 'transform, opacity';

      if (firstRect && firstRect.width > 0 && lastRect.width > 0) {
        const dx = firstRect.left - lastRect.left;
        const dy = firstRect.top - lastRect.top;
        const sx = firstRect.width / lastRect.width;
        const sy = firstRect.height / lastRect.height;

        el.style.transformOrigin = 'top left';
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
        el.style.zIndex = id === primaryId ? '30' : '20';
      } else {
        // Newly entering off-stage block glides gently in place
        el.style.transformOrigin = 'center center';
        el.style.transform = 'scale(0.95)';
        el.style.opacity = '0';
        el.style.zIndex = id === primaryId ? '30' : '10';
      }
      movingEls.push(el);
    });

    if (movingEls.length === 0) return;
    // Commit inverted state in one synchronous reflow
    void movingEls[0].offsetWidth;

    // 2. Play Anime.js inOutExpo morph to swapped coordinates + outExpo opacity settle
    requestAnimationFrame(() => {
      if (morphAnimGenRef.current !== animGen) return;
      movingEls.forEach((el) => {
        el.style.transition =
          'transform 560ms cubic-bezier(0.87, 0, 0.13, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';
        el.style.opacity = '1';
      });
    });

    const cleanupTimer = window.setTimeout(() => {
      if (morphAnimGenRef.current !== animGen) return;
      movingEls.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.transformOrigin = '';
        el.style.willChange = '';
        el.style.zIndex = '';
        el.style.opacity = '';
      });
    }, 580);

    return () => window.clearTimeout(cleanupTimer);
  }, [plateOrder]);

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

  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImage]);

  // 27 visual segments representing the 108-bead Tulsi mala (each bead marker = 4 mantras)
  const totalMalaMarkers = 27;
  const activeMarkerIndex = Math.floor((beadInCurrentMala / 108) * totalMalaMarkers);

  // Precompute 27 radial bead positions around the circular rosary ring
  // Slot 0 is the golden Meru bead at the 12 o'clock apex (-90 degrees)
  const beadPositions = React.useMemo(() => {
    const radiusPercent = 41.5;
    return Array.from({ length: totalMalaMarkers }).map((_, idx) => {
      const slot = idx + 1; // slots 1 to 27 clockwise
      const angle = -Math.PI / 2 + (slot / 28) * 2 * Math.PI;
      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);
      return { x, y };
    });
  }, [totalMalaMarkers]);

  return (
    <div className="w-full space-y-6">
      {/* 1. Minimalist Devotional Sanctuary Hero — Calm Header Bar + 3-Plate FLIP Visual Showcase */}
      <section
        aria-label="श्री वृन्दावन नित्य संदर्शन"
        className="w-full space-y-4 sm:space-y-5 pt-1"
      >
        {/* Clean Single-Axis Top Header: Quiet Title on Left, 2 Focused Actions on Right */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-0.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-laila text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
              <span className="font-semibold text-amber-950">{livePrahar.nameDevanagari} प्रहर</span>
              <span className="text-neutral-300">·</span>
              <span>{livePanchang.masaDevanagari} {livePanchang.pakshaDevanagari} {livePanchang.tithiNameDevanagari}</span>
            </div>

            <h1 className="font-rozha text-[26px] sm:text-3xl lg:text-[36px] text-[#1A120B] leading-[1.15] tracking-tight">
              नित्य निकुञ्ज संदर्शन
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTapBead}
              className="h-9 sm:h-10 flex items-center gap-2 px-4 rounded-full bg-[#1C140D] hover:bg-[#2F2217] text-[#FEF08A] text-xs font-laila font-bold transition-colors cursor-pointer"
              title="सीधे यहीं से +१ राधे नाम जप करें"
            >
              <Disc3 className="w-3.5 h-3.5 text-[#FEF08A]" />
              <span>+१ राधे जप</span>
              <span className="font-mono text-[10.5px] text-amber-200/90 bg-white/10 px-1.5 py-0.5 rounded-full">
                {formatDevanagariNumerals(beadInCurrentMala)}/१०८
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenFocus}
              className="h-9 sm:h-10 flex items-center gap-1.5 px-3.5 rounded-full bg-[#F1EAE0] hover:bg-[#E7DEC9] text-[#1C140D] text-xs font-laila font-semibold transition-colors cursor-pointer"
              title="Open Dhyāna Sanctuary (ध्यान कक्ष)"
            >
              <Wind className="w-3.5 h-3.5 text-amber-800" />
              <span>ध्यान कक्ष</span>
            </button>
          </div>
        </div>

        {/* Unified Asymmetric 3-Plate CSS Grid with FLIP Spatial Position Morphing (Zero Outlines) */}
        <div className="relative grid grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 gap-3.5 sm:gap-4">
          {plateOrder.slice(0, 3).map((pIdx, slotPos) => {
            const tile = NITYA_DARSHAN_PLATES[pIdx];
            const isPrimary = slotPos === 0;

            return (
              <div
                key={tile.id}
                ref={(el) => {
                  if (el) {
                    blockRefs.current.set(tile.id, el);
                  } else {
                    blockRefs.current.delete(tile.id);
                  }
                }}
                role={!isPrimary ? 'button' : undefined}
                tabIndex={!isPrimary ? 0 : undefined}
                onClick={!isPrimary ? () => selectPlate(pIdx) : undefined}
                onKeyDown={
                  !isPrimary
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          selectPlate(pIdx);
                        }
                      }
                    : undefined
                }
                aria-label={!isPrimary ? `मुख्य दर्शन में देखें: ${tile.label}` : undefined}
                className={`relative overflow-hidden bg-[#140B05] select-none ${
                  isPrimary
                    ? 'col-span-2 lg:col-span-8 lg:row-span-2 h-[280px] sm:h-[380px] lg:h-[430px] rounded-[24px] sm:rounded-[28px] squircle-card shadow-[0_14px_40px_rgba(24,24,27,0.09)]'
                    : 'group col-span-1 lg:col-span-4 lg:row-span-1 h-[145px] sm:h-[185px] lg:h-[207px] rounded-[22px] sm:rounded-[24px] squircle-card cursor-pointer shadow-[0_8px_24px_rgba(24,24,27,0.06)]'
                }`}
              >
                <img
                  src={tile.src}
                  alt={tile.caption}
                  onLoad={isPrimary ? () => setIsPlateLoading(false) : undefined}
                  onError={isPrimary ? () => setIsPlateLoading(false) : undefined}
                  className={`w-full h-full object-cover ${tile.pos}`}
                  loading="eager"
                  decoding="async"
                />

                {isPrimary ? (
                  <>
                    {/* Top-Left Subtle Frosted Plate Counter */}
                    <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#120A04]/55 backdrop-blur-md text-white text-[11px] font-laila font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FDE047] shrink-0" />
                      <span className="font-mono text-[10.5px] text-amber-200 font-bold">
                        {formatDevanagariNumerals(pIdx + 1).padStart(2, '०')} / {formatDevanagariNumerals(NITYA_DARSHAN_PLATES.length).padStart(2, '०')}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="truncate max-w-[180px] sm:max-w-none">{tile.mandir}</span>
                    </div>

                    {/* Top-Right Apple iOS 18 Plate Switch Loader */}
                    {isPlateLoading && (
                      <div
                        role="status"
                        aria-busy="true"
                        className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 px-2.5 py-1.5 rounded-full bg-[#120A04]/70 backdrop-blur-md inline-flex items-center gap-1.5 text-[10.5px] text-amber-100 font-laila"
                      >
                        <IOSSpinner size="xs" theme="white" />
                        <span>दर्शन...</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0E0703]/95 via-[#0E0703]/50 to-transparent pointer-events-none" />

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
                      <div className="font-rozha text-[17px] sm:text-xl lg:text-[22px] text-white tracking-wide leading-snug line-clamp-1 min-w-0">
                        {tile.caption}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <div className="flex items-center gap-1 sm:hidden" aria-hidden="true">
                          {NITYA_DARSHAN_PLATES.map((p, i) => (
                            <span
                              key={p.id}
                              className={`h-1 rounded-full transition-all duration-200 ${
                                i === pIdx ? 'w-4 bg-[#FEF08A]' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => selectPlate(pIdx - 1)}
                            aria-label="पिछला दर्शन"
                            className="w-8 h-8 rounded-full bg-[#120A04]/50 hover:bg-[#120A04]/75 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => selectPlate(pIdx + 1)}
                            aria-label="अगला दर्शन"
                            className="w-8 h-8 rounded-full bg-[#120A04]/50 hover:bg-[#120A04]/75 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ src: tile.src, caption: tile.caption })}
                            aria-label={`पूर्ण दर्शन देखें: ${tile.caption}`}
                            className="h-8 px-3.5 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-[11px] font-laila font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>पूर्ण दर्शन</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E0703]/90 via-[#0E0703]/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-laila text-amber-200/90 truncate">
                          {tile.mandir}
                        </div>
                        <div className="font-rozha text-sm sm:text-base text-white truncate leading-tight">
                          {tile.label}
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex text-[11px] font-laila font-semibold text-[#FEF08A] shrink-0">
                        देखें →
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean Borderless Darshan Plate Pills Strip + Direct Scripture Reader Link */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {NITYA_DARSHAN_PLATES.map((plate, idx) => {
              const isSelected = idx === plateIndex;
              return (
                <button
                  key={plate.id}
                  type="button"
                  onClick={() => selectPlate(idx)}
                  className={`px-3 py-1.5 rounded-full text-[11.5px] font-laila transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#FEF08A] text-[#1A120B] font-bold'
                      : 'bg-[#F1EAE0] hover:bg-[#E7DEC9] text-[#5C4E3E] font-medium'
                  }`}
                >
                  {plate.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleEnterReader}
            disabled={isOpeningReader}
            aria-busy={isOpeningReader}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-laila font-semibold text-amber-900 hover:text-amber-950 transition-colors cursor-pointer shrink-0 disabled:opacity-65"
          >
            {isOpeningReader ? (
              <>
                <IOSSpinner size="xs" theme="current" />
                <span>खुल रहा है</span>
              </>
            ) : (
              <span>रसिक वाणी पाठ →</span>
            )}
          </button>
        </div>
      </section>

      {/* Fullscreen Sacred Nitya Darshan Lightbox Portal */}
      {lightboxImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lightboxImage.caption}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-[#0D0805]/95 flex flex-col items-center justify-center p-4 sm:p-8"
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
              className="relative max-w-2xl w-full flex flex-col items-center gap-3"
            >
              <div className="relative w-full max-h-[78vh] rounded-[16px] overflow-hidden bg-black border border-amber-200/20 shadow-2xl flex items-center justify-center">
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.caption}
                  className="max-h-[78vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between w-full px-2 text-amber-100 font-laila text-xs sm:text-sm gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const prev = (plateIndex - 1 + NITYA_DARSHAN_PLATES.length) % NITYA_DARSHAN_PLATES.length;
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
                <span className="text-center font-semibold truncate">{lightboxImage.caption}</span>
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

      {/* 2. Artisanal Tulsi Japamala Sanctuary & Three Daily Offerings (Borderless Tonal Sanctuary) */}
      <div className="w-full bg-white rounded-[32px] squircle-card p-4 sm:p-6 space-y-6 shadow-[0_4px_24px_rgba(24,24,27,0.035)]">
        <div className="p-5 sm:p-6 rounded-[16px] sm:rounded-[8px] bg-[#FAF8F3]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center: The Circular Chanting Rosary Ring */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
              
              {/* Circular Thread Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="41.5" fill="none" stroke="#E6DCCA" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              </svg>

              {/* Apex Golden Meru Bead (सुमेरु - 12 o'clock) */}
              <div 
                title="सुमेरु मनका (Meru Bead)"
                className="absolute w-5 h-5 rounded-full meru-bead border border-amber-400 flex items-center justify-center text-[9px] text-white font-bold z-20 aspect-square shadow-sm"
                style={{ top: '8.5%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                ✦
              </div>

              {/* 27 Radial Beads distributed around the circle */}
              {beadPositions.map((pos, idx) => {
                const isChanted = idx < activeMarkerIndex;
                const isActive = idx === activeMarkerIndex && beadInCurrentMala > 0;

                return (
                  <div
                    key={idx}
                    title={`मनका खंड ${(idx + 1) * 4} / १०८`}
                    className={`absolute rounded-full aspect-square shrink-0 transition-all duration-200 z-10 ${
                      isActive
                        ? 'w-3.5 h-3.5 tulsi-bead-active ring-2 ring-amber-300'
                        : isChanted
                        ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 tulsi-bead-chanted'
                        : 'w-2 h-2 sm:w-2.5 sm:h-2.5 tulsi-bead-pending'
                    }`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                );
              })}

              {/* Central "राधे" Touch Gem Medallion */}
              <button 
                type="button" 
                onClick={handleTapBead}
                aria-label="Count 1 bead on Tulsi Mala"
                className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-white via-[#FCFAF5] to-[#F5EEDB] border border-amber-300/90 shadow-[0_12px_32px_rgba(217,119,6,0.14),inset_0_2px_4px_rgba(255,255,255,1)] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all group z-20"
              >
                {/* Inner Concentric Rim */}
                <div className="absolute inset-2 rounded-full border border-amber-200/60 pointer-events-none" />

                <span className="text-[10px] font-laila font-semibold uppercase tracking-wider text-amber-800/80 mb-1 leading-none">
                  नित्य युगल स्मरण{' '}
                </span>
                <span className={`font-rozha text-3xl sm:text-4xl text-amber-900 leading-none transition-transform duration-150 ${counterTick ? 'scale-110' : ''}`}>
                  राधे
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-laila text-[11px] font-bold text-amber-900">
                    +१ मनका जप
                  </span>
                </div>
              </button>
            </div>

            <div className="text-[11px] font-laila text-neutral-500 mt-2 text-center">
              केंद्र पर स्पर्श करें अथवा नीचे दिए बटनों का प्रयोग करें
            </div>
          </div>

          {/* Right Column: Modern Minimal Status & Chanting Metrics */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 pt-4 lg:pt-0 border-t border-amber-200/50 lg:border-t-0 lg:border-l lg:border-amber-200/60 lg:pl-8">
            
            {/* Category Header & Majestic Hero Counter */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-laila font-bold text-amber-800">
                  पवित्र तुलसी माला साधना
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-laila text-amber-900/80 font-semibold bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  १०८ मनका चक्र
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 pt-1">
                <span className={`font-rozha text-4xl sm:text-5xl text-[#18181B] leading-none ${counterTick ? 'animate-number-tick' : ''}`}>
                  {mantraCountDevanagari}
                </span>
                <div className="flex flex-col">
                  <span className="font-laila text-sm font-bold text-amber-900">
                    मंत्र जप पूर्ण{' '}
                  </span>
                  <span className="text-[11px] font-laila text-neutral-400">
                    आज का पावन संकल्प
                  </span>
                </div>
              </div>
            </div>

            {/* Modern Grid of 2 Metric Cards */}
            <div className="grid grid-cols-2 gap-3 font-laila">
              {/* Card 1: Mala Progress */}
              <div className="p-3.5 rounded-[18px] bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] text-neutral-500 font-medium block">
                  माला संकल्प सिद्धि
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5">
                  {malasDevanagari} / {malasTargetDevanagari} <span className="text-xs font-normal text-amber-800">माला</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((sadhana.japaCompleted / Math.max(1, sadhana.japaTarget)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Current Bead Track */}
              <div className="p-3.5 rounded-[18px] bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-[11px] text-neutral-500 font-medium block">
                  वर्तमान माला स्थिति
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5">
                  मनका {formatDevanagariNumerals(beadInCurrentMala)} <span className="text-xs font-normal text-neutral-500">/ १०८</span>
                </div>
                <div className="text-[11px] text-amber-800 font-semibold mt-1">
                  {formatDevanagariNumerals(Math.round((beadInCurrentMala / 108) * 100))}% माला पूर्ण
                </div>
              </div>
            </div>

            {/* Bottom Action Controls */}
            <div className="flex items-center gap-3 pt-1 font-laila">
              <button
                type="button"
                onClick={handleTapBead}
                className="flex-1 py-3 px-4 rounded-full bg-white hover:bg-[#FEFCE8] text-[#18181B] border border-amber-300/80 shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all"
              >
                <Disc3 className="w-4 h-4 text-amber-700" />
                <span>+१ मनका जप</span>
              </button>

              <button
                type="button"
                onClick={incrementJapa}
                className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-amber-100 to-amber-200/90 hover:from-amber-200 hover:to-amber-300/80 text-amber-950 border border-amber-300/90 shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all"
              >
                <span>+१ पूरी माला</span>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-white/70 px-2 py-0.5 rounded-full">(१०८)</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 3. The Three Sacred Daily Offerings (त्रिविध नित्य सेवा समर्पण) - Graphics Friendly Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Offering 1: Naam Japa */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('japa')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('japa')}
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Japa Meditation Art */}
          <ArtworkGraphicSlot
            src="/assets/darshan/radharaman-charan.webp"
            alt="श्री राधारमण लाल चरण-कमल व नाम जप"
            aspectRatio="card"
            theme="amber"
            imgPositionClass="object-[center_30%]"
            roundedClassName="rounded-[8px]"
            eager={true}
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 font-laila">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                १. युगल नाम जप
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.japaCompleted)} / {formatDevanagariNumerals(sadhana.japaTarget)} माला
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              श्री राधा-माधव युगल नाम का पावन अखंड जप।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">१०८ मनके / माला</span>
            <div className="company-link group-company-link font-semibold text-xs text-amber-700 group-hover:text-amber-900 transition-colors">
              <span>विवरण देखें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

        {/* Offering 2: Pad Shravan */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('shravan')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('shravan')}
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Pad Shravan & Raga Art */}
          <ArtworkGraphicSlot
            src="/assets/darshan/radharaman-venu.webp"
            alt="श्री राधारमण वेणु-माधुरी व रसिक वाणी श्रवण"
            aspectRatio="card"
            theme="amber"
            imgPositionClass="object-[center_20%]"
            roundedClassName="rounded-[8px]"
            eager={true}
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 font-laila">
                <Music2 className="w-3.5 h-3.5 text-amber-700" />
                २. रसिक वाणी श्रवण
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.shravanMinutes)} / {formatDevanagariNumerals(sadhana.shravanTarget)} मिनट
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              राग विभास, सारंग एवं बिलावल के दिव्य निकुंज पद।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">शास्त्रीय कीर्तन</span>
            <div className="company-link group-company-link font-semibold text-xs text-indigo-600 group-hover:text-indigo-800 transition-colors">
              <span>श्रवण करें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

        {/* Offering 3: Grantha Svadhyaya */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenPillar('svadhyaya')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenPillar('svadhyaya')}
          className="group p-4 rounded-[24px] bg-[#FAF9F5] hover:bg-[#FEFCE8] transition-colors cursor-pointer select-none flex flex-col justify-between space-y-3"
        >
          {/* Dedicated Visual Slot for Grantha Scripture Manuscript Art */}
          <ArtworkGraphicSlot
            src="/assets/darshan/radharaman-shriji.webp"
            alt="श्री राधारमण लाल एवं श्रीजी गद्दी ग्रंथ स्वाध्याय"
            aspectRatio="card"
            theme="orange"
            imgPositionClass="object-[center_35%]"
            roundedClassName="rounded-[8px]"
            eager={true}
          />

          <div>
            <div className="mb-1">
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 font-laila">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                ३. ग्रंथ स्वाध्याय
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#18181B] leading-tight">
              {formatDevanagariNumerals(sadhana.svadhyayaPadas)} / {formatDevanagariNumerals(sadhana.svadhyayaTarget)} पद
            </div>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 font-laila">
              श्री हित चौरासी, केलिमाल एवं राधा सुधानिधि चिंतन।
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-laila">
            <span className="text-xs text-neutral-500">रस उपासना</span>
            <div className="company-link group-company-link font-semibold text-xs text-amber-700 group-hover:text-amber-900 transition-colors">
              <span>स्वाध्याय करें</span>
              <span className="text-sm leading-none">→</span>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};