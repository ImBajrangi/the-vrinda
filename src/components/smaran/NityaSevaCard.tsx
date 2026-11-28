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

  // 1. FEATURED SHOWCASE HERO (Museum Split Ivory Editorial Card — Borderless Tonal Separation)
  if (isHero) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-busy={isEntering}
        onClick={handleEnter}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
        className={`group w-full cursor-pointer select-none transition-colors duration-200 bg-[#FAF8F4] hover:bg-[#F5EFE3] p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center ${
          seamless ? 'rounded-[20px]' : 'rounded-[22px]'
        }`}
      >
        {/* Clean Unobscured Temple Photograph */}
        <div className="md:col-span-5 aspect-[16/10] md:aspect-[4/3] w-full rounded-[12px] overflow-hidden bg-[#EFE7D8]">
          <img
            src={activeImage}
            alt={templeName}
            className="w-full h-full object-cover object-[center_28%]"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Crisp Devotional Schedule Panel */}
        <div className="md:col-span-7 px-2 pb-2 md:py-2 md:pr-3 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-laila font-semibold text-amber-800">
              <span className="font-mono font-bold text-amber-900/50">{displayNum}</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span aria-hidden="true">•</span>
                <span>{praharLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span aria-hidden="true">•</span>
                <span className="text-neutral-800">{devanagariTemple}</span>
              </span>
            </div>

            {statusType === 'active' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-laila font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>दर्शन खुले हैं</span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl lg:text-[26px] font-rozha text-[#18181B] leading-snug">
              {devanagariSeva}
            </h3>
            <p className="text-xs sm:text-[13px] font-sans text-neutral-500 mt-0.5">
              {sevaTitle}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[#18181B] font-mono text-xs sm:text-[13px] font-bold flex-wrap">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{time}</span>
              {countdownLabel && (
                <span className="text-[11px] font-laila font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  {countdownLabel}
                </span>
              )}
            </div>

            <div className="px-4 py-2 rounded-full bg-[#FEF08A] group-hover:bg-[#FDE047] text-[#78350F] text-xs sm:text-[13px] font-laila font-bold transition-colors flex items-center gap-1.5 shrink-0">
              {isEntering ? (
                <>
                  <IOSSpinner size="xs" theme="current" />
                  <span>प्रवेश...</span>
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

  // 2. COMPACT EDITORIAL SHOWCASE CARD (Clean Unobscured Plate Above + Borderless Ivory Body Below)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-busy={isEntering}
      onClick={handleEnter}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
      className="group w-full cursor-pointer select-none transition-colors duration-150 rounded-[20px] bg-[#FAF8F4] hover:bg-[#F5EFE3] p-2.5 flex flex-col justify-between gap-3"
    >
      {/* Clean Unobscured WebP Photo Plate */}
      <div className="aspect-[16/10] w-full rounded-[10px] overflow-hidden bg-[#EFE7D8]">
        <img
          src={activeImage}
          alt={templeName}
          className="w-full h-full object-cover object-[center_20%]"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Ivory Typographic Body */}
      <div className="px-1.5 pb-1 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-laila font-semibold text-amber-800 truncate">
              {displayNum} • {devanagariTemple}
            </span>
            {statusType === 'active' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-laila font-semibold text-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>खुले</span>
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-[17px] font-rozha text-[#18181B] leading-snug line-clamp-1">
            {devanagariSeva}
          </h4>
          <p className="text-[11px] font-laila text-neutral-500 truncate mt-0.5">
            {praharLabel}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 gap-2">
          <span className="text-[11px] font-mono font-semibold text-neutral-700 truncate">
            {countdownLabel || time}
          </span>

          <div className="text-amber-800 group-hover:text-amber-950 transition-colors text-xs font-laila font-bold shrink-0 flex items-center gap-1">
            {isEntering ? (
              <>
                <IOSSpinner size="xs" theme="current" />
                <span>प्रवेश...</span>
              </>
            ) : (
              <>
                <span>दर्शन</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
