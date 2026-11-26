import React, { useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { IOSSpinner, navigationProgress } from '../common/IOSActivityIndicator';

export interface NityaSevaCardProps {
  templeName: string;
  sevaTitle: string;
  sevaTitleDevanagari?: string;
  praharLabel?: string;
  time: string;
  sevaDetails?: string[];
  statusLabel?: string;
  statusType?: 'active' | 'upcoming' | 'completed';
  countdownLabel?: string;
  imageUrl?: string;
  onOpen?: () => void;
  isHero?: boolean;
  indexNumber?: string;
  seamless?: boolean;
}

/**
 * NityaSevaCard — Inspired by Company Showcase Layout Perfection
 * 
 * Features:
 * 1. Zero Unnecessary Dots/Outlines: No bullet dots, no green indicator dots, no border-t lines, no button outlines.
 * 2. 0 Gap Unified Mosaic: Inner gaps removed, master container gives soft outer corners.
 * 3. Ghost Numbers: 01, 02, 03, 04 in crisp font-mono.
 * 4. Concentric Geometry: R_inner = R_outer - padding.
 * 5. Zero translateY or scale on hover.
 */
export const NityaSevaCard: React.FC<NityaSevaCardProps> = ({
  templeName,
  sevaTitle,
  sevaTitleDevanagari,
  praharLabel: propPraharLabel,
  time,
  statusType = 'upcoming',
  countdownLabel,
  imageUrl,
  onOpen,
  isHero = false,
  indexNumber,
  seamless = false,
}) => {
  const isBihari = templeName.toLowerCase().includes('bihari') || templeName.includes('बिहारी');
  const isVallabh = templeName.toLowerCase().includes('vallabh') || templeName.includes('वल्लभ');
  const isRaman = templeName.toLowerCase().includes('raman') || templeName.includes('रमण');
  const isBarsana = templeName.toLowerCase().includes('barsana') || templeName.includes('बरसाना');

  // Devanagari temple branding & live timings
  let devanagariTemple = 'श्री वृन्दावन धाम मंदिर';
  let devanagariSeva = sevaTitleDevanagari || sevaTitle;
  let praharLabel = propPraharLabel || 'नित्य अष्टयाम';
  let defaultImage = '/assets/temples/banke-bihari-v2.webp';
  let defaultNum = '01';

  if (isBihari) {
    devanagariTemple = 'श्री बाँके बिहारी मंदिर';
    devanagariSeva = sevaTitleDevanagari || 'शयन एवं संध्या दर्शन';
    praharLabel = propPraharLabel || 'नित्य अष्टयाम';
    defaultImage = '/assets/temples/banke-bihari-v2.webp';
    defaultNum = '01';
  } else if (isVallabh) {
    devanagariTemple = 'श्री राधा वल्लभ लाल';
    devanagariSeva = sevaTitleDevanagari || 'राजभोग दर्शन एवं महाप्रसाद';
    praharLabel = propPraharLabel || 'मध्याह्न अष्टयाम';
    defaultImage = '/assets/temples/radha-vallabh.webp';
    defaultNum = '02';
  } else if (isRaman) {
    devanagariTemple = 'श्री राधा रमण जू';
    devanagariSeva = sevaTitleDevanagari || 'संध्या आरती व दिव्य शृंगार';
    praharLabel = propPraharLabel || 'सायं संध्या';
    defaultImage = '/assets/darshan/radharaman-simhasan.webp';
    defaultNum = '03';
  } else if (isBarsana) {
    devanagariTemple = 'बरसाना श्री लाड़िली लाल जी';
    devanagariSeva = sevaTitleDevanagari || 'शयन दर्शन व चंवर सेवा';
    praharLabel = propPraharLabel || 'शयन अष्टयाम';
    defaultImage = '/assets/temples/barsana-radharani.webp';
    defaultNum = '04';
  }

  const activeImage = imageUrl || defaultImage;
  const displayNum = indexNumber || defaultNum;
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = () => {
    if (isEntering || !onOpen) return;
    setIsEntering(true);
    navigationProgress.start();
    requestAnimationFrame(() => {
      try {
        onOpen();
      } finally {
        setIsEntering(false);
      }
    });
  };

  // 1. FEATURED SHOWCASE HERO (Company showcase-featured)
  if (isHero) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-busy={isEntering}
        onClick={handleEnter}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
        className={`group relative w-full overflow-hidden cursor-pointer select-none transition-colors duration-200 min-h-[320px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 bg-neutral-950 ${
          seamless
            ? ''
            : 'rounded-[24px] shadow-md'
        }`}
      >
        {/* Full-bleed Authentic Background Photo */}
        <img
          src={activeImage}
          alt={templeName}
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          loading="eager"
        />
        {/* Cinematic Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

        {/* Ghost Number in Top-Right */}
        <span className="absolute top-5 right-7 text-6xl sm:text-7xl font-mono font-black text-white/20 select-none pointer-events-none leading-none">
          {displayNum}
        </span>

        {/* Bottom Content Area (No dots, no outlines, Laila & Rozha Hindi Typography) */}
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs sm:text-sm font-laila font-semibold text-amber-300 tracking-wider mb-1 truncate">
            {praharLabel} &nbsp; {devanagariTemple}
          </div>

          <h3 className="text-2xl sm:text-3xl font-rozha text-white tracking-wide leading-tight">
            {devanagariSeva}
            <span className="text-sm sm:text-base font-normal text-white/70 ml-2 font-sans">
              ({sevaTitle})
            </span>
          </h3>

          {/* Gateway Action Bar (Live Status Aware, No border-t outline) */}
          <div className="flex items-center justify-between pt-3 mt-3 gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-white font-mono text-xs sm:text-sm font-bold flex-wrap">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{time}</span>
              {countdownLabel && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-laila font-semibold px-2.5 py-0.5 rounded-full ml-1 ${
                  statusType === 'active'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35'
                    : 'bg-white/10 text-amber-200 border border-white/15'
                }`}>
                  {statusType === 'active' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {countdownLabel}
                </span>
              )}
            </div>

            <div className="px-5 py-2 rounded-full bg-[#FEF08A] hover:bg-[#FACC15] text-[#78350F] text-xs sm:text-sm font-laila font-bold transition-colors flex items-center gap-1.5 shadow-sm shrink-0">
              {isEntering ? (
                <>
                  <IOSSpinner size="xs" theme="current" />
                  <span>प्रवेश हो रहा है...</span>
                </>
              ) : (
                <>
                  <span>दर्शन प्रवेश</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#78350F]" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT SHOWCASE CARD (Company showcase-card)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-busy={isEntering}
      onClick={handleEnter}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
      className={`group relative w-full overflow-hidden cursor-pointer select-none transition-colors duration-200 min-h-[220px] sm:min-h-[240px] flex flex-col justify-end p-5 sm:p-6 bg-neutral-950 ${
        seamless
          ? ''
          : 'rounded-[22px] shadow-sm'
      }`}
    >
      {/* Background Photo */}
      <img
        src={activeImage}
        alt={templeName}
        className="absolute inset-0 w-full h-full object-cover object-[center_22%]"
        loading="lazy"
      />
      {/* Scrim Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

      {/* Live Status Pill (Top-Left) & Ghost Number (Top-Right) */}
      {statusType === 'active' && (
        <span className="absolute top-4 left-5 z-10 inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-950/75 border border-emerald-400/35 text-[10px] font-laila font-semibold text-emerald-100">
          दर्शन खुले हैं
        </span>
      )}
      <span className="absolute top-4 right-5 text-5xl font-mono font-black text-white/20 select-none pointer-events-none leading-none">
        {displayNum}
      </span>

      {/* Bottom Content (No dots, no outlines, Laila & Rozha Hindi Typography) */}
      <div className="relative z-10">
        <div className="text-[11px] sm:text-xs font-laila font-semibold text-amber-300 tracking-wider mb-0.5 truncate">
          {praharLabel} &nbsp; {devanagariTemple}
        </div>

        <h4 className="text-lg sm:text-xl font-rozha text-white tracking-wide leading-snug line-clamp-1">
          {devanagariSeva}
        </h4>

        {/* Bottom Bar: Timing & Clean CTA with NO outline */}
        <div className="flex items-center justify-between pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 gap-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white/90 whitespace-nowrap">
            {countdownLabel || time}
          </span>

          <div className="company-link group-company-link text-amber-300 group-hover:text-white transition-colors text-xs sm:text-sm font-laila font-bold shrink-0 flex items-center gap-1.5">
            {isEntering ? (
              <>
                <IOSSpinner size="xs" theme="current" />
                <span>प्रवेश...</span>
              </>
            ) : (
              <>
                <span>दर्शन</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
